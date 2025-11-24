import fetch from 'node-fetch';

/**
 * OpenRouter AI Integration
 * Supports multiple free vision models for OMR processing
 */

export interface OpenRouterModel {
    id: string;
    name: string;
    provider: string;
    free: boolean;
}

export const AVAILABLE_MODELS: OpenRouterModel[] = [
    { id: 'x-ai/grok-beta', name: 'Grok Beta (Vision)', provider: 'X.AI', free: true },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', provider: 'Google', free: true },
    { id: 'qwen/qwen2.5-vl-32b-instruct:free', name: 'Qwen Vision 32B', provider: 'Qwen', free: true },
    { id: 'meta-llama/llama-3.2-90b-vision-instruct:free', name: 'Llama 3.2 Vision', provider: 'Meta', free: true },
];

export interface AIProcessingResult {
    answers: Map<number, string>;
    confidence: number;
    method: string;
    rawResponse?: string;
}

/**
 * Process OMR sheet using OpenRouter models
 */
export async function processWithOpenRouter(
    imageBuffer: Buffer,
    totalQuestions: number,
    optionsCount: number = 4,
    modelId: string = 'x-ai/grok-beta'
): Promise<AIProcessingResult> {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not configured');
    }

    const optionLetters = Array.from({ length: optionsCount }, (_, i) =>
        String.fromCharCode(65 + i)
    ).join(', ');

    const prompt = `
You are an expert OMR (Optical Mark Recognition) sheet analyzer. Analyze this OMR answer sheet with extreme precision.

**Critical Instructions:**
1. **Question Range**: This sheet has ${totalQuestions} questions numbered 1 to ${totalQuestions}
2. **Options**: Each question has ${optionsCount} options: ${optionLetters}
3. **Detection Rules**:
   - Look for FILLED/DARKENED bubbles
   - IMPORTANT: Detect even FAINT marks (light pencil/pen)
   - If a bubble is darker than the background, count it as filled
   - Ignore completely empty bubbles
   - If multiple bubbles are filled for one question: "MULTIPLE"
   - If no bubble is filled: "EMPTY"

**Output Format (STRICT JSON ONLY):**
{
  "1": "A",
  "2": "B",
  "3": "MULTIPLE",
  "4": "EMPTY",
  ...
}

**Rules:**
- Return ONLY valid JSON
- Do NOT include markdown formatting (no \`\`\`json)
- Question numbers are strings
- Answers are uppercase letters or "EMPTY" or "MULTIPLE"
- Be very careful with faint marks - if you see ANY darkening, count it

Analyze the image now and provide the JSON.
`;

    try {
        const base64Image = imageBuffer.toString('base64');

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                'X-Title': 'Al-Ghazali OMR Manager'
            },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
        }

        const data: any = await response.json();
        const text = data.choices[0]?.message?.content || '';

        // Parse JSON response
        const cleanResponse = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const aiAnswers = JSON.parse(cleanResponse);

        // Convert to Map and filter
        const answersMap = new Map<number, string>();
        let validAnswers = 0;

        Object.entries(aiAnswers).forEach(([qNum, answer]) => {
            const answerStr = answer as string;
            if (answerStr !== 'EMPTY' && answerStr !== 'MULTIPLE') {
                answersMap.set(parseInt(qNum), answerStr);
                validAnswers++;
            }
        });

        const confidence = validAnswers / totalQuestions;

        console.log(`✅ OpenRouter (${modelId}) Success: ${validAnswers}/${totalQuestions} answers`);

        return {
            answers: answersMap,
            confidence,
            method: `openrouter-${modelId}`,
            rawResponse: text
        };

    } catch (error) {
        console.error(`❌ OpenRouter (${modelId}) Failed:`, error);
        throw error;
    }
}

/**
 * Test all available models and compare results
 */
export async function testAllModels(
    imageBuffer: Buffer,
    totalQuestions: number,
    optionsCount: number = 4
): Promise<{
    results: Map<string, AIProcessingResult>;
    consensus: Map<number, { answer: string; confidence: number }>;
}> {
    const results = new Map<string, AIProcessingResult>();

    // Test each model
    for (const model of AVAILABLE_MODELS) {
        try {
            console.log(`Testing ${model.name}...`);
            const result = await processWithOpenRouter(
                imageBuffer,
                totalQuestions,
                optionsCount,
                model.id
            );
            results.set(model.id, result);
        } catch (error) {
            console.error(`Failed to test ${model.name}:`, error);
        }
    }

    // Calculate consensus
    const consensus = new Map<number, { answer: string; confidence: number }>();

    for (let q = 1; q <= totalQuestions; q++) {
        const votes = new Map<string, number>();

        // Count votes from each model
        results.forEach((result) => {
            const answer = result.answers.get(q);
            if (answer) {
                votes.set(answer, (votes.get(answer) || 0) + 1);
            }
        });

        if (votes.size > 0) {
            // Find most voted answer
            let maxVotes = 0;
            let bestAnswer = '';

            votes.forEach((count, answer) => {
                if (count > maxVotes) {
                    maxVotes = count;
                    bestAnswer = answer;
                }
            });

            const confidence = maxVotes / results.size;
            consensus.set(q, { answer: bestAnswer, confidence });
        }
    }

    return { results, consensus };
}
