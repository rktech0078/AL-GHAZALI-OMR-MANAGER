import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OMRPDFGenerator } from '@/lib/omr/pdf-generator';
import archiver from 'archiver';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get request body
        const body = await request.json();
        const { examId, studentIds } = body;

        if (!examId || !studentIds || studentIds.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch exam details
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('*')
            .eq('id', examId)
            .eq('created_by', user.id)
            .single();

        if (examError || !exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        // Fetch questions for answer key
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('question_number, correct_answer')
            .eq('exam_id', examId)
            .order('question_number', { ascending: true });

        if (questionsError) {
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        // Format answer key
        const answerKey = questions
            ?.filter(q => q.correct_answer)
            .map(q => `${q.question_number}-${q.correct_answer}`)
            .join(',') || '';

        // Fetch students
        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('id, full_name, email, roll_number, student_class')
            .in('id', studentIds);

        if (studentsError || !students) {
            return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
        }

        // Fetch school name
        const { data: teacherData } = await supabase
            .from('users')
            .select('school_id')
            .eq('id', user.id)
            .single();

        let schoolName = 'Al-Ghazali School';
        if (teacherData?.school_id) {
            const { data: schoolData } = await supabase
                .from('schools')
                .select('school_name')
                .eq('id', teacherData.school_id)
                .single();
            if (schoolData) schoolName = schoolData.school_name;
        }

        // Create ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Set up response headers
        const headers = new Headers();
        headers.set('Content-Type', 'application/zip');
        headers.set('Content-Disposition', `attachment; filename="omr-bulk-${exam.exam_name}-${Date.now()}.zip"`);

        // Generate PDF for each student
        for (const student of students) {
            const generator = new OMRPDFGenerator({
                totalQuestions: exam.total_questions,
                options: exam.options_count,
                showKey: true,
                answerKey: answerKey ? answerKey.split(',').reduce((acc: { [key: string]: string }, pair: string) => {
                    const [q, a] = pair.split('-');
                    if (q && a) acc[q.trim()] = a.trim();
                    return acc;
                }, {}) : {},
                examName: exam.exam_name,
                schoolName: schoolName,
                studentName: student.full_name,
                studentId: student.id,
                examId: examId,
                rollNumber: student.roll_number,
                studentClass: student.student_class
            });

            const pdfBuffer = await generator.generate();

            // Add PDF to archive
            const sanitizedName = student.full_name.replace(/[^a-z0-9]/gi, '_');
            archive.append(pdfBuffer, { name: `${sanitizedName}-${student.id.slice(0, 8)}.pdf` });
        }

        // Finalize the archive
        archive.finalize();

        // Convert archive stream to Response
        const readableStream = new ReadableStream({
            start(controller) {
                archive.on('data', (chunk: Buffer) => controller.enqueue(chunk));
                archive.on('end', () => controller.close());
                archive.on('error', (err: Error) => controller.error(err));
            }
        });

        return new NextResponse(readableStream, { headers });

    } catch (error: any) {
        console.error('Bulk OMR generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate bulk OMR', details: error.message },
            { status: 500 }
        );
    }
}
