'use client';

import { useState, useEffect, useCallback } from 'react';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface Submission {
    id: string;
    student_id: string;
    exam_id: string;
    score: number;
    total_marks: number;
    status: string;
    created_at: string;
    student?: {
        full_name: string;
        email: string;
        roll_number: string;
    };
}

export default function ExamResultsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;
    const { showToast } = useToast();

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [examName, setExamName] = useState('');

    // Modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const supabase = createSupabaseBrowserClient();

            // Fetch exam details
            const { data: examData, error: examError } = await supabase
                .from('exams')
                .select('exam_name')
                .eq('id', examId)
                .single();

            if (examError) throw examError;
            setExamName(examData.exam_name);

            // Fetch submissions with student details
            const { data: resultsData, error: resultsError } = await supabase
                .from('results')
                .select(`
                    *,
                    student:users!student_id (
                        full_name,
                        email,
                        roll_number
                    )
                `)
                .eq('exam_id', examId)
                .order('created_at', { ascending: false });

            if (resultsError) throw resultsError;
            setSubmissions(resultsData || []);

        } catch (err: any) {
            console.error('Error fetching results:', err);
            showToast('Failed to load results', 'error');
        } finally {
            setLoading(false);
        }
    }, [examId, showToast]);

    useEffect(() => {
        fetchData();
    }, [examId, fetchData]);

    const confirmDelete = (id: string) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const handleDeleteSubmission = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch('/api/results/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'single',
                    submissionIds: [itemToDelete], // itemToDelete is the result ID (from frontend state)
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete result');
            }

            setSubmissions(submissions.filter(s => s.id !== itemToDelete));
            showToast('Result deleted successfully', 'success');
            setDeleteModalOpen(false);
        } catch (err: any) {
            console.error('Error deleting result:', err);
            showToast('Failed to delete result: ' + (err?.message || 'Unknown error'), 'error');
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch('/api/results/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'all',
                    examId: examId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete all results');
            }

            setSubmissions([]);
            showToast('All results deleted successfully', 'success');
            setDeleteAllModalOpen(false);
        } catch (err: any) {
            console.error('Error deleting all results:', err);
            showToast('Failed to delete all results', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={`/teacher/exams/${examId}`}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm mb-4 font-medium transition-colors"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Exam Details
                </Link>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Results: {examName}</h1>
                        <p className="text-gray-600 mt-1">
                            Total Submissions: {submissions.length}
                        </p>
                    </div>

                    {submissions.length > 0 && (
                        <Button
                            onClick={() => setDeleteAllModalOpen(true)}
                            variant="danger"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            }
                        >
                            Delete All Results
                        </Button>
                    )}
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {submissions.length === 0 ? (
                    <EmptyState
                        title="No results found"
                        description="No students have submitted this exam yet."
                        icon={
                            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Roll No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {submissions.map((submission) => (
                                    <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {submission.student?.full_name?.charAt(0) || 'S'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {submission.student?.full_name || 'Unknown Student'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {submission.student?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {submission.student?.roll_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {submission.score} / {submission.total_marks}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {Math.round((submission.score / submission.total_marks) * 100)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${submission.status === 'passed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {submission.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(submission.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => confirmDelete(submission.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteSubmission}
                title="Delete Result"
                message="Are you sure you want to delete this result? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                loading={isDeleting}
            />

            <ConfirmationModal
                isOpen={deleteAllModalOpen}
                onClose={() => setDeleteAllModalOpen(false)}
                onConfirm={handleDeleteAll}
                title="Delete All Results"
                message="Are you sure you want to delete ALL results for this exam? This will permanently remove all student submissions and scores. This action cannot be undone."
                confirmText="Delete All"
                variant="danger"
                typeToConfirm="DELETE"
                loading={isDeleting}
            />
        </div>
    );
}
