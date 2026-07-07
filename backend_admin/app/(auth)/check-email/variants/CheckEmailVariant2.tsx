// app/(auth)/check-email/variants/CheckEmailVariant2.tsx
'use client';

import { Mail } from 'lucide-react';
import Link from 'next/link';
import { AUTH_IMAGES } from '../../lib/authAssets';

export default function CheckEmailVariant2() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url('${AUTH_IMAGES.checkEmailBg}')` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10 w-full max-w-md p-8 bg-white/90 rounded-xl shadow-lg text-center">
        <Mail className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
        <p className="text-gray-600 mb-6">
          A reset link has been sent to your registered email address.
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
