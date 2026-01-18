import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processSubmission } from '@/lib/omr/omr-processor';

/**
 * POST /api/omr/process
 * Manually trigger processing of a submission
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { submissionId, forceAI } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Check if submission exists
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check authorization (admin or owner)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isOwner = submission.student_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Process submission
    const result = await processSubmission(submissionId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        submissionId,
        resultId: result.resultId,
        result: {
          obtainedMarks: result.obtainedMarks,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          grade: result.grade,
          status: result.status,
          processingMethod: result.processingMethod,
          confidence: result.confidence
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        submissionId,
        error: result.error,
        issues: result.issues
      }, { status: 422 });
    }

  } catch (error) {
    console.error('Process API error:', error);
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
 * GET /api/omr/process?examId=xxx
 * Get all submissions for an exam
 */
export async function GET(request: NextRequest) {
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

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get('examId');

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    // Authorization check - verify user can access this exam's submissions
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      const { data: exam } = await supabase
        .from('exams')
        .select('created_by')
        .eq('id', examId)
        .single();

      if (!exam || exam.created_by !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden - You can only view submissions from your own exams' },
          { status: 403 }
        );
      }
    }

    // Fetch submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*, results(*)')
      .eq('exam_id', examId)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('Fetch error:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissions
    });

  } catch (error) {
    console.error('GET API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
