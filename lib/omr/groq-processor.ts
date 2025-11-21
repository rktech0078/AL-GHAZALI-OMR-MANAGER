import Groq from "groq-sdk";

/**
 * Groq + LLaMA-3.2-Vision AI Processor
 * Ultra-fast OMR processing using Groq's LPU technology
 * FREE tier: 500K tokens/day, 30 requests/min
 * 
 * Using llama-3.2-11b-vision-preview (user specified)
 */

export interface AIProcessingResult {
    answers: Map<number, string>;
    confidence: number;
    method: 'groq-ai';
    model: string;
    rawResponse?: string;
}

/**
 * Process OMR sheet using Groq + LLaMA-3.2-Vision
 * Tries 11B model first (faster), falls back to 90B (more accurate)
 */
export async function processWithGroq(
    imageBuffer: Buffer,
    totalQuestions: number,
    optionsCount: number = 4
): Promise<AIProcessingResult> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured. Get free key from console.groq.com');
    }
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });

    // Use Llama 4 Scout (multimodal) as recommended replacement for decommissioned Llama 3.2 vision models
    const modelsToTry = [
        'meta-llama/llama-4-scout-17b-16e-instruct'
    ];

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting OMR processing with ${modelName}...`);
            return await processWithModel(
                groq,
                modelName,
                imageBuffer,
                totalQuestions,
                optionsCount
            );
        } catch (error) {
            console.warn(`${modelName} failed:`, error);
            lastError = error instanceof Error ? error : new Error(String(error));
            // Continue to next model
        }
    }

    // If we get here, all models failed
    console.error('All Groq models failed');
    throw new Error(`Groq AI processing failed after trying all models. Last error: ${lastError?.message}`);
}

/**
 * Process with specific Groq model
 */
async function processWithModel(
    groq: Groq,
    modelName: string,
    imageBuffer: Buffer,
    totalQuestions: number,
    optionsCount: number
): Promise<AIProcessingResult> {
    // Generate option letters (A, B, C, D, etc.)
    const optionLetters = Array.from({ length: optionsCount }, (_, i) =>
        String.fromCharCode(65 + i)
    ).join(', ');

    // Optimized prompt for OMR detection
    const prompt = `You are an expert OMR (Optical Mark Recognition) sheet analyzer. Your task is to detect filled bubbles with maximum precision.

**OMR Sheet Details:**
- Total Questions: ${totalQuestions}
- Options per Question: ${optionsCount} (${optionLetters})
- Bubble Format: Filled/darkened circles indicate selected answers

**Detection Rules:**
1. A filled bubble appears DARKER than empty bubbles
2. Look for solid fills, not just marks or dots
3. If multiple bubbles are filled for one question → mark as "MULTIPLE"
4. If no bubble is clearly filled → mark as "EMPTY"
5. Be precise - only mark clearly filled bubbles

**Output Format:**
Return ONLY a valid JSON object with this EXACT structure:
{
  "1": "A",
  "2": "B",
  "3": "C",
  ...
  "${totalQuestions}": "D"
}

**Critical Requirements:**
- Use question numbers as keys (strings: "1", "2", etc.)
- Use uppercase letters for answers (${optionLetters})
- Use "MULTIPLE" if >1 bubble filled
- Use "EMPTY" if no bubble filled
- NO explanations, ONLY the JSON object
- Ensure valid JSON format

Analyze the OMR sheet carefully and extract all answers.`;

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    try {
        // Call Groq API with vision model
        const completion = await groq.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            temperature: 0.1, // Low temperature for consistent results
            max_tokens: 2048,
            top_p: 0.9
        });

        const responseText = completion.choices[0]?.message?.content || '';

        if (!responseText) {
            throw new Error('Empty response from Groq API');
        }

        // Parse JSON response
        const cleanResponse = responseText
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

        console.log(`✅ Groq ${modelName} success: ${validAnswers}/${totalQuestions} answers detected`);

        return {
            answers: answersMap,
            confidence,
            method: 'groq-ai',
            model: modelName,
            rawResponse: responseText
        };

    } catch (error) {
        console.error(`Groq ${modelName} processing error:`, error);
        throw error;
    }
}

/**
 * Validate Groq API key
 */
export function validateGroqApiKey(): boolean {
    return !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_');
}

/**
 * Get Groq usage stats (for monitoring free tier limits)
 */
export async function getGroqUsageStats(): Promise<{
    available: boolean;
    message: string;
}> {
    if (!validateGroqApiKey()) {
        return {
            available: false,
            message: 'GROQ_API_KEY not configured or invalid'
        };
    }

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // Test API availability with minimal request
        await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
        });

        return {
            available: true,
            message: 'Groq API is available and working'
        };
    } catch (error) {
        return {
            available: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
