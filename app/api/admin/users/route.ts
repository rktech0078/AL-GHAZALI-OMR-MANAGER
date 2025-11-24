import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

        const { email: inputEmail, password, full_name, role, school_id, roll_number, student_class } = validationResult.data;

        // Generate dummy email for students if not provided
        let email = inputEmail;
        if (role === 'student' && !email) {
            // Format: student_[roll_number]_[school_id_suffix]@omr.local
            // We use a suffix of school_id to make it somewhat unique across schools, 
            // though roll_number should ideally be unique within a school.
            const schoolSuffix = school_id ? school_id.split('-')[0] : 'noschool';
            email = `student_${roll_number}_${schoolSuffix}@omr.local`.toLowerCase();
        } else if (!email) {
            return NextResponse.json({ error: 'Email is required for non-student users' }, { status: 400 });
        }

        // Create auth user using signUp
        // Create auth user using signUp (with auto-confirm for admin creation)
        // Create auth user using admin client to auto-confirm
        const supabaseAdmin = createAdminClient();
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
                role,
                school_id,
                roll_number,
                student_class,
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
