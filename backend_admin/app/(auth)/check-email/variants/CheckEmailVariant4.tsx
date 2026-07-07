// app/(auth)/check-email/variants/CheckEmailVariant4.tsx
'use client';

import { Mail } from 'lucide-react';
import Link from 'next/link';
import { AUTH_IMAGES } from '../../lib/authAssets';

export default function CheckEmailVariant4() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left - Image */}
      <div
        className="hidden md:block bg-cover bg-center"
        style={{ backgroundImage: `url('${AUTH_IMAGES.checkEmailBg}')` }}
      />

      {/* Right - Message */}
      <div className="flex items-center justify-center bg-white px-8 py-12">
        <div className="max-w-md w-full text-center">
          <Mail className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            If the email exists in our system, you’ll receive a password reset link.
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
