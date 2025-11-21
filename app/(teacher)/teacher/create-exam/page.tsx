'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateExamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        exam_name: '',
        subject: '',
        class_name: '',
        total_questions: 20,
        passing_marks: 40,
        options_count: 4,
        exam_date: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/teacher/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create exam');
            }

            // Redirect to Question Builder
            router.push(`/teacher/exams/${data.exam.id}/questions`);

        } catch (err) {
            console.error('Error creating exam:', err);
            setError(err instanceof Error ? err.message : 'Failed to create exam');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Exam</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Exam Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Exam Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.exam_name}
                                onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Mathematics Mid-Term 2024"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g., Mathematics"
                                />
                            </div>

                            {/* Class */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Class *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.class_name}
                                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g., 9th Grade"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Total Questions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Total Questions *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="100"
                                    value={formData.total_questions}
                                    onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            {/* Passing Marks */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Passing Marks *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max={formData.total_questions}
                                    value={formData.passing_marks}
                                    onChange={(e) => setFormData({ ...formData, passing_marks: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Options Count */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Options *
                                </label>
                                <select
                                    value={formData.options_count}
                                    onChange={(e) => setFormData({ ...formData, options_count: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value={4}>4 (A, B, C, D)</option>
                                    <option value={5}>5 (A, B, C, D, E)</option>
                                </select>
                            </div>

                            {/* Exam Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Exam Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.exam_date}
                                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                <p className="font-medium">Error</p>
                                <p className="text-sm whitespace-pre-wrap">{error}</p>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed font-medium shadow-sm"
                            >
                                {loading ? 'Creating Exam...' : 'Create Exam & Set Answer Key'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
