'use client';

import { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
    children: ReactNode;
    role: 'teacher' | 'admin' | 'student';
    userInfo?: {
        name: string;
        email: string;
    };
}

export function DashboardLayout({ children, role, userInfo }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <DashboardSidebar role={role} userInfo={userInfo} />

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            {/* Mobile padding for hamburger */}
                            <div className="lg:hidden w-10"></div>

                            {/* Logo for mobile when sidebar closed */}
                            <div className="lg:hidden">
                                <span className="text-lg font-bold text-gray-900">Al-Ghazali OMR</span>
                            </div>

                            {/* Right side - can add search, notifications, etc */}
                            <div className="flex items-center gap-4 ml-auto">
                                {/* Placeholder for future features like search, notifications */}
                                <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="py-8">
                    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
