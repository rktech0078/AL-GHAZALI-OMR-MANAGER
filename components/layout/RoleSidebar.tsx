'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    DocumentIcon,
    UsersIcon,
    ClipboardCheckIcon,
    ChartBarIcon,
    UserCircleIcon,
    LogOutIcon,
    OfficeBuildingIcon,
} from '@/components/ui/Icons';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

interface NavigationItem {
    name: string;
    href: string;
    icon: React.ComponentType;
}

interface RoleSidebarProps {
    role: 'admin' | 'teacher' | 'student';
}

export default function RoleSidebar({ role }: RoleSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { signOut } = useAuth();
    const supabase = createSupabaseBrowserClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    // Define navigation items based on role
    const getNavigationItems = (): NavigationItem[] => {
        switch (role) {
            case 'admin':
                return [
                    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
                    { name: 'Schools', href: '/admin/schools', icon: OfficeBuildingIcon },
                    { name: 'Users', href: '/admin/users', icon: UsersIcon },
                    { name: 'Teacher Panel', href: '/teacher', icon: DocumentIcon },
                ];
            case 'teacher':
                return [
                    { name: 'Dashboard', href: '/teacher', icon: HomeIcon },
                    { name: 'My Exams', href: '/teacher/exams', icon: DocumentIcon },
                    { name: 'My Students', href: '/teacher/students', icon: UsersIcon },
                    { name: 'OMR Upload', href: '/teacher/upload-omr', icon: ClipboardCheckIcon },
                    { name: 'Results', href: '/teacher/results', icon: ChartBarIcon },
                    { name: 'Profile', href: '/teacher/profile', icon: UserCircleIcon },
                ];
            case 'student':
                return [
                    { name: 'Dashboard', href: '/student', icon: HomeIcon },
                    { name: 'My Results', href: '/student/results', icon: ChartBarIcon },
                    { name: 'Profile', href: '/student/profile', icon: UserCircleIcon },
                ];
            default:
                return [];
        }
    };

    const navigation = getNavigationItems();

    // Primary action button (only for teachers)
    const renderPrimaryAction = () => {
        if (role === 'teacher') {
            return (
                <div className="px-4 mb-6">
                    <Link
                        href="/teacher/create-exam"
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        <span className="mr-2 text-lg">+</span>
                        New Exam
                    </Link>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:top-16 z-sidebar bg-white border-r border-gray-200 shadow-sm">
            <div className="flex flex-col flex-1 min-h-0">
                <div className="flex flex-col flex-1 pt-6 pb-4 overflow-y-auto">
                    {renderPrimaryAction()}

                    <nav className="flex-1 px-3 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <div
                                        className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                                            }`}
                                    >
                                        <item.icon />
                                    </div>
                                    {item.name}
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={signOut}
                        className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors group"
                    >
                        <div className="mr-3 flex-shrink-0 w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors">
                            <LogOutIcon />
                        </div>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
