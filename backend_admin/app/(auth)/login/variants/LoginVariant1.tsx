// app/(auth)/login/variants/LoginVariant1.tsx
'use client';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import { useLoginForm } from '../../hooks/useLoginForm';
import { APP_CONSTANT } from '../../../config/Constant';

export default function Variant1() {
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
    <div
      className="flex flex-col min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Main content */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg"
              style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}
            >
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
              {APP_CONSTANT.name}
            </h1>
            <p style={{ color: 'var(--form-text-caption)' }}>Client Operations Management</p>
          </div>

          {/* Card */}
          <div
            className="rounded-lg shadow-xl p-8"
            style={{ background: 'var(--card-bg)', color: 'var(--card-text)' }}
          >
            <h2 className="text-2xl font-bold" style={{ color: 'var(--card-text)' }}>
              Welcome back
            </h2>
            <p className="mb-6" style={{ color: 'var(--form-text-caption)' }}>
              Please sign in to your account
            </p>

            {error && (
              <div className="mb-4 p-4 rounded-lg" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: 'var(--formfield-error)' }}>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Email Address" htmlFor="email" required>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  leftIcon={<Mail className="w-5 h-5" style={{ color: 'var(--form-text-caption)' }} />}
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
                  leftIcon={<Lock className="w-5 h-5" style={{ color: 'var(--form-text-caption)' }} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ color: 'var(--form-text-caption)' }}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                  <span className="ml-2 text-sm" style={{ color: 'var(--form-text-caption)' }}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm"
                  style={{ color: 'var(--link-color)' }}
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" loading={loading} disabled={!isFormValid} fullWidth>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="py-6 text-center text-sm border-t backdrop-blur-sm"
        style={{ background: 'var(--card-bg)', color: 'var(--form-text-caption)', borderColor: 'var(--border-color)' }}
      >
        © {new Date().getFullYear()} <span className="font-semibold">{APP_CONSTANT.name}</span>. All rights reserved.
      </footer>
    </div>
  );
}