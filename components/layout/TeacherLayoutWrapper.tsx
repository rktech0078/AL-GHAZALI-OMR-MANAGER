'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { DashboardLayout } from './DashboardLayout';

interface TeacherLayoutWrapperProps {
    children: ReactNode;
}

export function TeacherLayoutWrapper({ children }: TeacherLayoutWrapperProps) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const userInfo = profile ? {
        name: profile.full_name,
        email: profile.email
    } : undefined;

    return (
        <DashboardLayout role="teacher" userInfo={userInfo}>
            {children}
        </DashboardLayout>
    );
}
