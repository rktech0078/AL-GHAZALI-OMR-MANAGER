import React from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import RoleSidebar from '@/components/layout/RoleSidebar';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <RoleSidebar role="student" />
            <div className="md:pl-64 flex flex-col flex-1">
                <main className="flex-1">
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </main>
            </div>
        </div>
    );
}
