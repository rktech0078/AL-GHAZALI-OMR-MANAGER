import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all schools
export async function GET() {
    try {
        const supabase = createClient();

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user's role and verify admin access
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { data: schools, error } = await supabase
            .from('schools')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching schools:', error);
            throw error;
        }

        return NextResponse.json({ schools }, { status: 200 });
    } catch (error: any) {
        console.error('Error in GET /api/admin/schools:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch schools' },
            { status: 500 }
        );
    }
}

// POST - Create new school
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user's role
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const body = await request.json();

        // Validate required fields
        if (!body.school_name || !body.school_code) {
            return NextResponse.json(
                { error: 'School name and code are required' },
                { status: 400 }
            );
        }

        // Check if school code already exists
        const { data: existing } = await supabase
            .from('schools')
            .select('id')
            .eq('school_code', body.school_code)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: 'School code already exists' },
                { status: 400 }
            );
        }

        // Insert new school
        const { data: school, error } = await supabase
            .from('schools')
            .insert({
                school_name: body.school_name,
                school_code: body.school_code,
                city: body.city || null,
                address: body.address || null,
                principal_name: body.principal_name || null,
                contact_email: body.contact_email || null,
                contact_phone: body.contact_phone || null,
                is_active: body.is_active !== undefined ? body.is_active : true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating school:', error);
            throw error;
        }

        return NextResponse.json(
            { message: 'School created successfully', school },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error in POST /api/admin/schools:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create school' },
            { status: 500 }
        );
    }
}
