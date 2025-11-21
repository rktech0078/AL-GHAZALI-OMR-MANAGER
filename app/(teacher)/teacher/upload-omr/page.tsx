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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  if (error || exams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Exams Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Please create an exam first before uploading OMR sheets.
            </p>
            <button
              onClick={() => router.push('/teacher/create-exam')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload OMR Sheet</h1>
          <p className="mt-2 text-gray-600">
            Select an exam and upload the OMR sheet image for processing
          </p>
        </div>

        {/* Exam Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Exam
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.exam_name} ({exam.total_questions} questions)
              </option>
            ))}
          </select>
        </div>

        {/* OMR Upload Component */}
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

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 Instructions</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Select the exam from the dropdown above</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Use your mobile camera to capture the OMR sheet or upload from gallery</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Ensure good lighting and the entire OMR sheet is visible</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>The system will automatically process and show results</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">5.</span>
              <span>Supported formats: JPEG, PNG (Max 10MB)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
