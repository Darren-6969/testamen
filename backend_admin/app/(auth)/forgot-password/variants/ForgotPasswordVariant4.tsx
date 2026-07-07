// app/(auth)/forgot-password/variants/ForgotPasswordVariant4.tsx
'use client';

import { Mail } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import Link from 'next/link';
import { useState } from 'react';
import { AUTH_IMAGES } from '../../lib/authAssets';

export default function ForgotPasswordVariant4() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Image */}
      <div
        className="hidden md:block bg-cover bg-center"
        style={{ backgroundImage: `url('${AUTH_IMAGES.forgotPasswordBg}')` }}
      />

      {/* Right Form */}
      <div className="flex items-center justify-center bg-white px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <Mail className="w-12 h-12 mx-auto text-blue-600 mb-2" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
            <p className="text-gray-600 text-sm">Enter your email to reset your password.</p>
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
    </div>
  );
}
