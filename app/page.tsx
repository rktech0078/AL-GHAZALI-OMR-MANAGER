'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/lib/context/AuthContext';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = profile?.role;

  return (
    <div className="min-h-screen bg-white">


      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* Subtle Animated Background Pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-40">
          {/* Subtle Grid */}
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
          {/* Subtle Gradient Orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Hero Content */}
        <div className="relative container px-4 mx-auto sm:px-6 lg:px-8 py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
            >
              <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl lg:text-7xl mb-6">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Exam Management
                </span>
              </h1>
              <p className="text-xl text-gray-600 sm:text-2xl mb-8 max-w-2xl mx-auto">
                AI-powered OMR solution using mobile cameras. No scanners needed.
                Fast, accurate, and designed for Pakistani schools.
              </p>
              {/* Auth Buttons */}
              {/* Auth Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link
                    href={role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : role === 'student' ? '/student' : '/'}
                    className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Login to Portal
                  </Link>
                )}
              </div>
            </div>

            {/* Stats */}
            <div
              className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">95%+</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">&lt;5s</div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">Mobile First</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">24/7</div>
                <div className="text-sm text-gray-600">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Al-Ghazali OMR?
            </h2>
            <p className="text-xl text-gray-600">
              Built specifically for Pakistani educational institutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Mobile First
              </h3>
              <p className="text-gray-600">
                Just use your phone camera to capture OMR sheets. No expensive scanners needed!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                AI Powered
              </h3>
              <p className="text-gray-600">
                Advanced AI ensures 95%+ accuracy even with poor image quality or lighting.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Bank-level security. Your student data is encrypted and protected at all times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple 3-Step Process
            </h2>
            <p className="text-xl text-gray-600">
              From exam creation to results in minutes
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Create Exam & Generate OMR
                  </h3>
                  <p className="text-gray-600">
                    Teachers create exams with questions and download printable OMR sheets with QR codes.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Capture with Mobile
                  </h3>
                  <p className="text-gray-600">
                    After students complete the exam, simply photograph the OMR sheets using your phone.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Instant Results
                  </h3>
                  <p className="text-gray-600">
                    AI processes the sheets instantly. Students see results with detailed analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Exam Process?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join hundreds of schools across Pakistan already using Al-Ghazali OMR
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-4 text-lg font-semibold text-indigo-600 bg-white rounded-full hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
            >
              Login Now
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
