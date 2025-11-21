import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch single school
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: school, error } = await supabase
            .from('schools')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) throw error;

        if (!school) {
            return NextResponse.json(
                { error: 'School not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(school);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update school
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { data: school, error } = await supabase
            .from('schools')
            .update({
                school_name: body.school_name,
                school_code: body.school_code,
                city: body.city,
                address: body.address,
                principal_name: body.principal_name,
                contact_email: body.contact_email,
                contact_phone: body.contact_phone,
                is_active: body.is_active,
                updated_at: new Date().toISOString(),
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(school);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete school
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { error } = await supabase
            .from('schools')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ message: 'School deleted successfully' });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
