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
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Welcome Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Teacher'}! 👋
        </h1>
        <p className="mt-3 text-lg text-gray-600 max-w-2xl">
          Here's what's happening with your exams and students today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Exams"
          value={stats.totalExams}
          icon={<DocumentIcon />}
          description="All time"
          bgColor="bg-blue-50 text-blue-600"
        />
        <StatsCard
          title="Published"
          value={stats.publishedExams}
          icon={<ClipboardCheckIcon />}
          description="Active now"
          bgColor="bg-green-50 text-green-600"
        />
        <StatsCard
          title="Drafts"
          value={stats.draftExams}
          icon={<DocumentIcon />}
          description="In progress"
          bgColor="bg-yellow-50 text-yellow-600"
        />
        <StatsCard
          title="Results"
          value={stats.resultsCount}
          icon={<ChartBarIcon />}
          description="Processed"
          bgColor="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="bg-indigo-100 p-2 rounded-lg mr-3 text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/teacher/create-exam"
                className="group relative overflow-hidden p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-1">Create New Exam</h3>
                  <p className="text-indigo-100 text-sm mb-4">Design a new OMR sheet & questions</p>
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-full text-white group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </span>
                </div>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors"></div>
              </Link>

              <Link
                href="/teacher/upload-omr"
                className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
                    <ClipboardCheckIcon />
                  </div>
                  <span className="text-gray-300 group-hover:text-purple-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Upload OMR</h3>
                <p className="text-gray-500 text-sm">Scan and process student sheets</p>
              </Link>

              <Link
                href="/teacher/exams"
                className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <DocumentIcon />
                  </div>
                  <span className="text-gray-300 group-hover:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">My Exams</h3>
                <p className="text-gray-500 text-sm">Manage your exam library</p>
              </Link>

              <Link
                href="/teacher/students"
                className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-green-100 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-100 transition-colors">
                    <UsersIcon />
                  </div>
                  <span className="text-gray-300 group-hover:text-green-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Students</h3>
                <p className="text-gray-500 text-sm">View performance & records</p>
              </Link>
            </div>
          </section>

          {/* Recent Exams List */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Exams</h2>
              <Link href="/teacher/exams" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentExams.length > 0 ? (
                recentExams.map((exam) => (
                  <div key={exam.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${exam.status === 'published' ? 'bg-green-100 text-green-600' :
                        exam.status === 'draft' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                        <DocumentIcon />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          <Link href={`/teacher/exams/${exam.id}`}>{exam.exam_name}</Link>
                        </h4>
                        <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                          <span>{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'No date'}</span>
                          <span>•</span>
                          <span className="capitalize">{exam.status}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/teacher/exams/${exam.id}`}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full text-gray-400 mb-3">
                    <DocumentIcon />
                  </div>
                  <p className="text-gray-500">No exams created yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column (1/3 width) */}
        <div className="space-y-6">
          {/* Profile Summary Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-md">
              {profile?.full_name?.charAt(0) || 'T'}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{profile?.full_name}</h3>
            <p className="text-gray-500 text-sm mb-6">{profile?.email}</p>
            <Link href="/teacher/profile" className="block w-full py-2 px-4 bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Edit Profile
            </Link>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-3 opacity-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                <span className="font-semibold tracking-wide uppercase text-xs">Pro Tip</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Better OMR Scanning</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                Ensure good lighting when scanning sheets. Avoid shadows on the corner markers for 99% accuracy.
              </p>
              <Link href="/teacher/upload-omr" className="text-sm font-medium text-white underline hover:text-indigo-200 transition-colors">
                Try it now →
              </Link>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-purple-500/30 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
