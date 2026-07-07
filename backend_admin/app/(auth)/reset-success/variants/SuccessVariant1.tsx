// app/(auth)/reset-success/variants/SuccessVariant1.tsx
'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResetSuccessVariant1() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
        <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
        <p className="text-gray-600 mb-6">
          Your password has been updated. You can now log in with your new credentials.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}