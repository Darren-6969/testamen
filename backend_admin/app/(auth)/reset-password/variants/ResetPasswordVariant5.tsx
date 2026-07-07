// app/(auth)/reset-password/variants/ResetPasswordVariant5.tsx
'use client';

import { Lock } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import Link from 'next/link';
import { useState } from 'react';

export default function ResetPasswordVariant5() {
  const [formData, setFormData] = useState({ password: '', confirm: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex">
      {/* Left Gradient Section */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center text-white p-12">
        <div>
          <h2 className="text-4xl font-bold mb-4">Secure Your Account</h2>
          <p className="text-lg text-white/90">
            Enter a new password below to reset your account credentials.
          </p>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 mx-auto text-blue-600 mb-2" />
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          </div>

          {submitted ? (
            <p className="p-4 bg-green-50 text-green-700 rounded-lg text-sm text-center">
              Password successfully updated!
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <FormField label="New Password" htmlFor="password" required>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
              </FormField>

              <FormField label="Confirm Password" htmlFor="confirm" required>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  value={formData.confirm}
                  onChange={handleChange}
                  placeholder="Confirm password"
                />
              </FormField>

              <Button type="submit" fullWidth>
                Reset Password
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