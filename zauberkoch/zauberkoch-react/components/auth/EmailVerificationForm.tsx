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

  const getHeroConfig = () => {
    switch (verificationState) {
      case 'success':
        return {
          gradient: 'from-success to-emerald-600',
          badge: '✅ Erfolgreich verifiziert',
          title: 'Willkommen bei ZauberKoch!',
          subtitle: 'Deine E-Mail wurde erfolgreich verifiziert. Du kannst jetzt alle Features nutzen.',
          textColor: 'text-green-100'
        };
      case 'error':
        return {
          gradient: 'from-error to-red-600',
          badge: '❌ Verifizierung fehlgeschlagen',
          title: 'Etwas ist schiefgelaufen',
          subtitle: 'Wir konnten deine E-Mail nicht verifizieren. Keine Sorge, wir helfen dir weiter.',
          textColor: 'text-red-100'
        };
      case 'expired':
        return {
          gradient: 'from-warning to-orange-500',
          badge: '⏰ Link abgelaufen',
          title: 'Neuer Link erforderlich',
          subtitle: 'Der Verifizierungslink ist abgelaufen. Wir senden dir gerne einen neuen zu.',
          textColor: 'text-orange-100'
        };
      case 'verifying':
        return {
          gradient: 'from-info to-blue-600',
          badge: '🔄 Verarbeitung läuft',
          title: 'Einen Moment bitte...',
          subtitle: 'Wir verifizieren gerade deine E-Mail-Adresse.',
          textColor: 'text-blue-100'
        };
      default:
        return {
          gradient: 'from-primary to-primary-dark',
          badge: '📧 E-Mail-Verifizierung',
          title: 'Bestätige deine E-Mail',
          subtitle: 'Um alle Features zu nutzen, musst du deine E-Mail-Adresse verifizieren.',
          textColor: 'text-primary-light'
        };
    }
  };

  const heroConfig = getHeroConfig();

  const renderContent = () => {
    switch (verificationState) {
      case 'verifying':
        return (
          <motion.div
            className="text-center"
            variants={itemVariants}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-info to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiRotateCw className="text-white animate-spin" size={32} />
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
            className="text-center"
            variants={itemVariants}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiCheckCircle className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-success mb-4">Erfolgreich verifiziert! 🎉</h2>
            <p className="text-on-surface-variant mb-8">
              Deine E-Mail-Adresse wurde erfolgreich verifiziert. Du kannst jetzt alle Features von ZauberKoch nutzen.
            </p>
            <Link href="/recipes">
              <button className="btn btn-primary btn-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]">
                <FiArrowRight className="mr-2" />
                Zu den Rezepten
              </button>
            </Link>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            className="text-center"
            variants={itemVariants}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-error to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiAlertCircle className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-error mb-4">Verifizierung fehlgeschlagen</h2>
            <p className="text-on-surface-variant mb-8">{errorMessage}</p>
            <div className="space-y-3">
              {user && (
                <button
                  onClick={handleResendVerification}
                  className="w-full btn btn-primary py-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <span className="animate-spin mr-2">⚪</span>
                      Sende E-Mail...
                    </>
                  ) : (
                    <>
                      <FiMail className="mr-2" />
                      Neue E-Mail senden
                    </>
                  )}
                </button>
              )}
              <Link href="/auth/login">
                <button className="w-full btn btn-outline py-3 border-2 hover:bg-primary hover:text-white">
                  Zur Anmeldung
                </button>
              </Link>
            </div>
          </motion.div>
        );

      case 'expired':
        return (
          <motion.div
            className="text-center"
            variants={itemVariants}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-warning to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiAlertCircle className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-warning mb-4">Link abgelaufen</h2>
            <p className="text-on-surface-variant mb-8">
              Der Verifizierungslink ist abgelaufen. Wir senden dir gerne einen neuen Link zu.
            </p>
            <div className="space-y-3">
              {user && (
                <button
                  onClick={handleResendVerification}
                  className="w-full btn btn-primary py-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <span className="animate-spin mr-2">⚪</span>
                      Sende Link...
                    </>
                  ) : (
                    <>
                      <FiMail className="mr-2" />
                      Neuen Link senden
                    </>
                  )}
                </button>
              )}
              <Link href="/auth/login">
                <button className="w-full btn btn-outline py-3 border-2 hover:bg-primary hover:text-white">
                  Zur Anmeldung
                </button>
              </Link>
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div
            className="text-center"
            variants={itemVariants}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-info to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiMail className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">E-Mail verifizieren</h2>
            <p className="text-on-surface-variant mb-8">
              {user ? 
                'Wir haben dir eine Verifizierungs-E-Mail gesendet. Klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.' :
                'Bitte melde dich an, um deine E-Mail-Adresse zu verifizieren.'
              }
            </p>

            {user ? (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-info/5 to-blue-500/5 border border-info/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-info to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      <FiMail />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">E-Mail gesendet an:</p>
                      <p className="text-sm text-on-surface-variant break-all">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-on-surface-variant space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-info">📬</span>
                      <span><strong>Prüfe deinen Posteingang</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-warning">⏰</span>
                      <span>Der Link ist 24 Stunden gültig</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-error">🗑️</span>
                      <span>Schau auch in den Spam-Ordner</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleResendVerification}
                  className="w-full btn btn-outline py-3 border-2 hover:bg-primary hover:text-white"
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <span className="animate-spin mr-2">⚪</span>
                      Sende E-Mail...
                    </>
                  ) : (
                    <>
                      <FiMail className="mr-2" />
                      E-Mail erneut senden
                    </>
                  )}
                </button>
              </div>
            ) : (
              <Link href="/auth/login">
                <button className="btn btn-primary btn-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]">
                  <FiArrowRight className="mr-2" />
                  Zur Anmeldung
                </button>
              </Link>
            )}
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Dynamic Hero Background */}
      <div className={`bg-gradient-to-br ${heroConfig.gradient} text-white`}>
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
              {heroConfig.badge}
            </motion.div>
            
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              {heroConfig.title}
            </motion.h1>
            
            <motion.p 
              className={`text-xl leading-relaxed ${heroConfig.textColor}`}
              variants={itemVariants}
            >
              {heroConfig.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
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
            {renderContent()}

            {/* Help Section */}
            <motion.div
              className="mt-8 text-center"
              variants={itemVariants}
            >
              <p className="text-sm text-on-surface-variant">
                Probleme?{' '}
                <Link href="/contact" className="text-primary hover:text-primary-dark transition-colors font-medium">
                  Kontaktiere unseren Support
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default EmailVerificationForm;