import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/omr/status/[id]
 * Check processing status of a submission
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

        const submissionId = params.id;

        // Fetch submission with result
        const { data: submission, error: submissionError } = await supabase
            .from('submissions')
            .select(`
        *,
        results (
          id,
          obtained_marks,
          total_marks,
          percentage,
          grade,
          status,
          processing_method,
          confidence_score,
          processed_at
        )
      `)
            .eq('id', submissionId)
            .single();

        if (submissionError || !submission) {
            return NextResponse.json(
                { error: 'Submission not found' },
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
        const isOwner = submission.student_id === user.id;

        if (!isAdmin && !isTeacher && !isOwner) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Return status
        return NextResponse.json({
            success: true,
            submission: {
                id: submission.id,
                examId: submission.exam_id,
                studentId: submission.student_id,
                status: submission.status,
                submittedAt: submission.submitted_at,
                processedAt: submission.processed_at,
                errorMessage: submission.error_message,
                imageUrl: submission.image_url
            },
            result: submission.results ? {
                id: submission.results.id,
                obtainedMarks: submission.results.obtained_marks,
                totalMarks: submission.results.total_marks,
                percentage: submission.results.percentage,
                grade: submission.results.grade,
                status: submission.results.status,
                processingMethod: submission.results.processing_method,
                confidence: submission.results.confidence_score,
                processedAt: submission.results.processed_at
            } : null
        });

    } catch (error) {
        console.error('Status API error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
