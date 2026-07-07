// app/(auth)/reset-password/variants/ResetPasswordVariant3.tsx
'use client';

import { Lock } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import Link from 'next/link';
import { useState } from 'react';
import { AUTH_IMAGES } from '../../lib/authAssets';

export default function ResetPasswordVariant3() {
  const [formData, setFormData] = useState({ password: '', confirm: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left - Form */}
      <div className="flex items-center justify-center bg-white px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 mx-auto text-blue-600 mb-2" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600 text-sm">Set your new account password.</p>
          </div>

          {submitted ? (
            <p className="p-4 bg-green-50 text-green-700 rounded-lg text-sm text-center">
              Password updated successfully.
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

      {/* Right - Image */}
      <div
        className="hidden md:block bg-cover bg-center"
        style={{ backgroundImage: `url('${AUTH_IMAGES.resetPasswordBg}')` }}
      />
    </div>
  );
}
