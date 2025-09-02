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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex justify-center mb-4"
              >
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="text-success" size={32} />
                </div>
              </motion.div>
              <CardTitle className="text-2xl font-bold text-success">E-Mail gesendet!</CardTitle>
              <p className="text-on-surface-variant mt-2">
                Wir haben dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts gesendet.
              </p>
            </CardHeader>

            <CardContent>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-surface-variant rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FiMail className="text-info" size={20} />
                    <div>
                      <p className="font-medium text-on-surface">E-Mail gesendet an:</p>
                      <p className="text-sm text-on-surface-variant">{sentEmail}</p>
                    </div>
                  </div>
                  <div className="text-sm text-on-surface-variant">
                    <p className="mb-2">📬 <strong>Schau in deinen Posteingang</strong></p>
                    <p className="mb-2">⏰ Der Link ist 1 Stunde gültig</p>
                    <p className="mb-2">🗑️ Prüfe auch deinen Spam-Ordner</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    size="lg"
                    fullWidth
                    onClick={handleSendAgain}
                    leftIcon={<FiSend />}
                  >
                    Erneut senden
                  </Button>

                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      leftIcon={<FiArrowLeft />}
                    >
                      Zurück zur Anmeldung
                    </Button>
                  </Link>
                </div>

                <div className="text-center text-sm text-on-surface-variant">
                  <p>
                    Probleme? <Link href="/contact" className="text-primary hover:underline">Kontaktiere unseren Support</Link>
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
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
            <CardTitle className="text-2xl font-bold">Passwort vergessen?</CardTitle>
            <p className="text-on-surface-variant mt-2">
              Kein Problem! Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
            </p>
          </CardHeader>

          <CardContent>
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
                  helperText="Wir senden dir einen sicheren Link zum Zurücksetzen"
                  leftIcon={<FiMail size={20} />}
                  autoComplete="email"
                  autoFocus
                  required
                />
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  leftIcon={<FiSend />}
                >
                  Reset-Link senden
                </Button>
              </motion.div>

              {/* Back to Login */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <Link href="/auth/login">
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    fullWidth
                    leftIcon={<FiArrowLeft />}
                  >
                    Zurück zur Anmeldung
                  </Button>
                </Link>
              </motion.div>
            </form>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="mt-8 bg-info/5 border border-info/20 rounded-lg p-4"
            >
              <h4 className="font-medium text-info mb-2">💡 Sicherheitshinweis</h4>
              <ul className="text-sm text-info space-y-1">
                <li>• Der Reset-Link ist nur 1 Stunde gültig</li>
                <li>• Verwende ihn nur, wenn du ihn angefordert hast</li>
                <li>• Teile den Link niemals mit anderen</li>
                <li>• Bei Problemen kontaktiere unseren Support</li>
              </ul>
            </motion.div>

            {/* Register Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="mt-6 text-center"
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
      </motion.div>
    </div>
  );
}

export default ForgotPasswordForm;