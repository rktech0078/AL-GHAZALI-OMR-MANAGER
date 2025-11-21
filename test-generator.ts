import { OMRPDFGenerator } from './lib/omr/pdf-generator';
import fs from 'fs';
import path from 'path';

async function runTest() {
    console.log('Testing OMRPDFGenerator directly...');

    try {
        const generator = new OMRPDFGenerator({
            totalQuestions: 20,
            options: 4,
            showKey: true,
            answerKey: { '1': 'A', '2': 'B' },
            examName: 'Direct Test Exam',
            schoolName: 'Direct Test School'
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
