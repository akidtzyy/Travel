-- ============================================================
-- SQL: Allow admin to read all profiles for User Management page
-- Run this in Supabase SQL Editor
-- ============================================================

-- Allow admin to read ALL profiles (needed for UserManagement page)
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

-- Allow service_role (our API) to update role column freely
-- (service_role bypasses RLS by default, so no extra policy needed)

-- Verify profiles table has correct columns
-- SELECT id, full_name, email, role FROM public.profiles LIMIT 10;
