import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface ResultPageProps {
    params: {
        id: string;
    };
}

export default async function ResultPage({ params }: ResultPageProps) {
    const supabase = await createClient();

    let { data: result, error } = await supabase
        .from('results')
        .select(`
            *,
            exam:exams(exam_name, exam_date)
        `)
        .eq('id', params.id)
        .single();

    // If not found with standard client (RLS), and user is teacher/admin, try admin client
    if (!result) {
        const { data: { user } } = await supabase.auth.getUser();
        const role = user?.user_metadata?.role;

        if (role === 'teacher' || role === 'admin') {
            const { createAdminClient } = await import('@/lib/supabase/admin');
            const adminClient = createAdminClient();

            const { data: adminResult, error: adminError } = await adminClient
                .from('results')
                .select(`
                    *,
                    exam:exams(exam_name, exam_date)
                `)
                .eq('id', params.id)
                .single();

            if (adminResult) {
                result = adminResult;
                error = null;
            } else if (adminError) {
                console.error('Admin fetch error:', adminError);
            }
        }
    }

    if (error || !result) {
        console.error('Error fetching result:', error);
        notFound();
    }

    return (
        <div className="container max-w-4xl p-6 mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Exam Result</h1>
                <Link
                    href="/student"
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    Back to Dashboard
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Exam Details Card */}
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h2 className="mb-4 text-xl font-semibold text-gray-800">Exam Details</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-500">Exam Name</label>
                            <p className="font-medium">{result.exam?.exam_name || 'Unknown Exam'}</p>
                        </div>
                        {/* Subject column does not exist in schema, removing it */}
                        <div>
                            <label className="text-sm text-gray-500">Date</label>
                            <p className="font-medium">
                                {result.exam?.exam_date
                                    ? new Date(result.exam.exam_date).toLocaleDateString()
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Score Card */}
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h2 className="mb-4 text-xl font-semibold text-gray-800">Performance</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 text-center bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-700">
                                {result.obtained_marks} / {result.total_marks}
                            </div>
                            <div className="text-sm text-blue-600">Score</div>
                        </div>
                        <div className="p-4 text-center bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-700">
                                {result.percentage}%
                            </div>
                            <div className="text-sm text-purple-600">Percentage</div>
                        </div>
                        <div className="p-4 text-center bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-700">
                                {result.grade}
                            </div>
                            <div className="text-sm text-green-600">Grade</div>
                        </div>
                        <div className={`p-4 text-center rounded-lg ${result.status === 'pass' ? 'bg-emerald-50' : 'bg-red-50'
                            }`}>
                            <div className={`text-2xl font-bold ${result.status === 'pass' ? 'text-emerald-700' : 'text-red-700'
                                }`}>
                                {result.status?.toUpperCase()}
                            </div>
                            <div className={`text-sm ${result.status === 'pass' ? 'text-emerald-600' : 'text-red-600'
                                }`}>Status</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Breakdown */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Question Analysis</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-3 px-4 font-semibold text-gray-600">Q#</th>
                                <th className="py-3 px-4 font-semibold text-gray-600">Your Answer</th>
                                <th className="py-3 px-4 font-semibold text-gray-600">Correct Answer</th>
                                <th className="py-3 px-4 font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.question_results && Object.entries(result.question_results).map(([qNum, qResult]: [string, any]) => (
                                <tr key={qNum} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4">{parseInt(qNum) + 1}</td>
                                    <td className="py-3 px-4 font-mono">{qResult.studentAnswer || '-'}</td>
                                    <td className="py-3 px-4 font-mono">{qResult.correctAnswer}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${qResult.isCorrect
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {qResult.isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Processing Info */}
            <div className="text-xs text-gray-400 text-center">
                Processed via {result.processing_method} • Confidence: {Math.round(result.confidence_score * 100)}%
            </div>
        </div>
    );
}
