-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Teachers can view school users" ON public.users;

-- Create a corrected policy that allows teachers to view users from their school
-- This uses a subquery to avoid circular reference
CREATE POLICY "Teachers can view school users"
  ON public.users FOR SELECT
  USING (
    -- User can view their own profile
    auth.uid() = id
    OR
    -- OR user is a teacher/admin viewing users from their school
    school_id IN (
      SELECT school_id FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );
