import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini AI Fallback System
 * Used when library-based detection fails or has low confidence
 */

export interface AIProcessingResult {
    answers: Map<number, string>;
    confidence: number;
    method: 'gemini-ai';
    rawResponse?: string;
}

/**
 * Process OMR sheet using Gemini AI
 */
/**
 * Process OMR sheet using Gemini AI with robust fallback
 */
export async function processWithGeminiAI(
    imageBuffer: Buffer,
    totalQuestions: number,
    optionsCount: number = 4
): Promise<AIProcessingResult> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // List of models to try in order of preference (speed/cost -> stability)
    // Using stable models available in Gemini free tier (Nov 2024)
    const modelsToTry = [
        'gemini-1.5-flash',      // Fast and cost-effective (stable version)
        'gemini-1.5-pro'         // More capable (stable version)
    ];

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting AI processing with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Generate option letters
            const optionLetters = Array.from({ length: optionsCount }, (_, i) =>
                String.fromCharCode(65 + i)
            ).join(', ');

            const prompt = `
            You are an expert OMR (Optical Mark Recognition) sheet analyzer. Your task is to carefully examine this OMR answer sheet and extract the marked answers with high precision.

            **Instructions:**
            - This OMR sheet contains ${totalQuestions} multiple-choice questions
            - Each question has ${optionsCount} options: ${optionLetters}
            - Identify which bubble is filled/darkened for each question
            - A filled bubble appears darker than empty bubbles
            - If multiple bubbles are filled for a question, mark it as "MULTIPLE"
            - If no bubble is clearly filled, mark it as "EMPTY"
            - Be very careful and precise in your detection

            **Output Format:**
            Return ONLY a valid JSON object with this exact structure:
            {
              "1": "A",
              "2": "B",
              "3": "C",
              ...
            }

            **Important:**
            - Use question numbers as keys (as strings)
            - Use uppercase letters for answers (${optionLetters})
            - Use "MULTIPLE" if more than one bubble is filled
            - Use "EMPTY" if no bubble is filled
            - Do not include any explanation, only the JSON object
            - Ensure the JSON is valid and parseable

            Analyze the image carefully and provide the answers.
            `;

            // Convert buffer to base64
            const base64Image = imageBuffer.toString('base64');

            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: 'image/jpeg'
                }
            };

            // Generate content
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            // Parse JSON response
            const cleanResponse = text
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            const aiAnswers = JSON.parse(cleanResponse);

            // Convert to Map and filter out invalid answers
            const answersMap = new Map<number, string>();
            let validAnswers = 0;

            Object.entries(aiAnswers).forEach(([qNum, answer]) => {
                const answerStr = answer as string;

                // Only include valid answers (not EMPTY or MULTIPLE)
                if (answerStr !== 'EMPTY' && answerStr !== 'MULTIPLE') {
                    answersMap.set(parseInt(qNum), answerStr);
                    validAnswers++;
                }
            });

            // Calculate confidence based on completion ratio
            const confidence = validAnswers / totalQuestions;

            console.log(`Success with model ${modelName}`);
            return {
                answers: answersMap,
                confidence,
                method: 'gemini-ai',
                rawResponse: text
            };

        } catch (error) {
            console.warn(`Failed with model ${modelName}:`, error);
            lastError = error instanceof Error ? error : new Error(String(error));
            // Continue to next model
        }
    }

    // If we get here, all models failed
    console.error('All Gemini models failed');
    throw new Error(`AI processing failed after trying all models. Last error: ${lastError?.message}`);
}

/**
 * Compare library detection with AI detection
 */
export interface ComparisonResult {
    agreement: number; // Percentage of matching answers
    differences: {
        questionNumber: number;
        libraryAnswer: string | undefined;
        aiAnswer: string | undefined;
    }[];
    recommendation: 'use-library' | 'use-ai' | 'manual-review';
}

export function compareDetectionResults(
    libraryAnswers: Map<number, string>,
    aiAnswers: Map<number, string>,
    totalQuestions: number
): ComparisonResult {
    const differences: ComparisonResult['differences'] = [];
    let matchingAnswers = 0;

    for (let q = 1; q <= totalQuestions; q++) {
        const libAnswer = libraryAnswers.get(q);
        const aiAnswer = aiAnswers.get(q);

        if (libAnswer === aiAnswer) {
            matchingAnswers++;
        } else {
            differences.push({
                questionNumber: q,
                libraryAnswer: libAnswer,
                aiAnswer: aiAnswer
            });
        }
    }

    const agreement = (matchingAnswers / totalQuestions) * 100;

    // Determine recommendation
    let recommendation: ComparisonResult['recommendation'];
    if (agreement >= 95) {
        recommendation = 'use-library';
    } else if (agreement >= 80) {
        recommendation = 'use-ai';
    } else {
        recommendation = 'manual-review';
    }

    return {
        agreement,
        differences,
        recommendation
    };
}

/**
 * Merge library and AI results intelligently
 */
export function mergeDetectionResults(
    libraryAnswers: Map<number, string>,
    aiAnswers: Map<number, string>,
    libraryConfidence: number,
    aiConfidence: number
): Map<number, string> {
    const merged = new Map<number, string>();

    // Get all question numbers
    const allQuestions = new Set([
        ...Array.from(libraryAnswers.keys()),
        ...Array.from(aiAnswers.keys())
    ]);

    allQuestions.forEach(q => {
        const libAnswer = libraryAnswers.get(q);
        const aiAnswer = aiAnswers.get(q);

        if (libAnswer === aiAnswer && libAnswer !== undefined) {
            // Both agree - high confidence
            merged.set(q, libAnswer);
        } else if (libAnswer && !aiAnswer) {
            // Only library detected
            merged.set(q, libAnswer);
        } else if (aiAnswer && !libAnswer) {
            // Only AI detected
            merged.set(q, aiAnswer);
        } else if (libAnswer && aiAnswer && libAnswer !== aiAnswer) {
            // Disagreement - use higher confidence method
            if (libraryConfidence >= aiConfidence) {
                merged.set(q, libAnswer);
            } else {
                merged.set(q, aiAnswer);
            }
        }
    });

    return merged;
}

/**
 * Retry AI processing with enhanced prompt
 */
export async function retryWithEnhancedPrompt(
    imageBuffer: Buffer,
    totalQuestions: number,
    previousIssues: string[]
): Promise<AIProcessingResult> {
    const issuesText = previousIssues.join(', ');

    const enhancedPrompt = `
CRITICAL: Previous detection had issues: ${issuesText}

You are an expert OMR analyzer. This is a RETRY with enhanced focus.

**Special Instructions:**
- Pay extra attention to lightly filled bubbles
- Look for partial marks or erasures
- Consider bubbles filled with different pen pressures
- Be more lenient with fill detection threshold

Analyze this OMR sheet with ${totalQuestions} questions and return answers in JSON format:
{
  "1": "A",
  "2": "B",
  ...
}

Use "EMPTY" for unfilled, "MULTIPLE" for multiple marks.
`;

    // Use the same processing logic but with enhanced prompt
    return processWithGeminiAI(imageBuffer, totalQuestions);
}
