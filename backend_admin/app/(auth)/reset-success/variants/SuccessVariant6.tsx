// app/(auth)/reset-success/variants/SuccessVariant5.tsx
'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { AUTH_IMAGES } from '../../lib/authAssets';

export default function ResetSuccessVariant6() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Side Gradient */}
      <div className="hidden md:flex items-center justify-center relative bg-white overflow-hidden">
        {/* angled red background */}
        <div
          className="absolute bg-red-600 shadow-sm"
          style={{
            width: '1200px',
            height: '1200px',
            transform: 'rotate(-60deg)',
            top: '60px',
            left: '-450px',
            borderRadius: '157px',
          }}
        ></div>

        {/* angled white overlay */}
        <div
          className="absolute bg-white shadow-md"
          style={{
            width: '1200px',
            height: '1200px',
            transform: 'rotate(-60deg)',
            top: '130px',
            left: '-490px',
            borderRadius: '157px',
          }}
        ></div>

        {/* logo (fixed & responsive) */}
        <div className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center w-full">
          <img
            src={AUTH_IMAGES.loginBg}
            alt="Logo"
            className="max-w-[250px] w-[40%] h-auto md:max-w-[300px] lg:max-w-[350px]"
          />
        </div>
      </div>

      {/* Right - Message */}
      <div className="flex items-center justify-center bg-white px-8 py-12">
        <div className="max-w-lg w-full text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
          <p className="text-gray-600 mb-6">
            Please log in with your new password.
          </p>
          <Link
            href="/login"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
