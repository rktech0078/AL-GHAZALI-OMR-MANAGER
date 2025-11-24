import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/ui/StatsCard';
import {
  DocumentIcon,
  ClipboardCheckIcon,
  ChartBarIcon,
  TrendingUpIcon,
} from '@/components/ui/Icons';
import Link from 'next/link';
import { StudentResultsList } from '@/components/student/StudentResultsList';

async function getStudentStats(studentId: string) {
  const supabase = await createClient();

  // Get student's exam enrollments and results
  const { data: enrollments } = await supabase
    .from('exam_enrollments')
    .select(`
      *,
      exam:exams(*)
    `)
    .eq('student_id', studentId);

  const { data: results } = await supabase
    .from('results')
    .select('*, exam:exams(exam_name, exam_date)')
    .eq('student_id', studentId);

  const totalExams = enrollments?.length || 0;
  const completedExams = results?.length || 0;
  const upcomingExams = totalExams - completedExams;

  // Calculate average percentage
  const avgPercentage = results && results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;

  // Find highest score
  const highestScore = results && results.length > 0
    ? Math.max(...results.map(r => r.percentage))
    : 0;

  return {
    totalExams,
    completedExams,
    upcomingExams,
    avgPercentage,
    highestScore,
  };
}

async function getRecentResults(studentId: string) {
  const supabase = await createClient();

  const { data: results } = await supabase
    .from('results')
    .select('*, exam:exams(exam_name, exam_date)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(5);

  return results || [];
}

export default async function StudentDashboard() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container p-4 mx-auto">
        <p>Please log in to access your dashboard</p>
      </div>
    );
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, roll_number, class')
    .eq('id', user.id)
    .single();

  const stats = await getStudentStats(user.id);
  const recentResults = await getRecentResults(user.id);

  // Get greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="container p-4 mx-auto sm:p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white">
          {greeting}, {profile?.full_name || 'Student'}! 🎓
        </h1>
        <p className="mt-2 text-indigo-100">
          {profile?.class && `Class: ${profile.class}`}
          {profile?.roll_number && ` | Roll No: ${profile.roll_number}`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Exams"
          value={stats.totalExams}
          icon={<DocumentIcon />}
          description="Enrolled in"
          bgColor="bg-blue-100"
        />
        <StatsCard
          title="Completed"
          value={stats.completedExams}
          icon={<ClipboardCheckIcon />}
          description="Exams taken"
          bgColor="bg-green-100"
        />
        <StatsCard
          title="Average Score"
          value={`${stats.avgPercentage}%`}
          icon={<ChartBarIcon />}
          description="Overall performance"
          bgColor="bg-purple-100"
        />
        <StatsCard
          title="Best Score"
          value={`${stats.highestScore}%`}
          icon={<TrendingUpIcon />}
          description="Highest achievement"
          bgColor="bg-yellow-100"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Results */}
        {/* Recent Results with Search */}
        <StudentResultsList initialResults={recentResults} />

        {/* Performance Insights */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Performance Overview
          </h2>
          <div className="space-y-4">
            {/* Average Performance Indicator */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Overall Average
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {stats.avgPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats.avgPercentage}%` }}
                />
              </div>
            </div>

            {/* Performance Message */}
            {stats.avgPercentage >= 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  🌟 Excellent performance! Keep up the great work!
                </p>
              </div>
            )}
            {stats.avgPercentage >= 60 && stats.avgPercentage < 80 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  👍 Good job! With a little more effort, you can achieve excellence!
                </p>
              </div>
            )}
            {stats.avgPercentage < 60 && stats.avgPercentage > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💪 Keep practicing! Every effort counts towards improvement!
                </p>
              </div>
            )}

            {/* Quick Links */}
            <div className="pt-4 border-t border-gray-200">
              <p className="mb-3 text-sm font-medium text-gray-700">Quick Links</p>
              <div className="space-y-2">
                <Link
                  href="/student/results"
                  className="flex items-center justify-between p-2 text-sm text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100"
                >
                  <span>My Results</span>
                  <DocumentIcon />
                </Link>
                <Link
                  href="/student/profile"
                  className="flex items-center justify-between p-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100"
                >
                  <span>My Profile</span>
                  <span>👤</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 italic">
          "Education is the most powerful weapon which you can use to change the world."
        </p>
        <p className="mt-1 text-xs text-blue-700">- Nelson Mandela</p>
      </div>
    </div>
  );
}
