import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processOMRSheet } from '@/lib/omr/omr-processor';

/**
 * POST /api/omr/upload
 * Upload OMR sheet image and process it
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

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('image') as File;
        const examId = formData.get('examId') as string;
        const studentId = formData.get('studentId') as string || user.id;

        // Validate inputs
        if (!file) {
            return NextResponse.json(
                { error: 'No image file provided' },
                { status: 400 }
            );
        }

        if (!examId) {
            return NextResponse.json(
                { error: 'Exam ID is required' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG and PNG are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let finalStudentId = studentId;
        let submissionId: string | undefined;
        let uploadPath: string | undefined;

        // If studentId is provided, we can follow the standard flow
        if (finalStudentId) {
            // Upload to Supabase Storage
            const fileName = `${examId}/${finalStudentId}/${Date.now()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('omr-submissions')
                .upload(fileName, buffer, {
                    contentType: file.type,
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return NextResponse.json(
                    { error: 'Failed to upload image' },
                    { status: 500 }
                );
            }
            uploadPath = uploadData.path;

            // Create submission record
            const { data: submission, error: submissionError } = await supabase
                .from('submissions')
                .insert({
                    exam_id: examId,
                    student_id: finalStudentId,
                    image_url: uploadPath,
                    status: 'pending'
                })
                .select()
                .single();

            if (submissionError) {
                console.error('Submission error:', submissionError);
                return NextResponse.json(
                    { error: 'Failed to create submission record' },
                    { status: 500 }
                );
            }
            submissionId = submission.id;
        }

        // Process OMR sheet
        try {
            const result = await processOMRSheet(buffer, {
                examId,
                studentId: finalStudentId
            });

            if (result.success) {
                // If we didn't have a studentId before, we should have one now (from QR)
                // However, processOMRSheet doesn't explicitly return studentId in the interface yet,
                // but we modified it to use the detected one.
                // We need to extract it from the result if possible, or we assume the processor handled it.
                // Wait, if finalStudentId was null, we need to know what it is now to create the submission.

                // Since I didn't update the interface return type in the previous step (I just added a comment),
                // I should rely on the fact that if it succeeded, it found a student ID.
                // But I need that ID to create the submission record if I haven't already.

                // Let's assume for now that if studentId was missing, we need to get it.
                // I'll check if I can get it from the result. 
                // In the previous step, I didn't add it to the return object explicitly in the interface, 
                // but I did add it to the return object in the implementation.
                // So I can cast the result to any to access it.
                const detectedStudentId = (result as any).studentId || finalStudentId;

                if (!submissionId && detectedStudentId) {
                    // We need to upload the file and create submission now
                    finalStudentId = detectedStudentId;

                    const fileName = `${examId}/${finalStudentId}/${Date.now()}.jpg`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('omr-submissions')
                        .upload(fileName, buffer, {
                            contentType: file.type,
                            upsert: false
                        });

                    if (!uploadError) {
                        const { data: submission, error: submissionError } = await supabase
                            .from('submissions')
                            .insert({
                                exam_id: examId,
                                student_id: finalStudentId,
                                image_url: uploadData.path,
                                status: 'processed',
                                result_id: result.resultId
                            })
                            .select()
                            .single();

                        if (!submissionError) {
                            submissionId = submission.id;
                        }
                    }
                } else if (submissionId) {
                    // Update existing submission
                    await supabase
                        .from('submissions')
                        .update({
                            status: 'processed',
                            result_id: result.resultId
                        })
                        .eq('id', submissionId);
                }

                return NextResponse.json({
                    success: true,
                    submissionId: submissionId,
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
                // Check for specific error
                if (result.error === 'MISSING_STUDENT_ID') {
                    return NextResponse.json({
                        success: false,
                        error: 'MISSING_STUDENT_ID',
                        message: 'Could not identify student. Please select manually.'
                    }, { status: 422 });
                }

                // Update submission as failed if it exists
                if (submissionId) {
                    await supabase
                        .from('submissions')
                        .update({
                            status: 'failed',
                            error_message: result.error
                        })
                        .eq('id', submissionId);
                }

                return NextResponse.json({
                    success: false,
                    submissionId: submissionId,
                    error: result.error,
                    issues: result.issues
                }, { status: 422 });
            }
        } catch (processingError) {
            console.error('Processing error:', processingError);

            // Update submission as failed if it exists
            if (submissionId) {
                await supabase
                    .from('submissions')
                    .update({
                        status: 'failed',
                        error_message: processingError instanceof Error ? processingError.message : 'Processing failed'
                    })
                    .eq('id', submissionId);
            }

            return NextResponse.json({
                success: false,
                submissionId: submissionId,
                error: 'OMR processing failed',
                details: processingError instanceof Error ? processingError.message : 'Unknown error'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
