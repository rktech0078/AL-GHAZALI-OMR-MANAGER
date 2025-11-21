'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface SidebarLink {
    name: string;
    href: string;
    icon: React.ReactNode;
}

interface SidebarProps {
    role: 'teacher' | 'admin' | 'student';
    userInfo?: {
        name: string;
        email: string;
    };
}

const teacherLinks: SidebarLink[] = [
    {
        name: 'Dashboard',
        href: '/teacher',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        name: 'My Exams',
        href: '/teacher/exams',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        name: 'Create Exam',
        href: '/teacher/create-exam',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        ),
    },
    {
        name: 'Students',
        href: '/teacher/students',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
    {
        name: 'Upload OMR',
        href: '/teacher/upload-omr',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
        ),
    },
];

const adminLinks: SidebarLink[] = [
    {
        name: 'Dashboard',
        href: '/admin',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        name: 'Schools',
        href: '/admin/schools',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
    {
        name: 'Users',
        href: '/admin/users',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
];

const studentLinks: SidebarLink[] = [
    {
        name: 'Dashboard',
        href: '/student',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        name: 'My Results',
        href: '/student/results',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
];

export function DashboardSidebar({ role, userInfo }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const links = role === 'teacher' ? teacherLinks : role === 'admin' ? adminLinks : studentLinks;

    const roleColors = {
        teacher: 'from-indigo-600 to-purple-600',
        admin: 'from-red-600 to-pink-600',
        student: 'from-green-600 to-teal-600',
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 z-40 h-screen bg-gray-900 text-white
          transition-transform duration-300 ease-in-out
          w-64 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Logo & Brand */}
                <div className="p-6 border-b border-gray-800">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <Image
                                src="/al-ghazali-logo.png"
                                alt="Al-Ghazali"
                                width={40}
                                height={40}
                                className="rounded-lg group-hover:scale-110 transition-transform"
                            />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Al-Ghazali OMR</h1>
                            <p className="text-xs text-gray-400 capitalize">{role} Portal</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-3">
                    <ul className="space-y-1">
                        {links.map((link) => {
                            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                            return (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200 group
                      ${isActive
                                                ? `bg-gradient-to-r ${roleColors[role]} text-white shadow-lg`
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }
                    `}
                                    >
                                        <span className={isActive ? '' : 'group-hover:scale-110 transition-transform'}>
                                            {link.icon}
                                        </span>
                                        <span className="font-medium">{link.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Info Footer */}
                {userInfo && (
                    <div className="p-4 border-t border-gray-800">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${roleColors[role]} text-white font-bold text-sm`}>
                                {userInfo.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{userInfo.name}</p>
                                <p className="text-xs text-gray-400 truncate">{userInfo.email}</p>
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
