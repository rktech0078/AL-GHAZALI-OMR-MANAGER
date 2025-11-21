import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CreateExamSchema = z.object({
    exam_name: z.string().min(3, 'Exam name must be at least 3 characters'),
    subject: z.string().min(2, 'Subject is required'),
    class_name: z.string().min(1, 'Class is required'),
    total_questions: z.number().min(1).max(100),
    passing_marks: z.number().min(0),
    options_count: z.number().min(3).max(5).default(4),
    exam_date: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Check authentication and role
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify teacher role
        const { data: userData, error: roleError } = await supabase
            .from('users')
            .select('role, school_id')
            .eq('id', user.id)
            .single();

        if (roleError || !userData || (userData.role !== 'teacher' && userData.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden: Teachers only' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = CreateExamSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const { exam_name, subject, class_name, total_questions, passing_marks, options_count, exam_date } = validationResult.data;

        // Create Exam
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .insert({
                exam_name,
                subject,
                class_name, // Corrected column name
                total_questions,
                passing_marks,
                options_count,
                exam_date: exam_date ? new Date(exam_date).toISOString() : null,
                created_by: user.id,
                school_id: userData.school_id,
                status: 'draft'
            })
            .select()
            .single();

        if (examError) {
            console.error('Exam creation error:', examError);
            return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
        }

        // Initialize Questions (Empty placeholders)
        // We create them now so the Question Builder has rows to edit
        const questions = Array.from({ length: total_questions }, (_, i) => ({
            exam_id: exam.id,
            question_number: i + 1,
            correct_answer: null, // To be filled by teacher
            marks: 1,
            question_text: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: ''
        }));

        const { error: questionsError } = await supabase
            .from('questions')
            .insert(questions);

        if (questionsError) {
            console.error('Questions initialization error:', questionsError);
            // We don't fail the request, but warn. Teacher can re-initialize or add later.
        }

        return NextResponse.json({ exam, message: 'Exam created successfully' });

    } catch (error) {
        console.error('Internal server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
