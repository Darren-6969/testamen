// app/(auth)/reset-password/variants/ResetPasswordVariant1.tsx
'use client';

import { Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import Link from 'next/link';
import { useState } from 'react';

export default function ResetPasswordVariant1() {
  const [formData, setFormData] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <Lock className="w-12 h-12 mx-auto text-blue-600 mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 text-sm">Enter your new password below.</p>
        </div>

        {submitted ? (
          <p className="p-4 bg-green-50 text-green-700 rounded-lg text-sm text-center">
            Your password has been successfully reset.
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
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
            </FormField>

            <FormField label="Confirm Password" htmlFor="confirm" required>
              <Input
                id="confirm"
                name="confirm"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirm}
                onChange={handleChange}
                placeholder="Confirm new password"
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
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
  );
}