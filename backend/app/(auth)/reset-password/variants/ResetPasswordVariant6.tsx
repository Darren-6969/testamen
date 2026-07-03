'use client';

import { Lock } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AUTH_IMAGES } from '../../lib/authAssets';
import { useResetPasswordForm } from '../../hooks/useResetPasswordForm';

export default function ResetPasswordVariant6() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'));
  }, []);

  const {
        formData,
        loading,
        error,
        handleInputChange,
        handleValidationChange,
        handleSubmit,
        formValid,
  } = useResetPasswordForm(token);

  const isFormValid = formValid.password && formValid.confirm;

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Gradient Section */}
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

      {/* Right Form */}
      <div className="flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-lg border p-12 rounded-2xl shadow-md">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 mx-auto text-blue-600 mb-2" />
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && 
              <p className="p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                {error}
              </p>
            }
            <FormField label="New Password" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                validationRules={{ required: true }}
                onValidationChange={handleValidationChange('password')}
                placeholder="Enter new password"
              />
            </FormField>

            <FormField label="Confirm Password" htmlFor="confirm" required>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                value={formData.confirm}
                onChange={handleInputChange}
                validationRules={{ required: true }}
                onValidationChange={handleValidationChange('confirm')}
                placeholder="Confirm password"
              />
            </FormField>

            <Button type="submit" loading={loading} disabled={!isFormValid} fullWidth variant="outline" color="red" hoverColor="red" className="border-red-600 shadow-lg">
              {loading ? 'Reseting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-red-600 hover:text-red-500">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
