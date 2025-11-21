# OMR_PROCESSING_GEMINI.md - Complete OMR Processing Pipeline

## 🎯 Purpose
Automated OMR sheet processing using computer vision libraries with Gemini AI fallback.

## 🔄 Processing Pipeline Overview
```
Mobile Image Upload → 
Pre-processing → 
Barcode/QR Scanning → 
Bubble Detection (Libraries) → 
[If Failed] → Gemini AI Fallback → 
Answer Extraction → 
Result Calculation → 
Database Storage
```

## 📸 Step 1: Image Upload System

### Upload Component
```typescript
interface ImageUploadProps {
  examId: string;
  studentId: string;
  onSuccess: (submissionId: string) => void;
  onError: (error: string) => void;
}

// Features:
- Mobile camera capture (navigator.mediaDevices)
- File upload from gallery
- Image preview before submit
- Compression before upload
- Progress indicator
```

### Validation Rules
```typescript
const validateImage = (file: File) => {
  // File size check
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Max 10MB.' };
  }
  
  // File type check
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG/PNG allowed.' };
  }
  
  // Check minimum dimensions
  const img = new Image();
  img.src = URL.createObjectURL(file);
  
  img.onload = () => {
    if (img.width < 800 || img.height < 1000) {
      return { valid: false, error: 'Image too small. Minimum 800x1000.' };
    }
  };
  
  return { valid: true };
};
```

### Upload API
```typescript
// POST /api/omr/upload
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('image') as File;
  const examId = formData.get('examId') as string;
  const studentId = formData.get('studentId') as string;
  
  // Validate
  const validation = validateImage(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  // Upload to Supabase Storage
  const { data: upload, error } = await supabase.storage
    .from('omr-submissions')
    .upload(`${examId}/${studentId}/${Date.now()}.jpg`, file);
  
  if (error) throw error;
  
  // Create submission record
  const { data: submission } = await supabase
    .from('submissions')
    .insert({
      exam_id: examId,
      student_id: studentId,
      image_url: upload.path,
      status: 'pending'
    })
    .select()
    .single();
  
  // Trigger processing job
  await processOMRSheet(submission.id);
  
  return NextResponse.json({ submissionId: submission.id });
}
```

## 🔧 Step 2: Image Pre-processing

### Using Sharp Library
```typescript
import sharp from 'sharp';

async function preprocessImage(imageBuffer: Buffer) {
  const processed = await sharp(imageBuffer)
    // Convert to grayscale
    .grayscale()
    // Enhance contrast
    .normalize()
    // Remove noise
    .median(3)
    // Increase sharpness
    .sharpen()
    // Resize to standard dimensions
    .resize(2480, 3508, { // A4 at 300 DPI
      fit: 'contain',
      background: { r: 255, g: 255, b: 255 }
    })
    // Convert to format OpenCV can read
    .png()
    .toBuffer();
  
  return processed;
}
```

### Perspective Correction (Using OpenCV)
```typescript
import cv from 'opencv4nodejs';

async function correctPerspective(imagePath: string) {
  const image = await cv.imreadAsync(imagePath);
  const gray = image.bgrToGray();
  
  // Detect corners/edges
  const edges = gray.canny(50, 150);
  const contours = edges.findContours(
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );
  
  // Find largest rectangle (OMR sheet boundary)
  let maxArea = 0;
  let maxContour = contours[0];
  
  contours.forEach(contour => {
    const area = contour.area;
    if (area > maxArea) {
      maxArea = area;
      maxContour = contour;
    }
  });
  
  // Get corner points
  const approx = maxContour.approxPolyDP(
    0.02 * maxContour.arcLength(true),
    true
  );
  
  if (approx.length === 4) {
    // Apply perspective transform
    const corners = approx.getPoints();
    const width = 2480;
    const height = 3508;
    
    const dstPoints = [
      new cv.Point2(0, 0),
      new cv.Point2(width, 0),
      new cv.Point2(width, height),
      new cv.Point2(0, height)
    ];
    
    const transformMatrix = cv.getPerspectiveTransform(corners, dstPoints);
    const corrected = image.warpPerspective(
      transformMatrix,
      new cv.Size(width, height)
    );
    
    return corrected;
  }
  
  return image; // Return original if perspective correction fails
}
```

## 📊 Step 3: Barcode & QR Code Reading

### Scan Codes
```typescript
import jsQR from 'jsqr';
import JsBarcode from 'jsbarcode';
import Quagga from '@ericblade/quagga2';

async function scanCodes(image: cv.Mat) {
  // Convert to ImageData for jsQR
  const imageData = {
    data: new Uint8ClampedArray(image.getData()),
    width: image.cols,
    height: image.rows
  };
  
  // Scan QR Code
  const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
  
  // Scan Barcode
  const barcodeResult = await new Promise((resolve) => {
    Quagga.decodeSingle({
      src: image,
      numOfWorkers: 0,
      decoder: {
        readers: ['code_128_reader']
      }
    }, (result) => {
      resolve(result?.codeResult?.code);
    });
  });
  
  return {
    qrData: qrCode?.data ? JSON.parse(qrCode.data) : null,
    barcodeData: barcodeResult as string
  };
}
```

### Validate Codes
```typescript
async function validateCodes(qrData: any, barcodeData: string, examId: string) {
  // Check if serial number matches
  const { data: omrSheet } = await supabase
    .from('omr_sheets')
    .select('*')
    .eq('serial_number', barcodeData)
    .eq('exam_id', examId)
    .single();
  
  if (!omrSheet) {
    return {
      valid: false,
      error: 'Invalid OMR sheet. Serial number not found.'
    };
  }
  
  // Check if QR data matches
  if (qrData.examId !== examId || qrData.serialNumber !== barcodeData) {
    return {
      valid: false,
      error: 'QR code data mismatch.'
    };
  }
  
  return {
    valid: true,
    studentId: omrSheet.student_id,
    examId: omrSheet.exam_id
  };
}
```

## 🎯 Step 4: Bubble Detection (Primary Method)

### Locate Bubble Regions
```typescript
interface BubbleRegion {
  questionNumber: number;
  options: {
    option: 'A' | 'B' | 'C' | 'D';
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

function locateBubbleRegions(totalQuestions: number): BubbleRegion[] {
  const regions: BubbleRegion[] = [];
  const startY = 180; // Start position from OMR template
  const bubbleSpacing = 30;
  const questionSpacing = 25;
  const options = ['A', 'B', 'C', 'D'] as const;
  
  for (let q = 0; q < totalQuestions; q++) {
    const yPosition = startY + (q * questionSpacing);
    const questionBubbles = options.map((opt, i) => ({
      option: opt,
      x: 100 + (i * bubbleSpacing),
      y: yPosition,
      width: 16,
      height: 16
    }));
    
    regions.push({
      questionNumber: q + 1,
      options: questionBubbles
    });
  }
  
  return regions;
}
```

### Detect Filled Bubbles
```typescript
async function detectFilledBubbles(
  image: cv.Mat,
  regions: BubbleRegion[]
): Promise<Map<number, string>> {
  const answers = new Map<number, string>();
  const threshold = 0.6; // 60% filled = marked
  
  for (const region of regions) {
    let maxFillRatio = 0;
    let selectedAnswer = '';
    
    for (const bubble of region.options) {
      // Extract bubble ROI
      const roi = image.getRegion(
        new cv.Rect(bubble.x, bubble.y, bubble.width, bubble.height)
      );
      
      // Apply threshold
      const binary = roi.threshold(127, 255, cv.THRESH_BINARY_INV);
      
      // Calculate fill ratio
      const whitePixels = cv.countNonZero(binary);
      const totalPixels = bubble.width * bubble.height;
      const fillRatio = whitePixels / totalPixels;
      
      if (fillRatio > maxFillRatio && fillRatio > threshold) {
        maxFillRatio = fillRatio;
        selectedAnswer = bubble.option;
      }
    }
    
    if (selectedAnswer) {
      answers.set(region.questionNumber, selectedAnswer);
    }
  }
  
  return answers;
}
```

### Confidence Score Calculation
```typescript
interface DetectionResult {
  answers: Map<number, string>;
  confidence: number;
  issues: string[];
}

function calculateConfidence(
  detectedAnswers: Map<number, string>,
  totalQuestions: number,
  fillRatios: number[][]
): DetectionResult {
  const issues: string[] = [];
  let confidenceSum = 0;
  
  // Check answer count
  const detectedCount = detectedAnswers.size;
  const completionRatio = detectedCount / totalQuestions;
  
  if (completionRatio < 0.8) {
    issues.push(`Only ${detectedCount}/${totalQuestions} answers detected`);
  }
  
  // Check for multiple marks per question
  fillRatios.forEach((ratios, qNum) => {
    const markedCount = ratios.filter(r => r > 0.6).length;
    if (markedCount > 1) {
      issues.push(`Multiple marks in question ${qNum + 1}`);
    }
    if (markedCount === 0 && detectedAnswers.has(qNum + 1)) {
      issues.push(`Unclear marking in question ${qNum + 1}`);
    }
  });
  
  // Calculate average confidence
  fillRatios.forEach(ratios => {
    const maxRatio = Math.max(...ratios);
    confidenceSum += maxRatio;
  });
  
  const avgConfidence = confidenceSum / totalQuestions;
  
  return {
    answers: detectedAnswers,
    confidence: avgConfidence,
    issues
  };
}
```

## 🤖 Step 5: Gemini AI Fallback (When Libraries Fail)

### Trigger Conditions
```typescript
function shouldUseGeminiAI(detectionResult: DetectionResult): boolean {
  // Use AI if:
  return (
    detectionResult.confidence < 0.7 || // Low confidence
    detectionResult.issues.length > 3 || // Multiple issues
    detectionResult.answers.size < (totalQuestions * 0.8) // Too many missing
  );
}
```

### Gemini AI Processing
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

async function processWithGeminiAI(
  imageBuffer: Buffer,
  totalQuestions: number
): Promise<Map<number, string>> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `
You are an OMR sheet analyzer. Analyze this image and extract the marked answers.

Instructions:
- There are ${totalQuestions} multiple-choice questions
- Each question has 4 options: A, B, C, D
- Identify which bubble is filled for each question
- If multiple bubbles are filled, mark as "MULTIPLE"
- If no bubble is filled, mark as "EMPTY"
- Output ONLY a JSON object in this format:
{
  "1": "A",
  "2": "B",
  "3": "C",
  ...
}

Be precise. Look for darkened/filled circles.
`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg'
    }
  };
  
  const result = await model.generateContent([prompt, imagePart]);
  const response = result.response.text();
  
  // Parse JSON response
  const cleanResponse = response.replace(/```json|```/g, '').trim();
  const aiAnswers = JSON.parse(cleanResponse);
  
  // Convert to Map
  const answersMap = new Map<number, string>();
  Object.entries(aiAnswers).forEach(([qNum, answer]) => {
    if (answer !== 'EMPTY' && answer !== 'MULTIPLE') {
      answersMap.set(parseInt(qNum), answer as string);
    }
  });
  
  return answersMap;
}
```

### Combined Processing Strategy
```typescript
async function processOMRSheet(submissionId: string) {
  try {
    // 1. Fetch submission
    const { data: submission } = await supabase
      .from('submissions')
      .select('*, exams(*)')
      .eq('id', submissionId)
      .single();
    
    // 2. Download image
    const { data: imageBlob } = await supabase.storage
      .from('omr-submissions')
      .download(submission.image_url);
    
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
    
    // 3. Pre-process
    const processed = await preprocessImage(imageBuffer);
    
    // 4. Scan codes
    const codes = await scanCodes(processed);
    const validation = await validateCodes(
      codes.qrData,
      codes.barcodeData,
      submission.exam_id
    );
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // 5. Try library-based detection first
    const regions = locateBubbleRegions(submission.exams.total_questions);
    const detectionResult = await detectFilledBubbles(processed, regions);
    
    let finalAnswers: Map<number, string>;
    let processingMethod: 'library' | 'gemini-ai';
    
    // 6. Use Gemini AI if needed
    if (shouldUseGeminiAI(detectionResult)) {
      console.log('Low confidence, using Gemini AI fallback...');
      finalAnswers = await processWithGeminiAI(
        processed,
        submission.exams.total_questions
      );
      processingMethod = 'gemini-ai';
    } else {
      finalAnswers = detectionResult.answers;
      processingMethod = 'library';
    }
    
    // 7. Calculate result
    const result = await calculateResult(
      submission.exam_id,
      finalAnswers
    );
    
    // 8. Save to database
    await supabase.from('results').insert({
      submission_id: submissionId,
      exam_id: submission.exam_id,
      student_id: validation.studentId,
      obtained_marks: result.obtainedMarks,
      total_marks: result.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
      status: result.status,
      processing_method: processingMethod,
      confidence_score: detectionResult.confidence,
      processed_at: new Date()
    });
    
    // 9. Update submission status
    await supabase
      .from('submissions')
      .update({ status: 'processed' })
      .eq('id', submissionId);
    
    return { success: true, result };
    
  } catch (error) {
    console.error('OMR Processing failed:', error);
    
    // Mark as failed
    await supabase
      .from('submissions')
      .update({ 
        status: 'failed',
        error_message: error.message
      })
      .eq('id', submissionId);
    
    throw error;
  }
}
```

## 📊 Step 6: Result Calculation

### Calculate Marks
```typescript
async function calculateResult(
  examId: string,
  studentAnswers: Map<number, string>
) {
  // Fetch correct answers
  const { data: questions } = await supabase
    .from('questions')
    .select('question_number, correct_answer, marks')
    .eq('exam_id', examId)
    .order('question_number');
  
  let obtainedMarks = 0;
  let totalMarks = 0;
  const questionResults: any[] = [];
  
  questions.forEach((q) => {
    totalMarks += q.marks;
    const studentAnswer = studentAnswers.get(q.question_number);
    const isCorrect = studentAnswer === q.correct_answer;
    
    if (isCorrect) {
      obtainedMarks += q.marks;
    }
    
    questionResults.push({
      questionNumber: q.question_number,
      studentAnswer,
      correctAnswer: q.correct_answer,
      isCorrect,
      marksObtained: isCorrect ? q.marks : 0
    });
  });
  
  const percentage = (obtainedMarks / totalMarks) * 100;
  const grade = calculateGrade(percentage);
  
  // Fetch exam passing marks
  const { data: exam } = await supabase
    .from('exams')
    .select('passing_marks')
    .eq('id', examId)
    .single();
  
  const status = obtainedMarks >= exam.passing_marks ? 'pass' : 'fail';
  
  return {
    obtainedMarks,
    totalMarks,
    percentage: Math.round(percentage * 100) / 100,
    grade,
    status,
    questionResults
  };
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}
```

## 🗄️ Database Schema

```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id),
  student_id UUID REFERENCES users(id),
  image_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  error_message TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id),
  exam_id UUID REFERENCES exams(id),
  student_id UUID REFERENCES users(id),
  obtained_marks INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  grade TEXT NOT NULL,
  status TEXT CHECK (status IN ('pass', 'fail')),
  processing_method TEXT CHECK (processing_method IN ('library', 'gemini-ai')),
  confidence_score DECIMAL(3,2),
  question_results JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_exam ON results(exam_id);
```

## ⚡ Performance Optimizations

### Queue System (Optional - Using Bull/BullMQ)
```typescript
import Queue from 'bull';

const omrProcessingQueue = new Queue('omr-processing', {
  redis: process.env.REDIS_URL
});

// Add job to queue
omrProcessingQueue.add({ submissionId }, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});

// Process jobs
omrProcessingQueue.process(async (job) => {
  return await processOMRSheet(job.data.submissionId);
});
```

### Parallel Processing
- Process multiple submissions in parallel
- Use worker threads for CPU-intensive tasks
- Implement rate limiting for Gemini API

## 🧪 Testing Checklist
- [ ] Image upload works
- [ ] Pre-processing improves image quality
- [ ] Barcode/QR scanning works
- [ ] Bubble detection accuracy >90%
- [ ] Gemini AI fallback triggers correctly
- [ ] Results calculated accurately
- [ ] Failed submissions logged
- [ ] Can handle poor quality images
- [ ] Processing time <10 seconds
- [ ] Handles concurrent uploads

## 📚 API Endpoints

```typescript
POST /api/omr/upload          // Upload OMR image
GET  /api/omr/submissions/[id] // Check processing status
POST /api/omr/reprocess/[id]  // Manually trigger reprocessing
GET  /api/omr/results/[examId] // Get all results for exam
```

---
**OMR Processing: Where AI Meets Education! 🤖📝**
**Insha'Allah, 99% Accuracy! 🎯**