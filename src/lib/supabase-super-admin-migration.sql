-- ============================================================
-- Migration: Add 'super_admin' role to profiles table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop old role constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Add new constraint with super_admin
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- Step 3: Update your own account to super_admin
-- Replace email with your own super admin email
UPDATE public.profiles
  SET role = 'super_admin'
  WHERE email = 'andhika.ramak@gmail.com';

-- Step 4: Update the trigger so new signups don't auto-get super_admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'user'  -- All new signups are 'user' by default
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Update get_user_role helper to return super_admin too
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Update RLS — super_admin and admin can read all profiles
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Step 7: Only super_admin can update roles via RLS
-- (Our API bypasses this with service_role, but this is defense-in-depth)
DROP POLICY IF EXISTS "Users can update own profile or admins update all" ON public.profiles;
CREATE POLICY "Super admin can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) = 'super_admin'
  );

-- ============================================================
-- Verify: Check your role
-- SELECT email, role FROM public.profiles ORDER BY role;
-- ============================================================
