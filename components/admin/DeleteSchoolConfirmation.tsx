'use client';

import { useState } from 'react';

// Icons
const AlertTriangleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

// Loading spinner
const LoadingSpinner = () => (
    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
);

interface School {
    id: string;
    school_name: string;
    school_code: string;
}

interface DeleteSchoolConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    school: School | null;
}

export default function DeleteSchoolConfirmation({
    isOpen,
    onClose,
    onSuccess,
    school,
}: DeleteSchoolConfirmationProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!school) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/admin/schools/${school.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete school');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !school) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-semibold text-gray-700">Deleting school...</p>
                        </div>
                    </div>
                )}

                <div className="p-6 sm:p-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 mb-4 bg-red-100 rounded-full">
                            <AlertTriangleIcon />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Delete School?</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Are you sure you want to delete <span className="font-bold text-gray-900">{school.school_name}</span>?
                        </p>
                    </div>

                    <div className="p-4 mt-6 text-sm text-left text-red-800 border border-red-200 bg-red-50 rounded-xl">
                        <p className="font-bold flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Warning: This action is irreversible!
                        </p>
                        <ul className="pl-5 space-y-1 list-disc opacity-90">
                            <li>All students and teachers in this school will be unlinked or deleted.</li>
                            <li>All exam data and results associated with this school will be permanently removed.</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="p-3 mt-4 text-sm text-red-600 bg-red-50 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mt-8 sm:flex-row-reverse">
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="flex-1 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 bg-red-600 border-2 border-red-600 shadow-lg rounded-xl hover:bg-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <TrashIcon />
                                    Yes, Delete School
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
