"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { type Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HeaderAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:block">
          {session.user.email}
        </span>
        <button
          onClick={handleLogout}
          className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <Link href="/login" className="px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100">
        Login
      </Link>
      <Link
        href="/signup"
        className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Sign Up
      </Link>
    </div>
  );
}
