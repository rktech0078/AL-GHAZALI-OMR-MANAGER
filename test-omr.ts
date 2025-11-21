// Test script to verify OMR sheet functionality
import { POST } from './app/api/omr/generate/route';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

async function runTest() {
  console.log('Testing OMR sheet generation...');

  // Create a mock request object to test the API route
  const mockRequest = {
    json: async () => ({
      examName: 'Test Exam',
      schoolName: 'Test School',
      questions: 20,
      options: 4,
      showKey: true,
      answerKey: {1: 'A', 2: 'B', 3: 'C'},
      students: [{name: 'John Doe', rollNumber: '123'}]
    })
  } as unknown as NextRequest;

  try {
    const response = await POST(mockRequest);

    if (response.status === 200) {
      console.log('Success! PDF generated.');
      const buffer = await response.arrayBuffer();
      const outputPath = path.join(process.cwd(), 'test-output.pdf');
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      console.log(`PDF saved to: ${outputPath}`);
    } else {
      console.error('Failed to generate PDF. Status:', response.status);
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

runTest();