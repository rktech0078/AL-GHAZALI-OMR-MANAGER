-- =====================================================
-- Al-Ghazali OMR Manager - Complete Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student')) DEFAULT 'student',
  school_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. SCHOOLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_name TEXT NOT NULL,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. EXAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_name TEXT NOT NULL,
  school_id UUID REFERENCES public.schools(id),
  created_by UUID REFERENCES public.users(id),
  total_questions INTEGER NOT NULL,
  passing_marks INTEGER NOT NULL,
  options_count INTEGER DEFAULT 4,
  exam_date DATE,
  subject TEXT,
  class_name TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'ongoing', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT,
  correct_answer TEXT NOT NULL,
  marks INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, question_number)
);

-- =====================================================
-- 5. OMR_SHEETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.omr_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  serial_number TEXT UNIQUE NOT NULL,
  student_id UUID REFERENCES public.users(id),
  qr_code_data JSONB,
  barcode_data TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id),
  image_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'processed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  result_id UUID,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- =====================================================
-- 7. RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES public.submissions(id),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id),
  obtained_marks INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  grade TEXT NOT NULL,
  status TEXT CHECK (status IN ('pass', 'fail')) NOT NULL,
  processing_method TEXT CHECK (processing_method IN ('library', 'gemini-ai', 'hybrid')),
  confidence_score DECIMAL(3,2),
  question_results JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON public.exams(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam_id ON public.submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_results_exam_id ON public.results(exam_id);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON public.results(student_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omr_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- EXAMS TABLE POLICIES
-- =====================================================
CREATE POLICY "Anyone can view exams"
  ON public.exams FOR SELECT
  USING (true);

CREATE POLICY "Teachers can create exams"
  ON public.exams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can update own exams"
  ON public.exams FOR UPDATE
  USING (created_by = auth.uid());

-- =====================================================
-- QUESTIONS TABLE POLICIES
-- =====================================================
CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT
  USING (true);

CREATE POLICY "Teachers can create questions"
  ON public.questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE id = exam_id AND created_by = auth.uid()
    )
  );

-- =====================================================
-- SUBMISSIONS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own submissions"
  ON public.submissions FOR SELECT
  USING (student_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Users can create submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "System can update submissions"
  ON public.submissions FOR UPDATE
  USING (true);

-- =====================================================
-- RESULTS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own results"
  ON public.results FOR SELECT
  USING (student_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "System can create results"
  ON public.results FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKET for OMR Images
-- =====================================================
-- Run this in Supabase Dashboard > Storage

-- Create bucket (do this in Supabase Dashboard UI):
-- Bucket name: omr-submissions
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png

-- Storage policies (run in SQL Editor):
CREATE POLICY "Users can upload OMR images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'omr-submissions' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view own OMR images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'omr-submissions' AND
    auth.role() = 'authenticated'
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert a sample school
INSERT INTO public.schools (school_name, address, contact_email)
VALUES ('Al-Ghazali High School', 'Lahore, Pakistan', 'info@alghazali.edu.pk')
ON CONFLICT DO NOTHING;

-- Note: Users will be created via Supabase Auth
-- After signup, you need to update their role in users table

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- =====================================================
-- DONE! 
-- =====================================================
-- All tables, indexes, RLS policies, and triggers created
-- Next: Create storage bucket in Supabase Dashboard
