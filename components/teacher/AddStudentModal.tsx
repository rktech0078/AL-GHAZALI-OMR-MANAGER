'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createStudent } from '../../app/(teacher)/teacher/actions';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        roll_number: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formDataToSubmit = new FormData();
            formDataToSubmit.append('full_name', formData.full_name);
            formDataToSubmit.append('email', formData.email);
            formDataToSubmit.append('roll_number', formData.roll_number);

            const result = await createStudent(formDataToSubmit);

            if (result.error) {
                setError(result.error);
            } else {
                setFormData({ full_name: '', email: '', roll_number: '' });
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Add New Student
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-4">
                                        Create a new student account for your school.
                                    </p>

                                    {error && (
                                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <form id="add-student-form" onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                            <input
                                                type="text"
                                                id="full_name"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address (Optional)</label>
                                            <input
                                                type="email"
                                                id="email"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="Will be auto-generated if empty"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="roll_number" className="block text-sm font-medium text-gray-700">Roll Number</label>
                                            <input
                                                type="text"
                                                id="roll_number"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                                value={formData.roll_number}
                                                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                                            />
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <Button
                            type="submit"
                            form="add-student-form"
                            loading={loading}
                            className="w-full sm:w-auto sm:ml-3"
                        >
                            Create Student
                        </Button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
