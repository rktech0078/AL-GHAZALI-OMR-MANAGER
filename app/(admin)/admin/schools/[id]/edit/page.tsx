'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Icons
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const OfficeBuildingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

// Loading spinner
const LoadingSpinner = () => (
    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
);

export default function EditSchoolPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        school_name: '',
        school_code: '',
        city: '',
        address: '',
        principal_name: '',
        contact_email: '',
        contact_phone: '',
        is_active: true,
    });

    // Fetch school data
    useEffect(() => {
        const fetchSchool = async () => {
            if (!params?.id) return;

            try {
                const response = await fetch(`/api/admin/schools/${params.id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch school');
                }

                setFormData({
                    school_name: data.school_name || '',
                    school_code: data.school_code || '',
                    city: data.city || '',
                    address: data.address || '',
                    principal_name: data.principal_name || '',
                    contact_email: data.contact_email || '',
                    contact_phone: data.contact_phone || '',
                    is_active: data.is_active,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load school');
            } finally {
                setLoading(false);
            }
        };

        fetchSchool();
    }, [params?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!params?.id) return;

        setSaving(true);
        setError('');

        try {
            const response = await fetch(`/api/admin/schools/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update school');
            }

            router.push('/admin/schools');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-medium text-gray-600">Loading school details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container max-w-3xl p-4 mx-auto sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/admin/schools"
                        className="inline-flex items-center justify-center p-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400"
                        title="Back to Schools"
                    >
                        <ArrowLeftIcon />
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                            <OfficeBuildingIcon />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Edit School</h1>
                            <p className="text-sm text-gray-500">Update school information and settings</p>
                        </div>
                    </div>
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl sm:p-8">
                        <h2 className="mb-6 text-lg font-semibold text-gray-900 border-b border-gray-100 pb-4">
                            School Details
                        </h2>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* School Name */}
                            <div className="sm:col-span-2">
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    School Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.school_name}
                                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="e.g., Al-Ghazali Model School"
                                />
                            </div>

                            {/* School Code */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    School Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.school_code}
                                    onChange={(e) => setFormData({ ...formData, school_code: e.target.value })}
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="e.g., AGS001"
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="e.g., Lahore"
                                />
                            </div>

                            {/* Address */}
                            <div className="sm:col-span-2">
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    Address
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="Full address of the school"
                                />
                            </div>

                            {/* Principal Name */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    Principal Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.principal_name}
                                    onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="e.g., Dr. Ahmed Khan"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    Status
                                </label>
                                <select
                                    value={formData.is_active ? 'active' : 'inactive'}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                >
                                    <option value="active">✅ Active</option>
                                    <option value="inactive">❌ Inactive</option>
                                </select>
                            </div>

                            {/* Contact Email */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    Contact Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="school@example.com"
                                />
                            </div>

                            {/* Contact Phone */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">
                                    Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="+92 300 1234567"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 pt-4 sm:flex-row-reverse">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 bg-indigo-600 border-2 border-indigo-600 shadow-lg rounded-xl hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <LoadingSpinner />
                                    Saving Changes...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                        <Link
                            href="/admin/schools"
                            className="flex-1 px-6 py-3 text-sm font-semibold text-center text-gray-700 transition-all duration-200 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
