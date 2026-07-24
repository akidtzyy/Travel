-- SQL Migration: Add end_date column to public.bookings
-- Run this in your Supabase SQL Editor

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL;
