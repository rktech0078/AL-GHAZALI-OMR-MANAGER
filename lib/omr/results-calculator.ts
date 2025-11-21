import { createClient } from '@/lib/supabase/server';

/**
 * Result Calculation System
 * Compares student answers with correct answers and calculates grades
 */

export interface QuestionResult {
    questionNumber: number;
    studentAnswer: string | undefined;
    correctAnswer: string;
    isCorrect: boolean;
    marksObtained: number;
    marksAllocated: number;
}

export interface CalculatedResult {
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    status: 'pass' | 'fail';
    questionResults: QuestionResult[];
}

/**
 * Calculate result by comparing answers
 */
export async function calculateResult(
    examId: string,
    studentAnswers: Map<number, string>
): Promise<CalculatedResult> {
    const supabase = await createClient();

    // Fetch exam details and questions
    const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('*, questions(*)')
        .eq('id', examId)
        .single();

    if (examError || !exam) {
        throw new Error('Exam not found');
    }

    let obtainedMarks = 0;
    let totalMarks = 0;
    const questionResults: QuestionResult[] = [];

    // Sort questions by question_number
    const sortedQuestions = exam.questions.sort(
        (a: any, b: any) => a.question_number - b.question_number
    );

    sortedQuestions.forEach((question: any) => {
        const studentAnswer = studentAnswers.get(question.question_number);
        const correctAnswer = question.correct_answer;
        const marksAllocated = question.marks || 1;

        const isCorrect = studentAnswer === correctAnswer;
        const marksObtained = isCorrect ? marksAllocated : 0;

        totalMarks += marksAllocated;
        obtainedMarks += marksObtained;

        questionResults.push({
            questionNumber: question.question_number,
            studentAnswer,
            correctAnswer,
            isCorrect,
            marksObtained,
            marksAllocated
        });
    });

    // Calculate percentage
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    // Calculate grade
    const grade = calculateGrade(percentage);

    // Determine pass/fail status
    const passingMarks = Number(exam.passing_marks) || (totalMarks * 0.4); // Default 40%
    console.log(`Grading Debug: Obtained=${obtainedMarks}, Total=${totalMarks}, Passing=${passingMarks}, ExamPassing=${exam.passing_marks}`);
    const status = obtainedMarks >= passingMarks ? 'pass' : 'fail';

    return {
        obtainedMarks,
        totalMarks,
        percentage: Math.round(percentage * 100) / 100,
        grade,
        status,
        questionResults
    };
}

/**
 * Calculate grade based on percentage
 */
export function calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
}

/**
 * Get grade color for UI display
 */
export function getGradeColor(grade: string): string {
    switch (grade) {
        case 'A+':
        case 'A':
            return 'text-green-600';
        case 'B':
            return 'text-blue-600';
        case 'C':
            return 'text-yellow-600';
        case 'D':
        case 'E':
            return 'text-orange-600';
        case 'F':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
}

/**
 * Calculate class statistics
 */
export interface ClassStatistics {
    totalStudents: number;
    averageMarks: number;
    averagePercentage: number;
    highestMarks: number;
    lowestMarks: number;
    passCount: number;
    failCount: number;
    passPercentage: number;
    gradeDistribution: Record<string, number>;
}

export async function calculateClassStatistics(examId: string): Promise<ClassStatistics> {
    const supabase = await createClient();

    const { data: results, error } = await supabase
        .from('results')
        .select('obtained_marks, total_marks, percentage, grade, status')
        .eq('exam_id', examId);

    if (error || !results || results.length === 0) {
        throw new Error('No results found for this exam');
    }

    const totalStudents = results.length;
    const totalMarksSum = results.reduce((sum, r) => sum + r.obtained_marks, 0);
    const averageMarks = totalMarksSum / totalStudents;

    const totalPercentageSum = results.reduce((sum, r) => sum + r.percentage, 0);
    const averagePercentage = totalPercentageSum / totalStudents;

    const highestMarks = Math.max(...results.map(r => r.obtained_marks));
    const lowestMarks = Math.min(...results.map(r => r.obtained_marks));

    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = totalStudents - passCount;
    const passPercentage = (passCount / totalStudents) * 100;

    // Grade distribution
    const gradeDistribution: Record<string, number> = {
        'A+': 0,
        'A': 0,
        'B': 0,
        'C': 0,
        'D': 0,
        'E': 0,
        'F': 0
    };

    results.forEach(r => {
        if (r.grade in gradeDistribution) {
            gradeDistribution[r.grade]++;
        }
    });

    return {
        totalStudents,
        averageMarks: Math.round(averageMarks * 100) / 100,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
        highestMarks,
        lowestMarks,
        passCount,
        failCount,
        passPercentage: Math.round(passPercentage * 100) / 100,
        gradeDistribution
    };
}

/**
 * Get student rank in class
 */
export async function getStudentRank(
    examId: string,
    studentId: string
): Promise<{ rank: number; totalStudents: number }> {
    const supabase = await createClient();

    const { data: results, error } = await supabase
        .from('results')
        .select('student_id, obtained_marks')
        .eq('exam_id', examId)
        .order('obtained_marks', { ascending: false });

    if (error || !results) {
        throw new Error('Unable to calculate rank');
    }

    const rank = results.findIndex(r => r.student_id === studentId) + 1;

    return {
        rank,
        totalStudents: results.length
    };
}

/**
 * Generate result summary text
 */
export function generateResultSummary(result: CalculatedResult): string {
    const { obtainedMarks, totalMarks, percentage, grade, status } = result;

    return `
Result Summary:
- Marks: ${obtainedMarks}/${totalMarks}
- Percentage: ${percentage}%
- Grade: ${grade}
- Status: ${status.toUpperCase()}
- Correct Answers: ${result.questionResults.filter(q => q.isCorrect).length}/${result.questionResults.length}
  `.trim();
}
