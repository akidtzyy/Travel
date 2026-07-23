-- ============================================
-- SQL Migration: Add phone, address, and birth_date columns to profiles table
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add new fields if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE DEFAULT NULL;

-- 2. Update existing policies if necessary to make sure users can edit their profile info.
-- The current select/update policies are already configured to allow auth.uid() = id,
-- which handles updating these fields.

-- 3. Verify columns are added successfully
-- SELECT id, full_name, email, phone, address, birth_date FROM public.profiles LIMIT 5;
