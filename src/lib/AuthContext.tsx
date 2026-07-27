import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { apiFetch } from './apiFetch';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  birth_date?: string;
  nationality_type?: 'WNI' | 'WNA';
  identity_type?: 'NIK' | 'PASSPORT';
  identity_number?: string;
  country_origin?: string;
  ktp_passport_url?: string;
  sim_idp_url?: string;
  identity_verification_status?: 'UNVERIFIED' | 'VERIFIED' | 'EXPIRED';
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  profile: null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
  isAdmin: false,
  isSuperAdmin: false,
  isLoggedIn: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const token = localStorage.getItem('laravel_token');
    if (!token) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }

    try {
      const res = await apiFetch('/auth/me');
      if (res && res.data) {
        const laravelUser = {
          id: String(res.data.id),
          email: res.data.email,
          user_metadata: { full_name: res.data.name },
          app_metadata: {},
          aud: 'authenticated',
          created_at: res.data.created_at || new Date().toISOString(),
        } as any as User;

        setUser(laravelUser);
        setSession({
          access_token: token,
          token_type: 'bearer',
          user: laravelUser,
        } as any as Session);

        // Map backend customer relation if eager loaded, or fallback to user fields
        const customer = res.data.customer || {};
        setProfile({
          id: String(res.data.id),
          full_name: res.data.name,
          email: res.data.email,
          role: (res.data.role || 'user') as UserRole,
          phone: customer.phone || '',
          address: customer.address || '',
          nationality_type: customer.nationality_type,
          identity_type: customer.identity_type,
          identity_number: customer.identity_number,
          country_origin: customer.country_origin,
          // Use the accessor-resolved full Cloudinary URLs (not raw path fields)
          ktp_passport_url: customer.ktp_passport_url || undefined,
          sim_idp_url: customer.sim_idp_url || undefined,
          identity_verification_status: customer.identity_verification_status || 'UNVERIFIED',
        });
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
      // Clear token if invalid/expired
      localStorage.removeItem('laravel_token');
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('laravel_token');
      if (token) {
        await refreshProfile();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res && res.token) {
        localStorage.setItem('laravel_token', res.token);
        
        const laravelUser = {
          id: String(res.user.id),
          email: res.user.email,
          user_metadata: { full_name: res.user.name },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any as User;

        setUser(laravelUser);
        setSession({
          access_token: res.token,
          token_type: 'bearer',
          user: laravelUser,
        } as any as Session);

        setProfile({
          id: String(res.user.id),
          full_name: res.user.name,
          email: res.user.email,
          role: (res.user.role || 'user') as UserRole,
        });

        // Trigger loading complete profile details
        await refreshProfile();
        return { error: null };
      }
      return { error: new Error('Gagal login: Token tidak ditemukan.') };
    } catch (err: any) {
      console.error('Sign in failed:', err);
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          password_confirmation: password
        })
      });

      if (res && res.token) {
        localStorage.setItem('laravel_token', res.token);
        
        const laravelUser = {
          id: String(res.user.id),
          email: res.user.email,
          user_metadata: { full_name: res.user.name },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any as User;

        setUser(laravelUser);
        setSession({
          access_token: res.token,
          token_type: 'bearer',
          user: laravelUser,
        } as any as Session);

        setProfile({
          id: String(res.user.id),
          full_name: res.user.name,
          email: res.user.email,
          role: (res.user.role || 'user') as UserRole,
        });

        await refreshProfile();
        return { error: null };
      }
      return { error: new Error('Gagal registrasi: Token tidak ditemukan.') };
    } catch (err: any) {
      console.error('Sign up failed:', err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request failed (token may have already expired):', err);
    } finally {
      localStorage.removeItem('laravel_token');
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const role = profile?.role ?? null;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      role,
      profile,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      isAdmin,
      isSuperAdmin,
      isLoggedIn
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
