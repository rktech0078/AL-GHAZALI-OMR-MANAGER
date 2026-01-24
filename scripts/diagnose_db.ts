
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};

envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);

async function deepDiagnose() {
    console.log('--- Deep Database Diagnosis ---');

    // We need a student ID to check. Let's find one student first.
    const { data: students } = await supabase.from('users').select('id, full_name').eq('role', 'student').limit(1);

    if (!students || students.length === 0) {
        console.log('No students found to test with.');
        return;
    }

    const testId = students[0].id;
    console.log(`Checking references for student: ${students[0].full_name} (${testId})`);

    const tablesToCheck = [
        'users', 'results', 'submissions', 'omr_sheets',
        'exams', 'questions', 'schools', 'audit_logs',
        'notifications', 'messages', 'student_data'
    ];

    for (const table of tablesToCheck) {
        try {
            // Check for id match in any likely column
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .or(`id.eq.${testId},student_id.eq.${testId},user_id.eq.${testId},created_by.eq.${testId}`)
                .limit(1);

            if (error) {
                if (error.code !== 'PGRST116' && error.code !== '42P01') {
                    // console.log(`Table ${table} check skipped or failed: ${error.message}`);
                }
            } else if (data && data.length > 0) {
                console.log(`[FOUND] Reference in table: ${table}`);
                console.log(JSON.stringify(data[0], null, 2));
            }
        } catch (e) {
            // ignore
        }
    }

    console.log('\n--- Checking Triggers ---');
    // We can't check triggers easily via the client, but we can check if deleting the user from public.users works first.
}

deepDiagnose();
