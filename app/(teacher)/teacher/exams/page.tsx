'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface Exam {
    id: string;
    exam_name: string;
    subject: string;
    class_name: string;
    exam_date: string | null;
    total_questions: number;
    options_count: number;
    passing_marks: number;
    status: string;
    created_at: string;
}

function MyExamsContent() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingOMR, setGeneratingOMR] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const supabase = createSupabaseBrowserClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('exams')
                    .select('*')
                    .eq('created_by', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setExams(data || []);
            } catch (err: any) {
                console.error('Error fetching exams:', err);
                showToast(err?.message || 'Failed to load exams', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [router, showToast]);

    const handleGenerateOMR = async (exam: Exam) => {
        try {
            setGeneratingOMR(exam.id);
            const supabase = createSupabaseBrowserClient();

            const { data: questions, error: questionsError } = await supabase
                .from('questions')
                .select('question_number, correct_answer')
                .eq('exam_id', exam.id)
                .order('question_number', { ascending: true });

            if (questionsError) throw questionsError;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const { data: userData } = await supabase
                .from('users')
                .select('school_id')
                .eq('id', user.id)
                .single();

            let schoolName = 'Al-Ghazali School';
            if (userData?.school_id) {
                const { data: schoolData } = await supabase
                    .from('schools')
                    .select('school_name')
                    .eq('id', userData.school_id)
                    .single();
                if (schoolData) schoolName = schoolData.school_name;
            }

            const answerKey = questions
                ?.filter(q => q.correct_answer)
                .map(q => `${q.question_number}-${q.correct_answer}`)
                .join(',') || '';

            const params = new URLSearchParams({
                examName: exam.exam_name,
                schoolName: schoolName,
                questions: exam.total_questions.toString(),
                options: exam.options_count.toString(),
                showKey: 'true',
                answerKey: answerKey
            });

            const response = await fetch(`/api/omr/generate?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to generate OMR');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `omr-${exam.exam_name}-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('OMR sheet generated successfully! 📄', 'success');

        } catch (err: any) {
            console.error('Error generating OMR:', err);
            showToast('Failed to generate OMR sheet: ' + (err?.message || 'Unknown error'), 'error');
        } finally {
            setGeneratingOMR(null);
        }
    };

    const handleDeleteExam = async (examId: string) => {
        try {
            const supabase = createSupabaseBrowserClient();

            // Delete the exam (cascade should handle questions and results if configured, 
            // but let's be safe and try to delete what we can or rely on DB constraints)
            // Assuming DB has ON DELETE CASCADE for foreign keys
            const { error } = await supabase
                .from('exams')
                .delete()
                .eq('id', examId);

            if (error) throw error;

            setExams(exams.filter(e => e.id !== examId));
            showToast('Exam deleted successfully', 'success');
        } catch (err: any) {
            console.error('Error deleting exam:', err);
            showToast('Failed to delete exam: ' + (err?.message || 'Unknown error'), 'error');
        }
    };

    const filteredExams = exams.filter(exam =>
        exam.exam_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.class_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading exams...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="mb-8 animate-slide-up">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Exams</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Manage and organize all your exams in one place
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/teacher/create-exam')}
                        variant="primary"
                        size="lg"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                    >
                        Create New Exam
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            {exams.length > 0 && (
                <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search exams by name, subject, or class..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Exams List */}
            {exams.length === 0 ? (
                <EmptyState
                    icon={
                        <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                    title="No exams yet"
                    description="Get started by creating your first exam and generate OMR sheets for students."
                    action={{
                        label: 'Create Your First Exam',
                        onClick: () => router.push('/teacher/create-exam')
                    }}
                />
            ) : filteredExams.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                    <EmptyState
                        title="No exams found"
                        description="Try adjusting your search terms to find what you're looking for."
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    {filteredExams.map((exam, index) => (
                        <div
                            key={exam.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                            style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Link
                                                href={`/teacher/exams/${exam.id}`}
                                                className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition-colors group-hover:underline"
                                            >
                                                {exam.exam_name}
                                            </Link>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${exam.status === 'published'
                                                ? 'bg-green-100 text-green-800'
                                                : exam.status === 'draft'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {exam.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 text-xs mb-1">Subject</p>
                                                <p className="font-medium text-gray-900">{exam.subject}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs mb-1">Class</p>
                                                <p className="font-medium text-gray-900">{exam.class_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs mb-1">Questions</p>
                                                <p className="font-medium text-gray-900">{exam.total_questions}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs mb-1">Exam Date</p>
                                                <p className="font-medium text-gray-900">
                                                    {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'Not set'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-6 flex flex-col gap-2">
                                        <Link href={`/teacher/exams/${exam.id}`}>
                                            <Button variant="primary" size="sm">
                                                View Details
                                            </Button>
                                        </Link>
                                        <Button
                                            onClick={() => handleGenerateOMR(exam)}
                                            variant="outline"
                                            size="sm"
                                            loading={generatingOMR === exam.id}
                                            icon={
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            }
                                        >
                                            Generate OMR
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone and will delete all associated questions and results.')) {
                                                    handleDeleteExam(exam.id);
                                                }
                                            }}
                                            variant="danger"
                                            size="sm"
                                            className="text-red-600 hover:bg-red-50 border-red-200"
                                            icon={
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {exams.length > 0 && (
                <div className="mt-8 text-center text-sm text-gray-500">
                    Showing {filteredExams.length} of {exams.length} exam{exams.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}

export default function MyExamsPage() {
    return <MyExamsContent />;
}
