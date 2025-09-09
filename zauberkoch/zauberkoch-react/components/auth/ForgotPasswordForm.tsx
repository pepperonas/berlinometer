'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiSend, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import useForm, { validationRules } from '@/hooks/useForm';
import { useState } from 'react';

interface ForgotPasswordFormData {
  email: string;
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

export function ForgotPasswordForm() {
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  } = useForm<ForgotPasswordFormData>({
    initialValues: {
      email: '',
    },
    validationSchema: {
      email: {
        ...validationRules.required(),
        ...validationRules.email(),
      },
    },
    onSubmit: async (formData) => {
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Fehler beim Senden der E-Mail');
        }

        setSentEmail(formData.email);
        setIsEmailSent(true);
        toast.success('E-Mail erfolgreich gesendet! 📧');
      } catch (error: any) {
        toast.error(error?.message || 'Fehler beim Senden der E-Mail');
      }
    },
  });

  const handleSendAgain = () => {
    setIsEmailSent(false);
    setSentEmail('');
    resetForm();
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-surface">
        {/* Success Hero Background */}
        <div className="bg-gradient-to-br from-success to-emerald-600 text-white">
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
                ✅ E-Mail gesendet
              </motion.div>
              
              <motion.h1 
                className="text-4xl lg:text-5xl font-bold mb-6 leading-tight"
                variants={itemVariants}
              >
                Prüfe deine E-Mails
              </motion.h1>
              
              <motion.p 
                className="text-xl text-green-100 leading-relaxed"
                variants={itemVariants}
              >
                Wir haben dir einen sicheren Link zum Zurücksetzen deines Passworts gesendet.
              </motion.p>
            </motion.div>
          </div>
        </div>

        {/* Success Content */}
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
              <div className="text-center mb-8">
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <FiCheckCircle className="text-white" size={32} />
                </motion.div>
                <h2 className="text-2xl font-bold text-success mb-2">E-Mail erfolgreich gesendet!</h2>
                <p className="text-on-surface-variant">
                  Folge den Anweisungen in der E-Mail, um dein Passwort zurückzusetzen.
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-success/5 to-emerald-500/5 border border-success/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center text-white text-sm">
                      <FiMail />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">E-Mail gesendet an:</p>
                      <p className="text-sm text-on-surface-variant break-all">{sentEmail}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-on-surface-variant space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-info">📬</span>
                      <span><strong>Schau in deinen Posteingang</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-warning">⏰</span>
                      <span>Der Link ist 1 Stunde gültig</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-error">🗑️</span>
                      <span>Prüfe auch deinen Spam-Ordner</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleSendAgain}
                    className="w-full btn btn-primary py-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                  >
                    <FiSend className="mr-2" />
                    Erneut senden
                  </button>

                  <Link href="/auth/login">
                    <button className="w-full btn btn-outline py-3 border-2 hover:bg-primary hover:text-white">
                      <FiArrowLeft className="mr-2" />
                      Zurück zur Anmeldung
                    </button>
                  </Link>
                </div>

                <div className="text-center text-sm text-on-surface-variant">
                  <p>
                    Probleme?{' '}
                    <Link href="/contact" className="text-primary hover:text-primary-dark transition-colors font-medium">
                      Kontaktiere unseren Support
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Background */}
      <div className="bg-gradient-to-br from-warning to-orange-500 text-white">
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
              🔐 Passwort vergessen
            </motion.div>
            
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              Kein Problem!
            </motion.h1>
            
            <motion.p 
              className="text-xl text-orange-100 leading-relaxed"
              variants={itemVariants}
            >
              Gib deine E-Mail-Adresse ein und wir senden dir einen sicheren Link zum Zurücksetzen deines Passworts.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Reset Form */}
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="deine@email.com"
                    value={values.email}
                    onChange={(e) => handleChange('email')(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    autoComplete="email"
                    autoFocus
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
                  <p className="text-xs text-on-surface-variant mt-1">Wir senden dir einen sicheren Reset-Link</p>
                </div>
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
                      Sende E-Mail...
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" />
                      Reset-Link senden
                    </>
                  )}
                </button>
              </motion.div>

              {/* Back to Login */}
              <motion.div
                variants={itemVariants}
              >
                <Link href="/auth/login">
                  <button
                    type="button"
                    className="w-full btn btn-outline py-3 border-2 hover:bg-primary hover:text-white"
                  >
                    <FiArrowLeft className="mr-2" />
                    Zurück zur Anmeldung
                  </button>
                </Link>
              </motion.div>
            </form>

            {/* Security Info */}
            <motion.div
              className="mt-8 p-4 bg-gradient-to-br from-info/5 to-blue-500/5 border border-info/20 rounded-xl"
              variants={itemVariants}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-info to-blue-600 rounded-full flex items-center justify-center text-white text-sm mt-0.5">
                  💡
                </div>
                <div>
                  <h4 className="font-semibold text-info mb-2">Sicherheitshinweis</h4>
                  <ul className="text-sm text-on-surface-variant space-y-1">
                    <li>• Der Reset-Link ist nur 1 Stunde gültig</li>
                    <li>• Verwende ihn nur, wenn du ihn angefordert hast</li>
                    <li>• Teile den Link niemals mit anderen</li>
                    <li>• Bei Problemen kontaktiere unseren Support</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Register Link */}
            <motion.div
              className="mt-6 text-center"
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
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;