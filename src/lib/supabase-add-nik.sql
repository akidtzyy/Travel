-- ============================================
-- SQL Migration: Add NIK (Nomor Induk Kependudukan) column to bookings and customers tables
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add NIK to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS nik TEXT DEFAULT '';

-- 2. Add NIK to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS nik TEXT DEFAULT '';

-- 3. Verify columns
-- SELECT id, name, nik FROM public.bookings LIMIT 5;
-- SELECT id, full_name, nik FROM public.customers LIMIT 5;
