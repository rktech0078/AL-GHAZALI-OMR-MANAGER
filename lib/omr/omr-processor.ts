import { preprocessImage, validateImage } from './image-preprocessor';
import { scanCodes, validateCodes } from './code-scanner';
import { generateBubbleRegions, detectFilledBubbles, shouldUseGeminiAI, getDetectionStats } from './bubble-detector';
import { processWithGeminiAI, mergeDetectionResults } from './ai-processor';
import { processWithGroq } from './groq-processor';
import { calculateResult } from './results-calculator';
import { bufferToMat, cleanupMats } from './opencv-utils';
import { createClient } from '@/lib/supabase/server';

/**
 * Main OMR Processing Pipeline
 * Orchestrates the entire OMR sheet processing workflow
 */

export interface ProcessingOptions {
    examId: string;
    studentId?: string;
    useAIFallback?: boolean;
    forceAI?: boolean;
}

export interface ProcessingResult {
    success: boolean;
    submissionId?: string;
    resultId?: string;
    answers?: Map<number, string>;
    obtainedMarks?: number;
    totalMarks?: number;
    percentage?: number;
    grade?: string;
    status?: 'pass' | 'fail';
    processingMethod: 'library' | 'gemini-ai' | 'groq-ai' | 'hybrid';
    confidence: number;
    error?: string;
    issues?: string[];
}

/**
 * Process OMR sheet from uploaded image
 */
export async function processOMRSheet(
    imageBuffer: Buffer,
    options: ProcessingOptions
): Promise<ProcessingResult> {
    const supabase = await createClient();

    try {
        console.log('Starting OMR processing...');

        // Step 1: Validate image
        console.log('Step 1: Validating image...');
        const validation = await validateImage(imageBuffer);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
                processingMethod: 'library',
                confidence: 0
            };
        }

        // Step 2: Fetch exam details
        console.log('Step 2: Fetching exam details...');
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('*')
            .eq('id', options.examId)
            .single();

        if (examError || !exam) {
            return {
                success: false,
                error: 'Exam not found',
                processingMethod: 'library',
                confidence: 0
            };
        }

        // Step 3: Preprocess image
        console.log('Step 3: Preprocessing image...');
        const processedBuffer = await preprocessImage(imageBuffer);

        // Step 4: Scan QR/Barcode codes
        console.log('Step 4: Scanning QR/Barcode...');
        const codeResult = await scanCodes(processedBuffer);

        // Resolve Student ID
        let studentId = options.studentId;

        if (!studentId) {
            console.log('No Student ID provided, checking QR/Barcode...');
            if (codeResult.success && (codeResult.qrData || codeResult.barcodeData)) {
                const rawData = codeResult.qrData || codeResult.barcodeData;
                console.log('Raw code data:', rawData);

                try {
                    if (typeof rawData === 'string') {
                        // Try to parse as JSON first (new format)
                        const parsedData = JSON.parse(rawData);
                        if (parsedData.s) {
                            studentId = parsedData.s;
                            console.log('Found Student ID from JSON QR:', studentId);
                        }

                        // Verify Exam ID if present
                        if (parsedData.e && parsedData.e !== options.examId) {
                            console.warn(`Warning: Scanned Exam ID (${parsedData.e}) does not match current Exam ID (${options.examId})`);
                        }
                    } else if (rawData && typeof rawData === 'object') {
                        // Handle QRCodeData object
                        // @ts-ignore
                        if (rawData.s) studentId = rawData.s;
                        // @ts-ignore
                        else if (rawData.studentId) studentId = rawData.studentId;
                    }
                } catch (e) {
                    // Fallback to raw string (legacy format)
                    if (typeof rawData === 'string') {
                        studentId = rawData;
                        console.log('Found Student ID from raw code:', studentId);
                    }
                }
            }

            if (!studentId) {
                console.warn('Failed to identify student from image codes');
                return {
                    success: false,
                    error: 'MISSING_STUDENT_ID',
                    processingMethod: 'library',
                    confidence: 0,
                    issues: ['Could not identify student from QR/Barcode. Please select manually.']
                };
            }
        }

        if (!codeResult.success) {
            console.warn('Code scanning failed:', codeResult.error);
            // Continue processing even if codes fail, provided we have a studentId
        }

        // Validate codes if available
        if (codeResult.qrData || codeResult.barcodeData) {
            const codeValidation = await validateCodes(
                codeResult.qrData,
                codeResult.barcodeData,
                options.examId
            );

            if (!codeValidation.valid) {
                console.warn('Code validation failed:', codeValidation.error);
            }
        }

        let finalAnswers: Map<number, string> = new Map();
        let processingMethod: 'library' | 'gemini-ai' | 'groq-ai' | 'hybrid' = 'library';
        let confidence: number = 0;
        let issues: string[] = [];

        // Step 5: Try library-based detection first (unless forced AI)
        if (!options.forceAI) {
            console.log('Step 5: Detecting bubbles with OpenCV...');

            // Convert buffer to Mat
            const imageMat = await bufferToMat(processedBuffer);

            // Generate bubble regions
            const regions = generateBubbleRegions(exam.total_questions);

            // Detect filled bubbles
            const detectionResult = await detectFilledBubbles(imageMat, regions);

            // Get statistics
            const stats = getDetectionStats(detectionResult, exam.total_questions);
            console.log('Detection stats:', stats);

            issues = detectionResult.issues;

            // Clean up Mat
            cleanupMats(imageMat);

            // Step 6: Multi-tier AI fallback chain
            if (options.useAIFallback !== false && shouldUseGeminiAI(detectionResult, exam.total_questions)) {
                console.log('Step 6: Low confidence detected, initiating AI fallback chain...');

                let aiResult;
                let aiMethod: 'groq-ai' | 'gemini-ai' | null = null;

                // Try Groq first (fastest & free)
                try {
                    console.log('Trying Groq + LLaMA-3.2-Vision (primary AI)...');
                    aiResult = await processWithGroq(
                        processedBuffer,
                        exam.total_questions,
                        exam.options_count || 4
                    );
                    aiMethod = 'groq-ai';
                    console.log('✅ Groq AI processing successful');
                } catch (groqError) {
                    console.warn('⚠️ Groq failed, trying Gemini fallback...', groqError);

                    // Fallback to Gemini
                    try {
                        console.log('Trying Gemini AI (backup)...');
                        aiResult = await processWithGeminiAI(
                            processedBuffer,
                            exam.total_questions,
                            exam.options_count || 4
                        );
                        aiMethod = 'gemini-ai';
                        console.log('✅ Gemini AI processing successful');
                    } catch (geminiError) {
                        console.error('❌ All AI fallbacks failed:', geminiError);
                        // Use library results with warning
                        finalAnswers = detectionResult.answers;
                        processingMethod = 'library';
                        confidence = detectionResult.confidence;
                        issues.push('All AI fallbacks failed, using library results');
                        aiResult = null;
                    }
                }

                // If AI succeeded, merge results
                if (aiResult && aiMethod) {
                    finalAnswers = mergeDetectionResults(
                        detectionResult.answers,
                        aiResult.answers,
                        detectionResult.confidence,
                        aiResult.confidence
                    );

                    processingMethod = 'hybrid';
                    confidence = Math.max(detectionResult.confidence, aiResult.confidence);

                    console.log(`Hybrid processing completed (OpenCV + ${aiMethod})`);
                }
            } else {
                // Use library results
                finalAnswers = detectionResult.answers;
                processingMethod = 'library';
                confidence = detectionResult.confidence;
                console.log('Library detection successful');
            }
        } else {
            // Force AI processing (Groq first, Gemini fallback)
            console.log('Step 5: Processing with AI (forced)...');

            try {
                console.log('Using Groq AI (forced mode)...');
                const aiResult = await processWithGroq(
                    processedBuffer,
                    exam.total_questions,
                    exam.options_count || 4
                );

                finalAnswers = aiResult.answers;
                processingMethod = 'groq-ai';
                confidence = aiResult.confidence;
            } catch (groqError) {
                console.warn('Groq failed in forced mode, trying Gemini...', groqError);

                const aiResult = await processWithGeminiAI(
                    processedBuffer,
                    exam.total_questions,
                    exam.options_count || 4
                );

                finalAnswers = aiResult.answers;
                processingMethod = 'gemini-ai';
                confidence = aiResult.confidence;
            }
        }

        // Step 7: Calculate result
        console.log('Step 7: Calculating result...');
        const result = await calculateResult(options.examId, finalAnswers);

        // Step 8: Store result in database
        console.log('Step 8: Storing result...');
        const { data: savedResult, error: saveError } = await supabase
            .from('results')
            .insert({
                exam_id: options.examId,
                student_id: studentId,
                obtained_marks: result.obtainedMarks,
                total_marks: result.totalMarks,
                percentage: result.percentage,
                grade: result.grade,
                status: result.status,
                processing_method: processingMethod,
                confidence_score: confidence,
                question_results: result.questionResults,
                processed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (saveError) {
            console.error('Failed to save result:', saveError);
            return {
                success: false,
                error: 'Failed to save result',
                processingMethod,
                confidence
            };
        }

        console.log('OMR processing completed successfully!');

        return {
            success: true,
            resultId: savedResult.id,
            answers: finalAnswers,
            obtainedMarks: result.obtainedMarks,
            totalMarks: result.totalMarks,
            percentage: result.percentage,
            grade: result.grade,
            status: result.status,
            processingMethod,
            confidence,
            issues,
            // Return the identified student ID so the API can use it
            // We can add this property to ProcessingResult interface if needed, 
            // but for now we can just rely on the caller knowing it or using the resultId
        };

    } catch (error) {
        console.error('OMR processing failed:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            processingMethod: 'library',
            confidence: 0
        };
    }
}

/**
 * Process OMR sheet from submission ID
 */
export async function processSubmission(submissionId: string): Promise<ProcessingResult> {
    const supabase = await createClient();

    try {
        // Fetch submission
        const { data: submission, error: submissionError } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (submissionError || !submission) {
            return {
                success: false,
                error: 'Submission not found',
                processingMethod: 'library',
                confidence: 0
            };
        }

        // Update status to processing
        await supabase
            .from('submissions')
            .update({ status: 'processing' })
            .eq('id', submissionId);

        // Download image from storage
        const { data: imageBlob, error: downloadError } = await supabase.storage
            .from('omr-submissions')
            .download(submission.image_url);

        if (downloadError || !imageBlob) {
            await supabase
                .from('submissions')
                .update({
                    status: 'failed',
                    error_message: 'Failed to download image'
                })
                .eq('id', submissionId);

            return {
                success: false,
                error: 'Failed to download image',
                processingMethod: 'library',
                confidence: 0
            };
        }

        // Convert blob to buffer
        const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());

        // Process OMR
        const result = await processOMRSheet(imageBuffer, {
            examId: submission.exam_id,
            studentId: submission.student_id
        });

        // Update submission status
        if (result.success) {
            await supabase
                .from('submissions')
                .update({
                    status: 'processed',
                    result_id: result.resultId
                })
                .eq('id', submissionId);
        } else {
            await supabase
                .from('submissions')
                .update({
                    status: 'failed',
                    error_message: result.error
                })
                .eq('id', submissionId);
        }

        return {
            ...result,
            submissionId
        };

    } catch (error) {
        // Update submission as failed
        await supabase
            .from('submissions')
            .update({
                status: 'failed',
                error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', submissionId);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingMethod: 'library',
            confidence: 0
        };
    }
}

/**
 * Batch process multiple submissions
 */
export async function batchProcessSubmissions(
    submissionIds: string[]
): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    for (const submissionId of submissionIds) {
        const result = await processSubmission(submissionId);
        results.push(result);
    }

    return results;
}
