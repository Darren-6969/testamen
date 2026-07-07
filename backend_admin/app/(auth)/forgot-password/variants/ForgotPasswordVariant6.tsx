// app/(auth)/forgot-password/variants/ForgotPasswordVariant5.tsx
'use client';

import { Mail } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import Link from 'next/link';
import { useForgetPasswordForm } from '../../hooks/useForgetPasswordForm';
import { AUTH_IMAGES } from '../../lib/authAssets';

export default function ForgotPasswordVariant6() {
  const {
      formData,
      loading,
      error,
      handleInputChange,
      handleValidationChange,
      handleSubmit,
      formValid,
  } = useForgetPasswordForm();

 const isFormValid = formValid.email;

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

      {/* Right Form */}
      <div className="flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-lg border p-12 rounded-2xl shadow-md">
          <div className="text-center mb-6">
            <Mail className="w-12 h-12 mx-auto text-black mb-2" />
            <h1 className="text-2xl font-bold text-red-600">Forgot Password?</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && 
              <p className="p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                {error}
              </p>
            }
            <FormField label="Email" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                validationRules={{ required: true, email: true }}
                onValidationChange={handleValidationChange('email')}
                leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
              />
            </FormField>
            <Button type="submit" loading={loading} disabled={!isFormValid} fullWidth variant="outline" color="red" hoverColor="red" className="border-red-600 shadow-lg">
              {loading ? 'Sending...' : 'Send Reset Link'}
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