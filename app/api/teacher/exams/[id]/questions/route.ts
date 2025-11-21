import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const QuestionSchema = z.object({
    id: z.string().optional(),
    question_number: z.number(),
    correct_answer: z.enum(['A', 'B', 'C', 'D', 'E']).nullable(),
    question_text: z.string().optional(),
    marks: z.number().default(1),
});

const SaveQuestionsSchema = z.object({
    questions: z.array(QuestionSchema),
});

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { id: examId } = params;

        // Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify teacher owns the exam
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('created_by, total_questions, options_count')
            .eq('id', examId)
            .single();

        if (examError || !exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        if (exam.created_by !== user.id) {
            // Check if admin
            const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
            if (userData?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Fetch questions
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('exam_id', examId)
            .order('question_number', { ascending: true });

        if (questionsError) {
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        // If no questions found, initialize them (Self-healing)
        if (!questions || questions.length === 0) {
            console.log('No questions found, initializing...');
            const placeholders = Array.from({ length: exam.total_questions }, (_, i) => ({
                exam_id: examId,
                question_number: i + 1,
                correct_answer: null,
                marks: 1,
                question_text: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: ''
            }));

            const { error: insertError } = await supabase
                .from('questions')
                .insert(placeholders);

            if (insertError) {
                console.error('Failed to auto-initialize questions:', insertError);
                return NextResponse.json({ error: 'Failed to initialize questions' }, { status: 500 });
            }

            // Return the newly created placeholders
            return NextResponse.json({
                questions: placeholders,
                examConfig: {
                    totalQuestions: exam.total_questions,
                    optionsCount: exam.options_count
                }
            });
        }

        return NextResponse.json({
            questions,
            examConfig: {
                totalQuestions: exam.total_questions,
                optionsCount: exam.options_count
            }
        });

    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { id: examId } = params;

        // Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify teacher owns the exam
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('created_by')
            .eq('id', examId)
            .single();

        if (examError || !exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        if (exam.created_by !== user.id) {
            const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
            if (userData?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const body = await request.json();
        const validationResult = SaveQuestionsSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const { questions } = validationResult.data;

        // Upsert questions
        // We map the questions to include exam_id and ensure they belong to this exam
        const questionsToUpsert = questions.map(q => ({
            ...q,
            exam_id: examId,
            updated_at: new Date().toISOString()
        }));

        const { error: upsertError } = await supabase
            .from('questions')
            .upsert(questionsToUpsert, { onConflict: 'exam_id, question_number' });

        if (upsertError) {
            console.error('Questions upsert error:', upsertError);
            return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Questions saved successfully' });

    } catch (error) {
        console.error('Error saving questions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
