"use server";

import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
    const supabase = createClient();
    await supabase.auth.signOut();
}
