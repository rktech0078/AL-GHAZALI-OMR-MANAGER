'use client';

import { Fragment, useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    typeToConfirm?: string; // If provided, user must type this string to enable confirm button
    variant?: 'danger' | 'primary' | 'outline';
    loading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    typeToConfirm,
    variant = 'primary',
    loading = false
}: ConfirmationModalProps) {
    const [inputValue, setInputValue] = useState('');
    const isConfirmDisabled = typeToConfirm ? inputValue !== typeToConfirm : false;

    useEffect(() => {
        if (isOpen) {
            setInputValue('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={!loading ? onClose : undefined}
                ></div>

                {/* Modal panel */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            {variant === 'danger' && (
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            )}
                            <div className={`mt-3 text-center sm:mt-0 ${variant === 'danger' ? 'sm:ml-4' : ''} sm:text-left w-full`}>
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {message}
                                    </p>
                                </div>

                                {typeToConfirm && (
                                    <div className="mt-4">
                                        <label htmlFor="confirm-input" className="block text-sm font-medium text-gray-700 mb-1">
                                            Type <span className="font-mono font-bold text-red-600">{typeToConfirm}</span> to confirm
                                        </label>
                                        <input
                                            type="text"
                                            id="confirm-input"
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                            placeholder={`Type "${typeToConfirm}"`}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            disabled={loading}
                                            autoComplete="off"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <Button
                            onClick={onConfirm}
                            variant={variant}
                            disabled={isConfirmDisabled || loading}
                            loading={loading}
                            className="w-full sm:w-auto sm:ml-3"
                        >
                            {confirmText}
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            disabled={loading}
                            className="mt-3 w-full sm:w-auto sm:mt-0"
                        >
                            {cancelText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
