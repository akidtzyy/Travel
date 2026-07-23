import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import supabase from './supabase';
import type { User, Session } from '@supabase/supabase-js';

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
  ktp_sim_passport_url?: string;
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

const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.warn('Could not fetch user profile:', error.message);
      return null;
    }
    return data as UserProfile;
  } catch (err) {
    console.error('Unexpected error fetching user profile:', err);
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchUserProfile(user.id);
      setProfile(userProfile);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const userProfile = await fetchUserProfile(currentUser.id);
        if (isMounted) {
          setProfile(userProfile);
        }
      } else {
        if (isMounted) setProfile(null);
      }
      if (isMounted) setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const userProfile = await fetchUserProfile(currentUser.id);
        if (isMounted) {
          setProfile(userProfile);
        }
      } else {
        if (isMounted) setProfile(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
