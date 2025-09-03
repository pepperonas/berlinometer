'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiStar,
  FiZap,
  FiShield,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PremiumPlan from '@/components/premium/PremiumPlan';
import { useAuth } from '@/contexts/AuthContext';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerReason?: 'daily_limit' | 'premium_feature' | 'manual';
  highlightedPlan?: string;
}

export function PremiumModal({ 
  isOpen, 
  onClose, 
  triggerReason = 'manual',
  highlightedPlan = 'monthly'
}: PremiumModalProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast.error('Bitte melde dich an, um einen Plan auszuwählen');
      return;
    }

    if (planId === 'free') {
      onClose();
      return;
    }

    setSelectedPlan(planId);
    setIsProcessing(true);

    try {
      // Create PayPal subscription
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Fehler beim Erstellen des Abonnements');
      }

      // Redirect to PayPal
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }

    } catch (error: any) {
      console.error('Subscription creation error:', error);
      toast.error(error?.message || 'Fehler beim Erstellen des Abonnements');
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const getTriggerContent = () => {
    switch (triggerReason) {
      case 'daily_limit':
        return {
          icon: <FiAlertCircle className="text-warning" size={32} />,
          title: 'Tageslimit erreicht',
          description: 'Du hast heute bereits 3 Rezepte generiert. Mit Premium kannst du unbegrenzt viele Rezepte erstellen.',
          cta: 'Jetzt upgraden und weiter kochen!'
        };
      case 'premium_feature':
        return {
          icon: <FiStar className="text-primary" size={32} />,
          title: 'Premium Feature',
          description: 'Diese Funktion ist exklusiv für Premium-Nutzer verfügbar. Upgrade jetzt und entdecke alle Möglichkeiten von ZauberKoch.',
          cta: 'Premium freischalten'
        };
      default:
        return {
          icon: <FiCrown className="text-primary" size={32} />,
          title: 'Upgrade zu Premium',
          description: 'Entdecke unbegrenzte Möglichkeiten mit ZauberKoch Premium. Generiere so viele Rezepte wie du möchtest und nutze alle Premium-Features.',
          cta: 'Jetzt Premium werden'
        };
    }
  };

  const triggerContent = getTriggerContent();
  const currentUserPlan = user?.premiumExpiration && new Date(user.premiumExpiration) > new Date() 
    ? 'premium' 
    : 'free';

  const features = [
    {
      icon: <FiZap className="text-primary" />,
      title: 'Unbegrenzte Rezepte',
      description: 'Generiere so viele Rezepte wie du möchtest, ohne tägliche Limits'
    },
    {
      icon: <FiStar className="text-primary" />,
      title: 'Alle KI-Provider',
      description: 'Nutze OpenAI GPT-4, DeepSeek und Grok für vielfältige Rezeptideen'
    },
    {
      icon: <FiShield className="text-primary" />,
      title: 'Prioritärer Support',
      description: 'Erhalte bevorzugten Kundensupport und schnellere Antwortzeiten'
    },
    {
      icon: <FiCrown className="text-primary" />,
      title: 'Exklusive Features',
      description: 'Zugriff auf Beta-Features und neue Funktionen vor allen anderen'
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-screen px-4 py-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-6xl bg-surface rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 px-6 py-6 border-b border-outline/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-surface rounded-lg shadow-sm">
                    {triggerContent.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-on-surface mb-2">
                      {triggerContent.title}
                    </h2>
                    <p className="text-on-surface-variant max-w-2xl">
                      {triggerContent.description}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  leftIcon={<FiX size={18} />}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="p-6">
              {/* Premium Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <h3 className="text-xl font-bold text-center mb-6">
                  Warum ZauberKoch Premium?
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="text-center p-4 rounded-lg bg-surface-variant/30"
                    >
                      <div className="flex justify-center mb-3">
                        <div className="p-2 bg-surface rounded-lg shadow-sm">
                          {feature.icon}
                        </div>
                      </div>
                      <h4 className="font-semibold text-on-surface mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-on-surface-variant">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Plans */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xl font-bold text-center mb-6">
                  Wähle deinen Plan
                </h3>
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <PremiumPlan
                        plan={plan}
                        currentPlan={currentUserPlan}
                        isPopular={plan.id === highlightedPlan}
                        onSelectPlan={handleSelectPlan}
                        loading={isProcessing && selectedPlan === plan.id}
                        disabled={isProcessing}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Security Notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 text-center"
              >
                <div className="inline-flex items-center gap-2 bg-info/10 text-info px-4 py-2 rounded-lg text-sm">
                  <FiShield size={16} />
                  <span>
                    Sichere Zahlung über PayPal • Jederzeit kündbar • 30 Tage Geld-zurück-Garantie
                  </span>
                </div>
              </motion.div>

              {/* Additional Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 text-center space-y-2"
              >
                <p className="text-sm text-on-surface-variant">
                  🔒 Alle Zahlungen werden sicher über PayPal abgewickelt
                </p>
                <p className="text-sm text-on-surface-variant">
                  💡 Deine Premium-Features werden sofort nach der Zahlung aktiviert
                </p>
                <p className="text-sm text-on-surface-variant">
                  📧 Du erhältst eine Bestätigungs-E-Mail mit allen Details
                </p>
              </motion.div>

              {/* Close Button */}
              {triggerReason !== 'daily_limit' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center mt-6"
                >
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={isProcessing}
                  >
                    Vielleicht später
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PremiumModal;