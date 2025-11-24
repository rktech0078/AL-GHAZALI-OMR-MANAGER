'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

// Loading spinner
const LoadingSpinner = () => (
    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
);

// Icons
const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const AlertTriangleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

interface User {
    id: string;
    email: string;
    full_name: string;
}

interface DeleteUserConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

export default function DeleteUserConfirmation({
    isOpen,
    onClose,
    onSuccess,
    user,
}: DeleteUserConfirmationProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { showToast } = useToast();

    const handleDelete = async () => {
        if (!user) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete user');
            }

            showToast('User deleted successfully', 'success');
            onSuccess();
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An error occurred';
            setError(message);
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError('');
            onClose();
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-semibold text-gray-700">Deleting user...</p>
                        </div>
                    </div>
                )}

                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center flex-shrink-0 w-16 h-16 rounded-full bg-red-100">
                                <AlertTriangleIcon />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Delete User</h2>
                                <p className="mt-0.5 text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >
                            <XIcon />
                        </button>
                    </div>

                    {/* Warning Message */}
                    <div className="p-5 mb-6 border-2 border-red-200 rounded-xl bg-red-50">
                        <p className="mb-3 text-sm font-medium text-gray-700">
                            Are you sure you want to delete this user?
                        </p>
                        <div className="p-4 bg-white border border-red-100 rounded-lg">
                            <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                            <p className="mt-1 text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex items-start gap-2 p-3 mt-3 border border-red-200 rounded-lg bg-red-50/50">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs font-medium text-red-700">
                                All data associated with this user (exams, submissions, results) will also be permanently deleted
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 mb-6 text-sm font-medium text-red-700 border border-red-200 rounded-xl bg-red-50">
                            {error}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col gap-3 sm:flex-row-reverse">
                        <button
                            type="button"
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
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Yes, Delete User
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
