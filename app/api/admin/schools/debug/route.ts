import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = createClient();

        // 1. Check table columns
        const { data: columns, error: columnsError } = await supabase
            .rpc('get_table_columns', { table_name: 'schools' }); // This might not work if rpc doesn't exist.

        // Alternative: Try to select a non-existent column to see the error, or just select * limit 1
        const { data: sample, error: sampleError } = await supabase
            .from('schools')
            .select('*')
            .limit(1);

        // 2. Check RLS policies (requires SQL access usually, but we can try to insert and see the error)

        return NextResponse.json({
            sampleData: sample,
            sampleError: sampleError ? {
                message: sampleError.message,
                details: sampleError.details,
                hint: sampleError.hint,
                code: sampleError.code
            } : null,
        }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Internal error',
            details: error.message
        }, { status: 500 });
    }
}
