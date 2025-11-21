import * as cvUtils from './opencv-utils';

/**
 * Bubble Detection System
 * Detects and analyzes filled bubbles in OMR sheets
 */

export interface BubbleRegion {
    questionNumber: number;
    options: BubbleOption[];
}

export interface BubbleOption {
    option: 'A' | 'B' | 'C' | 'D' | 'E';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DetectionResult {
    answers: Map<number, string>;
    confidence: number;
    issues: string[];
    fillRatios: number[][];
}

/**
 * OMR Sheet Layout Configuration
 */
export interface OMRLayout {
    startX: number;
    startY: number;
    bubbleRadius: number;
    bubbleSpacing: number;
    rowHeight: number;
    questionsPerColumn: number;
    columnSpacing: number;
    optionsCount: number;
}

/**
 * Default A4 OMR layout (matches PDF generator)
 */
export const DEFAULT_OMR_LAYOUT: OMRLayout = {
    startX: 85, // Shifted left slightly
    startY: 240, // Shifted up slightly
    bubbleRadius: 6,
    bubbleSpacing: 30,
    rowHeight: 28, // Increased row height to match the image spacing
    questionsPerColumn: 15,
    columnSpacing: 100, // Increased column spacing significantly for the gap
    optionsCount: 4
};

/**
 * Generate bubble regions for all questions
 */
export function generateBubbleRegions(
    totalQuestions: number,
    layout: OMRLayout = DEFAULT_OMR_LAYOUT
): BubbleRegion[] {
    const regions: BubbleRegion[] = [];
    const options = ['A', 'B', 'C', 'D', 'E'] as const;

    for (let q = 1; q <= totalQuestions; q++) {
        // Calculate column and row
        const columnIndex = Math.floor((q - 1) / layout.questionsPerColumn);
        const rowIndex = (q - 1) % layout.questionsPerColumn;

        // Calculate base position
        const baseX = layout.startX + columnIndex * (layout.bubbleSpacing * layout.optionsCount + layout.columnSpacing);
        const baseY = layout.startY + rowIndex * layout.rowHeight;

        // Generate bubble positions for each option
        const questionBubbles: BubbleOption[] = [];
        for (let i = 0; i < layout.optionsCount; i++) {
            questionBubbles.push({
                option: options[i],
                x: baseX + i * layout.bubbleSpacing,
                y: baseY,
                width: layout.bubbleRadius * 2,
                height: layout.bubbleRadius * 2
            });
        }

        regions.push({
            questionNumber: q,
            options: questionBubbles
        });
    }

    return regions;
}

/**
 * Detect filled bubbles in the image
 */
export async function detectFilledBubbles(
    imageMat: any,
    regions: BubbleRegion[],
    fillThreshold: number = 0.6
): Promise<DetectionResult> {
    await cvUtils.initializeOpenCV();

    const answers = new Map<number, string>();
    const fillRatios: number[][] = [];
    const issues: string[] = [];

    // Convert to grayscale if needed
    let grayMat = imageMat;
    if (imageMat.channels() > 1) {
        grayMat = cvUtils.toGrayscale(imageMat);
    }

    // Apply threshold for better detection
    const threshMat = cvUtils.applyAdaptiveThreshold(grayMat);

    for (const region of regions) {
        const questionFillRatios: number[] = [];
        let maxFillRatio = 0;
        let selectedAnswer = '';
        let selectedCount = 0;

        for (const bubble of region.options) {
            try {
                // Extract bubble ROI
                const roi = cvUtils.extractROI(
                    threshMat,
                    Math.round(bubble.x),
                    Math.round(bubble.y),
                    Math.round(bubble.width),
                    Math.round(bubble.height)
                );

                // Calculate fill ratio
                const fillRatio = cvUtils.calculateFillRatio(roi);
                questionFillRatios.push(fillRatio);

                // Check if this bubble is filled
                if (fillRatio > fillThreshold) {
                    selectedCount++;
                    if (fillRatio > maxFillRatio) {
                        maxFillRatio = fillRatio;
                        selectedAnswer = bubble.option;
                    }
                }

                // Clean up ROI
                cvUtils.cleanupMats(roi);
            } catch (error) {
                console.error(`Error processing Q${region.questionNumber} option ${bubble.option}:`, error);
                questionFillRatios.push(0);
            }
        }

        fillRatios.push(questionFillRatios);

        // Validate answer
        if (selectedCount > 1) {
            issues.push(`Multiple marks detected in question ${region.questionNumber}`);
            // Still record the darkest one
            if (selectedAnswer) {
                answers.set(region.questionNumber, selectedAnswer);
            }
        } else if (selectedCount === 1) {
            answers.set(region.questionNumber, selectedAnswer);
        } else {
            issues.push(`No answer detected for question ${region.questionNumber}`);
        }
    }

    // Calculate confidence score
    const confidence = calculateConfidence(answers, regions.length, fillRatios);

    // Clean up
    if (grayMat !== imageMat) {
        cvUtils.cleanupMats(grayMat);
    }
    cvUtils.cleanupMats(threshMat);

    return {
        answers,
        confidence,
        issues,
        fillRatios
    };
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(
    answers: Map<number, string>,
    totalQuestions: number,
    fillRatios: number[][]
): number {
    let confidenceSum = 0;
    let validAnswers = 0;

    fillRatios.forEach((ratios, index) => {
        const maxRatio = Math.max(...ratios);
        const secondMaxRatio = ratios.sort((a, b) => b - a)[1] || 0;

        // High confidence if:
        // 1. One bubble is clearly filled (high ratio)
        // 2. Other bubbles are clearly not filled (low ratio)
        const clarity = maxRatio - secondMaxRatio;

        if (maxRatio > 0.6) {
            confidenceSum += Math.min(1, maxRatio * clarity * 2);
            validAnswers++;
        }
    });

    // Penalize for missing answers
    const completionRatio = answers.size / totalQuestions;
    const avgConfidence = validAnswers > 0 ? confidenceSum / validAnswers : 0;

    return avgConfidence * completionRatio;
}

/**
 * Determine if Gemini AI fallback should be used
 */
export function shouldUseGeminiAI(result: DetectionResult, totalQuestions: number): boolean {
    const completionRatio = result.answers.size / totalQuestions;

    return (
        result.confidence < 0.7 || // Low confidence
        result.issues.length > totalQuestions * 0.3 || // Too many issues (>30%)
        completionRatio < 0.8 // Too many missing answers (<80% complete)
    );
}

/**
 * Validate detection result
 */
export interface ValidationIssue {
    type: 'missing' | 'multiple' | 'unclear';
    questionNumber: number;
    message: string;
}

export function validateDetectionResult(
    result: DetectionResult,
    totalQuestions: number
): ValidationIssue[] {
    const validationIssues: ValidationIssue[] = [];

    // Check for missing answers
    for (let q = 1; q <= totalQuestions; q++) {
        if (!result.answers.has(q)) {
            validationIssues.push({
                type: 'missing',
                questionNumber: q,
                message: `Question ${q}: No answer detected`
            });
        }
    }

    // Check fill ratios for quality issues
    result.fillRatios.forEach((ratios, index) => {
        const questionNumber = index + 1;
        const markedCount = ratios.filter(r => r > 0.6).length;

        if (markedCount > 1) {
            validationIssues.push({
                type: 'multiple',
                questionNumber,
                message: `Question ${questionNumber}: Multiple bubbles marked`
            });
        } else if (markedCount === 0 && result.answers.has(questionNumber)) {
            validationIssues.push({
                type: 'unclear',
                questionNumber,
                message: `Question ${questionNumber}: Unclear marking`
            });
        }
    });

    return validationIssues;
}

/**
 * Get detection statistics
 */
export interface DetectionStats {
    totalQuestions: number;
    answeredQuestions: number;
    missingAnswers: number;
    multipleMarks: number;
    averageFillRatio: number;
    confidence: number;
}

export function getDetectionStats(
    result: DetectionResult,
    totalQuestions: number
): DetectionStats {
    const multipleMarks = result.issues.filter(i => i.includes('Multiple')).length;
    const missingAnswers = totalQuestions - result.answers.size;

    const allFillRatios = result.fillRatios.flat();
    const averageFillRatio = allFillRatios.reduce((sum, r) => sum + r, 0) / allFillRatios.length;

    return {
        totalQuestions,
        answeredQuestions: result.answers.size,
        missingAnswers,
        multipleMarks,
        averageFillRatio: Math.round(averageFillRatio * 100) / 100,
        confidence: Math.round(result.confidence * 100) / 100
    };
}
