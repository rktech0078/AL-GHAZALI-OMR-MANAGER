'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import RoleSidebar from '@/components/layout/RoleSidebar';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user && profile && profile.role !== 'student') {
            router.replace('/');
        }
    }, [user, profile, loading, router]);

    if (loading && !user) {
        return <FullScreenLoader text="Checking Authorization..." />;
    }

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
