-- EMERGENCY FIX: Drop all custom policies that are causing infinite recursion
-- This will restore basic functionality

-- Drop all policies on users table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Teachers can view school users" ON public.users;

-- Recreate simple, safe policies
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile  
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- TEMPORARY: Allow all authenticated users to read all users
-- This is not ideal for production but will fix the immediate issue
-- We'll implement proper service role queries later
CREATE POLICY "Authenticated users can view all users"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Note: For production, you should use service role (bypasses RLS) 
-- in your API routes for admin/teacher operations instead of relying on RLS policies
