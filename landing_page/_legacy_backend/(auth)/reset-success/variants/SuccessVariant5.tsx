// app/(auth)/reset-success/variants/SuccessVariant5.tsx
'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResetSuccessVariant5() {
  return (
    <div className="min-h-screen flex">
      {/* Left - Gradient */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center text-white p-12">
        <div>
          <h2 className="text-4xl font-bold mb-4">All Set!</h2>
          <p className="text-lg text-white/90">
            Your password has been successfully updated. You can now log in securely.
          </p>
        </div>
      </div>

      {/* Right - Message */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white px-8 py-12">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
          <p className="text-gray-600 mb-6">
            Please log in with your new password.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
