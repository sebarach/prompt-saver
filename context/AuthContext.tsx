import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loginWithDemo: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        // Ignoramos error en init para permitir modo offline si falla la conexión
        
        if (mounted) {
           if (session) {
             setSession(session);
             setUser(session.user);
           }
        }
      } catch (error) {
        console.warn('Supabase Auth check failed, app will stay in logged out state until demo login:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Si es usuario demo (fake), solo limpiamos el estado
    if (user?.id === 'demo-user-id') {
        setUser(null);
        setSession(null);
        return;
    }
    await supabase.auth.signOut();
  };

  const loginWithDemo = (email: string) => {
    const fakeUser: User = {
        id: 'demo-user-id',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: email,
        phone: ''
    };
    const fakeSession: Session = {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: fakeUser
    };
    setUser(fakeUser);
    setSession(fakeSession);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, loginWithDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};