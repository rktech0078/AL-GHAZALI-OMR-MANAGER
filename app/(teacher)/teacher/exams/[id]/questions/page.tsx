'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/AuthContext';

interface Question {
    id?: string;
    question_number: number;
    correct_answer: 'A' | 'B' | 'C' | 'D' | 'E' | null;
    question_text?: string;
    marks: number;
}

export default function QuestionBuilderPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [examConfig, setExamConfig] = useState({ totalQuestions: 0, optionsCount: 4 });

    useEffect(() => {
        const fetchQuestions = async () => {
            if (authLoading) return;

            if (!user) {
                router.push('/login');
                return;
            }

            // Layout handles role protection. 
            // Proceed to fetch questions.

            try {
                // Now fetch questions
                const response = await fetch(`/api/teacher/exams/${params.id}/questions`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch questions');
                }

                setQuestions(data.questions);
                setExamConfig(data.examConfig);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load questions');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchQuestions();
        }
    }, [params.id, user, profile, authLoading, router]);

    const handleAnswerChange = (questionNumber: number, answer: string) => {
        setQuestions(prev => prev.map(q =>
            q.question_number === questionNumber
                ? { ...q, correct_answer: answer as any }
                : q
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/teacher/exams/${params.id}/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ questions }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save answer key');
            }

            alert('Answer key saved successfully!');
            router.push('/teacher/exams'); // Or wherever appropriate
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="text-indigo-600 hover:underline"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const options = Array.from({ length: examConfig.optionsCount }, (_, i) => String.fromCharCode(65 + i)); // ['A', 'B', 'C', 'D'...]

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Set Answer Key</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Select the correct answer for each question.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/teacher/exams"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                        >
                            {saving ? 'Saving...' : 'Save Answer Key'}
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {questions.map((question) => (
                            <div
                                key={question.question_number}
                                className={`p-4 border rounded-lg ${question.correct_answer
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-medium text-gray-900">
                                        Question {question.question_number}
                                    </span>
                                    {question.correct_answer && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Selected: {question.correct_answer}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between gap-2">
                                    {options.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => handleAnswerChange(question.question_number, option)}
                                            className={`flex-1 h-10 rounded-md text-sm font-medium transition-colors ${question.correct_answer === option
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {questions.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white rounded-lg shadow mt-6">
                        <p className="text-gray-500">No questions found. Try refreshing the page to initialize them.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 text-indigo-600 hover:underline"
                        >
                            Refresh Page
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
