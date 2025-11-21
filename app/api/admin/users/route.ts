import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateUserSchema } from '@/lib/validations/userValidation';

// GET - Fetch all users
export async function GET() {
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

        // Fetch all users (without school join for now)
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        // Manually fetch school names if needed
        if (users && users.length > 0) {
            const schoolIds = users.map(u => u.school_id).filter(Boolean);
            if (schoolIds.length > 0) {
                const { data: schools } = await supabase
                    .from('schools')
                    .select('id, school_name')
                    .in('id', schoolIds);

                // Attach school data to users
                const usersWithSchools = users.map(user => ({
                    ...user,
                    schools: schools?.find(s => s.id === user.school_id) || null
                }));

                return NextResponse.json({ users: usersWithSchools }, { status: 200 });
            }
        }

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error('Error in GET /api/admin/users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create new user
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

        // Parse and validate request body
        const body = await request.json();
        const validationResult = CreateUserSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.issues },
                { status: 400 }
            );
        }

        const { email, password, full_name, role, school_id, roll_number, student_class } = validationResult.data;

        // Create auth user using signUp
        // Create auth user using signUp (with auto-confirm for admin creation)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: undefined, // No email confirmation needed
                data: {
                    full_name,
                    role,
                    school_id,
                    roll_number,
                    student_class,
                },
            },
        });

        if (authError) {
            console.error('Error creating auth user:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // Create user profile in public.users table
        const { data: newUser, error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                full_name,
                role,
                school_id: school_id || null,
                roll_number: roll_number || null,
                student_class: student_class || null,
            })
            .select('*')
            .single();

        if (profileError) {
            console.error('Error creating user profile:', profileError);
            return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
        }

        return NextResponse.json(
            { message: 'User created successfully', user: newUser },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error in POST /api/admin/users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
