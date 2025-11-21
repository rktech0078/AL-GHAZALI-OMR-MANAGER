import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/ui/StatsCard';
import {
  DocumentIcon,
  UsersIcon,
  ClipboardCheckIcon,
  ChartBarIcon,
} from '@/components/ui/Icons';
import Link from 'next/link';

async function getTeacherStats(teacherId: string) {
  const supabase = await createClient();

  // Get teacher's exam counts
  const [
    { count: totalExams },
    { count: publishedExams },
    { count: draftExams },
  ] = await Promise.all([
    supabase.from('exams').select('*', { count: 'exact', head: true }).eq('teacher_id', teacherId),
    supabase.from('exams').select('*', { count: 'exact', head: true }).eq('teacher_id', teacherId).eq('status', 'published'),
    supabase.from('exams').select('*', { count: 'exact', head: true }).eq('teacher_id', teacherId).eq('status', 'draft'),
  ]);

  // Get teacher's exam IDs first
  const { data: teacherExams } = await supabase
    .from('exams')
    .select('id')
    .eq('teacher_id', teacherId);

  const examIds = teacherExams?.map(exam => exam.id) || [];

  // Get total results processed for these exams
  let resultsCount = 0;
  if (examIds.length > 0) {
    const { count } = await supabase
      .from('results')
      .select('*', { count: 'exact', head: true })
      .in('exam_id', examIds);

    resultsCount = count || 0;
  }

  return {
    totalExams: totalExams || 0,
    publishedExams: publishedExams || 0,
    draftExams: draftExams || 0,
    resultsCount,
  };
}

async function getRecentExams(teacherId: string) {
  const supabase = await createClient();

  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
    .limit(5);

  return exams || [];
}

export default async function TeacherDashboard() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container p-4 mx-auto">
        <p>Please log in to access the teacher dashboard</p>
      </div>
    );
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const stats = await getTeacherStats(user.id);
  const recentExams = await getRecentExams(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'Teacher'}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your teaching activities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <StatsCard
          title="Total Exams"
          value={stats.totalExams}
          icon={<DocumentIcon />}
          description="All exams created"
          bgColor="bg-blue-100"
        />
        <StatsCard
          title="Published"
          value={stats.publishedExams}
          icon={<ClipboardCheckIcon />}
          description="Active exams"
          bgColor="bg-green-100"
        />
        <StatsCard
          title="Drafts"
          value={stats.draftExams}
          icon={<DocumentIcon />}
          description="Pending publication"
          bgColor="bg-yellow-100"
        />
        <StatsCard
          title="Results Processed"
          value={stats.resultsCount}
          icon={<ChartBarIcon />}
          description="OMR sheets graded"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Quick Actions & Recent Exams */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* Quick Actions Panel */}
        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/teacher/create-exam"
              className="flex items-center justify-between p-4 text-white transition-all bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-md group"
            >
              <span className="font-medium">Create New Exam</span>
              <span className="text-2xl group-hover:scale-110 transition-transform">+</span>
            </Link>
            <Link
              href="/teacher/exams"
              className="flex items-center justify-between p-4 transition-colors bg-blue-50 rounded-lg hover:bg-blue-100 group"
            >
              <span className="font-medium text-blue-700">My Exams</span>
              <DocumentIcon />
            </Link>
            <Link
              href="/teacher/students"
              className="flex items-center justify-between p-4 transition-colors bg-green-50 rounded-lg hover:bg-green-100 group"
            >
              <span className="font-medium text-green-700">My Students</span>
              <UsersIcon />
            </Link>
            <Link
              href="/teacher/upload-omr"
              className="flex items-center justify-between p-4 transition-colors bg-purple-50 rounded-lg hover:bg-purple-100 group"
            >
              <span className="font-medium text-purple-700">Upload OMR Sheets</span>
              <ClipboardCheckIcon />
            </Link>
          </div>
        </div>

        {/* Recent Exams */}
        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Exams
            </h2>
            <Link
              href="/teacher/exams"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          {recentExams.length > 0 ? (
            <ul className="space-y-3">
              {recentExams.map((exam) => (
                <li
                  key={exam.id}
                  className="flex items-start justify-between pb-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/teacher/exams/${exam.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {exam.exam_name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {exam.exam_date
                        ? new Date(exam.exam_date).toLocaleDateString()
                        : 'Date not set'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${exam.status === 'published'
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
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-4">No exams created yet</p>
              <Link
                href="/teacher/create-exam"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Create Your First Exam
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">💡</div>
          <div>
            <h3 className="mb-2 text-lg font-semibold text-blue-900">
              Quick Tip
            </h3>
            <p className="text-sm text-blue-800">
              Create exams with at least 10 questions for best OMR processing results.
              Make sure to publish your exam before generating OMR sheets for students.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
