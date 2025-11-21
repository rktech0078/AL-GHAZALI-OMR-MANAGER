-- =====================================================
-- QUICK FIX: RLS Policy Issue for Exam Creation
-- =====================================================

-- Step 1: Check if user exists in public.users table
-- Replace 'your-email@example.com' with your actual email
SELECT id, email, role FROM public.users WHERE email = 'your-email@example.com';

-- If user NOT found, create entry:
-- First get user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then insert into public.users (replace USER_ID with actual ID from above)
INSERT INTO public.users (id, email, role, full_name)
VALUES (
  'USER_ID_FROM_AUTH_USERS',  -- Replace this
  'your-email@example.com',    -- Replace this
  'teacher',                    -- Set role as teacher
  'Your Name'                   -- Replace this
)
ON CONFLICT (id) DO UPDATE 
SET role = 'teacher';

-- Step 2: Verify user role is set to teacher
SELECT id, email, role FROM public.users WHERE email = 'your-email@example.com';

-- =====================================================
-- ALTERNATIVE: Temporarily Disable RLS for Testing
-- =====================================================
-- WARNING: Only use this for testing, not production!

-- Disable RLS on exams table
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable it:
-- ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ALTERNATIVE: Update RLS Policy to be More Permissive
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Teachers can create exams" ON public.exams;

-- Create more permissive policy (allows any authenticated user)
CREATE POLICY "Authenticated users can create exams"
  ON public.exams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check current user
SELECT 
  auth.uid() as current_user_id,
  u.email,
  u.role
FROM public.users u
WHERE u.id = auth.uid();

-- Check RLS policies on exams table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'exams';
