// app/(auth)/hooks/useLoginForm.ts
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import authService from '../../services/authService';
import {
  SESSION_EXPIRED_REASON,
  consumePostLoginRedirect,
  getSessionExpiredMessage,
  storeSessionAccessToken,
  storePostLoginRedirect,
} from '@/app/lib/session-expiration';

const REMEMBER_ME_STORAGE_KEY = 'remember_me_username';

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValid, setFormValid] = useState<Record<string, boolean>>({});

  const redirectParam = searchParams.get('redirect');

  useEffect(() => {
    const savedUsername = localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
    if (!savedUsername) {
      return;
    }

    setFormData((prev) => ({ ...prev, username: savedUsername }));
    setRememberMe(true);
    setFormValid((prev) => ({ ...prev, username: true }));
  }, []);

  useEffect(() => {
    const reason = searchParams.get('reason');

    if (reason === SESSION_EXPIRED_REASON) {
      setError(getSessionExpiredMessage());
    }
  }, [searchParams]);

  useEffect(() => {
    if (redirectParam?.startsWith('/') && !redirectParam.startsWith('//')) {
      storePostLoginRedirect(redirectParam);
    }
  }, [redirectParam]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleValidationChange =
    (fieldName: string) => (isValid: boolean) => {
      setFormValid(prev => ({ ...prev, [fieldName]: isValid }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login({
        ...formData,
        rememberMe,
      });

      if (response.success) {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_STORAGE_KEY, formData.username.trim());
        } else {
          localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
        }
        storeSessionAccessToken(response.token, response.refreshToken);
        router.push(consumePostLoginRedirect() || '/module/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    showPassword,
    setShowPassword,
    loading,
    rememberMe,
    setRememberMe,
    error,
    formValid,
    setFormValid,
    handleInputChange,
    handleValidationChange,
    handleSubmit,
  };
}
