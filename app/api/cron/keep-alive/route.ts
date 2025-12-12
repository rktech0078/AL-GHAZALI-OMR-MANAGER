import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function GET() {
    try {
        const supabase = createClient();
        
        // Perform a lightweight operation to keep the project alive
        // Select from 'users' just to trigger a DB read.
        // Using count to be minimal.
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase Cron: Query Error:', error.message);
            return NextResponse.json({ status: 'warning', message: 'DB reached but query failed', error: error.message }, { status: 200 });
        }

        console.log('Supabase Cron: Ping Successful');
        return NextResponse.json({ status: 'ok', message: 'Supabase is alive', timestamp: new Date().toISOString() });
    } catch (error: unknown) {
        console.error('Supabase Cron: Critical Error:', error);
        const err = error as Error;
        return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
    }
}
