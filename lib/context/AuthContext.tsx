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
                // Get initial session
                const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                setSession(initialSession);
                setUser(initialSession?.user ?? null);

                if (initialSession?.user) {
                    // Start fetching profile in background
                    fetchProfile(initialSession.user.id).then(upp => {
                        setProfile(upp);
                    });
                }
            } catch (error) {
                console.error('[AuthContext] Auth initialization failed:', error);
            } finally {
                // IMPORTANT: Set loading to false as soon as session check is done
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log(`[AuthContext] 🔄 Auth event: ${event}`, { userId: currentSession?.user?.id });

            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || (event === 'INITIAL_SESSION' && currentSession?.user)) {
                const userId = currentSession?.user?.id;
                if (userId) {
                    // Non-blocking profile fetch
                    fetchProfile(userId).then(upp => {
                        setProfile(upp);
                    });
                }
            } else if (event === 'SIGNED_OUT') {
                setProfile(null);
                setUser(null);
                setSession(null);
            }

            // Always clear loading if an event occurs
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase.auth, fetchProfile]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            // Clear local states
            setUser(null);
            setProfile(null);
            setSession(null);

            // Hard redirect to clear any residual memory-based state/cache
            window.location.href = '/login';
        } catch (error) {
            console.error('[AuthContext] Sign out failed:', error);
            // Even if it fails, try to clear locally and redirect
            window.location.href = '/login';
        }
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
