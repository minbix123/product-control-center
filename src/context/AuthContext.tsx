import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { fetchCurrentProfile, clearProfileCache } from '../lib/api';
import type { User } from '@supabase/supabase-js';
import type { Profile, Role, UserPermissions } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  permissions: UserPermissions | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isDev: boolean;
  isManager: boolean;
  isWorker: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const defaultPermissions: UserPermissions = {
  can_create_products: false, can_edit_products: false, can_delete_products: false,
  can_create_versions: false, can_edit_versions: false, can_delete_versions: false,
  can_create_updates: false, can_manage_users: false, can_manage_roles: false,
  can_manage_assignments: false, can_view_audit: false, can_access_admin: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = profile?.role || null;
  const permissions = (role?.permissions as UserPermissions) || defaultPermissions;
  const isAuthenticated = !!user && !!profile;
  const isDev = role?.name === 'DEV';
  const isManager = role?.name === 'MANAGER';
  const isWorker = role?.name === 'WORKER';

  const loadProfile = useCallback(async (retries = 3): Promise<void> => {
    try {
      const p = await fetchCurrentProfile();
      if (p) {
        setProfile(p);
        setError(null);
      } else if (retries > 0) {
        // Profile might not be created yet by the trigger — wait and retry
        await new Promise(r => setTimeout(r, 1500));
        return loadProfile(retries - 1);
      } else {
        setError('Profile not found. Please contact an administrator.');
      }
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1500));
        return loadProfile(retries - 1);
      }
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setUser(session.user);
          await loadProfile();
        }
      } catch {
        // Silent — user is simply not logged in
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setLoading(true);
        clearProfileCache();
        await loadProfile();
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        clearProfileCache();
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const loginWithGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    });
    if (error) setError(error.message);
  };

  const loginWithEmail = async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, full_name: name } },
    });
    if (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    clearProfileCache();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    clearProfileCache();
    await loadProfile();
  };

  return (
    <AuthContext.Provider value={{
      user, profile, role, permissions, loading, error, isAuthenticated,
      isDev, isManager, isWorker,
      loginWithGoogle, loginWithEmail, signUpWithEmail, logout, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
