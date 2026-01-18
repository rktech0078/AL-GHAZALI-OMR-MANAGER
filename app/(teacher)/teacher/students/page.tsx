'use client';

import { useState, useEffect, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import AddStudentModal from '@/components/teacher/AddStudentModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { deleteStudent } from '../actions';

interface Student {
    id: string;
    full_name: string;
    email: string;
    roll_number?: string;
    created_at: string;
}

export default function MyStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Ensure we only run client-side code after mounting
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchStudents = async () => {
        console.log('[StudentsPage] Starting fetchStudents...');
        try {
            setLoading(true);
            const supabase = createSupabaseBrowserClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            console.log('[StudentsPage] Auth user:', user?.id, 'Error:', authError);

            if (!user) {
                console.warn('[StudentsPage] No user found');
                setError('Please log in to view students.');
                setLoading(false);
                return;
            }

            // Get teacher's school_id and verify role
            const { data: teacherData, error: teacherError } = await supabase
                .from('users')
                .select('school_id, role')
                .eq('id', user.id)
                .single();

            if (teacherError) {
                console.error('Teacher data error:', teacherError);
                throw new Error(`Failed to fetch teacher data: ${teacherError.message}`);
            }

            // Check if user is a teacher
            if (teacherData?.role !== 'teacher') {
                setError('Access denied. This page is only for teachers.');
                setLoading(false);
                return;
            }

            if (!teacherData?.school_id) {
                throw new Error('Your account is not associated with a school. Please contact an administrator to assign you to a school.');
            }

            // Fetch students of the same school
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('school_id', teacherData.school_id)
                .eq('role', 'student')
                .order('full_name', { ascending: true });

            if (error) {
                console.error('[StudentsPage] Error fetching students list:', error);
                throw error;
            }

            console.log('[StudentsPage] Students fetched:', data?.length);
            setStudents(data || []);
        } catch (err: any) {
            console.error('[StudentsPage] Catch block error:', err);
            setError(`Failed to load students: ${err?.message || 'Unknown error'}`);
        } finally {
            console.log('[StudentsPage] Finally block - setLoading(false)');
            setLoading(false);
        }
    };

    const handleDeleteClick = (student: Student) => {
        setStudentToDelete(student);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!studentToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteStudent(studentToDelete.id);

            if (result.error) {
                setError(result.error);
            } else {
                // Remove from local state
                setStudents(students.filter(s => s.id !== studentToDelete.id));
                setStudentToDelete(null);
            }
            setDeleteModalOpen(false);
        } catch (err: any) {
            setError(`Failed to delete student: ${err.message}`);
            setDeleteModalOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        if (isMounted) {
            fetchStudents();
        }
    }, [isMounted]);

    const filteredStudents = useMemo(() => {
        return students.filter(student =>
            student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const stats = useMemo(() => {
        return {
            total: students.length,
            active: students.length, // Placeholder logic for now
            newThisMonth: students.filter(s => {
                const date = new Date(s.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length
        };
    }, [students]);

    if (loading || !isMounted) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 w-48 bg-gray-200 rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-slide-up">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
                    <p className="text-gray-500 mt-1">Manage and view all registered students</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="primary"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Add Student
                    </Button>
                </div>
            </div>

            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    fetchStudents();
                }}
            />

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Total Students</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Active Students</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">New This Month</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.newThisMonth}</p>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Search by name, email, or roll no..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Students Grid */}
            {filteredStudents.length === 0 ? (
                <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <EmptyState
                        title="No students found"
                        description={searchTerm ? `No students matching "${searchTerm}"` : "No students are registered for your school yet."}
                        icon={
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    {filteredStudents.map((student) => (
                        <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                            <div className="relative flex items-start justify-between mb-4">
                                <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-indigo-700 font-bold text-2xl border border-indigo-200 shadow-sm">
                                    {student.full_name?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                        Active
                                    </span>
                                    <button
                                        onClick={() => handleDeleteClick(student)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete Student"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                    {student.full_name}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {student.email}
                                </p>

                                <div className="space-y-2 pt-4 border-t border-gray-50">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Roll Number</span>
                                        <span className="font-medium text-gray-900">{student.roll_number || '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Joined</span>
                                        <span className="font-medium text-gray-900">
                                            {new Date(student.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-50 flex gap-2">
                                    <button className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                                        View Profile
                                    </button>
                                    <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                                        Results
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Student"
                message={`Are you sure you want to delete ${studentToDelete?.full_name}? This will permanently remove the student account and all associated data. This action cannot be undone.`}
                confirmText="Delete Student"
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
}
