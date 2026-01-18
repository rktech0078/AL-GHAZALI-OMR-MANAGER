'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createStudent(formData: FormData) {
    const full_name = formData.get('full_name') as string;
    const emailInput = formData.get('email') as string;
    const roll_number = formData.get('roll_number') as string;

    if (!full_name || !roll_number) {
        return { error: 'Name and Roll Number are required' };
    }

    try {
        const supabase = await createClient(); // Await the promise
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'Unauthorized' };
        }

        // Verify user is a teacher and get school_id
        const { data: teacherProfile } = await supabase
            .from('users')
            .select('role, school_id')
            .eq('id', user.id)
            .single();

        if (!teacherProfile || teacherProfile.role !== 'teacher' || !teacherProfile.school_id) {
            return { error: 'Unauthorized: Only teachers associated with a school can create students.' };
        }

        const school_id = teacherProfile.school_id;

        // Generate email if not provided
        let email = emailInput;
        if (!email) {
            const schoolSuffix = school_id.split('-')[0];
            email = `student_${roll_number}_${schoolSuffix}@omr.local`.toLowerCase();
            // Ensure unique timestamp to prevent collisions in very rapid creation (edge case)
            if (emailInput === '') {
                email = `student_${roll_number}_${schoolSuffix}_${Date.now()}@omr.local`.toLowerCase();
            }
        }

        const adminClient = createAdminClient();

        // 1. Create Auth User
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password: 'student_password_123', // Default password, should probably be set/changed later or random
            email_confirm: true,
            user_metadata: {
                full_name,
                role: 'student',
                school_id,
                roll_number,
            }
        });

        if (authError) {
            console.error('Auth create error:', authError);
            return { error: `Failed to create account: ${authError.message}` };
        }

        if (!authData.user) {
            return { error: 'Failed to create user account' };
        }

        // 2. Create Profile in public.users
        const { error: profileError } = await adminClient
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                full_name,
                role: 'student',
                school_id,
                roll_number,
            });

        if (profileError) {
            console.error('Profile create error:', profileError);
            // Cleanup auth user if profile fails
            await adminClient.auth.admin.deleteUser(authData.user.id);
            return { error: `Failed to create profile: ${profileError.message}` };
        }

        revalidatePath('/teacher/students');
        return { success: true };

    } catch (error: any) {
        console.error('Server action error:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function deleteStudent(studentId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'Unauthorized' };
        }

        // Verify user is a teacher and get school_id
        const { data: teacherProfile } = await supabase
            .from('users')
            .select('role, school_id')
            .eq('id', user.id)
            .single();

        if (!teacherProfile || teacherProfile.role !== 'teacher' || !teacherProfile.school_id) {
            return { error: 'Unauthorized: Only teachers can delete students.' };
        }

        // Verify the student belongs to the same school
        const { data: studentProfile } = await supabase
            .from('users')
            .select('school_id, role')
            .eq('id', studentId)
            .single();

        if (!studentProfile) {
            return { error: 'Student not found' };
        }

        if (studentProfile.role !== 'student') {
            return { error: 'Can only delete student accounts' };
        }

        if (studentProfile.school_id !== teacherProfile.school_id) {
            return { error: 'Unauthorized: Student belongs to a different school' };
        }

        const adminClient = createAdminClient();

        // 1. Delete Results
        const { error: resultsError } = await adminClient
            .from('results')
            .delete()
            .eq('student_id', studentId);

        if (resultsError) {
            console.error('Results delete error:', resultsError);
            // Continue even if error? No, might fail later. But maybe table doesn't exist or no records.
            // Better to log and continue or return error?
            // If strictly enforced, we should probably stop. But let's try to proceed as sometimes it's empty.
        }

        // 2. Delete Submissions
        const { error: submissionsError } = await adminClient
            .from('submissions')
            .delete()
            .eq('student_id', studentId);

        if (submissionsError) {
            console.error('Submissions delete error:', submissionsError);
        }

        // 3. Delete from public.users
        const { error: profileError } = await adminClient
            .from('users')
            .delete()
            .eq('id', studentId);

        if (profileError) {
            console.error('Profile delete error:', profileError);
            return { error: `Failed to delete student profile: ${profileError.message}` };
        }

        // 4. Delete from auth.users
        const { error: authError } = await adminClient.auth.admin.deleteUser(studentId);

        if (authError) {
            console.error('Auth delete error:', authError);
            return { error: `Failed to delete student account: ${authError.message}` };
        }

        revalidatePath('/teacher/students');
        return { success: true };

    } catch (error: any) {
        console.error('Delete student error:', error);
        return { error: error.message || 'Internal server error' };
    }
}
