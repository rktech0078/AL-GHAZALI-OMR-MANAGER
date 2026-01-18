'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
}

interface Student {
    id: string;
    full_name: string;
    email: string;
    roll_number?: string;
    student_class?: string;
}

export default function ExamDetailPage() {
    return <ExamDetailContent />;
}

function ExamDetailContent() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;
    const { showToast } = useToast();

    const [exam, setExam] = useState<Exam | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [generatingBulk, setGeneratingBulk] = useState(false);
    const [generatingPNG, setGeneratingPNG] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createSupabaseBrowserClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setLoading(false);
                    router.push('/login');
                    return;
                }

                // Check if user is a teacher
                const { data: profile } = await supabase
                    .from('users')
                    .select('role, school_id')
                    .eq('id', user.id)
                    .single();

                if (profile?.role !== 'teacher') {
                    setLoading(false);
                    showToast('Access denied. This page is only for teachers.', 'error');
                    router.push('/');
                    return;
                }

                // Fetch exam details
                const { data: examData, error: examError } = await supabase
                    .from('exams')
                    .select('*')
                    .eq('id', examId)
                    .single();

                if (examError) throw examError;
                setExam(examData);

                // Fetch students using the school_id from profile
                if (profile?.school_id) {
                    // Fetch students with roll_number and student_class
                    const { data: studentsData, error: studentsError } = await supabase
                        .from('users')
                        .select('id, full_name, email, roll_number, student_class')
                        .eq('role', 'student')
                        .eq('school_id', profile.school_id);

                    if (studentsError) throw studentsError;
                    setStudents(studentsData || []);
                }

            } catch (err: any) {
                console.error('Error fetching data:', err);
                showToast('Failed to load exam details', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [examId, router, showToast]);

    // Filter students based on search
    const filteredStudents = students.filter(student =>
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.roll_number && student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const toggleStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedStudents.size === filteredStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const generateOMRPDF = async () => {
        const supabase = createSupabaseBrowserClient();

        // Get questions
        const { data: questions } = await supabase
            .from('questions')
            .select('question_number, correct_answer')
            .eq('exam_id', examId)
            .order('question_number', { ascending: true });

        const answerKey = questions
            ?.filter(q => q.correct_answer)
            .reduce((acc, q) => {
                acc[q.question_number] = q.correct_answer;
                return acc;
            }, {} as Record<string, string>) || {};

        // Get selected students info
        const selectedStudentsList = students
            .filter(s => selectedStudents.has(s.id))
            .map(s => ({
                id: s.id,
                name: s.full_name,
                rollNumber: s.roll_number || '',
                className: s.student_class || exam?.class_name || '' // Use student_class
            }));

        const response = await fetch('/api/omr/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                students: selectedStudentsList,
                examName: exam?.exam_name,
                schoolName: 'Al-Ghazali School',
                questions: exam?.total_questions,
                options: exam?.options_count,
                showKey: true,
                answerKey: answerKey,
                examId: examId
            })
        });

        if (!response.ok) throw new Error('Failed to generate OMR');
        return await response.blob();
    };

    const handleGenerateBulkOMR = async () => {
        if (selectedStudents.size === 0) {
            showToast('Please select at least one student', 'warning');
            return;
        }

        setGeneratingBulk(true);
        try {
            const blob = await generateOMRPDF();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bulk-omr-${exam?.exam_name}-${selectedStudents.size}-students.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast(`Successfully generated OMR sheets for ${selectedStudents.size} students! 🎉`, 'success');
            setSelectedStudents(new Set()); // Clear selection

        } catch (err: any) {
            console.error('Error generating bulk OMR:', err);
            showToast('Failed to generate bulk OMR: ' + (err?.message || 'Unknown error'), 'error');
        } finally {
            setGeneratingBulk(false);
        }
    };

    // Helper to load PDF.js from CDN
    const loadPdfJs = async () => {
        if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                const pdfjsLib = (window as any).pdfjsLib;
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve(pdfjsLib);
            };
            script.onerror = () => reject(new Error('Failed to load PDF.js'));
            document.body.appendChild(script);
        });
    };

    const handleDownloadPNG = async () => {
        if (selectedStudents.size === 0) {
            showToast('Please select at least one student', 'warning');
            return;
        }

        setGeneratingPNG(true);
        try {
            const pdfBlob = await generateOMRPDF();
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Load PDF.js from CDN
            const pdfjsLib = await loadPdfJs();

            // Load PDF
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            // Process each page
            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const scale = 2; // High quality
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;

                    // Convert to blob and download
                    canvas.toBlob((blob: Blob | null) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `omr-${exam?.exam_name}-page-${i}.png`;
                            document.body.appendChild(a);
                            a.click();
                            URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                        }
                    }, 'image/png');
                }
            }

            showToast(`Successfully downloaded ${totalPages} PNG images!`, 'success');
            setSelectedStudents(new Set());

        } catch (err: any) {
            console.error('Error generating PNGs:', err);
            showToast('Failed to generate PNGs: ' + (err?.message || 'Unknown error'), 'error');
        } finally {
            setGeneratingPNG(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 w-32 bg-gray-200 rounded"></div>
                    <div className="h-48 bg-gray-200 rounded-xl"></div>
                    <div className="h-96 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <EmptyState
                    title="Exam Not Found"
                    description="The exam you're looking for doesn't exist or you don't have permission to access it."
                    action={{
                        label: 'Back to Exams',
                        onClick: () => router.push('/teacher/exams')
                    }}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50/50">
            {/* Navigation */}
            <div className="mb-6">
                <Link
                    href="/teacher/exams"
                    className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors group font-medium"
                >
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Exams
                </Link>
            </div>

            {/* Exam Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 animate-slide-up">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{exam.exam_name}</h1>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${exam.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {exam.status}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="font-medium">{exam.subject}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="font-medium">{exam.class_name}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">{exam.total_questions} Questions</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">
                                    {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Date not set'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
                        <Link href={`/teacher/exams/${examId}/questions`}>
                            <Button variant="outline" className="bg-white hover:bg-gray-50" icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            }>
                                Edit Questions / Key
                            </Button>
                        </Link>
                        <Link href={`/teacher/exams/${examId}/results`}>
                            <Button variant="outline" className="bg-white hover:bg-gray-50" icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            }>
                                View Results
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Student Selection & OMR Generation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Generate OMR Sheets</h2>
                            <p className="text-sm text-gray-500 mt-1">Select students to generate personalized OMR sheets</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleDownloadPNG}
                                variant="outline"
                                size="sm"
                                loading={generatingPNG}
                                disabled={selectedStudents.size === 0 || generatingBulk}
                                icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                }
                            >
                                Download PNGs
                            </Button>
                            <Button
                                onClick={handleGenerateBulkOMR}
                                variant="primary"
                                size="sm"
                                loading={generatingBulk}
                                disabled={selectedStudents.size === 0 || generatingPNG}
                                className="shadow-lg shadow-indigo-100"
                                icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                }
                            >
                                Generate Bulk OMR
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-96">
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="text-sm text-gray-600">
                                <span className="font-bold text-indigo-600">{selectedStudents.size}</span> selected
                            </span>
                            <Button
                                onClick={toggleSelectAll}
                                variant="ghost"
                                size="sm"
                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                                {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                        <div className="p-12">
                            <EmptyState
                                icon={
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                }
                                title={searchQuery ? "No students found" : "No students available"}
                                description={searchQuery
                                    ? "Try adjusting your search terms."
                                    : "Add students to your school to generate OMR sheets."
                                }
                            />
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        onClick={() => toggleStudent(student.id)}
                                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedStudents.has(student.id) ? 'bg-indigo-50/50' : ''}`}
                                    >
                                        <td className="px-6 py-4 w-16">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.has(student.id)}
                                                    onChange={() => toggleStudent(student.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{student.full_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {student.roll_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {student.student_class || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {student.email}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
