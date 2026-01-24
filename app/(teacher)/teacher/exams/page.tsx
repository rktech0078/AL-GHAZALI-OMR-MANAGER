'use client';
// Force rebuild


import { useState, useEffect, useRef } from 'react';
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
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const { showToast } = useToast();
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        let mounted = true;
        const fetchExams = async () => {
            console.log('Fetching exams started...');
            try {
                const supabase = createSupabaseBrowserClient();
                const { data: { user } } = await supabase.auth.getUser();
                console.log('User fetched:', user?.id);

                if (!user) {
                    console.log('No user found, redirecting...');
                    if (mounted) setLoading(false);
                    router.push('/login');
                    return;
                }

                // Check if user is a teacher
                const { data: profile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile?.role !== 'teacher') {
                    console.log('User is not a teacher, redirecting...');
                    if (mounted) setLoading(false);
                    showToast('Access denied. This page is only for teachers.', 'error');
                    router.push('/');
                    return;
                }

                const { data, error } = await supabase
                    .from('exams')
                    .select('*')
                    .eq('created_by', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Supabase error fetching exams:', error);
                    throw error;
                }

                console.log('Exams fetched:', data?.length);
                if (mounted) setExams(data || []);
            } catch (err: any) {
                console.error('Error fetching exams:', err);
                if (mounted) showToast(err?.message || 'Failed to load exams', 'error');
            } finally {
                console.log('Fetch exams finally block reached');
                if (mounted) setLoading(false);
            }
        };

        fetchExams();

        // Refetch when window regains focus
        const handleFocus = () => {
            console.log('Window focused, refetching exams...');
            fetchExams();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            mounted = false;
            window.removeEventListener('focus', handleFocus);
        };
    }, [router, showToast]);

    const handleGenerateOMR = async (exam: Exam) => {
        try {
            setGeneratingOMR(exam.id);
            setActiveMenu(null);
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

            let schoolName = 'AL-GHAZALI HIGH SCHOOL';
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
            setActiveMenu(null);
            const supabase = createSupabaseBrowserClient();

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
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-64 animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                                <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Exams</h1>
                    <p className="mt-1 text-gray-500">Manage your assessments and OMR sheets</p>
                </div>
                <Link href="/teacher/create-exam">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full md:w-auto shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                    >
                        Create New Exam
                    </Button>
                </Link>
            </div>

            {/* Search Bar */}
            {exams.length > 0 && (
                <div className="mb-8 relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search exams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm"
                    />
                </div>
            )}

            {/* Exams Grid */}
            {exams.length === 0 ? (
                <EmptyState
                    icon={
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    }
                    title="No exams created yet"
                    description="Get started by creating your first exam to generate OMR sheets."
                    action={{
                        label: 'Create Exam',
                        onClick: () => router.push('/teacher/create-exam')
                    }}
                />
            ) : filteredExams.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No exams found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam) => (
                        <div
                            key={exam.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group relative flex flex-col h-full"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 pr-4">
                                        <Link href={`/teacher/exams/${exam.id}`} className="block">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1" title={exam.exam_name}>
                                                {exam.exam_name}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-gray-500 mt-1">{exam.subject} • {exam.class_name}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${exam.status === 'published' ? 'bg-green-100 text-green-800' :
                                            exam.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'}`}>
                                        {exam.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {exam.total_questions} Qs
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'No Date'}
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 rounded-b-2xl flex justify-between items-center">
                                <Link
                                    href={`/teacher/exams/${exam.id}`}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                                >
                                    View Details
                                </Link>

                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenu(activeMenu === exam.id ? null : exam.id);
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>

                                    {activeMenu === exam.id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-100"
                                        >
                                            <button
                                                onClick={() => handleGenerateOMR(exam)}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                disabled={generatingOMR === exam.id}
                                            >
                                                {generatingOMR === exam.id ? (
                                                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                )}
                                                Download OMR
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this exam?')) {
                                                        handleDeleteExam(exam.id);
                                                    }
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                            >
                                                <svg className="w-4 h-4 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete Exam
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function MyExamsPage() {
    return <MyExamsContent />;
}
