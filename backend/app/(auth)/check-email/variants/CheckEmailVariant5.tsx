// app/(auth)/check-email/variants/CheckEmailVariant5.tsx
'use client';

import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function CheckEmailVariant5() {
  return (
    <div className="min-h-screen flex">
      {/* Left - Gradient Section */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center text-white p-12">
        <div>
          <h2 className="text-4xl font-bold mb-4">Almost There!</h2>
          <p className="text-lg text-white/90">
            We’ve sent you a link to reset your password. Please check your inbox.
          </p>
        </div>
      </div>

      {/* Right - Message */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white px-8 py-12">
        <div className="max-w-md w-full text-center">
          <Mail className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            If the email exists, a reset link has been sent. Follow the instructions inside.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
