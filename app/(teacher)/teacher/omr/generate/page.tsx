import { OMRGenerateForm } from "@/components/omr/omr-generate-form";
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OMRGeneratePage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile and verify role
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    // Redirect if not a teacher
    if (profile?.role !== 'teacher') {
        redirect('/');
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">OMR Sheet Generator</h1>
                    <p className="text-gray-600 mt-2">
                        Design and download professional OMR sheets for your exams.
                    </p>
                </div>

                <OMRGenerateForm />
            </div>
        </div>
    );
}
