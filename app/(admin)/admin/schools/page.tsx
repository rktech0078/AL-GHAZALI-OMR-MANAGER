'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DeleteSchoolConfirmation from '@/components/admin/DeleteSchoolConfirmation';

// Icons
const OfficeBuildingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

interface School {
    id: string;
    school_name: string;
    school_code: string;
    city: string | null;
    principal_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    is_active: boolean;
}

export default function SchoolsPage() {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

    const fetchSchools = async () => {
        try {
            const response = await fetch('/api/admin/schools');
            const data = await response.json();
            if (data.schools) {
                setSchools(data.schools);
            }
        } catch (error) {
            console.error('Error fetching schools:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSchools();
    };

    const handleDeleteClick = (school: School) => {
        setSelectedSchool(school);
        setDeleteModalOpen(true);
    };

    const handleDeleteSuccess = () => {
        fetchSchools();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container p-4 mx-auto sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="inline-flex items-center justify-center p-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400"
                            title="Back to Dashboard"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">School Management</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage all registered schools and their information
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 sm:px-4"
                            title="Refresh list"
                        >
                            <RefreshIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <Link
                            href="/admin/schools/create"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <PlusIcon />
                            <span className="hidden sm:inline">Add School</span>
                            <span className="sm:hidden">Add</span>
                        </Link>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm font-medium text-gray-600">Loading schools...</p>
                    </div>
                ) : schools.length === 0 ? (
                    <div className="p-12 text-center bg-white border-2 border-gray-200 border-dashed rounded-xl">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-full">
                            <OfficeBuildingIcon />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No schools yet</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Get started by creating a new school.
                        </p>
                        <Link
                            href="/admin/schools/create"
                            className="inline-flex items-center px-4 py-2 mt-6 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
                        >
                            <PlusIcon />
                            <span className="ml-2">Add New School</span>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            School Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            Code
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            City
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            Contact
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {schools.map((school) => (
                                        <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-100 rounded-full text-indigo-600">
                                                        <OfficeBuildingIcon />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{school.school_name}</div>
                                                        {school.principal_name && (
                                                            <div className="text-sm text-gray-500">Principal: {school.principal_name}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {school.school_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{school.city || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{school.contact_email || 'N/A'}</div>
                                                {school.contact_phone && (
                                                    <div className="text-xs text-gray-500">{school.contact_phone}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${school.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {school.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/schools/${school.id}`}
                                                        className="p-2 text-gray-400 transition-colors rounded-lg hover:text-indigo-600 hover:bg-indigo-50"
                                                        title="View Details"
                                                    >
                                                        <EyeIcon />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/schools/${school.id}/edit`}
                                                        className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                                                        title="Edit School"
                                                    >
                                                        <PencilIcon />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteClick(school)}
                                                        className="p-2 text-gray-400 transition-colors rounded-lg hover:text-red-600 hover:bg-red-50"
                                                        title="Delete School"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Summary */}
                {!loading && schools.length > 0 && (
                    <div className="mt-4 text-sm text-gray-500">
                        Showing {schools.length} school{schools.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteSchoolConfirmation
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onSuccess={handleDeleteSuccess}
                school={selectedSchool}
            />
        </div>
    );
}
