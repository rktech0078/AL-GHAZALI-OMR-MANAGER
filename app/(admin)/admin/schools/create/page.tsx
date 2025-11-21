'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateSchoolPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            school_name: formData.get('name'),
            school_code: formData.get('code'),
            city: formData.get('city'),
            address: formData.get('address'),
            principal_name: formData.get('principal_name'),
            contact_email: formData.get('contact_email'),
            contact_phone: formData.get('contact_phone'),
        };

        try {
            const response = await fetch('/api/admin/schools', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create school');
            }

            router.push('/admin/schools');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl p-4 mx-auto sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create New School</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Add a new educational institution to the system
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                        School Information
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700"
                            >
                                School Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="e.g., Al-Ghazali Model School"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="code"
                                className="block text-sm font-medium text-gray-700"
                            >
                                School Code *
                            </label>
                            <input
                                type="text"
                                name="code"
                                id="code"
                                required
                                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="e.g., AGS001"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Unique identifier for the school
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="city"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    City
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    id="city"
                                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="e.g., Lahore"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="principal_name"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Principal Name
                                </label>
                                <input
                                    type="text"
                                    name="principal_name"
                                    id="principal_name"
                                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="e.g., Dr. Ahmed Khan"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="address"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Address
                            </label>
                            <textarea
                                name="address"
                                id="address"
                                rows={3}
                                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Full address of the school"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="contact_email"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Contact Email
                                </label>
                                <input
                                    type="email"
                                    name="contact_email"
                                    id="contact_email"
                                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="school@example.com"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="contact_phone"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    name="contact_phone"
                                    id="contact_phone"
                                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="+92 300 1234567"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logo Upload Section - Phase 2 */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="mb-2 text-lg font-semibold text-gray-800">
                        School Logos
                    </h2>
                    <p className="mb-4 text-sm text-gray-500">
                        Logo upload feature coming soon in Phase 2
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : 'Create School'}
                    </button>
                </div>
            </form>
        </div>
    );
}
