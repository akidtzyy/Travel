# Supabase Profiles RLS Recursion Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the infinite RLS recursion bug on the `public.profiles` table to enable correct admin role resolution for `andhika.ramak@gmail.com` and show the admin panel menu in the frontend.

**Architecture:** Use a dynamic role check via a `SECURITY DEFINER` function in PostgreSQL to query the `profiles` table without triggering RLS checks recursively.

**Tech Stack:** Supabase SQL

## Global Constraints

- Database updates must be compatible with Supabase RLS policies.
- Ensure correct role resolution in all environments.

---

### Task 1: Update SQL Migration File for Profiles Table

**Files:**
- Modify: `src/lib/supabase-user-profiles.sql`

**Interfaces:**
- Consumes: Database schema for `public.profiles`.
- Produces: Corrected SQL migration file with recursion-free policies.

- [ ] **Step 1: Write helper function and updated RLS policies**

  Update `src/lib/supabase-user-profiles.sql` by replacing the RLS Policies section (lines 19 to 49) with the recursion-free policies using the `get_user_role` SECURITY DEFINER helper function.

  Here is the code block to write:

  ```sql
  -- Helper function to get user role without recursion
  CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
  RETURNS TEXT AS $$
  BEGIN
    RETURN (
      SELECT role FROM public.profiles
      WHERE id = user_id
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- RLS Policies
  -- 1. Allow users to view their own profile, and admins to view all profiles
  DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
  CREATE POLICY "Users can view own profile or admins view all" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() = id 
      OR 
      public.get_user_role(auth.uid()) = 'admin'
    );

  -- 2. Allow users to update their own full_name, and admins to update anything
  DROP POLICY IF EXISTS "Users can update own profile or admins update all" ON public.profiles;
  CREATE POLICY "Users can update own profile or admins update all" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = id
      OR
      public.get_user_role(auth.uid()) = 'admin'
    )
    WITH CHECK (
      (
        auth.uid() = id 
        AND 
        role = public.get_user_role(auth.uid())
      )
      OR
      public.get_user_role(auth.uid()) = 'admin'
    );
  ```

- [ ] **Step 2: Commit the changes to git**

  Run:
  ```bash
  git add src/lib/supabase-user-profiles.sql
  git commit -m "fix: resolve infinite recursion in profiles RLS policies using SECURITY DEFINER helper"
  ```
