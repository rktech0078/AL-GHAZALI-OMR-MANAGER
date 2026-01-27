'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import RoleSidebar from '@/components/layout/RoleSidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user && profile && profile.role !== 'teacher') {
            router.replace('/');
        }
    }, [user, profile, loading, router]);

    // Show a minimal loader only if we are absolutely sure the user is unauthorized
    // but the page is still trying to decide.
    if (loading && !user) {
        return <FullScreenLoader text="Checking Authorization..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <RoleSidebar role="teacher" />
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
