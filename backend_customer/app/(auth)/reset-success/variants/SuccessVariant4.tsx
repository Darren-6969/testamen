// app/(auth)/reset-success/variants/SuccessVariant4.tsx
'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { AUTH_IMAGES } from '../../lib/authAssets';

export default function ResetSuccessVariant4() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left - Image */}
      <div
        className="hidden md:block bg-cover bg-center"
        style={{ backgroundImage: `url('${AUTH_IMAGES.resetSuccessBg}')` }}
      />

      {/* Right - Message */}
      <div className="flex items-center justify-center bg-white px-8 py-12">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Changed</h1>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. Please log in again.
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
