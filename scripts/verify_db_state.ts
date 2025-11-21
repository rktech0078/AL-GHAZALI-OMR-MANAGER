
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually since we can't rely on dotenv being configured for this script location
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};

envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifyState() {
    console.log('Verifying database state...');

    // 1. Check Users
    const { data: users, error: usersError } = await supabase
        .from('users') // Assuming 'users' table mirrors auth users or is the main user table
        .select('email, full_name, role');

    if (usersError) {
        console.error('Error fetching users:', usersError);
    } else {
        console.log('\n--- Users ---');
        console.log(`Total Users: ${users.length}`);
        users.forEach(u => console.log(`- ${u.email} (${u.role})`));
    }

    // 2. Check Schools
    const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('name, school_code');

    if (schoolsError) {
        console.error('Error fetching schools:', schoolsError);
    } else {
        console.log('\n--- Schools ---');
        console.log(`Total Schools: ${schools.length}`);
        schools.forEach(s => console.log(`- ${s.name} (${s.school_code})`));
    }

    // 3. Check Exams
    const { count: examsCount, error: examsError } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true });

    if (examsError) console.error('Error fetching exams:', examsError);
    else console.log(`\nTotal Exams: ${examsCount}`);

    // 4. Check Results
    const { count: resultsCount, error: resultsError } = await supabase
        .from('results')
        .select('*', { count: 'exact', head: true });

    if (resultsError) console.error('Error fetching results:', resultsError);
    else console.log(`Total Results: ${resultsCount}`);

    // 5. Check Submissions
    const { count: submissionsCount, error: submissionsError } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

    if (submissionsError) console.error('Error fetching submissions:', submissionsError);
    else console.log(`Total Submissions: ${submissionsCount}`);
}

verifyState();
