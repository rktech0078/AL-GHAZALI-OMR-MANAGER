'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Icons
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

const OfficeBuildingIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-8 h-8"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

interface School {
    id: string;
    school_name: string;
    school_code: string;
    city: string | null;
    address: string | null;
    principal_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    is_active: boolean;
}

export default function ViewSchoolPage() {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [school, setSchool] = useState<School | null>(null);

    useEffect(() => {
        const fetchSchool = async () => {
            if (!params?.id) return;

            try {
                const response = await fetch(`/api/admin/schools/${params.id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch school');
                }

                setSchool(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load school');
            } finally {
                setLoading(false);
            }
        };

        fetchSchool();
    }, [params?.id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-medium text-gray-600">Loading school details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="p-6 text-center bg-white rounded-lg shadow-sm">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Error Loading School</h3>
                    <p className="mt-2 text-sm text-gray-500">{error}</p>
                    <Link
                        href="/admin/schools"
                        className="inline-flex items-center px-4 py-2 mt-4 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        Back to Schools
                    </Link>
                </div>
            </div>
        );
    }

    if (!school) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container max-w-4xl p-4 mx-auto sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/schools"
                            className="inline-flex items-center justify-center p-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400"
                            title="Back to Schools"
                        >
                            <ArrowLeftIcon />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">School Details</h1>
                            <p className="text-sm text-gray-500">View complete school information</p>
                        </div>
                    </div>

                    <Link
                        href={`/admin/schools/${school.id}/edit`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PencilIcon />
                        Edit School
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Info Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                            <div className="p-6 sm:p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl">
                                            <OfficeBuildingIcon className="w-8 h-8 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{school.school_name}</h2>
                                            <p className="text-sm font-medium text-indigo-600">{school.school_code}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`inline-flex px-3 py-1 text-xs font-semibold leading-5 rounded-full ${school.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {school.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Principal</h3>
                                        <p className="mt-1 text-base font-medium text-gray-900">{school.principal_name || 'Not assigned'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">City</h3>
                                        <p className="mt-1 text-base font-medium text-gray-900">{school.city || 'Not specified'}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Address</h3>
                                        <p className="mt-1 text-base text-gray-600">{school.address || 'No address provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info Card */}
                        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                            </div>
                            <div className="p-6 sm:p-8">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Email Address</p>
                                            <a href={`mailto:${school.contact_email}`} className="text-base font-medium text-indigo-600 hover:underline">
                                                {school.contact_email || 'N/A'}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-green-50 rounded-lg">
                                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Phone Number</p>
                                            <a href={`tel:${school.contact_phone}`} className="text-base font-medium text-gray-900 hover:text-indigo-600">
                                                {school.contact_phone || 'N/A'}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Stats/Quick Actions */}
                    <div className="space-y-6">
                        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                                        <span className="text-sm text-gray-500">Total Students</span>
                                        <span className="text-lg font-bold text-gray-900">0</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                                        <span className="text-sm text-gray-500">Total Teachers</span>
                                        <span className="text-lg font-bold text-gray-900">0</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Active Exams</span>
                                        <span className="text-lg font-bold text-gray-900">0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
