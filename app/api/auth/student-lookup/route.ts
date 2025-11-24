import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const { roll_number } = await request.json();

        if (!roll_number) {
            return NextResponse.json({ error: 'Roll number is required' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // Search for user with this roll number and role 'student'
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('role', 'student')
            .eq('roll_number', roll_number)
            .limit(1);

        if (error) {
            console.error('Error looking up student:', error);
            return NextResponse.json({ error: 'Failed to lookup student' }, { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Return the email of the first match
        return NextResponse.json({ email: users[0].email }, { status: 200 });

    } catch (error) {
        console.error('Error in student lookup:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
