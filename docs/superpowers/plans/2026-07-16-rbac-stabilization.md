# Role-Based Access Control (RBAC) Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize dynamic database-driven Role-Based Access Control (RBAC) for the application by enhancing error handling and backfilling database user profiles.

**Architecture:** Use a dynamic role check via Supabase DB profiles. Implement robust error checking in AuthContext.

**Tech Stack:** React, TypeScript, Vite, Supabase JS, Supabase SQL

## Global Constraints

- Code must build successfully using `npm run build` without any compilation errors.
- Explicitly check Supabase client query errors and fallback gracefully.

---

### Task 1: Update SQL Migration to Backfill User Profiles

**Files:**
- Modify: `src/lib/supabase-user-profiles.sql`

**Interfaces:**
- Consumes: Existing user accounts in `auth.users`.
- Produces: Synced records in `public.profiles` with correct roles.

- [ ] **Step 1: Add existing users backfill code**
  
  Append the following SQL insert statement to the end of `src/lib/supabase-user-profiles.sql` to backfill users who signed up prior to trigger activation:
  ```sql
  -- Populate profiles for existing users
  INSERT INTO public.profiles (id, full_name, email, role)
  SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', ''), 
    email, 
    CASE 
      WHEN email = 'andhika.ramak@gmail.com' THEN 'admin'
      ELSE 'user'
    END
  FROM auth.users
  ON CONFLICT (id) DO NOTHING;
  ```

- [ ] **Step 2: Commit changes**
  
  Run:
  ```bash
  git add src/lib/supabase-user-profiles.sql
  git commit -m "migration: add existing users backfill to profiles table"
  ```

---

### Task 2: Stabilize AuthContext Role Loading and Error Checking

**Files:**
- Modify: `src/lib/AuthContext.tsx`

**Interfaces:**
- Consumes: Supabase `profiles` table.
- Produces: Robust `role` state ('user' | 'admin' | null) accessible via `useAuth` hook.

- [ ] **Step 1: Implement reusable fetchUserRole helper**

  Modify `src/lib/AuthContext.tsx` to include the `fetchUserRole` function:
  ```typescript
  const fetchUserRole = async (userId: string): Promise<'user' | 'admin'> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('Could not fetch user role, defaulting to user:', error.message);
        return 'user';
      }
      return (data?.role as 'user' | 'admin') ?? 'user';
    } catch (err) {
      console.error('Unexpected error fetching user role:', err);
      return 'user';
    }
  };
  ```

- [ ] **Step 2: Integrate helper in initAuth**

  Update the `initAuth` function inside the `useEffect` block in `src/lib/AuthContext.tsx` to use the helper:
  ```typescript
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const userRole = await fetchUserRole(currentUser.id);
        if (isMounted) {
          setRole(userRole);
        }
      } else {
        if (isMounted) setRole(null);
      }
      if (isMounted) setLoading(false);
    };
  ```

- [ ] **Step 3: Integrate helper in onAuthStateChange**

  Update the `onAuthStateChange` callback in `src/lib/AuthContext.tsx` to use the helper:
  ```typescript
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const userRole = await fetchUserRole(currentUser.id);
        if (isMounted) {
          setRole(userRole);
        }
      } else {
        if (isMounted) setRole(null);
      }
      if (isMounted) setLoading(false);
    });
  ```

- [ ] **Step 4: Verify build compiles cleanly**

  Run: `npm run build`
  Expected: Command finishes successfully with no TypeScript compilation errors.

- [ ] **Step 5: Commit changes**

  Run:
  ```bash
  git add src/lib/AuthContext.tsx
  git commit -m "feat: stabilize user profile role fetching and error handling in AuthContext"
  ```
