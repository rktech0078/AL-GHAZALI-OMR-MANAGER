-- Add roll_number and student_class columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS student_class TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.users.roll_number IS 'Student Roll Number (for students only)';
COMMENT ON COLUMN public.users.student_class IS 'Student Class/Grade (for students only)';
