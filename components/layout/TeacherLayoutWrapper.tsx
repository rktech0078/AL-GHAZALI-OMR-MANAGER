'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { DashboardLayout } from './DashboardLayout';

interface TeacherLayoutWrapperProps {
    children: ReactNode;
}

export function TeacherLayoutWrapper({ children }: TeacherLayoutWrapperProps) {
    const [userInfo, setUserInfo] = useState<{ name: string; email: string } | undefined>();
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUserInfo = async () => {
            const supabase = createSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('id', user.id)
                .single();

            setUserInfo({
                name: profile?.full_name || 'Teacher',
                email: profile?.email || user.email || ''
            });
            setLoading(false);
        };

        fetchUserInfo();
    }, [router]);

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

    return (
        <DashboardLayout role="teacher" userInfo={userInfo}>
            {children}
        </DashboardLayout>
    );
}
