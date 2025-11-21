# Al-Ghazali OMR Manager - Main Project Specification

## 🎯 Project Overview
Al-Ghazali OMR Manager is an AI-powered web application for managing student exams through mobile-captured OMR sheets. This system eliminates the need for physical scanners by leveraging mobile cameras and AI technology.

## 🏗️ Tech Stack
- **Frontend Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **OMR Processing Libraries**:
  - `opencv4nodejs` - Image processing and edge detection
  - `tesseract.js` - OCR for text/number recognition
  - `jsqr` / `@zxing/library` - QR code and barcode scanning
  - `pdfkit` - OMR sheet PDF generation
  - `sharp` - Image optimization and preprocessing
- **AI Fallback**: Gemini AI API (when libraries fail to detect)
- **State Management**: Zustand or React Context
- **Form Handling**: React Hook Form + Zod validation

## 📁 Project Structure
```
al-ghazali-omr/
├── GEMINI.md (this file)
├── ADMIN_GEMINI.md
├── TEACHER_GEMINI.md
├── STUDENT_GEMINI.md
├── OMR_PROCESSING_GEMINI.md
├── app/
│   ├── (admin)/
│   ├── (teacher)/
│   ├── (student)/
│   ├── api/
│   └── layout.tsx
├── components/
├── lib/
│   ├── supabase/
│   ├── omr-processor/
│   └── gemini-ai/
└── public/
```

## 🎭 User Roles & Access
1. **Admin**: Full system access and management
2. **Teacher**: Question creation, OMR setup, result viewing
3. **Student**: Result viewing only

## 🔑 Core Features

### 1. Authentication (Supabase)
- Email/Password login
- Role-based access control (RBAC)
- Protected routes per user role

### 2. OMR Sheet Generation
- **A4 Size PDF Download**
- Dynamic serial number generation
- School logos (top-left and top-right)
- Professional barcodes and QR codes
- Customizable question bubbles based on teacher input
- Answer key section

### 3. OMR Processing Pipeline
```typescript
Mobile Camera → Image Upload → Pre-processing → 
Library Detection → (If Failed) → Gemini AI Fallback → 
Result Extraction → Database Storage
```

### 4. Mobile-First Image Capture
- Camera integration (web API)
- Image quality validation
- Auto-rotation and perspective correction
- Upload progress indicator

## 🧠 AI Integration Strategy
**IMPORTANT**: Gemini AI is used as a FALLBACK ONLY when:
- Library-based detection fails
- Image quality is poor
- Bubble detection confidence is low
- Manual review is flagged

**Never use AI as primary method** - Libraries first, AI second!

## 🗄️ Database Schema (Supabase)

### Tables Overview:
1. `users` - Authentication and profiles
2. `schools` - School information and logos
3. `exams` - Exam metadata
4. `questions` - Question bank
5. `omr_sheets` - Generated OMR templates
6. `submissions` - Student submissions
7. `results` - Processed results

### Row Level Security (RLS):
- Enable RLS on all tables
- Admin: Full access
- Teacher: Access to own school/exams
- Student: Read-only access to own results

## 📱 Responsive Design Requirements
- Mobile-first approach (primary use case)
- Tablet optimization for teachers
- Desktop support for admin panel
- PWA capabilities for offline support (optional Phase 2)

## 🔐 Security Considerations
- Secure file upload with size limits (max 10MB)
- Image validation (file type, dimensions)
- API rate limiting
- Encrypted sensitive data
- Audit logs for admin actions

## 🚀 Development Phases

### Phase 1: Foundation
- Setup Next.js + Supabase
- Authentication system
- Basic RBAC
- Database schema

### Phase 2: OMR Generation
- PDF template creation
- Dynamic question setup
- Barcode/QR generation

### Phase 3: Image Processing
- Upload system
- Library-based detection
- Gemini AI fallback

### Phase 4: Panels
- Admin panel
- Teacher panel
- Student portal

### Phase 5: Polish
- Testing
- Performance optimization
- Documentation

## 📋 File-Specific Specifications
For detailed implementation of each feature, refer to:
- `ADMIN_GEMINI.md` - Admin panel features
- `TEACHER_GEMINI.md` - Teacher panel features
- `STUDENT_GEMINI.md` - Student portal features
- `OMR_PROCESSING_GEMINI.md` - OMR detection logic

## 🎨 Design Principles
- Clean, professional UI
<!--- Urdu language support (optional)-->
- High contrast for readability
- Accessible (WCAG 2.1 AA)
- Fast loading times (<3s)

## 📊 Success Metrics
- 95%+ OMR detection accuracy
- <5 second processing time per sheet
- Support 500+ concurrent users
- 99.9% uptime

## 🔄 Git Workflow
```bash
main (production)
├── develop (staging)
    ├── feature/admin-panel
    ├── feature/omr-processing
    └── feature/teacher-panel
```

## 📞 Support & Maintenance
- Error logging (Sentry recommended)
- Performance monitoring
- Regular backups
- Version control

---
**Built with ❤️ for Education Revolution**
**Bismillah! Let's transform education in Pakistan! 🇵🇰** 