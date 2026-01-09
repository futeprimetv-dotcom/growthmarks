import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    // Configure session persistence based on rememberMe
    // When rememberMe is false, session will be cleared when browser closes
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // If not remembering, store a flag to clear session on browser close
    if (!rememberMe && !error) {
      sessionStorage.setItem('session_temporary', 'true');
    } else {
      sessionStorage.removeItem('session_temporary');
    }
    
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    sessionStorage.removeItem('session_temporary');
    await supabase.auth.signOut();
  };

  // Handle temporary session (clear on browser close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionStorage.getItem('session_temporary') === 'true') {
        // This will be checked on next load
        localStorage.setItem('clear_session_on_load', 'true');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Check if we need to clear session from previous temporary login
    if (localStorage.getItem('clear_session_on_load') === 'true') {
      localStorage.removeItem('clear_session_on_load');
      supabase.auth.signOut();
    }

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
