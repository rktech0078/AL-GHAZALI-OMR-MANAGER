'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
    full_name: string;
    role: string;
}

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch user authentication state
    useEffect(() => {
        const supabase = createSupabaseBrowserClient();

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('full_name, role')
                    .eq('id', user.id)
                    .single();

                setUserProfile(profile);
            }
        };

        fetchUser();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                setUserProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Handle logout
    const handleLogout = async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        setIsProfileMenuOpen(false);
        router.push('/login');
        router.refresh();
    };

    // Check if we're on a public page
    const isPublicPage = pathname === '/';

    // Get dashboard URL based on role
    const getDashboardUrl = () => {
        if (userProfile?.role === 'admin') return '/admin';
        if (userProfile?.role === 'teacher') return '/teacher';
        if (userProfile?.role === 'student') return '/student';
        return '/';
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (userProfile?.full_name) {
            const names = userProfile.full_name.split(' ');
            return names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return user?.email?.[0].toUpperCase() || 'U';
    };

    // Get navigation links based on role
    const getNavLinks = () => {
        const role = userProfile?.role;
        const links = [];

        if (role === 'admin') {
            links.push(
                { name: 'Dashboard', href: '/admin' },
                { name: 'Schools', href: '/admin/schools' },
                { name: 'Users', href: '/admin/users' },
                { name: 'Teacher Panel', href: '/teacher' },
                { name: 'OMR Upload', href: '/teacher/upload-omr' },
                { name: 'Exams', href: '/teacher/exams' },
                { name: 'Results', href: '/teacher/results' }
            );
        } else if (role === 'teacher') {
            links.push(
                { name: 'Dashboard', href: '/teacher' },
                { name: 'My Exams', href: '/teacher/exams' },
                { name: 'My Students', href: '/teacher/students' },
                { name: 'OMR Upload', href: '/teacher/upload-omr' },
                { name: 'Results', href: '/teacher/results' },
                { name: 'Profile', href: '/teacher/profile' }
            );
        } else if (role === 'student') {
            links.push(
                { name: 'Dashboard', href: '/student' }
            );
        }

        return links;
    };

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || !isPublicPage
                    ? 'bg-white/95 backdrop-blur-md shadow-md'
                    : 'bg-transparent'
                    }`}
            >
                <div className="container px-4 mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href={user ? getDashboardUrl() : '/'} className="flex items-center space-x-3">
                            <Image
                                src="/al-ghazali-logo.png"
                                alt="Al-Ghazali Logo"
                                width={40}
                                height={40}
                                className="rounded-lg"
                            />
                            <span
                                className={`text-xl font-bold hidden sm:block ${isScrolled || !isPublicPage ? 'text-gray-900' : 'text-white'
                                    }`}
                            >
                                Al-Ghazali OMR
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-6">
                            {!user ? (
                                // Not logged in - show public links
                                <>
                                    <Link
                                        href="/"
                                        className={`font-medium transition-colors ${isScrolled || !isPublicPage
                                            ? 'text-gray-700 hover:text-indigo-600'
                                            : 'text-white hover:text-indigo-200'
                                            }`}
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        href="/login"
                                        className={`font-medium transition-colors ${isScrolled || !isPublicPage
                                            ? 'text-gray-700 hover:text-indigo-600'
                                            : 'text-white hover:text-indigo-200'
                                            }`}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="px-6 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            ) : (
                                // Logged in - show user menu
                                <div className="flex items-center space-x-6">
                                    {/* Role-based Navigation Links */}
                                    {getNavLinks().map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`text-sm font-medium transition-colors ${pathname === link.href
                                                ? 'text-indigo-600'
                                                : isScrolled || !isPublicPage
                                                    ? 'text-gray-700 hover:text-indigo-600'
                                                    : 'text-white hover:text-indigo-200'
                                                }`}
                                        >
                                            {link.name}
                                        </Link>
                                    ))}

                                    <div className="relative">
                                        <button
                                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                            className="flex items-center space-x-3 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full text-white font-bold">
                                                {getUserInitials()}
                                            </div>
                                            <div className="text-left hidden lg:block">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {userProfile?.full_name || user?.email}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {userProfile?.role || 'User'}
                                                </p>
                                            </div>
                                            <svg
                                                className={`w-4 h-4 text-gray-600 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isProfileMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                                                <Link
                                                    href={getDashboardUrl()}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                        </svg>
                                                        <span>Dashboard</span>
                                                    </div>
                                                </Link>
                                                <div className="border-t border-gray-100 my-2"></div>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className={`md:hidden p-2 rounded-lg ${isScrolled || !isPublicPage ? 'text-gray-700' : 'text-white'
                                }`}
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-[55] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Sidebar */}
            <div
                className={`fixed top-0 right-0 bottom-0 w-64 bg-white z-[60] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <span className="text-lg font-bold text-gray-900">Menu</span>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        {!user ? (
                            <div className="flex flex-col space-y-2 px-4">
                                <Link
                                    href="/"
                                    className="py-3 px-4 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-medium transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/login"
                                    className="py-3 px-4 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-medium transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="py-3 px-4 text-center text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md hover:shadow-lg transition-all mt-4"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col px-4">
                                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full text-white font-bold">
                                            {getUserInitials()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 truncate max-w-[140px]">
                                                {userProfile?.full_name || user?.email}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">
                                                {userProfile?.role || 'User'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    {/* Role-based Navigation Links for Mobile */}
                                    {getNavLinks().map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`block py-3 px-4 rounded-lg font-medium transition-colors ${pathname === link.href
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                                                }`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 my-6"></div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 w-full py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
