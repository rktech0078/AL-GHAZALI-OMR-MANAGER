
import { DocumentIcon, ClipboardCheckIcon, ChartBarIcon } from '@/components/ui/Icons';

export default function Loading() {
    return (
        <div className="container mx-auto px-6 py-8 max-w-7xl animate-pulse">
            {/* Welcome Header Skeleton */}
            <div className="mb-10">
                <div className="h-10 w-96 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 w-full max-w-2xl bg-gray-200 rounded-lg"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-32">
                        <div className="flex justify-between items-start">
                            <div className="space-y-3 w-full">
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                            </div>
                            <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Quick Actions Skeleton */}
                    <section>
                        <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="h-40 bg-gray-200 rounded-2xl"></div>
                            <div className="h-40 bg-gray-200 rounded-2xl"></div>
                            <div className="h-40 bg-gray-200 rounded-2xl"></div>
                            <div className="h-40 bg-gray-200 rounded-2xl"></div>
                        </div>
                    </section>

                    {/* Recent Exams Skeleton */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-96">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="h-6 w-32 bg-gray-200 rounded"></div>
                        </div>
                        <div className="p-6 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar Column Skeleton */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-64"></div>
                    <div className="h-48 bg-gray-200 rounded-2xl"></div>
                </div>
            </div>
        </div>
    );
}
