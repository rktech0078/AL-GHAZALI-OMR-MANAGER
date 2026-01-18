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
    typeToConfirm?: string;
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
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                    aria-hidden="true"
                    onClick={!loading ? onClose : undefined}
                ></div>

                {/* Modal panel */}
                <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
                <div className="relative inline-block transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle border border-gray-100/50">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-8">
                        <div className="flex flex-col items-center text-center">
                            {variant === 'danger' && (
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-6">
                                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </div>
                            )}

                            <h3 className="text-xl font-bold leading-6 text-gray-900 mb-2" id="modal-title">
                                {title}
                            </h3>

                            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                                {message}
                            </p>

                            {typeToConfirm && (
                                <div className="w-full mt-2 mb-4">
                                    <label htmlFor="confirm-input" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                                        Type <span className="font-mono font-bold text-red-600 select-all">{typeToConfirm}</span> to confirm
                                    </label>
                                    <input
                                        type="text"
                                        id="confirm-input"
                                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-3 px-4 bg-gray-50"
                                        placeholder={`Type "${typeToConfirm}"`}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        disabled={loading}
                                        autoComplete="off"
                                    />
                                </div>
                            )}

                            <div className="mt-2 w-full flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    disabled={loading}
                                    className="w-full justify-center py-3 text-base rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium"
                                >
                                    {cancelText}
                                </Button>
                                <Button
                                    onClick={onConfirm}
                                    variant={variant}
                                    disabled={isConfirmDisabled || loading}
                                    loading={loading}
                                    className="w-full justify-center py-3 text-base rounded-xl font-bold shadow-lg shadow-red-100"
                                >
                                    {confirmText}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
