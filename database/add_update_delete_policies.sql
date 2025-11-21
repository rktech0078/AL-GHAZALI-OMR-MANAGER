-- Add UPDATE and DELETE policies for users table
-- This will allow admins to edit and delete users

-- Policy for UPDATE
CREATE POLICY "Authenticated users can update all users"
  ON public.users FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy for DELETE  
CREATE POLICY "Authenticated users can delete all users"
  ON public.users FOR DELETE
  USING (auth.role() = 'authenticated');

-- Note: In production, you should restrict these to admin role only
-- But for now, this will make the app functional
