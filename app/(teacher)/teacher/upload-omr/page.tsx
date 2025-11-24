'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OMRUpload from '@/components/omr/OMRUpload';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function UploadOmrPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('exams')
        .select('id, exam_name, total_questions, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setExams(data || []);
      if (data && data.length > 0) {
        setSelectedExamId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading exams...</p>
        </div>
      </div>
    );
  }

  if (error || exams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Exams Found</h3>
          <p className="text-gray-500 mb-8">
            You need to create an exam before you can upload OMR sheets.
          </p>
          <button
            onClick={() => router.push('/teacher/create-exam')}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200"
          >
            Create First Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            OMR Scanner Console
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Process exam sheets instantly using our AI-powered scanner.
            Upload an image or use your camera to get started.
          </p>
        </div>

        {/* Main Console Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>

          {/* Exam Selector Toolbar */}
          <div className="bg-gray-50/50 border-b border-gray-100 p-6 md:p-8">
            <div className="max-w-xl mx-auto">
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Select Exam to Process
              </label>
              <div className="relative">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="block w-full pl-4 pr-10 py-4 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl shadow-sm transition-shadow cursor-pointer appearance-none bg-white"
                >
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.exam_name} • {exam.total_questions} Questions
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Scanner Area */}
          <div className="p-6 md:p-8 lg:p-12">
            {selectedExamId && (
              <OMRUpload
                examId={selectedExamId}
                onSuccess={(result) => {
                  console.log('Upload successful:', result);
                }}
                onError={(error) => {
                  console.error('Upload failed:', error);
                }}
              />
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Good Lighting</h3>
            <p className="text-sm text-gray-500">Ensure the OMR sheet is well-lit and free from shadows for best accuracy.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Align Corners</h3>
            <p className="text-sm text-gray-500">Keep the four corner markers visible within the camera frame.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Clean Sheet</h3>
            <p className="text-sm text-gray-500">Avoid folds or crinkles on the paper. Use a flat surface.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
