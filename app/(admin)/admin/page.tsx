import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/ui/StatsCard';
import {
  UsersIcon,
  DocumentIcon,
  OfficeBuildingIcon,
  AcademicCapIcon,
  ClipboardCheckIcon,
  ChartBarIcon
} from '@/components/ui/Icons';
import Link from 'next/link';

async function getDashboardStats() {
  const supabase = await createClient();

  // Get counts for all major entities
  const [
    { count: schoolsCount },
    { count: teachersCount },
    { count: studentsCount },
    { count: examsCount },
    { count: resultsCount },
    { count: pendingCount }
  ] = await Promise.all([
    supabase.from('schools').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('exams').select('*', { count: 'exact', head: true }),
    supabase.from('results').select('*', { count: 'exact', head: true }),
    supabase.from('results').select('*', { count: 'exact', head: true }).eq('processing_status', 'pending')
  ]);

  return {
    schools: schoolsCount || 0,
    teachers: teachersCount || 0,
    students: studentsCount || 0,
    exams: examsCount || 0,
    results: resultsCount || 0,
    pending: pendingCount || 0
  };
}

async function getRecentActivity() {
  const supabase = await createClient();

  // Get recent exams
  const { data: recentExams } = await supabase
    .from('exams')
    .select('exam_name, created_at, status')
    .order('created_at', { ascending: false })
    .limit(5);

  return recentExams || [];
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const recentActivity = await getRecentActivity();

  return (
    <div className="container p-4 mx-auto sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's what's happening in your system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Schools"
          value={stats.schools}
          icon={<OfficeBuildingIcon />}
          description="Registered educational institutions"
          bgColor="bg-blue-100"
        />
        <StatsCard
          title="Teachers"
          value={stats.teachers}
          icon={<AcademicCapIcon />}
          description="Active teaching staff"
          bgColor="bg-purple-100"
        />
        <StatsCard
          title="Students"
          value={stats.students}
          icon={<UsersIcon />}
          description="Enrolled students"
          bgColor="bg-green-100"
        />
        <StatsCard
          title="Total Exams"
          value={stats.exams}
          icon={<DocumentIcon />}
          description="Exams created"
          bgColor="bg-yellow-100"
        />
        <StatsCard
          title="Processed Results"
          value={stats.results}
          icon={<ClipboardCheckIcon />}
          description="OMR sheets processed"
          bgColor="bg-indigo-100"
        />
        <StatsCard
          title="Pending Reviews"
          value={stats.pending}
          icon={<ChartBarIcon />}
          description="Awaiting processing"
          bgColor="bg-red-100"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* Management Section */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Quick Management
          </h2>
          <nav>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin/schools"
                  className="flex items-center p-3 text-blue-600 transition-colors bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  <OfficeBuildingIcon />
                  <span className="ml-3 font-medium">Manage Schools</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className="flex items-center p-3 text-purple-600 transition-colors bg-purple-50 rounded-md hover:bg-purple-100"
                >
                  <UsersIcon />
                  <span className="ml-3 font-medium">Manage Users</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/exams"
                  className="flex items-center p-3 text-green-600 transition-colors bg-green-50 rounded-md hover:bg-green-100"
                >
                  <DocumentIcon />
                  <span className="ml-3 font-medium">View All Exams</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/analytics"
                  className="flex items-center p-3 text-indigo-600 transition-colors bg-indigo-50 rounded-md hover:bg-indigo-100"
                >
                  <ChartBarIcon />
                  <span className="ml-3 font-medium">Analytics & Reports</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Recent Activity */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <ul className="space-y-3">
              {recentActivity.map((exam, idx) => (
                <li key={idx} className="flex items-start pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {exam.exam_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created {new Date(exam.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${exam.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : exam.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {exam.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No recent activity</p>
          )}
        </div>
      </div>

      {/* System Health (Placeholder for now) */}
      <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-semibold">System Health</h3>
            <p className="mt-1 text-sm text-indigo-100">
              All systems operational
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
