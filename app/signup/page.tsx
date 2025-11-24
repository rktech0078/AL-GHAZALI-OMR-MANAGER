"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-indigo-50 pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg p-8 space-y-6 rounded-2xl shadow-2xl border border-gray-200/50 animate-slide-up text-center">
          {/* Logo */}
          <Link href="/" className="inline-block mb-4">
            <div className="flex items-center justify-center">
              <Image
                src="/al-ghazali-logo.png"
                alt="Al-Ghazali Logo"
                width={80}
                height={80}
                className="rounded-xl shadow-lg"
              />
            </div>
          </Link>

          {/* Restricted Access Message */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h2 className="text-xl font-bold text-yellow-800 mb-2">
              Registration Restricted
            </h2>
            <p className="text-sm text-yellow-700">
              New accounts can only be created by Administrators.
            </p>
            <p className="mt-2 text-sm text-yellow-700">
              Please contact your school administrator to get your account credentials.
            </p>
          </div>

          {/* Back to Login */}
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-xl"
            >
              Back to Login
            </Link>
          </div>

          {/* Footer Text */}
          <p className="mt-6 text-center text-xs text-gray-500">
            Al-Ghazali OMR Manager
          </p>
        </div>
      </div>
    </div>
  );
}
