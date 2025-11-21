import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateClassStatistics } from '@/lib/omr/results-calculator';

/**
 * GET /api/omr/result/[id]
 * Get detailed result for a submission
 *
 * GET /api/omr/result?examId=xxx
 * Get all results for an exam with statistics
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if examId query parameter exists to get all results for an exam
        const searchParams = request.nextUrl.searchParams;
        const examId = searchParams.get('examId');

        if (examId) {
            // Get all results for the specified exam
            return await getExamResults(supabase, user, examId);
        }

        // If no examId, get specific result by ID (original functionality)
        const resultId = params.id;

        // Fetch result with full details
        const { data: result, error: resultError } = await supabase
            .from('results')
            .select(`
                *,
                exams (
                  id,
                  exam_name,
                  total_questions,
                  passing_marks
                ),
                users!results_student_id_fkey (
                  id,
                  email,
                  full_name
                )
              `)
            .eq('id', resultId)
            .single();

        if (resultError || !result) {
            return NextResponse.json(
                { error: 'Result not found' },
                { status: 404 }
            );
        }

        // Check authorization
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const isAdmin = profile?.role === 'admin';
        const isTeacher = profile?.role === 'teacher';
        const isOwner = result.student_id === user.id;

        if (!isAdmin && !isTeacher && !isOwner) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Return detailed result
        return NextResponse.json({
            success: true,
            result: {
                id: result.id,
                examId: result.exam_id,
                examName: result.exams?.exam_name,
                studentId: result.student_id,
                studentName: result.users?.full_name,
                studentEmail: result.users?.email,
                obtainedMarks: result.obtained_marks,
                totalMarks: result.total_marks,
                percentage: result.percentage,
                grade: result.grade,
                status: result.status,
                processingMethod: result.processing_method,
                confidence: result.confidence_score,
                questionResults: result.question_results,
                processedAt: result.processed_at
            }
        });

    } catch (error) {
        console.error('Result API error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Helper function to get all results for an exam with statistics
 */
async function getExamResults(
    supabase: any, // Using any here to match the type from createClient() call
    user: { id: string },
    examId: string
) {
    // Fetch all results for exam
    const { data: results, error: resultsError } = await supabase
        .from('results')
        .select(`
            *,
            users!results_student_id_fkey (
              id,
              email,
              full_name
            )
          `)
        .eq('exam_id', examId)
        .order('percentage', { ascending: false });

    if (resultsError) {
        console.error('Fetch error:', resultsError);
        return NextResponse.json(
            { error: 'Failed to fetch results' },
            { status: 500 }
        );
    }

    // Check authorization for viewing exam results
    // Check if user is admin, teacher of the exam, or student who took the exam
    const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('created_by')
        .eq('id', examId)
        .single();

    // Note: examError is not used, but we need to acknowledge it to avoid linting error
    if (examError) {
        console.error('Error fetching exam data:', examError);
    }

    const isCreator = examData?.created_by === user.id;

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin';
    const isTeacher = profile?.role === 'teacher';

    if (!isAdmin && !isTeacher && !isCreator) {
        return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
        );
    }

    // Calculate statistics
    const statistics = await calculateClassStatistics(examId);

    return NextResponse.json({
        success: true,
        results: results.map((r: {
            id: string;
            student_id: string;
            users: { full_name: string; email: string } | null;
            obtained_marks: number;
            total_marks: number;
            percentage: number;
            grade: string;
            status: string;
            processing_method: string;
            confidence_score: number;
            processed_at: string;
        }, index: number) => ({
            id: r.id,
            rank: index + 1,
            studentId: r.student_id,
            studentName: r.users?.full_name,
            studentEmail: r.users?.email,
            obtainedMarks: r.obtained_marks,
            totalMarks: r.total_marks,
            percentage: r.percentage,
            grade: r.grade,
            status: r.status,
            processingMethod: r.processing_method,
            confidence: r.confidence_score,
            processedAt: r.processed_at
        })),
        statistics
    });
}
