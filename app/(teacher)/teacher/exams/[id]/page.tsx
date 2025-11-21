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
    student_class?: string; // Changed from class_name to match DB
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
                    router.push('/login');
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

                // Fetch students
                const { data: teacherData } = await supabase
                    .from('users')
                    .select('school_id')
                    .eq('id', user.id)
                    .single();

                if (teacherData?.school_id) {
                    // Fetch students with roll_number and student_class
                    const { data: studentsData, error: studentsError } = await supabase
                        .from('users')
                        .select('id, full_name, email, roll_number, student_class')
                        .eq('role', 'student')
                        .eq('school_id', teacherData.school_id);

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
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
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
            <div className="flex justify-center items-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading exam details...</p>
                </div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8 animate-slide-up">
                <Link
                    href="/teacher/exams"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm mb-4 font-medium transition-colors group"
                >
                    <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Exams
                </Link>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{exam.exam_name}</h1>
                            <div className="mt-4 flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Subject:</span>
                                    <span className="font-semibold text-gray-900">{exam.subject}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Class:</span>
                                    <span className="font-semibold text-gray-900">{exam.class_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Questions:</span>
                                    <span className="font-semibold text-gray-900">{exam.total_questions}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Date:</span>
                                    <span className="font-semibold text-gray-900">
                                        {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'Not set'}
                                    </span>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${exam.status === 'published'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {exam.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/teacher/exams/${examId}/results`}>
                                <Button variant="outline" icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                }>
                                    View Results
                                </Button>
                            </Link>
                            <Link href={`/teacher/exams/${examId}/questions`}>
                                <Button variant="outline" icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                }>
                                    Set Answer Key
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students Selection Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {/* Card Header */}
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Select Students for OMR Generation
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                <span className="font-semibold text-indigo-600">{selectedStudents.size}</span> of{' '}
                                <span className="font-semibold">{filteredStudents.length}</span> students selected
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={toggleSelectAll}
                                variant="outline"
                                size="md"
                            >
                                {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </Button>
                            <Button
                                onClick={handleDownloadPNG}
                                variant="outline"
                                size="md"
                                loading={generatingPNG}
                                disabled={selectedStudents.size === 0 || generatingBulk}
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                }
                            >
                                Download PNGs
                            </Button>
                            <Button
                                onClick={handleGenerateBulkOMR}
                                variant="primary"
                                size="md"
                                loading={generatingBulk}
                                disabled={selectedStudents.size === 0 || generatingPNG}
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                }
                            >
                                Generate Bulk OMR
                            </Button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search students by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Students List */}
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                        <EmptyState
                            icon={
                                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            }
                            title={searchQuery ? "No students found" : "No students in your school"}
                            description={searchQuery
                                ? "Try adjusting your search terms to find students."
                                : "Students need to be added to your school first before generating OMR sheets."
                            }
                        />
                    ) : (
                        filteredStudents.map((student) => (
                            <div
                                key={student.id}
                                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center group"
                                onClick={() => toggleStudent(student.id)}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.has(student.id)}
                                    onChange={() => toggleStudent(student.id)}
                                    className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                        {student.full_name}
                                    </p>
                                    <p className="text-sm text-gray-500">{student.email}</p>
                                    {/* Display Roll No and Class if available */}
                                    <div className="flex gap-4 mt-1 text-xs text-gray-400">
                                        {student.roll_number && <span>Roll No: {student.roll_number}</span>}
                                        {student.student_class && <span>Class: {student.student_class}</span>}
                                    </div>
                                </div>
                                {selectedStudents.has(student.id) && (
                                    <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
