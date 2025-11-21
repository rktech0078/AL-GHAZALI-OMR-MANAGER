-- Alter questions table to make correct_answer nullable
ALTER TABLE public.questions ALTER COLUMN correct_answer DROP NOT NULL;
