// app/(auth)/login/variants/LoginVariant3.tsx
'use client';

import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import { useLoginForm } from '../../hooks/useLoginForm';
import Link from 'next/link';
import { AUTH_IMAGES } from '../../lib/authAssets';
import { APP_CONSTANT } from '../../../config/Constant';

export default function Variant3() {
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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[var(--bg)] text-[var(--text)]">
      {/* Left side - Form */}
      <div className="flex items-center justify-center px-8 py-12 bg-[var(--form-body-bg)]">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg" style={{ backgroundColor: 'var(--button-bg)' }}>
              <Lock className="w-8 h-8" style={{ color: 'var(--button-text)' }} />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>{APP_CONSTANT.name}</h1>
            <p className="text-sm" style={{ color: 'var(--form-text-caption)' }}>Client Operations Management</p>
          </div>

          {error && (
            <div className="mb-4 p-4 border rounded-lg" style={{ backgroundColor: 'var(--formfield-error)', color: '#fff' }}>
              <p className="text-sm">{error}</p>
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
                leftIcon={<Mail className="w-5 h-5" style={{ color: 'var(--icon-color)' }} />}
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
                leftIcon={<Lock className="w-5 h-5" style={{ color: 'var(--icon-color)' }} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:opacity-75"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" style={{ color: 'var(--icon-color)' }} /> : <Eye className="w-5 h-5" style={{ color: 'var(--icon-color)' }} />}
                  </button>
                }
                validationRules={{ required: true, minLength: 3 }}
                onValidationChange={handleValidationChange('password')}
              />
            </FormField>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 border rounded"
                  style={{ accentColor: 'var(--button-bg)' }}
                />
                <span className="ml-2 text-sm" style={{ color: 'var(--form-text-caption)' }}>Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm hover:underline" style={{ color: 'var(--link-color)' }}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} disabled={!isFormValid} fullWidth>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs" style={{ color: 'var(--form-text-caption)' }}>
            © {new Date().getFullYear()} <span className="font-semibold">{APP_CONSTANT.name}</span>. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div
        className="hidden md:block bg-cover bg-center"
        style={{ backgroundImage: `url('${AUTH_IMAGES.loginBg}')` }}
      />
    </div>
  );
}