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
} from '@/components/ui/Icons';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TeacherSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const navigation = [
        { name: 'Dashboard', href: '/teacher', icon: HomeIcon },
        { name: 'My Exams', href: '/teacher/exams', icon: DocumentIcon },
        { name: 'My Students', href: '/teacher/students', icon: UsersIcon },
        { name: 'OMR Upload', href: '/teacher/upload-omr', icon: ClipboardCheckIcon },
        { name: 'Results', href: '/teacher/results', icon: ChartBarIcon },
        { name: 'Profile', href: '/teacher/profile', icon: UserCircleIcon },
    ];

    return (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:top-16 z-40">
            <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
                <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
                    <nav className="flex-1 px-2 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <div className={`mr-3 flex-shrink-0 h-6 w-6 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                                        }`}>
                                        <item.icon />
                                    </div>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex flex-shrink-0 p-4 border-t border-gray-200">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 group"
                    >
                        <div className="mr-3 flex-shrink-0 w-6 h-6 text-red-400 group-hover:text-red-500">
                            <LogOutIcon />
                        </div>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
