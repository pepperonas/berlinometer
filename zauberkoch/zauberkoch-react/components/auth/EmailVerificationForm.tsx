'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMail, FiCheckCircle, FiAlertCircle, FiRotateCw, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

type VerificationState = 'idle' | 'verifying' | 'success' | 'error' | 'expired';

export function EmailVerificationForm() {
  const searchParams = useSearchParams();
  const { user, resendVerificationEmail } = useAuth();
  const [verificationState, setVerificationState] = useState<VerificationState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams?.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setVerificationState('verifying');
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationState('success');
        toast.success('E-Mail erfolgreich verifiziert! 🎉');
      } else {
        if (data.message?.includes('expired') || data.message?.includes('abgelaufen')) {
          setVerificationState('expired');
          setErrorMessage('Der Verifizierungslink ist abgelaufen.');
        } else {
          setVerificationState('error');
          setErrorMessage(data.message || 'Verifizierung fehlgeschlagen');
        }
        toast.error(data.message || 'Verifizierung fehlgeschlagen');
      }
    } catch (error: any) {
      setVerificationState('error');
      setErrorMessage('Netzwerkfehler. Bitte versuche es später erneut.');
      toast.error('Verifizierung fehlgeschlagen');
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    
    try {
      await resendVerificationEmail();
      toast.success('Neue Verifizierungs-E-Mail gesendet! 📧');
    } catch (error: any) {
      toast.error(error?.message || 'Fehler beim Senden der E-Mail');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationState) {
      case 'verifying':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <FiRotateCw className="text-primary animate-spin" size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Verifizierung läuft...</h2>
            <p className="text-on-surface-variant">
              Bitte warte, während wir deine E-Mail-Adresse verifizieren.
            </p>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                <FiCheckCircle className="text-success" size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-success mb-4">Erfolgreich verifiziert! 🎉</h2>
            <p className="text-on-surface-variant mb-6">
              Deine E-Mail-Adresse wurde erfolgreich verifiziert. Du kannst jetzt alle Features von ZauberKoch nutzen.
            </p>
            <Link href="/recipes">
              <Button size="lg" rightIcon={<FiArrowRight />}>
                Zu den Rezepten
              </Button>
            </Link>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
                <FiAlertCircle className="text-error" size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-error mb-4">Verifizierung fehlgeschlagen</h2>
            <p className="text-on-surface-variant mb-6">{errorMessage}</p>
            <div className="space-y-3">
              {user && (
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleResendVerification}
                  loading={isResending}
                  leftIcon={<FiMail />}
                >
                  Neue E-Mail senden
                </Button>
              )}
              <Link href="/auth/login">
                <Button variant="outline" size="lg" fullWidth>
                  Zur Anmeldung
                </Button>
              </Link>
            </div>
          </motion.div>
        );

      case 'expired':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
                <FiAlertCircle className="text-warning" size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-warning mb-4">Link abgelaufen</h2>
            <p className="text-on-surface-variant mb-6">
              Der Verifizierungslink ist abgelaufen. Wir senden dir gerne einen neuen Link zu.
            </p>
            <div className="space-y-3">
              {user && (
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleResendVerification}
                  loading={isResending}
                  leftIcon={<FiMail />}
                >
                  Neuen Link senden
                </Button>
              )}
              <Link href="/auth/login">
                <Button variant="outline" size="lg" fullWidth>
                  Zur Anmeldung
                </Button>
              </Link>
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center">
                <FiMail className="text-info" size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">E-Mail verifizieren</h2>
            <p className="text-on-surface-variant mb-6">
              {user ? 
                'Wir haben dir eine Verifizierungs-E-Mail gesendet. Klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.' :
                'Bitte melde dich an, um deine E-Mail-Adresse zu verifizieren.'
              }
            </p>

            {user ? (
              <div className="space-y-4">
                <div className="bg-surface-variant rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FiMail className="text-info" size={20} />
                    <div className="text-left">
                      <p className="font-medium text-on-surface">E-Mail gesendet an:</p>
                      <p className="text-sm text-on-surface-variant">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-sm text-on-surface-variant text-left">
                    <p className="mb-2">📬 <strong>Prüfe deinen Posteingang</strong></p>
                    <p className="mb-2">⏰ Der Link ist 24 Stunden gültig</p>
                    <p>🗑️ Schau auch in den Spam-Ordner</p>
                  </div>
                </div>

                <Button
                  size="lg"
                  fullWidth
                  onClick={handleResendVerification}
                  loading={isResending}
                  leftIcon={<FiMail />}
                  variant="outline"
                >
                  E-Mail erneut senden
                </Button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button size="lg" rightIcon={<FiArrowRight />}>
                  Zur Anmeldung
                </Button>
              </Link>
            )}
          </motion.div>
        );
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
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center justify-center gap-2 text-2xl font-bold text-primary mb-4"
            >
              🍳 <span>ZauberKoch</span>
            </motion.div>
          </CardHeader>

          <CardContent>
            {renderContent()}

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-on-surface-variant">
                Probleme? <Link href="/contact" className="text-primary hover:underline">Kontaktiere unseren Support</Link>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default EmailVerificationForm;