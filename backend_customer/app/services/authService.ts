// app/services/authService.ts

interface LoginCredentials {
  email: string;
  password: string;
  username: string;
  rememberMe?: boolean;
  portal?: 'admin' | 'customer';
}

interface ForgotPassword {
  email: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  rememberMe?: boolean;
  message?: string;
}

class AuthService {
  private apiEnabled: boolean = false;

  private mockUser: User = {
    id: '1',
    name: 'Admin User',
    email: 'admin@company.com',
    role: 'admin'
  };

  enableApi(enabled: boolean = true) {
    this.apiEnabled = enabled;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[login] called with', credentials);
    console.log('[login] this.apiEnabled =', this.apiEnabled);

    if (!credentials.username || !credentials.password) {
      return { success: false, message: 'Username or email and password are required' };
    }
    if (credentials.password.length < 3) {
      return { success: false, message: 'Password must be at least 3 characters long' };
    }

    if (process.env.NEXT_PUBLIC_API_ENABLED === 'TRUE') {
      console.log('[login] -> using REAL API');

      try {
        const res = await fetch(`/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
            rememberMe: !!credentials.rememberMe,
            portal: 'customer'
          })
        });

        if (!res.ok) {
          const errorText = await res.json();
          return { success: false, message: errorText.message || 'Login failed' };
        }

        const data = await res.json();

        return {
          success: true,
          user: data.user ?? { email: credentials.email },
          token: data.accessToken,
          rememberMe: data.rememberMe,
          message: 'Login successful'
        };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Network error'
        };
      }
    }

    console.log('[login] -> using MOCK fallback');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user = { ...this.mockUser, email: credentials.email };
    return {
      success: true,
      user,
      message: 'Login successful (mock)'
    };
  }

  async forgotPassword(item: ForgotPassword): Promise<AuthResponse> {
    console.log('[forgotPassword] called with', item);
    console.log('[forgotPassword] this.apiEnabled =', this.apiEnabled);

    if (!item.email) {
      return { success: false, message: 'Email is required' };
    }
    if (process.env.NEXT_PUBLIC_API_ENABLED === 'TRUE') {
      console.log('[forgotPassword] -> using REAL API');

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: item.email }),
        });

        const result = await response.json();

        if (!response.ok) {
          return {
            success: false,
            message: result.message || 'Email not found',
          };
        }

        return {
          success: true,
          message: result.message || 'Reset link sent to your email.',
        };
      } catch (error) {
        console.error('Forgot password error:', error);
        return {
          success: false,
          message: 'Network error occurred',
        };
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: 'If the email exists, a reset link has been sent (mock).',
    };
  }

  async logout(): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }

  async getCurrentUser(): Promise<User | null> {
    return this.mockUser;
  }

  async validateToken(token: string): Promise<boolean> {
    return !!token;
  }

  hasPermission(permission: string): boolean {
    return this.mockUser.role === 'admin';
  }

  private async realLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Login failed'
        };
      }

      return {
        success: true,
        user: data.user,
        token: data.token
      };
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  private async realForgotPassword(data: { email: string }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Request failed',
        };
      }

      return {
        success: true,
        message: result.message || 'Reset link sent to your email.',
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  async resetPassword(token: string, formData: { password: string; confirm: string }): Promise<AuthResponse> {
    console.log('[resetPassword] called with token and newPassword');
    if (formData.password !== formData.confirm) {
      console.log('[resetPassword] passwords do not match');
      return { success: false, message: 'Passwords do not match.' };
    }

    if (process.env.NEXT_PUBLIC_API_ENABLED === 'TRUE') {
      console.log('[resetPassword] -> using REAL API');
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, password: formData.password }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.log('[resetPassword] API response not ok');
          return {
            success: false,
            message: result.message || 'Reset failed',
          };
        }
        console.log('[resetPassword] password reset successful');
        return {
          success: true,
          message: result.message || 'Password has been reset successfully.',
        };
      } catch (error) {
        console.error('Reset password error:', error);
        return {
          success: false,
          message: 'Network error occurred',
        };
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: 'Password has been reset successfully (mock).',
    };
  }
}

const authService = new AuthService();

export default authService;
export type { LoginCredentials, User, AuthResponse };
