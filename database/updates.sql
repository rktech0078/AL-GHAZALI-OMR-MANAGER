-- Add subject and class columns to exams table
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS class_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published', 'ongoing', 'completed')) DEFAULT 'draft';

-- Add question_text and options to questions table (if not already present)
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS question_text TEXT,
ADD COLUMN IF NOT EXISTS option_a TEXT,
ADD COLUMN IF NOT EXISTS option_b TEXT,
ADD COLUMN IF NOT EXISTS option_c TEXT,
ADD COLUMN IF NOT EXISTS option_d TEXT;
