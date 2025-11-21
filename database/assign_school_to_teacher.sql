-- This script helps you assign a school to a teacher account
-- Replace the email and school_name with actual values

-- Step 1: Find your school ID
SELECT id, school_name FROM public.schools;

-- Step 2: Find your teacher user ID
SELECT id, email, full_name, role, school_id FROM public.users WHERE role = 'teacher';

-- Step 3: Update teacher's school_id (replace the values below)
-- UPDATE public.users 
-- SET school_id = 'YOUR_SCHOOL_ID_HERE'
-- WHERE email = 'YOUR_TEACHER_EMAIL_HERE';

-- Example:
-- UPDATE public.users 
-- SET school_id = '123e4567-e89b-12d3-a456-426614174000'
-- WHERE email = 'teacher@example.com';
