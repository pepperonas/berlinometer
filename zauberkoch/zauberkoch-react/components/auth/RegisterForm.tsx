'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FiMail, 
  FiLock, 
  FiUser, 
  FiUsers,
  FiGlobe,
  FiGift,
  FiCheck
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import useForm, { validationRules } from '@/hooks/useForm';
import { cn } from '@/lib/utils';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  language: 'de' | 'en';
  referralCode?: string;
  acceptTerms: boolean;
  acceptMarketing: boolean;
}

const passwordRequirements = [
  'Mindestens 8 Zeichen',
  'Ein Großbuchstabe (A-Z)',
  'Ein Kleinbuchstabe (a-z)',
  'Eine Zahl (0-9)',
  'Ein Sonderzeichen (!@#$%^&*)',
];

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const referralCode = searchParams?.get('ref') || '';

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError,
  } = useForm<RegisterFormData>({
    initialValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      language: 'de',
      referralCode: referralCode,
      acceptTerms: false,
      acceptMarketing: false,
    },
    validationSchema: {
      firstName: {
        ...validationRules.required('Vorname ist erforderlich'),
        ...validationRules.maxLength(50),
      },
      lastName: {
        ...validationRules.required('Nachname ist erforderlich'),
        ...validationRules.maxLength(50),
      },
      username: {
        ...validationRules.required('Benutzername ist erforderlich'),
        ...validationRules.username(),
      },
      email: {
        ...validationRules.required(),
        ...validationRules.email(),
      },
      password: {
        ...validationRules.required(),
        ...validationRules.password(),
      },
      confirmPassword: {
        ...validationRules.required('Passwort bestätigen ist erforderlich'),
        ...validationRules.confirmPassword('password', 'Passwörter stimmen nicht überein'),
      },
      acceptTerms: {
        custom: (value: boolean) => {
          if (!value) return 'Du musst die AGB akzeptieren';
          return true;
        },
      },
    },
    onSubmit: async (formData) => {
      try {
        await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          language: formData.language,
          referralCode: formData.referralCode || undefined,
        });
        
        toast.success('Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse. 📧');
        router.push('/auth/verify-email');
      } catch (error: any) {
        const errorMessage = error?.message || 'Registrierung fehlgeschlagen';
        
        // Set specific field errors based on error type
        if (errorMessage.includes('email') || errorMessage.includes('E-Mail')) {
          setFieldError('email', errorMessage);
        } else if (errorMessage.includes('username') || errorMessage.includes('Benutzername')) {
          setFieldError('username', errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    },
  });

  const handleGoogleRegister = async () => {
    try {
      await loginWithGoogle();
      toast.success('Google-Registrierung erfolgreich! 🎉');
    } catch (error: any) {
      toast.error(error?.message || 'Google-Registrierung fehlgeschlagen');
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*]/.test(password),
    ];
    
    strength = checks.filter(Boolean).length;
    
    if (strength <= 2) return { label: 'Schwach', color: 'bg-error', textColor: 'text-error' };
    if (strength <= 3) return { label: 'Mittel', color: 'bg-warning', textColor: 'text-warning' };
    if (strength <= 4) return { label: 'Gut', color: 'bg-info', textColor: 'text-info' };
    return { label: 'Sehr stark', color: 'bg-success', textColor: 'text-success' };
  };

  const passwordStrength = getPasswordStrength(values.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center justify-center gap-2 text-2xl font-bold text-primary mb-2"
            >
              🍳 <span>ZauberKoch</span>
            </motion.div>
            <CardTitle className="text-2xl font-bold">Konto erstellen</CardTitle>
            <p className="text-on-surface-variant mt-2">
              Registriere dich und entdecke die Welt der KI-generierten Rezepte
            </p>
            
            {referralCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-3 bg-secondary/10 border border-secondary/20 rounded-lg flex items-center gap-2"
              >
                <FiGift className="text-secondary" />
                <span className="text-sm font-medium text-secondary">
                  🎉 Du erhältst 3 Monate Premium gratis!
                </span>
              </motion.div>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <Input
                  id="firstName"
                  type="text"
                  label="Vorname"
                  placeholder="Max"
                  value={values.firstName}
                  onChange={handleChange('firstName')}
                  onBlur={handleBlur('firstName')}
                  error={touched.firstName && errors.firstName ? errors.firstName : ''}
                  leftIcon={<FiUser size={20} />}
                  autoComplete="given-name"
                  required
                />
                <Input
                  id="lastName"
                  type="text"
                  label="Nachname"
                  placeholder="Mustermann"
                  value={values.lastName}
                  onChange={handleChange('lastName')}
                  onBlur={handleBlur('lastName')}
                  error={touched.lastName && errors.lastName ? errors.lastName : ''}
                  leftIcon={<FiUser size={20} />}
                  autoComplete="family-name"
                  required
                />
              </motion.div>

              {/* Username Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Input
                  id="username"
                  type="text"
                  label="Benutzername"
                  placeholder="max_koch"
                  value={values.username}
                  onChange={handleChange('username')}
                  onBlur={handleBlur('username')}
                  error={touched.username && errors.username ? errors.username : ''}
                  helperText="3-20 Zeichen, nur Buchstaben, Zahlen und Unterstriche"
                  leftIcon={<FiUsers size={20} />}
                  autoComplete="username"
                  required
                />
              </motion.div>

              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <Input
                  id="email"
                  type="email"
                  label="E-Mail-Adresse"
                  placeholder="max@beispiel.com"
                  value={values.email}
                  onChange={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={touched.email && errors.email ? errors.email : ''}
                  leftIcon={<FiMail size={20} />}
                  autoComplete="email"
                  required
                />
              </motion.div>

              {/* Password Field with Strength Indicator */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="space-y-3"
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
                  autoComplete="new-password"
                  required
                />
                
                {values.password && (
                  <div className="space-y-2">
                    {/* Password Strength Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-variant rounded-full h-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            passwordStrength.color
                          )}
                          style={{ width: `${(getPasswordStrength(values.password).label === 'Schwach' ? 20 : 
                                          getPasswordStrength(values.password).label === 'Mittel' ? 40 :
                                          getPasswordStrength(values.password).label === 'Gut' ? 70 : 100)}%` }}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", passwordStrength.textColor)}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    
                    {/* Password Requirements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                      {passwordRequirements.map((req, index) => {
                        let isValid = false;
                        switch (index) {
                          case 0: isValid = values.password.length >= 8; break;
                          case 1: isValid = /[A-Z]/.test(values.password); break;
                          case 2: isValid = /[a-z]/.test(values.password); break;
                          case 3: isValid = /\d/.test(values.password); break;
                          case 4: isValid = /[!@#$%^&*]/.test(values.password); break;
                        }
                        
                        return (
                          <div key={index} className={cn(
                            "flex items-center gap-1",
                            isValid ? "text-success" : "text-on-surface-variant"
                          )}>
                            <FiCheck size={12} className={isValid ? "opacity-100" : "opacity-30"} />
                            {req}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Confirm Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <Input
                  id="confirmPassword"
                  type="password"
                  label="Passwort bestätigen"
                  placeholder="••••••••"
                  value={values.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  error={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : ''}
                  leftIcon={<FiLock size={20} />}
                  autoComplete="new-password"
                  required
                />
              </motion.div>

              {/* Language & Referral */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">
                    Sprache <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <FiGlobe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-on-surface-variant" size={20} />
                    <select
                      value={values.language}
                      onChange={(e) => handleChange('language')(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    >
                      <option value="de">Deutsch</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <Input
                  id="referralCode"
                  type="text"
                  label="Referral-Code (Optional)"
                  placeholder="FRIEND123"
                  value={values.referralCode}
                  onChange={handleChange('referralCode')}
                  onBlur={handleBlur('referralCode')}
                  helperText="3 Monate Premium gratis!"
                  leftIcon={<FiGift size={20} />}
                />
              </motion.div>

              {/* Terms and Marketing */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                className="space-y-3"
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.acceptTerms}
                    onChange={(e) => handleChange('acceptTerms')(e.target.checked.toString())}
                    className="w-4 h-4 text-primary bg-background border-outline rounded focus:ring-primary focus:ring-2 mt-0.5"
                  />
                  <span className="text-sm text-on-surface leading-relaxed">
                    Ich akzeptiere die{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Allgemeinen Geschäftsbedingungen
                    </Link>{' '}
                    und die{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Datenschutzerklärung
                    </Link>
                    <span className="text-error ml-1">*</span>
                  </span>
                </label>
                {touched.acceptTerms && errors.acceptTerms && (
                  <p className="text-error text-sm mt-1">{errors.acceptTerms}</p>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.acceptMarketing}
                    onChange={(e) => handleChange('acceptMarketing')(e.target.checked.toString())}
                    className="w-4 h-4 text-primary bg-background border-outline rounded focus:ring-primary focus:ring-2 mt-0.5"
                  />
                  <span className="text-sm text-on-surface leading-relaxed">
                    Ich möchte über neue Features und Rezept-Tipps per E-Mail informiert werden
                  </span>
                </label>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Konto erstellen
                </Button>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.3 }}
                className="relative flex items-center justify-center"
              >
                <div className="border-t border-outline flex-grow"></div>
                <span className="px-4 text-sm text-on-surface-variant bg-background">oder</span>
                <div className="border-t border-outline flex-grow"></div>
              </motion.div>

              {/* Google Register */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.3 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={handleGoogleRegister}
                  leftIcon={<FcGoogle size={20} />}
                  disabled={isSubmitting}
                >
                  Mit Google registrieren
                </Button>
              </motion.div>
            </form>

            {/* Sign In Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.3 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-on-surface-variant">
                Bereits ein Konto?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary hover:text-primary-dark font-medium transition-colors"
                >
                  Jetzt anmelden
                </Link>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default RegisterForm;