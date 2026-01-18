import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's role for authorization checks
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const userRole = profile?.role;

        const body = await request.json();
        const { submissionIds, examId, type } = body;

        // Ownership verification for non-admin users
        if (userRole !== 'admin') {
            if (type === 'single' && submissionIds && submissionIds.length > 0) {
                // Verify user owns the exams associated with these results
                const { data: results } = await supabase
                    .from('results')
                    .select('exam_id')
                    .in('id', submissionIds);

                const uniqueExamIds = Array.from(new Set(results?.map(r => r.exam_id) || []));
                const examIds = uniqueExamIds;
                const { data: exams } = await supabase
                    .from('exams')
                    .select('created_by')
                    .in('id', examIds);

                const isOwner = exams?.every(e => e.created_by === user.id);
                if (!isOwner) {
                    return NextResponse.json({ error: 'Forbidden - You can only delete results from your own exams' }, { status: 403 });
                }
            } else if (type === 'all' && examId) {
                // Verify user owns the exam
                const { data: exam } = await supabase
                    .from('exams')
                    .select('created_by')
                    .eq('id', examId)
                    .single();

                if (!exam || exam.created_by !== user.id) {
                    return NextResponse.json({ error: 'Forbidden - You can only delete results from your own exams' }, { status: 403 });
                }
            }
        }

        // Initialize admin client if available for robust deletion
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const adminClient = serviceRoleKey
            ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            })
            : null;

        // Use admin client if available, otherwise fall back to user client
        const db = adminClient || supabase;

        if (type === 'single' && submissionIds && submissionIds.length > 0) {
            // Delete specific submissions
            // 1. Delete from submissions table
            const { error: subError } = await db
                .from('submissions')
                .delete()
                .in('id', submissionIds); // Assuming submissionIds are submission IDs

            // 2. Delete from results table (we need result IDs)
            // If we only have submission IDs, we might need to fetch result IDs first if we want to be precise,
            // or if the frontend passes result IDs.
            // The frontend passes "submission.id" which IS the submission ID.
            // But the results page displays "submissions" which are actually joined with results?
            // Let's check the frontend type:
            // interface Submission { id: string; ... } -> This 'id' comes from 'results' table in the frontend query!
            // Wait, the frontend query is: .from('results').select('* ...')
            // So 'submission.id' in the frontend IS the 'result.id'.

            // So submissionIds passed here are actually RESULT IDs.

            const resultIds = submissionIds;

            // We need to delete from 'submissions' table where result_id is in resultIds
            const { error: subRefError } = await db
                .from('submissions')
                .delete()
                .in('result_id', resultIds);

            if (subRefError) console.error('Error deleting referenced submissions:', subRefError);

            // Now delete from results
            const { error: resError, count } = await db
                .from('results')
                .delete()
                .in('id', resultIds);

            if (resError) throw resError;
            if (count === 0) {
                return NextResponse.json({ error: 'No results were deleted. This might be due to permission issues.' }, { status: 403 });
            }

            return NextResponse.json({ success: true, count });

        } else if (type === 'all' && examId) {
            // Delete all for exam
            // 1. Delete submissions
            const { error: subError } = await db
                .from('submissions')
                .delete()
                .eq('exam_id', examId);

            if (subError) console.error('Error deleting submissions:', subError);

            // 2. Delete results
            const { error: resError, count } = await db
                .from('results')
                .delete()
                .eq('exam_id', examId);

            if (resError) throw resError;
            if (count === 0) {
                return NextResponse.json({ error: 'No results were deleted. This might be due to permission issues.' }, { status: 403 });
            }

            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });

    } catch (error: any) {
        console.error('Delete API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
