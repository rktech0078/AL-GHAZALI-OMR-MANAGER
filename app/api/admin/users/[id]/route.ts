import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateUserSchema } from '@/lib/validations/userValidation';

// GET - Fetch single user by ID
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

        // Get current user's role
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const userId = params.id;

        // Fetch user with school information
        const { data: userData, error } = await supabase
            .from('users')
            .select(`
        id,
        email,
        full_name,
        role,
        school_id,
        roll_number,
        student_class,
        created_at,
        updated_at,
        schools (
          id,
          school_name
        )
      `)
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: userData }, { status: 200 });
    } catch (error) {
        console.error('Error in GET /api/admin/users/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update user details
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

        // Parse and validate request body
        const body = await request.json();
        const validationResult = UpdateUserSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.issues },
                { status: 400 }
            );
        }

        const userId = params.id;
        const updateData = validationResult.data;

        // Update user in database
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select(`
        id,
        email,
        full_name,
        role,
        school_id,
        created_at,
        updated_at,
        schools (
          id,
          school_name
        )
      `)
            .single();

        if (updateError) {
            console.error('Error updating user:', updateError);
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }

        return NextResponse.json(
            { message: 'User updated successfully', user: updatedUser },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in PUT /api/admin/users/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete user
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

        const userId = params.id;

        // Prevent admin from deleting themselves
        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // Delete user from public.users table (will cascade to auth.users due to ON DELETE CASCADE)
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }

        return NextResponse.json(
            { message: 'User deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in DELETE /api/admin/users/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
