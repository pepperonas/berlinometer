'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { User, AuthContextType, LoginCredentials, RegisterData } from '@/types';
import { isPremiumUser } from '@/lib/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth used outside of AuthProvider, returning default values');
    return {
      user: null,
      isLoading: false,
      login: async () => ({ success: false, error: 'Auth context not available' }),
      register: async () => ({ success: false, error: 'Auth context not available' }),
      logout: async () => {},
      checkAuthStatus: async () => {}
    };
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize authentication state
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        // Parse date fields from JSON
        if (userData.user) {
          if (userData.user.premiumExpiration) {
            userData.user.premiumExpiration = new Date(userData.user.premiumExpiration);
          }
          if (userData.user.created) {
            userData.user.created = new Date(userData.user.created);
          }
          if (userData.user.lastSeen) {
            userData.user.lastSeen = new Date(userData.user.lastSeen);
          }
        }
        setUser(userData.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Parse date fields from JSON
      if (data.user) {
        if (data.user.premiumExpiration) {
          data.user.premiumExpiration = new Date(data.user.premiumExpiration);
        }
        if (data.user.created) {
          data.user.created = new Date(data.user.created);
        }
        if (data.user.lastSeen) {
          data.user.lastSeen = new Date(data.user.lastSeen);
        }
      }
      setUser(data.user);
      toast.success('Successfully logged in!');
      router.push('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/auth/verify-email');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setUser(null);
        toast.success('Successfully logged out');
        router.push('/');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if server logout fails
      setUser(null);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = '/api/auth/google';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google login failed';
      toast.error(message);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      // Parse date fields from JSON
      if (data.user) {
        if (data.user.premiumExpiration) {
          data.user.premiumExpiration = new Date(data.user.premiumExpiration);
        }
        if (data.user.created) {
          data.user.created = new Date(data.user.created);
        }
        if (data.user.lastSeen) {
          data.user.lastSeen = new Date(data.user.lastSeen);
        }
      }
      setUser(data.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }

      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset request failed';
      toast.error(message);
      throw error;
    }
  };

  // Reset password with token
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      toast.success('Password reset successful! You can now log in with your new password.');
      router.push('/auth/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      toast.error(message);
      throw error;
    }
  };

  // Verify email with token
  const verifyEmail = async (token: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Email verification failed');
      }

      // Update user state if logged in
      if (user) {
        setUser({ ...user, verified: true });
      }

      toast.success('Email verified successfully!');
      router.push('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email verification failed';
      toast.error(message);
      throw error;
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend verification email';
      toast.error(message);
      throw error;
    }
  };

  // Change password (for authenticated users)
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      toast.success('Password changed successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      toast.error(message);
      throw error;
    }
  };

  // Delete account
  const deleteAccount = async (password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Account deletion failed');
      }

      setUser(null);
      toast.success('Account deleted successfully');
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Account deletion failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if user is premium (handles demo user and date parsing)
  const checkUserPremium = (user: User | null): boolean => {
    if (!user) return false;
    
    // Demo user always has premium
    if (user.id === 'demo-user-001' || user.email === 'demo@zauberkoch.com') {
      return true;
    }
    
    // Handle date parsing for premium expiration
    if (!user.premiumExpiration) return false;
    
    const premiumDate = typeof user.premiumExpiration === 'string' 
      ? new Date(user.premiumExpiration)
      : user.premiumExpiration;
    
    return premiumDate > new Date();
  };

  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    loginWithGoogle,
    updateUser,
    isLoading,
    isPremium: checkUserPremium(user),
    // Additional methods
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    changePassword,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return function WithAuthComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/auth/login');
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Hook for premium features
export function usePremium() {
  const { user, isPremium } = useAuth();
  
  const checkPremiumAccess = (feature: string): boolean => {
    if (!user) {
      console.log(`Premium feature attempted without user: ${feature}`);
      return false;
    }
    
    // Demo user always has premium access
    if (user.id === 'demo-user-001' || user.email === 'demo@zauberkoch.com') {
      console.log(`Demo user accessing premium feature: ${feature}`);
      return true;
    }
    
    if (isPremium) {
      console.log(`Premium user accessing feature: ${feature}, User: ${user.email}`);
      return true;
    }
    
    // Log feature access attempt for analytics
    console.log(`Premium feature blocked: ${feature}, User: ${user.email}, isPremium: ${isPremium}`);
    return false;
  };
  
  const showUpgradePrompt = (feature: string) => {
    // Don't show upgrade prompt for demo user
    if (user && (user.id === 'demo-user-001' || user.email === 'demo@zauberkoch.com')) {
      console.log('Skipping upgrade prompt for demo user');
      return;
    }
    
    toast.error(`Daily limit reached. Upgrade to premium for unlimited ${feature.toLowerCase()}.`, {
      duration: 5000,
    });
  };
  
  return {
    isPremium,
    checkPremiumAccess,
    showUpgradePrompt,
  };
}

// Export additional types for extended auth context
export interface ExtendedAuthContextType extends AuthContextType {
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

export default AuthProvider;