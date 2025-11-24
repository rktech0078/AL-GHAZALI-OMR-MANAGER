import React from 'react';
import { ToastProvider } from '@/components/ui/Toast';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <ToastProvider>
                {children}
            </ToastProvider>
        </div>
    );
}
