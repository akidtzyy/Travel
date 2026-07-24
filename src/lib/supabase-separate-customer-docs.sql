-- SQL Migration: Separate Customer Documents (KTP/Passport and SIM/IDP)
-- Run this in your Supabase SQL Editor

-- 1. Add new columns for separate documents in public.customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS ktp_passport_url TEXT DEFAULT NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS sim_idp_url TEXT DEFAULT NULL;

-- 2. Migrate existing data from ktp_sim_passport_url to ktp_passport_url as a starting point
UPDATE public.customers 
SET ktp_passport_url = ktp_sim_passport_url 
WHERE ktp_passport_url IS NULL AND ktp_sim_passport_url IS NOT NULL;

-- 3. Add new columns for profiles table too
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ktp_passport_url TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sim_idp_url TEXT DEFAULT NULL;

UPDATE public.profiles 
SET ktp_passport_url = ktp_sim_passport_url 
WHERE ktp_passport_url IS NULL AND ktp_sim_passport_url IS NOT NULL;
