-- Migration: Add contact_email and website_url to profiles table
-- Run this in your Supabase SQL Editor at: https://supabase.com/dashboard/project/_/sql

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS contact_email TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN profiles.contact_email IS 'Custom contact/proposal email shown in AI-generated scripts and proposals';
COMMENT ON COLUMN profiles.website_url IS 'Personal website or portfolio URL shown in PDF proposals';
