import { OMRPDFGenerator } from './lib/omr/pdf-generator';
import fs from 'fs';
import path from 'path';

async function runTest() {
    console.log('Testing OMRPDFGenerator directly...');

    try {
        const generator = new OMRPDFGenerator({
            totalQuestions: 12,
            options: 4,
            showKey: true,
            answerKey: { '1': 'A', '2': 'B', '12': 'D' },
            examName: 'Preliminary Examination 2025-26',
            schoolName: 'AL-GHAZALI HIGH SCHOOL',
            examId: 'EXAM-12-BASIC'
        });

        const buffer = await generator.generate();
        const outputPath = path.join(process.cwd(), 'test-generator-output.pdf');
        fs.writeFileSync(outputPath, buffer);
        console.log(`Success! PDF saved to: ${outputPath}`);
    } catch (error) {
        console.error('Error testing generator:', error);
    }
}

runTest();
