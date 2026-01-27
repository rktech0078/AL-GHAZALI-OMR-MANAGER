"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { FullScreenLoader } from "@/components/ui/FullScreenLoader";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loginType, setLoginType] = useState<'email' | 'roll_number'>('email');
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { showToast } = useToast();

  // Check for existing session on mount
  useState(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // If already has session, don't even wait for handleLogin
        // Fetch profile to know where to redirect
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role) {
          let url = '/';
          if (profile.role === 'admin') url = '/admin';
          else if (profile.role === 'teacher') url = '/teacher';
          else if (profile.role === 'student') url = '/student';
          router.replace(url);
        }
      }
    };
    checkSession();
  });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    let loginEmail = email;

    try {
      if (loginType === 'roll_number') {
        // Lookup email by roll number
        const response = await fetch('/api/auth/student-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roll_number: rollNumber }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to find student');
        }

        loginEmail = data.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch user role
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = profile?.role;
        let redirectUrl = '/';

        if (role === 'admin') redirectUrl = '/admin';
        else if (role === 'teacher') redirectUrl = '/teacher';
        else if (role === 'student') redirectUrl = '/student';

        setIsRedirecting(true);
        showToast('Successfully logged in!', 'success');
        router.push(redirectUrl);
        router.refresh();
      } else {
        // Fallback if user object is missing (unlikely if no error)
        router.push("/");
        router.refresh();
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isRedirecting && <FullScreenLoader text="Redirecting to Dashboard..." />}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20">
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
          <div className="bg-white/80 backdrop-blur-lg p-8 space-y-6 rounded-2xl shadow-2xl border border-gray-200/50 animate-slide-up">
            {/* Logo & Header */}
            <div className="text-center">
              <Link href="/" className="inline-block mb-4">
                <div className="flex items-center justify-center">
                  <Image
                    src="/al-ghazali-logo.png"
                    alt="Al-Ghazali Logo"
                    width={64}
                    height={64}
                    className="rounded-xl shadow-lg"
                  />
                </div>
              </Link>
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Sign in to continue to Al-Ghazali OMR
              </p>
            </div>

            {/* Login Type Toggle */}
            <div className="flex p-1 mb-6 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setLoginType('email')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginType === 'email'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Admin / Teacher
              </button>
              <button
                type="button"
                onClick={() => setLoginType('roll_number')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginType === 'roll_number'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Student
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field (for Admin/Teacher) */}
              {loginType === 'email' && (
                <div className="animate-fade-in">
                  <label
                    htmlFor="email"
                    className="block mb-1 text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3 transition-all border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              )}

              {/* Roll Number Field (for Student) */}
              {loginType === 'roll_number' && (
                <div className="animate-fade-in">
                  <label
                    htmlFor="roll_number"
                    className="block mb-1 text-sm font-medium text-gray-700"
                  >
                    Roll Number
                  </label>
                  <input
                    id="roll_number"
                    name="roll_number"
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="block w-full px-4 py-3 transition-all border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your Roll Number"
                  />
                </div>
              )}

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3 pr-12 transition-all border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute transition-colors -translate-y-1/2 right-3 top-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Forgot your password? Contact administrator.
              </p>
            </div>
          </div>

          {/* Footer Text */}
          <p className="mt-6 text-center text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </>
  );
}
