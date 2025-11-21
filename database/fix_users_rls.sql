-- Allow admins to view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow teachers to view users from their own school
CREATE POLICY "Teachers can view school users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'teacher'
      AND school_id = public.users.school_id
    )
  );
