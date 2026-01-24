'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

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
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const supabase = createSupabaseBrowserClient();

            // Check authentication and role first
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'teacher') {
                showToast('Access denied. This page is only for teachers.', 'error');
                router.push('/');
                return;
            }

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
    }, [examId, showToast, router]);

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

    // Calculate Stats
    const stats = useMemo(() => {
        if (submissions.length === 0) return null;

        const totalStudents = submissions.length;
        // Check for both 'passed' and 'Pass' (case insensitive)
        const passedStudents = submissions.filter(s =>
            s.status?.toLowerCase() === 'passed' || s.status?.toLowerCase() === 'pass'
        ).length;
        const passPercentage = Math.round((passedStudents / totalStudents) * 100);

        // Ensure score is treated as a number and handle null/undefined
        const validScores = submissions.map(s => Number(s.score) || 0);
        const totalScore = validScores.reduce((acc, curr) => acc + curr, 0);
        const averageScore = Math.round(totalScore / totalStudents);
        const maxScore = Math.max(...validScores);
        const totalMarks = submissions[0]?.total_marks || 0;

        return {
            totalStudents,
            passedStudents,
            passPercentage,
            averageScore,
            maxScore,
            totalMarks
        };
    }, [submissions]);

    // Filter Submissions
    const filteredSubmissions = submissions.filter(s =>
        s.student?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student?.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper to determine status color
    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'passed' || s === 'pass') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    // Helper to determine progress bar color
    const getProgressColor = (score: number, total: number) => {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return 'bg-emerald-500';
        if (percentage >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 w-32 bg-gray-200 rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="mb-8 animate-slide-up">
                <Link
                    href={`/teacher/exams/${examId}`}
                    className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors group font-medium mb-6"
                >
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Exam Details
                </Link>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Results Analysis</h1>
                        <p className="text-gray-500 mt-1">
                            Performance overview for <span className="font-semibold text-indigo-600">{examName}</span>
                        </p>
                    </div>

                    {submissions.length > 0 && (
                        <Button
                            onClick={() => setDeleteAllModalOpen(true)}
                            variant="danger"
                            className="shadow-lg shadow-red-100"
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

                {/* Stats Dashboard */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">Total Students</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className={`p-4 rounded-2xl ${stats.passPercentage >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">Pass Rate</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.passPercentage}%</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">Average Score</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {isNaN(stats.averageScore) ? '0' : stats.averageScore}
                                    <span className="text-sm text-gray-400 font-normal ml-1">/ {stats.totalMarks}</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">Highest Score</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {isNaN(stats.maxScore) || stats.maxScore === -Infinity ? '0' : stats.maxScore}
                                    <span className="text-sm text-gray-400 font-normal ml-1">/ {stats.totalMarks}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-900">Detailed Results</h2>
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-sm"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {submissions.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title="No results found"
                            description="No students have submitted this exam yet."
                            icon={
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                            }
                        />
                    </div>
                ) : filteredSubmissions.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No students found matching "{searchQuery}"
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Roll No
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Score
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Submitted
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {filteredSubmissions.map((submission) => (
                                    <tr key={submission.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-9 w-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200 shadow-sm">
                                                    {submission.student?.full_name?.charAt(0) || 'S'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {submission.student?.full_name || 'Unknown Student'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {submission.student?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            {submission.student?.roll_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900">{submission.score ?? 0}</span>
                                                <span className="text-xs text-gray-400">/ {submission.total_marks}</span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(submission.score || 0, submission.total_marks)}`}
                                                    style={{ width: `${((submission.score || 0) / submission.total_marks) * 100}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full capitalize border ${getStatusColor(submission.status)}`}>
                                                {submission.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(submission.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => confirmDelete(submission.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Result"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
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
