'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiUser, FiChefHat } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { MdRestaurantMenu } from 'react-icons/md';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import useForm, { validationRules } from '@/hooks/useForm';
import { cn } from '@/lib/utils';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = searchParams?.get('redirect') || '/recipes';
  const message = searchParams?.get('message');

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError,
  } = useForm<LoginFormData>({
    initialValues: {
      email: 'demo@zauberkoch.com',
      password: 'demo123',
      rememberMe: true,
    },
    validationSchema: {
      email: {
        ...validationRules.required(),
        ...validationRules.email(),
      },
      password: {
        ...validationRules.required('Passwort ist erforderlich'),
      },
    },
    onSubmit: async (formData) => {
      try {
        await login({
          email: formData.email,
          password: formData.password,
        });
        
        toast.success('Erfolgreich angemeldet! 🎉');
        router.push(redirectTo);
      } catch (error: any) {
        const errorMessage = error?.message || 'Anmeldung fehlgeschlagen';
        
        // Set specific field errors based on error type
        if (errorMessage.includes('email') || errorMessage.includes('E-Mail')) {
          setFieldError('email', errorMessage);
        } else if (errorMessage.includes('password') || errorMessage.includes('Passwort')) {
          setFieldError('password', errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    },
  });

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success('Google-Anmeldung erfolgreich! 🎉');
    } catch (error: any) {
      toast.error(error?.message || 'Google-Anmeldung fehlgeschlagen');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-background-darker via-background-dark to-background-darker" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card glass-effect shadow-xl border border-outline/20">
          <div className="card-header text-center pb-6 border-b border-outline/20">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-4"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <MdRestaurantMenu className="text-4xl text-accent-blue" />
                <h1 className="text-3xl font-bold text-gradient">ZauberKoch</h1>
              </div>
              <p className="text-sm text-secondary">Deine KI-gestützte Rezept-Magie</p>
            </motion.div>
            <h2 className="text-2xl font-semibold text-primary mb-2">Willkommen zurück!</h2>
            <p className="text-secondary">
              Melde dich an und entdecke neue Rezepte
            </p>
            
            {/* Demo Account Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="mt-4 p-3 alert-info rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FiUser className="text-accent-blue" />
                <p className="text-sm font-medium">
                  Demo-Account vorausgefüllt - einfach auf "Anmelden" klicken!
                </p>
              </div>
            </motion.div>
          </div>

          <div className="card-content p-6">
            {/* Redirect Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 alert alert-info"
              >
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{message}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="form-group"
              >
                <label htmlFor="email" className="form-label">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-on-surface-variant" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className="form-input pl-10"
                    placeholder="deine@email.com"
                    value={values.email}
                    onChange={(e) => handleChange('email')(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    autoComplete="email"
                    required
                  />
                  {touched.email && errors.email && (
                    <span className="form-error">{errors.email}</span>
                  )}
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="form-group"
              >
                <label htmlFor="password" className="form-label">
                  Passwort
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-on-surface-variant" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pl-10 pr-10"
                    placeholder="••••••••"
                    value={values.password}
                    onChange={(e) => handleChange('password')(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-on-surface-variant hover:text-primary transition-colors" />
                    ) : (
                      <FiEye className="text-on-surface-variant hover:text-primary transition-colors" />
                    )}
                  </button>
                  {touched.password && errors.password && (
                    <span className="form-error">{errors.password}</span>
                  )}
                </div>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="flex items-center justify-between mb-6"
              >
                <label className="form-check">
                  <input
                    type="checkbox"
                    checked={values.rememberMe}
                    onChange={(e) => handleChange('rememberMe')(e.target.checked.toString())}
                    className="form-check-input"
                  />
                  <span className="text-sm text-secondary ml-2">Angemeldet bleiben</span>
                </label>
                
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-accent-blue hover:text-primary-light transition-colors"
                >
                  Passwort vergessen?
                </Link>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⚪</span>
                      Anmelden...
                    </>
                  ) : (
                    'Anmelden'
                  )}
                </button>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="relative flex items-center justify-center my-6"
              >
                <div className="divider flex-grow"></div>
                <span className="px-4 text-sm text-secondary bg-card-background">oder</span>
                <div className="divider flex-grow"></div>
              </motion.div>

              {/* Google Login */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <button
                  type="button"
                  className="btn btn-outline btn-lg btn-full"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                >
                  <FcGoogle size={20} />
                  Mit Google anmelden
                </button>
              </motion.div>
            </form>

            {/* Sign Up Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-secondary">
                Noch kein Konto?{' '}
                <Link
                  href="/auth/register"
                  className="text-accent-blue hover:text-primary-light font-medium transition-colors"
                >
                  Jetzt registrieren
                </Link>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-secondary">
            Mit der Anmeldung akzeptierst du unsere{' '}
            <Link href="/terms" className="text-accent-blue hover:underline">
              AGB
            </Link>{' '}
            und{' '}
            <Link href="/privacy" className="text-accent-blue hover:underline">
              Datenschutzerklärung
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default LoginForm;