// app/(auth)/forgot-password/variants/ForgotPasswordVariant2.tsx
'use client';

import { Mail } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import Link from 'next/link';
import { useState } from 'react';
import { AUTH_IMAGES } from '../../lib/authAssets';

export default function ForgotPasswordVariant2() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url('${AUTH_IMAGES.forgotPasswordBg}')` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10 w-full max-w-md p-8 bg-white/90 rounded-xl shadow-2xl">
        <div className="text-center mb-6">
          <Mail className="w-12 h-12 mx-auto text-blue-600 mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="text-gray-600 text-sm">
            Enter your email and we’ll send a reset link.
          </p>
        </div>

        {submitted ? (
          <p className="p-4 bg-green-50 text-green-700 rounded-lg text-sm text-center">
            Reset link sent if email exists.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-4"
          >
            <FormField label="Email" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
              />
            </FormField>
            <Button type="submit" fullWidth>
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
