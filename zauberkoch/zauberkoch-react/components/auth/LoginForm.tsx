'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiUser } from 'react-icons/fi';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

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
    <div className="min-h-screen bg-surface">
      {/* Hero Background */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="container py-16 lg:py-20">
          <motion.div 
            className="text-center max-w-2xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-full text-sm font-semibold mb-6"
              variants={itemVariants}
            >
              🔑 Willkommen zurück
            </motion.div>
            
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              Anmelden bei ZauberKoch
            </motion.h1>
            
            <motion.p 
              className="text-xl text-primary-light leading-relaxed"
              variants={itemVariants}
            >
              Melde dich an und entdecke neue kulinarische Abenteuer mit KI-gestützten Rezepten.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Login Form */}
      <div className="container py-16 lg:py-20">
        <motion.div 
          className="max-w-md mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="card p-8 shadow-xl border border-outline/20"
            variants={itemVariants}
          >
            {/* Demo Account Info */}
            <motion.div
              className="mb-6 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm">
                  <FiUser />
                </div>
                <div>
                  <p className="font-semibold text-sm">Demo-Account vorausgefüllt</p>
                  <p className="text-xs text-on-surface-variant">Einfach auf "Anmelden" klicken!</p>
                </div>
              </div>
            </motion.div>

            {/* Redirect Message */}
            {message && (
              <motion.div
                className="mb-6 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                variants={itemVariants}
              >
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="flex-shrink-0 mt-0.5 text-amber-600" />
                  <p className="text-sm font-medium">{message}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <motion.div
                className="space-y-2"
                variants={itemVariants}
              >
                <label htmlFor="email" className="block text-sm font-semibold text-on-surface">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-on-surface-variant" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                      touched.email && errors.email
                        ? 'border-error bg-error/5 focus:border-error'
                        : 'border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface'
                    }`}
                    placeholder="deine@email.com"
                    value={values.email}
                    onChange={(e) => handleChange('email')(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    autoComplete="email"
                    required
                  />
                  {touched.email && errors.email && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="block text-sm text-error mt-1 font-medium"
                    >
                      {errors.email}
                    </motion.span>
                  )}
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                className="space-y-2"
                variants={itemVariants}
              >
                <label htmlFor="password" className="block text-sm font-semibold text-on-surface">
                  Passwort
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-on-surface-variant" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                      touched.password && errors.password
                        ? 'border-error bg-error/5 focus:border-error'
                        : 'border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface'
                    }`}
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
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="block text-sm text-error mt-1 font-medium"
                    >
                      {errors.password}
                    </motion.span>
                  )}
                </div>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                className="flex items-center justify-between"
                variants={itemVariants}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.rememberMe}
                    onChange={(e) => handleChange('rememberMe')(e.target.checked.toString())}
                    className="w-4 h-4 text-primary border-outline/30 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-on-surface-variant">Angemeldet bleiben</span>
                </label>
                
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:text-primary-dark transition-colors font-medium"
                >
                  Passwort vergessen?
                </Link>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                variants={itemVariants}
              >
                <button
                  type="submit"
                  className="w-full btn btn-primary btn-lg py-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⚪</span>
                      Anmelden...
                    </>
                  ) : (
                    <>
                      🔓 Anmelden
                    </>
                  )}
                </button>
              </motion.div>

              {/* Divider */}
              <motion.div
                className="relative flex items-center justify-center py-4"
                variants={itemVariants}
              >
                <div className="flex-grow border-t border-outline/30"></div>
                <span className="px-4 text-sm text-on-surface-variant bg-surface">oder</span>
                <div className="flex-grow border-t border-outline/30"></div>
              </motion.div>

              {/* Google Login */}
              <motion.div
                variants={itemVariants}
              >
                <button
                  type="button"
                  className="w-full btn btn-outline py-4 opacity-50 cursor-not-allowed border-2"
                  disabled={true}
                  title="Google OAuth ist offline nicht verfügbar"
                >
                  <FcGoogle size={20} className="mr-2" />
                  Mit Google anmelden (Offline)
                </button>
              </motion.div>
            </form>

            {/* Sign Up Link */}
            <motion.div
              className="mt-8 text-center"
              variants={itemVariants}
            >
              <p className="text-sm text-on-surface-variant">
                Noch kein Konto?{' '}
                <Link
                  href="/auth/register"
                  className="text-primary hover:text-primary-dark font-semibold transition-colors"
                >
                  Jetzt registrieren
                </Link>
              </p>
            </motion.div>

            {/* Terms & Privacy */}
            <motion.div
              className="mt-6 text-center"
              variants={itemVariants}
            >
              <p className="text-xs text-on-surface-variant">
                Mit der Anmeldung akzeptierst du unsere{' '}
                <Link href="/terms" className="text-primary hover:text-primary-dark transition-colors">
                  AGB
                </Link>{' '}
                und{' '}
                <Link href="/privacy" className="text-primary hover:text-primary-dark transition-colors">
                  Datenschutzerklärung
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginForm;