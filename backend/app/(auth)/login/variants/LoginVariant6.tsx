'use client';

import { Eye, EyeOff } from 'lucide-react';
import Button from '../../../../components/button/Button';
import Input from '../../../../components/input/Input';
import FormField from '../../../../components/input/FormField';
import { useLoginForm } from '../../hooks/useLoginForm';
import { AUTH_IMAGES } from '../../lib/authAssets';

export default function Variant6() {
  const {
    formData,
    showPassword,
    setShowPassword,
    loading,
    error,
    handleInputChange,
    handleValidationChange,
    handleSubmit,
    formValid,
  } = useLoginForm();

  const isFormValid = formValid.username && formValid.password;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-10xl flex flex-col items-center -mt-70">
        {/* LOGO */}
        <div className="mb-8 flex items-center gap-4">
          <img
            src={AUTH_IMAGES.loginBg}
            alt="Logo"
            className="w-16 h-16 object-contain mb-4"
          />

          <h1 className="text-white tracking-[0.4em] text-3xl md:text-3xl font-light uppercase">
            MEMODISE
          </h1>
        </div>

        {/* LOGIN FORM */}
        <div className="w-full max-w-5xl">
          {error && (
            <div className="mb-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* USERNAME */}
            <FormField htmlFor="username">
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Email"
                value={formData.username}
                onChange={handleInputChange}
                validationRules={{ required: true }}
                onValidationChange={handleValidationChange('username')}
                className="
                  h-8
                  bg-[#e9e9e9]
                  border
                  border-[#bdbdbd]
                  rounded-none
                  text-black
                  placeholder:text-gray-500
                  focus:border-pink-500
                  focus:ring-0
                "
              />
            </FormField>

            {/* PASSWORD */}
            <FormField htmlFor="password">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                validationRules={{ required: true, minLength: 3 }}
                onValidationChange={handleValidationChange('password')}
                className="
                  h-8
                  bg-[#e9e9e9]
                  border
                  border-[#bdbdbd]
                  rounded-none
                  text-black
                  placeholder:text-gray-500
                  focus:border-pink-500
                  focus:ring-0
                "
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-black transition"
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                }
              />
            </FormField>

            {/* LOGIN BUTTON */}
            <Button
              type="submit"
              loading={loading}
              disabled={!isFormValid}
              fullWidth
              className="
                h-7
                rounded-none
                border
                border-white
                bg-black
                text-white
                tracking-[0.2em]
                text-sm
                font-light
                transition-all
                duration-300
              "
            >
              {loading ? 'SIGNING IN...' : 'LOG IN'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}