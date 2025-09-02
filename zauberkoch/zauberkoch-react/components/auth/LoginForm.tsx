'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
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
      email: '',
      password: '',
      rememberMe: false,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center justify-center gap-2 text-2xl font-bold text-primary mb-2"
            >
              🍳 <span>ZauberKoch</span>
            </motion.div>
            <CardTitle className="text-2xl font-bold">Willkommen zurück!</CardTitle>
            <p className="text-on-surface-variant mt-2">
              Melde dich an und entdecke neue Rezepte
            </p>
          </CardHeader>

          <CardContent>
            {/* Redirect Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-info/10 border border-info/20 rounded-lg flex items-start gap-3"
              >
                <FiAlertCircle className="text-info flex-shrink-0 mt-0.5" />
                <p className="text-sm text-info font-medium">{message}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Input
                  id="email"
                  type="email"
                  label="E-Mail-Adresse"
                  placeholder="deine@email.com"
                  value={values.email}
                  onChange={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={touched.email && errors.email ? errors.email : ''}
                  leftIcon={<FiMail size={20} />}
                  autoComplete="email"
                  required
                />
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Input
                  id="password"
                  type="password"
                  label="Passwort"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange('password')}
                  onBlur={handleBlur('password')}
                  error={touched.password && errors.password ? errors.password : ''}
                  leftIcon={<FiLock size={20} />}
                  autoComplete="current-password"
                  required
                />
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.rememberMe}
                    onChange={(e) => handleChange('rememberMe')(e.target.checked.toString())}
                    className="w-4 h-4 text-primary bg-background border-outline rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-on-surface">Angemeldet bleiben</span>
                </label>
                
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:text-primary-dark transition-colors"
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
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Anmelden
                </Button>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="relative flex items-center justify-center"
              >
                <div className="border-t border-outline flex-grow"></div>
                <span className="px-4 text-sm text-on-surface-variant bg-background">oder</span>
                <div className="border-t border-outline flex-grow"></div>
              </motion.div>

              {/* Google Login */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={handleGoogleLogin}
                  leftIcon={<FcGoogle size={20} />}
                  disabled={isSubmitting}
                >
                  Mit Google anmelden
                </Button>
              </motion.div>
            </form>

            {/* Sign Up Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-on-surface-variant">
                Noch kein Konto?{' '}
                <Link
                  href="/auth/register"
                  className="text-primary hover:text-primary-dark font-medium transition-colors"
                >
                  Jetzt registrieren
                </Link>
              </p>
            </motion.div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-on-surface-variant">
            Mit der Anmeldung akzeptierst du unsere{' '}
            <Link href="/terms" className="text-primary hover:underline">
              AGB
            </Link>{' '}
            und{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Datenschutzerklärung
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default LoginForm;