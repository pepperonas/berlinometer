'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiCheckCircle, 
  FiStar,
  FiZap,
  FiGift,
  FiArrowRight,
  FiDownload,
  FiBookmark,
  FiSettings
} from 'react-icons/fi';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export function PremiumSuccessView() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [isActivating, setIsActivating] = useState(true);
  const [activationError, setActivationError] = useState<string | null>(null);
  
  const subscriptionId = searchParams?.get('subscription_id');
  const token = searchParams?.get('token');

  useEffect(() => {
    if (subscriptionId && token) {
      activateSubscription();
    } else {
      setActivationError('Ungültige Aktivierungs-Parameter');
      setIsActivating(false);
    }
  }, [subscriptionId, token]);

  const activateSubscription = async () => {
    try {
      const response = await fetch('/api/payments/activate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Aktivierung fehlgeschlagen');
      }

      // Refresh user data to get updated premium status
      await refreshUser();
      toast.success('🎉 Premium erfolgreich aktiviert!');
      
    } catch (error: any) {
      console.error('Activation error:', error);
      setActivationError(error?.message || 'Aktivierung fehlgeschlagen');
      toast.error('Fehler bei der Premium-Aktivierung');
    } finally {
      setIsActivating(false);
    }
  };

  const premiumFeatures = [
    {
      icon: <FiZap className="text-primary" />,
      title: 'Unbegrenzte Rezepte',
      description: 'Generiere so viele Rezepte wie du möchtest'
    },
    {
      icon: <FiStar className="text-primary" />,
      title: 'Alle KI-Provider',
      description: 'OpenAI GPT-4, DeepSeek und Grok verfügbar'
    },
    {
      icon: <FiBookmark className="text-primary" />,
      title: 'Erweiterte Speicherung',
      description: 'Organisiere und tagge deine Lieblingsrezepte'
    },
    {
      icon: <FiDownload className="text-primary" />,
      title: 'Export-Funktionen',
      description: 'Exportiere Rezepte als PDF oder in andere Formate'
    }
  ];

  const nextSteps = [
    {
      icon: <FiZap className="text-primary" />,
      title: 'Erstes Premium-Rezept',
      description: 'Generiere dein erstes unbegrenztes Rezept',
      action: 'Rezept generieren',
      href: '/recipes/generate'
    },
    {
      icon: <FiBookmark className="text-primary" />,
      title: 'Rezepte organisieren',
      description: 'Schau dir deine gespeicherten Rezepte an',
      action: 'Zu meinen Rezepten',
      href: '/recipes'
    },
    {
      icon: <FiSettings className="text-primary" />,
      title: 'Profil anpassen',
      description: 'Personalisiere dein ZauberKoch-Erlebnis',
      action: 'Profil bearbeiten',
      href: '/profile'
    }
  ];

  if (isActivating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-on-surface">
            Premium wird aktiviert...
          </h1>
          <p className="text-on-surface-variant">
            Bitte warte einen Moment, während wir dein Premium-Abonnement aktivieren.
          </p>
        </motion.div>
      </div>
    );
  }

  if (activationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-4"
        >
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-error" size={32} />
              </div>
              <CardTitle className="text-error">Aktivierung fehlgeschlagen</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-on-surface-variant mb-6">
                {activationError}
              </p>
              <div className="space-y-3">
                <Link href="/premium">
                  <Button fullWidth>
                    Erneut versuchen
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" fullWidth>
                    Support kontaktieren
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
              className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center"
            >
              <FiCheckCircle className="text-success" size={40} />
            </motion.div>
          </div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold text-on-surface mb-4"
          >
            🎉 Willkommen bei Premium!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-lg text-on-surface-variant mb-2"
          >
            Dein ZauberKoch Premium-Abonnement wurde erfolgreich aktiviert
          </motion.p>
          
          {user?.premiumExpiration && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-sm text-primary font-medium"
            >
              Gültig bis: {new Date(user.premiumExpiration).toLocaleDateString('de-DE')}
            </motion.p>
          )}
        </motion.div>

        {/* Premium Features Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <FiGift className="text-primary" />
                Deine neuen Premium-Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {premiumFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-surface-variant/30 rounded-lg"
                  >
                    <div className="flex-shrink-0 p-2 bg-surface rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-on-surface mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-on-surface-variant">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-on-surface text-center mb-8">
            Was möchtest du als nächstes tun?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {nextSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        {step.icon}
                      </div>
                    </div>
                    <h3 className="font-semibold text-on-surface mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-4">
                      {step.description}
                    </p>
                    <Link href={step.href}>
                      <Button size="sm" rightIcon={<FiArrowRight />}>
                        {step.action}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Subscription Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <Card className="shadow-lg bg-info/5 border-info/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-on-surface mb-4">
                📧 Bestätigung und Rechnung
              </h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Du erhältst in Kürze eine E-Mail mit deiner Rechnung und allen wichtigen Informationen 
                zu deinem Premium-Abonnement. Prüfe auch deinen Spam-Ordner.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/profile/billing">
                  <Button variant="outline" size="sm">
                    Rechnungsdetails
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost" size="sm">
                    Support kontaktieren
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fun Success Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 2 }}
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
        >
          {/* Confetti or celebration elements could go here */}
          <div className="relative w-full h-full">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1,
                  y: -100,
                  x: Math.random() * window.innerWidth,
                  rotate: 0
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  rotate: 360,
                  opacity: 0
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
                className="absolute w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default PremiumSuccessView;