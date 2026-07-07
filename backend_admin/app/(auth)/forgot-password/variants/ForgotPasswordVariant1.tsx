// app/(auth)/forgot-password/variants/ForgotPasswordVariant1.tsx
'use client';

import { Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import { APP_CONSTANT } from '../../../config/Constant';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 🔹 Replace with your real API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full shadow-lg mb-3">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-600 text-sm">Enter your email to reset your password</p>
        </div>

        {/* Success Message */}
        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm text-green-700">
              ✅ Reset link has been sent to <span className="font-semibold">{email}</span>.
              Please check your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <FormField label="Email Address" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
                validationRules={{ required: true, email: true }}
              />
            </FormField>

            <Button type="submit" loading={loading} fullWidth>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <a href="/" className="text-sm text-blue-600 hover:text-blue-500">
                Back to login
              </a>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 text-sm text-gray-500 text-center">
        © {new Date().getFullYear()} <span className="font-semibold">{APP_CONSTANT.name}</span>. All rights reserved.
      </footer>
    </div>
  );
}