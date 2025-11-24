
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SUBMISSION_ID = '82ecde65-5afa-4b25-b0e2-6960128008dd';

async function verifySubmission() {
    console.log(`Checking for submission ID: ${SUBMISSION_ID}`);

    // Check submissions table
    const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', SUBMISSION_ID)
        .single();

    if (submissionError) {
        console.error('Error fetching submission:', submissionError);
    } else {
        console.log('Submission found:', submission);
    }

    // Check results table (assuming it's linked by submission_id)
    const { data: result, error: resultError } = await supabase
        .from('results')
        .select('*')
        .eq('submission_id', SUBMISSION_ID)
        .single();

    if (resultError) {
        console.log('Result not found by submission_id, trying by id...');
        // Maybe the ID provided IS the result ID?
        const { data: resultById, error: resultByIdError } = await supabase
            .from('results')
            .select('*')
            .eq('id', SUBMISSION_ID)
            .single();

        if (resultByIdError) {
            console.error('Error fetching result by ID:', resultByIdError);
        } else {
            console.log('Result found by ID:', resultById);
        }

    } else {
        console.log('Result found by submission_id:', result);
    }
}

verifySubmission();
