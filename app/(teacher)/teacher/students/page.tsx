'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { UserCircleIcon, MagnifyingGlassIcon } from '@/components/ui/Icons';

interface Student {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
}

export default function MyStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const supabase = createSupabaseBrowserClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) return;

                // Get teacher's school_id
                const { data: teacherData, error: teacherError } = await supabase
                    .from('users')
                    .select('school_id')
                    .eq('id', user.id)
                    .single();

                if (teacherError) {
                    console.error('Teacher data error:', teacherError);
                    throw new Error(`Failed to fetch teacher data: ${teacherError.message}`);
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

                if (error) throw error;

                setStudents(data || []);
            } catch (err: any) {
                console.error('Error fetching students:', err);
                console.error('Error details:', {
                    message: err?.message,
                    code: err?.code,
                    details: err?.details,
                    hint: err?.hint
                });
                setError(`Failed to load students: ${err?.message || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {filteredStudents.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm ? 'Try adjusting your search terms.' : 'No students are registered for your school yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                                <li key={student.id}>
                                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <span className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                        {student.full_name?.charAt(0).toUpperCase() || 'S'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.full_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                Joined {new Date(student.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
