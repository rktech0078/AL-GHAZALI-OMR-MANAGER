# TEACHER_GEMINI.md - Teacher Panel Specification

## 🎯 Purpose
Empower teachers to create exams, generate OMR sheets, and view student results.

## 🔐 Access Level
**MEDIUM** - Can manage own exams and students within assigned school

## 📍 Route Structure
```
/teacher
├── /dashboard
├── /exams
│   ├── /create
│   ├── /[id]/edit
│   ├── /[id]/questions
│   └── /[id]/results
├── /students
│   └── /my-students
├── /omr-sheets
│   ├── /generate
│   └── /download
└── /profile
```

## 🎨 Core Features

### 1. Dashboard
```typescript
// Components:
- MyExamsCard (upcoming, ongoing, completed)
- QuickStatsCard (total students, exams conducted)
- RecentResults
- UpcomingExamsList
- QuickActionsPanel
```

**Key Metrics**:
- Total exams created: X
- Students enrolled: Y
- Pending evaluations: Z
- Average class performance: XX%

### 2. Exam Creation Workflow

#### Step 1: Basic Information
```typescript
interface ExamBasicInfo {
  title: string;
  subject: string;
  class: string;
  totalMarks: number;
  passingMarks: number;
  duration: number; // minutes
  examDate: Date;
  instructions?: string;
}
```

**Form Fields**:
- Exam title (e.g., "Mathematics Final Term")
- Subject dropdown
- Class/Grade dropdown
- Total marks
- Passing marks
- Exam duration
- Date and time
- Special instructions

#### Step 2: Question Creation
```typescript
interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: 'MCQ';
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  marks: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}
```

**Question Builder UI**:
```typescript
// Features:
- Add question one by one
- Bulk import from Excel/CSV
- Question bank integration (Phase 2)
- Rich text editor for questions
- Image upload for questions
- Set correct answer
- Assign marks per question
```

**Validation Rules**:
- Minimum 10 questions
- Maximum 100 questions per OMR sheet
- All questions must have correct answer marked
- Total marks calculation auto-update

#### Step 3: Student Assignment
```typescript
// Features:
- Select students from class list
- Bulk select all students
- Search and filter students
- Manual serial number assignment (optional)
- Auto-generate roll numbers
```

#### Step 4: Preview & Confirm
- Show exam summary
- Question count validation
- Student count confirmation
- OMR sheet preview thumbnail
- Generate OMR sheets button

### 3. OMR Sheet Generation

#### Template Configuration
```typescript
interface OMRTemplate {
  schoolId: string;
  examId: string;
  serialNumber: string; // Dynamic per student
  studentInfo: {
    name: string;
    rollNumber: string;
    class: string;
  };
  schoolLogos: {
    leftLogoUrl: string;
    rightLogoUrl: string;
  };
  header: {
    schoolName: string;
    examTitle: string;
    subject: string;
    date: string;
    maxMarks: number;
  };
  questions: Question[];
  barcodeData: string;
  qrCodeData: string;
}
```

#### PDF Generation Logic
```typescript
// Using pdfkit library
import PDFDocument from 'pdfkit';

async function generateOMRSheet(template: OMRTemplate) {
  const doc = new PDFDocument({ size: 'A4' });
  
  // Header Section (2 inches)
  doc.image(template.schoolLogos.leftLogoUrl, 50, 30, { width: 80 });
  doc.image(template.schoolLogos.rightLogoUrl, 470, 30, { width: 80 });
  
  doc.fontSize(16).text(template.header.schoolName, 150, 40, { align: 'center' });
  doc.fontSize(12).text(template.header.examTitle, 150, 60, { align: 'center' });
  
  // Barcode & QR Code
  const JsBarcode = require('jsbarcode');
  const QRCode = require('qrcode');
  
  // Generate barcode for serial number
  // Generate QR code with exam + student data
  
  // Student Information Section
  doc.fontSize(10).text(`Name: ${template.studentInfo.name}`, 50, 120);
  doc.fontSize(10).text(`Roll No: ${template.studentInfo.rollNumber}`, 50, 140);
  doc.fontSize(10).text(`Serial: ${template.serialNumber}`, 400, 120);
  
  // Answer Bubbles Section
  const bubbleRadius = 8;
  const bubbleSpacing = 30;
  const options = ['A', 'B', 'C', 'D'];
  
  let yPosition = 180;
  
  template.questions.forEach((q, index) => {
    doc.fontSize(9).text(`${q.questionNumber}.`, 50, yPosition);
    
    options.forEach((option, i) => {
      const xPosition = 100 + (i * bubbleSpacing);
      doc.circle(xPosition, yPosition + 5, bubbleRadius).stroke();
      doc.fontSize(8).text(option, xPosition - 3, yPosition + 1);
    });
    
    yPosition += 25;
    
    // Page break if needed
    if (yPosition > 750) {
      doc.addPage();
      yPosition = 50;
    }
  });
  
  // Footer with alignment marks
  // (for image processing)
  
  return doc;
}
```

#### Barcode & QR Code Data Format
```typescript
// Barcode: Serial Number (1D)
const barcodeData = `OMR-${schoolCode}-${examId}-${serialNumber}`;

// QR Code: Comprehensive Data (2D)
const qrCodeData = JSON.stringify({
  schoolId: '...',
  examId: '...',
  studentId: '...',
  serialNumber: '...',
  timestamp: Date.now()
});
```

#### Download Options
- Single student PDF
- Bulk download (ZIP file with all students)
- Class-wise download
- Print-ready format (margins adjusted)

### 4. Result Management

#### View Results
```typescript
interface ExamResult {
  studentId: string;
  studentName: string;
  rollNumber: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  status: 'pass' | 'fail';
  submittedAt: Date;
  processingStatus: 'pending' | 'processed' | 'failed';
}
```

**Result Dashboard Features**:
- Class average display
- Pass/Fail statistics
- Highest/Lowest scores
- Grade distribution chart
- Export results (Excel/PDF)
- Individual student report cards

#### Result Analytics
```typescript
// Visualizations:
- Bar chart (score distribution)
- Pie chart (pass/fail ratio)
- Line chart (question-wise difficulty)
- Table (student rankings)
```

#### Manual Override (if needed)
```typescript
// For failed OMR processing:
- View original submission image
- Manually enter marks
- Add remarks
- Re-process with Gemini AI
```

### 5. Student Management

#### My Students Section
```typescript
// Features:
- View all assigned students
- Search by name/roll number
- Filter by class
- View student performance history
- Send notifications (Phase 2)
```

**Student Profile View**:
- Personal information
- Enrolled exams
- Performance graph
- Attendance (Phase 2)

### 6. Question Bank (Phase 2)
```typescript
// Features:
- Save questions for reuse
- Organize by subject/topic
- Tag questions (difficulty, topic)
- Import from previous exams
- Share with other teachers (admin approval)
```

## 🗄️ Database Schema

```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES users(id),
  school_id UUID REFERENCES schools(id),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  class TEXT NOT NULL,
  total_marks INTEGER NOT NULL,
  passing_marks INTEGER NOT NULL,
  duration INTEGER, -- minutes
  exam_date TIMESTAMPTZ,
  instructions TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'ongoing', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  marks INTEGER DEFAULT 1,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE omr_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id),
  student_id UUID REFERENCES users(id),
  serial_number TEXT UNIQUE NOT NULL,
  pdf_url TEXT,
  barcode_data TEXT,
  qr_code_data TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id),
  student_id UUID REFERENCES users(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);
```

## 🔒 Security & Permissions

### Teacher Access Rules (RLS)
```sql
-- Teachers can only access their own exams
CREATE POLICY teacher_exams_policy ON exams
  FOR ALL
  USING (teacher_id = auth.uid());

-- Teachers can only see students from their school
CREATE POLICY teacher_students_policy ON users
  FOR SELECT
  USING (
    school_id = (SELECT school_id FROM users WHERE id = auth.uid())
    AND role = 'student'
  );
```

### Validation Rules
- Cannot delete exam if results exist
- Cannot modify questions after exam is published
- Cannot assign students from other schools

## 🎨 UI Components

### Exam Card Component
```typescript
interface ExamCardProps {
  exam: Exam;
  onEdit: () => void;
  onView: () => void;
  onGenerateOMR: () => void;
}

// Shows: Title, Subject, Date, Student count, Status badge
```

### Question Builder Component
```typescript
// Features:
- Drag-and-drop reordering
- Duplicate question
- Delete question
- Edit inline
- Validation feedback
```

### Student Selector Component
```typescript
// Features:
- Multi-select checkbox
- Search bar
- Filter by class
- Selected count indicator
- Bulk actions
```

## 📱 Responsive Design
- Desktop: Full table views, side-by-side forms
- Tablet: Stacked cards, collapsible sidebars
- Mobile: Bottom sheets, swipe actions

## ⚡ Performance Optimizations
- Paginate question list (20 per page)
- Lazy load OMR PDFs
- Cache student lists
- Debounced search
- Optimistic UI for question creation

## 🧪 Testing Checklist
- [ ] Can create exam with all fields
- [ ] Can add/edit/delete questions
- [ ] Can assign students correctly
- [ ] OMR PDF generates with all elements
- [ ] Can download individual/bulk OMRs
- [ ] Results display correctly
- [ ] Export functions work
- [ ] Cannot access other teacher's data
- [ ] Cannot modify published exams
- [ ] Validation works on all forms

## 📚 API Endpoints

```typescript
// Teacher-specific endpoints
POST   /api/teacher/exams
GET    /api/teacher/exams
PUT    /api/teacher/exams/[id]
DELETE /api/teacher/exams/[id]

POST   /api/teacher/exams/[id]/questions
PUT    /api/teacher/exams/[id]/questions/[qid]
DELETE /api/teacher/exams/[id]/questions/[qid]

POST   /api/teacher/exams/[id]/enroll-students
GET    /api/teacher/exams/[id]/students

POST   /api/teacher/omr/generate
GET    /api/teacher/omr/download/[id]

GET    /api/teacher/results/[examId]
GET    /api/teacher/students
```

## 🚀 Implementation Priority
1. ✅ Dashboard & navigation
2. ✅ Exam creation form
3. ✅ Question builder
4. ✅ Student assignment
5. ✅ OMR PDF generation
6. ✅ Result viewing
7. ✅ Analytics & charts

---
**Teachers: The True Heroes of Education! 📚✨**