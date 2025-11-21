import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = createClient();

        // Get current auth user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            return NextResponse.json({
                error: 'Auth error',
                details: authError.message
            }, { status: 500 });
        }

        if (!user) {
            return NextResponse.json({
                authenticated: false,
                message: 'No user logged in'
            }, { status: 200 });
        }

        // Get user from public.users table
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            return NextResponse.json({
                authenticated: true,
                hasProfile: false,
                authUser: {
                    id: user.id,
                    email: user.email
                },
                profileError: profileError.message
            }, { status: 200 });
        }

        return NextResponse.json({
            authenticated: true,
            hasProfile: true,
            authUser: {
                id: user.id,
                email: user.email
            },
            userProfile: userProfile
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({
            error: 'Internal error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
