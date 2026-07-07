// app/(auth)/login/variants/LoginVariant4.tsx
'use client';

import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import { useLoginForm } from '../../hooks/useLoginForm';
import { AUTH_IMAGES } from '../../lib/authAssets';
import { APP_CONSTANT } from '../../../config/Constant';

export default function Variant4() {
  const {
    formData,
    showPassword,
    setShowPassword,
    loading,
    rememberMe,
    setRememberMe,
    error,
    handleInputChange,
    handleValidationChange,
    handleSubmit,
    formValid,
  } = useLoginForm();

  const isFormValid = formValid.email && formValid.password;

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left side - Image */}
      <div
        className="hidden md:block bg-cover bg-center"
        style={{ backgroundImage: `url('${AUTH_IMAGES.loginBg}')` }}
      />

      {/* Right side - Form */}
      <div className="flex items-center justify-center bg-white px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{APP_CONSTANT.name}</h1>
            <p className="text-gray-600">Client Operations Management</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Email" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
                validationRules={{ required: true, email: true }}
                onValidationChange={handleValidationChange('email')}
              />
            </FormField>

            <FormField label="Password" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
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
                validationRules={{ required: true, minLength: 6 }}
                onValidationChange={handleValidationChange('password')}
              />
            </FormField>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={loading} disabled={!isFormValid} fullWidth>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} <span className="font-semibold">{APP_CONSTANT.name}</span>. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
