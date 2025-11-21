-- EMERGENCY FIX v2: Drop ALL policies first, then recreate
-- Run this complete script in one go

-- Step 1: Drop ALL existing policies on users table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
END $$;

-- Step 2: Recreate only the essential policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Step 3: Temporary fix - Allow all authenticated users to read all users
-- This bypasses the recursion issue
CREATE POLICY "Authenticated users can view all users"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');
