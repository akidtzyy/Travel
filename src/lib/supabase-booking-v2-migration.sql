-- ============================================
-- SQL Migration: Booking System V2 Upgrade
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Update customers table fields
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS nationality_type TEXT DEFAULT 'WNI' CHECK (nationality_type IN ('WNI', 'WNA'));
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS identity_type TEXT DEFAULT 'NIK' CHECK (identity_type IN ('NIK', 'PASSPORT'));
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS identity_number TEXT DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS country_origin TEXT DEFAULT NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS ktp_sim_passport_url TEXT DEFAULT NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS identity_verification_status TEXT DEFAULT 'UNVERIFIED' CHECK (identity_verification_status IN ('UNVERIFIED', 'VERIFIED', 'EXPIRED'));
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_bookings INT DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_spent NUMERIC DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_booking_date TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1.5 Update profiles table fields for registered users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality_type TEXT DEFAULT 'WNI' CHECK (nationality_type IN ('WNI', 'WNA'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_type TEXT DEFAULT 'NIK' CHECK (identity_type IN ('NIK', 'PASSPORT'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_number TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_origin TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ktp_sim_passport_url TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_verification_status TEXT DEFAULT 'UNVERIFIED' CHECK (identity_verification_status IN ('UNVERIFIED', 'VERIFIED', 'EXPIRED'));

-- 2. Update bookings table fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_uuid UUID UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_link TEXT DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_details_snapshot JSONB DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_notes TEXT DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS original_booking_date DATE DEFAULT NULL;

-- 3. Update bookings status constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'expired'));

-- 4. Update bookings payment_status constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'expired', 'refunded'));

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_uuid ON public.bookings(booking_uuid);
