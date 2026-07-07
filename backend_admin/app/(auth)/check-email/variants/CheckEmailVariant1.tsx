// app/(auth)/check-email/variants/CheckEmailVariant1.tsx
'use client';

import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function CheckEmailVariant1() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
        <Mail className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
        <p className="text-gray-600 mb-6">
          We’ve sent a password reset link to your email. Please check your inbox and follow the instructions.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
