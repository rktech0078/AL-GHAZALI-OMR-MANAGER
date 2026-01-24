'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface UserProfile {
    full_name: string;
    role: string;
    email: string;
    school_id?: string;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseBrowserClient();
    const router = useRouter();

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('full_name, role, email, school_id')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[AuthContext] Error fetching profile:', error);
                return null;
            }
            return data as UserProfile;
        } catch (error) {
            console.error('[AuthContext] Unexpected error fetching profile:', error);
            return null;
        }
    }, [supabase]);

    const refreshProfile = async () => {
        if (user) {
            const upp = await fetchProfile(user.id);
            setProfile(upp);
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const upp = await fetchProfile(session.user.id);
                    setProfile(upp);
                }
            } catch (error) {
                console.error('[AuthContext] Auth initialization failed:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
                const upp = await fetchProfile(currentSession.user.id);
                setProfile(upp);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase.auth, fetchProfile]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
