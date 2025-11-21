'use client';

import { useState } from 'react';

// Loading spinner component
const LoadingSpinner = () => (
    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
);

// Close icon
const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// User icon
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'teacher' | 'student';
    school_id: string | null;
    roll_number?: string;
    student_class?: string;
}

interface School {
    id: string;
    school_name: string;
}

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    schools: School[];
}

export default function AddUserModal({
    isOpen,
    onClose,
    onSuccess,
    schools,
}: AddUserModalProps) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'student' as 'admin' | 'teacher' | 'student',
        school_id: '',
        roll_number: '',
        student_class: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    school_id: formData.school_id || null,
                    roll_number: formData.role === 'student' ? formData.roll_number : null,
                    student_class: formData.role === 'student' ? formData.student_class : null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            // Reset form
            setFormData({
                email: '',
                password: '',
                full_name: '',
                role: 'student',
                school_id: '',
                roll_number: '',
                student_class: '',
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-semibold text-gray-700">Creating user...</p>
                        </div>
                    </div>
                )}

                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100">
                                <UserIcon />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Add New User</h2>
                                <p className="mt-0.5 text-sm text-gray-500">Create a new user account</p>
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

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 mb-6 text-sm font-medium text-red-700 border border-red-200 rounded-xl bg-red-50">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email & Full Name Row */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {/* Full Name */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    minLength={2}
                                    disabled={loading}
                                    value={formData.full_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, full_name: e.target.value })
                                    }
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                                    placeholder="John Doe"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    disabled={loading}
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                                    placeholder="user@example.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                disabled={loading}
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                                placeholder="••••••••"
                            />
                            <p className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Minimum 6 characters required
                            </p>
                        </div>

                        {/* Role & School Row */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {/* Role */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    disabled={loading}
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            role: e.target.value as 'admin' | 'teacher' | 'student',
                                        })
                                    }
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                                >
                                    <option value="student">🎓 Student</option>
                                    <option value="teacher">👨‍🏫 Teacher</option>
                                    <option value="admin">⚡ Admin</option>
                                </select>
                            </div>

                            {/* School */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    School <span className="text-gray-400">(Optional)</span>
                                </label>
                                <select
                                    disabled={loading}
                                    value={formData.school_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, school_id: e.target.value })
                                    }
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">🏫 No School</option>
                                    {schools.map((school) => (
                                        <option key={school.id} value={school.id}>
                                            {school.school_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Student Specific Fields */}
                        {formData.role === 'student' && (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                                        Roll Number
                                    </label>
                                    <input
                                        type="text"
                                        disabled={loading}
                                        value={formData.roll_number}
                                        onChange={(e) =>
                                            setFormData({ ...formData, roll_number: e.target.value })
                                        }
                                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                                        placeholder="e.g. 101"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                                        Class / Grade
                                    </label>
                                    <input
                                        type="text"
                                        disabled={loading}
                                        value={formData.student_class}
                                        onChange={(e) =>
                                            setFormData({ ...formData, student_class: e.target.value })
                                        }
                                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                                        placeholder="e.g. 10th-A"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col gap-3 pt-6 sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 bg-indigo-600 border-2 border-indigo-600 shadow-lg rounded-xl hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner />
                                        Creating User...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create User
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
                    </form>
                </div>
            </div>
        </div>
    );
}
