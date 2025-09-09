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
  FiCheck,
  FiEye,
  FiEyeOff
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
    
    if (strength <= 2) return { label: 'Schwach', color: 'bg-error', textColor: 'text-error', width: 20 };
    if (strength <= 3) return { label: 'Mittel', color: 'bg-warning', textColor: 'text-warning', width: 40 };
    if (strength <= 4) return { label: 'Gut', color: 'bg-info', textColor: 'text-info', width: 70 };
    return { label: 'Sehr stark', color: 'bg-success', textColor: 'text-success', width: 100 };
  };

  const passwordStrength = getPasswordStrength(values.password);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Background */}
      <div className="bg-gradient-to-br from-secondary to-secondary-dark text-white">
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
              👤 Neues Konto erstellen
            </motion.div>
            
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              Registrierung bei ZauberKoch
            </motion.h1>
            
            <motion.p 
              className="text-xl text-secondary-light leading-relaxed"
              variants={itemVariants}
            >
              Erstelle dein kostenloses Konto und entdecke unbegrenzte kulinarische Möglichkeiten mit KI.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="container py-16 lg:py-20">
        <motion.div 
          className="max-w-2xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="card p-8 shadow-xl border border-outline/20"
            variants={itemVariants}
          >
            {referralCode && (
              <motion.div
                className="mb-6 p-4 rounded-xl bg-gradient-to-br from-success/10 to-emerald-500/10 border border-success/20"
                variants={itemVariants}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center text-white text-sm">
                    <FiGift />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-success">🎉 Du erhältst 3 Monate Premium gratis!</p>
                    <p className="text-xs text-on-surface-variant">Referral-Code: {referralCode}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={itemVariants}
              >
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-semibold text-on-surface">
                    Vorname <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-on-surface-variant" />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                        touched.firstName && errors.firstName
                          ? 'border-error bg-error/5 focus:border-error'
                          : 'border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface'
                      }`}
                      placeholder="Max"
                      value={values.firstName}
                      onChange={(e) => handleChange('firstName')(e.target.value)}
                      onBlur={() => handleBlur('firstName')}
                      autoComplete="given-name"
                      required
                    />
                    {touched.firstName && errors.firstName && (
                      <motion.span 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="block text-sm text-error mt-1 font-medium"
                      >
                        {errors.firstName}
                      </motion.span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-semibold text-on-surface">
                    Nachname <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-on-surface-variant" />
                    </div>
                    <input
                      id="lastName"
                      type="text"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                        touched.lastName && errors.lastName
                          ? 'border-error bg-error/5 focus:border-error'
                          : 'border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface'
                      }`}
                      placeholder="Mustermann"
                      value={values.lastName}
                      onChange={(e) => handleChange('lastName')(e.target.value)}
                      onBlur={() => handleBlur('lastName')}
                      autoComplete="family-name"
                      required
                    />
                    {touched.lastName && errors.lastName && (
                      <motion.span 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="block text-sm text-error mt-1 font-medium"
                      >
                        {errors.lastName}
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Username Field */}
              <motion.div
                className="space-y-2"
                variants={itemVariants}
              >
                <label htmlFor="username" className="block text-sm font-semibold text-on-surface">
                  Benutzername <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUsers className="text-on-surface-variant" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                      touched.username && errors.username
                        ? 'border-error bg-error/5 focus:border-error'
                        : 'border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface'
                    }`}
                    placeholder="max_koch"
                    value={values.username}
                    onChange={(e) => handleChange('username')(e.target.value)}
                    onBlur={() => handleBlur('username')}
                    autoComplete="username"
                    required
                  />
                  {touched.username && errors.username && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="block text-sm text-error mt-1 font-medium"
                    >
                      {errors.username}
                    </motion.span>
                  )}
                  <p className="text-xs text-on-surface-variant mt-1">3-20 Zeichen, nur Buchstaben, Zahlen und Unterstriche</p>
                </div>
              </motion.div>

              {/* Email Field */}
              <motion.div
                className="space-y-2"
                variants={itemVariants}
              >
                <label htmlFor="email" className="block text-sm font-semibold text-on-surface">
                  E-Mail-Adresse <span className="text-error">*</span>
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
                    placeholder="max@beispiel.com"
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

              {/* Password Field with Strength Indicator */}
              <motion.div
                className="space-y-2"
                variants={itemVariants}
              >
                <label htmlFor="password" className="block text-sm font-semibold text-on-surface">
                  Passwort <span className="text-error">*</span>
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
                    autoComplete="new-password"
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
                
                {values.password && (
                  <div className="space-y-2 mt-3">
                    {/* Password Strength Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-variant/50 rounded-full h-2">
                        <motion.div 
                          className={cn("h-2 rounded-full transition-all duration-300", passwordStrength.color)}
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength.width}%` }}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", passwordStrength.textColor)}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    
                    {/* Password Requirements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs p-3 bg-surface-variant/20 rounded-lg">
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
                          <motion.div 
                            key={index} 
                            className={cn(
                              "flex items-center gap-1 transition-colors",
                              isValid ? "text-success" : "text-on-surface-variant"
                            )}
                            animate={{ scale: isValid ? 1.02 : 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <FiCheck size={12} className={isValid ? "opacity-100" : "opacity-30"} />
                            {req}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Confirm Password Field */}
              <motion.div
                className="space-y-2"
                variants={itemVariants}
              >
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-on-surface">
                  Passwort bestätigen <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-on-surface-variant" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                      touched.confirmPassword && errors.confirmPassword
                        ? 'border-error bg-error/5 focus:border-error'
                        : 'border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface'
                    }`}
                    placeholder="••••••••"
                    value={values.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword')(e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="text-on-surface-variant hover:text-primary transition-colors" />
                    ) : (
                      <FiEye className="text-on-surface-variant hover:text-primary transition-colors" />
                    )}
                  </button>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="block text-sm text-error mt-1 font-medium"
                    >
                      {errors.confirmPassword}
                    </motion.span>
                  )}
                </div>
              </motion.div>

              {/* Language & Referral */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={itemVariants}
              >
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface">
                    Sprache <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiGlobe className="text-on-surface-variant" />
                    </div>
                    <select
                      value={values.language}
                      onChange={(e) => handleChange('language')(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all duration-300 focus:outline-none focus:ring-0"
                    >
                      <option value="de">Deutsch</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="referralCode" className="block text-sm font-semibold text-on-surface">
                    Referral-Code (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiGift className="text-on-surface-variant" />
                    </div>
                    <input
                      id="referralCode"
                      type="text"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all duration-300 focus:outline-none focus:ring-0"
                      placeholder="FRIEND123"
                      value={values.referralCode}
                      onChange={(e) => handleChange('referralCode')(e.target.value)}
                      onBlur={() => handleBlur('referralCode')}
                    />
                    <p className="text-xs text-success mt-1">3 Monate Premium gratis!</p>
                  </div>
                </div>
              </motion.div>

              {/* Terms and Marketing */}
              <motion.div
                className="space-y-4 p-4 bg-surface-variant/20 rounded-xl"
                variants={itemVariants}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.acceptTerms}
                    onChange={(e) => handleChange('acceptTerms')(e.target.checked)}
                    className="w-4 h-4 text-primary border-outline/30 rounded focus:ring-primary focus:ring-2 mt-0.5"
                  />
                  <span className="text-sm text-on-surface leading-relaxed">
                    Ich akzeptiere die{' '}
                    <Link href="/terms" className="text-primary hover:text-primary-dark transition-colors font-medium">
                      Allgemeinen Geschäftsbedingungen
                    </Link>{' '}
                    und die{' '}
                    <Link href="/privacy" className="text-primary hover:text-primary-dark transition-colors font-medium">
                      Datenschutzerklärung
                    </Link>
                    <span className="text-error ml-1">*</span>
                  </span>
                </label>
                {touched.acceptTerms && errors.acceptTerms && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-error text-sm font-medium"
                  >
                    {errors.acceptTerms}
                  </motion.p>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.acceptMarketing}
                    onChange={(e) => handleChange('acceptMarketing')(e.target.checked)}
                    className="w-4 h-4 text-primary border-outline/30 rounded focus:ring-primary focus:ring-2 mt-0.5"
                  />
                  <span className="text-sm text-on-surface leading-relaxed">
                    Ich möchte über neue Features und Rezept-Tipps per E-Mail informiert werden
                  </span>
                </label>
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
                      Konto wird erstellt...
                    </>
                  ) : (
                    <>
                      👤 Konto erstellen
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

              {/* Google Register */}
              <motion.div
                variants={itemVariants}
              >
                <button
                  type="button"
                  className="w-full btn btn-outline py-4 border-2"
                  disabled={isSubmitting}
                  onClick={handleGoogleRegister}
                >
                  <FcGoogle size={20} className="mr-2" />
                  Mit Google registrieren
                </button>
              </motion.div>
            </form>

            {/* Sign In Link */}
            <motion.div
              className="mt-8 text-center"
              variants={itemVariants}
            >
              <p className="text-sm text-on-surface-variant">
                Bereits ein Konto?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary hover:text-primary-dark font-semibold transition-colors"
                >
                  Jetzt anmelden
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default RegisterForm;