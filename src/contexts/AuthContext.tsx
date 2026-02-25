import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function signInWithOAuthNative(provider: 'google' | 'apple') {
  const redirectTo = 'com.flagarcade.app://auth/callback';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (data.url) {
    await Browser.open({ url: data.url });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (isNative && session) {
        Browser.close();
      }
    });

    return () => subscription.unsubscribe();
  }, [isNative]);

  const signInWithGoogle = useCallback(async () => {
    if (isNative) {
      await signInWithOAuthNative('google');
    } else {
      const redirectTo = import.meta.env.VITE_SITE_URL || window.location.origin;
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
    }
  }, [isNative]);

  const signInWithApple = useCallback(async () => {
    if (isNative) {
      await signInWithOAuthNative('apple');
    } else {
      const redirectTo = import.meta.env.VITE_SITE_URL || window.location.origin;
      await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo },
      });
    }
  }, [isNative]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signInWithGoogle,
        signInWithApple,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
