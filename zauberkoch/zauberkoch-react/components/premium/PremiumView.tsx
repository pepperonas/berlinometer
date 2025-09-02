'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiStar,
  FiZap,
  FiShield,
  FiCrown,
  FiCheck,
  FiUsers,
  FiTrendingUp,
  FiHeart,
  FiArrowRight,
  FiGift,
  FiAward
} from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PremiumPlan from '@/components/premium/PremiumPlan';
import { useAuth } from '@/contexts/AuthContext';
import { SUBSCRIPTION_PLANS, PREMIUM_FEATURES } from '@/lib/constants';

export function PremiumView() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userStats, setUserStats] = useState<{
    recipesGenerated: number;
    savedRecipes: number;
    totalUsers: number;
  } | null>(null);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast.error('Bitte melde dich an, um einen Plan auszuwählen');
      return;
    }

    if (planId === 'free') {
      toast.success('Du nutzt bereits den kostenlosen Plan!');
      return;
    }

    setSelectedPlan(planId);
    setIsProcessing(true);

    try {
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

  const isPremium = user?.premiumExpiration && new Date(user.premiumExpiration) > new Date();
  const currentUserPlan = isPremium ? 'premium' : 'free';

  const testimonials = [
    {
      name: 'Sarah M.',
      text: 'ZauberKoch Premium hat meine Art zu kochen völlig verändert. Jeden Tag neue, kreative Rezepte!',
      rating: 5,
      plan: 'Premium'
    },
    {
      name: 'Michael K.',
      text: 'Die unbegrenzten Rezepte sind perfekt für meine große Familie. Beste Investition!',
      rating: 5,
      plan: 'Premium'
    },
    {
      name: 'Anna L.',
      text: 'Als Veganerin finde ich endlich Rezepte, die zu meinen Vorlieben passen. Danke ZauberKoch!',
      rating: 5,
      plan: 'Premium'
    }
  ];

  const comparisonFeatures = [
    { name: 'Rezepte pro Tag', free: '3', premium: 'Unbegrenzt' },
    { name: 'KI-Provider', free: 'OpenAI Basic', premium: 'Alle Provider' },
    { name: 'Rezept-Speicherung', free: '✓', premium: '✓' },
    { name: 'Erweiterte Filter', free: '✗', premium: '✓' },
    { name: 'Prioritärer Support', free: '✗', premium: '✓' },
    { name: 'Beta-Features', free: '✗', premium: '✓' },
    { name: 'Export-Funktionen', free: '✗', premium: '✓' },
    { name: 'Werbefrei', free: '✗', premium: '✓' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl shadow-lg">
                <FiCrown className="text-primary" size={48} />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-on-surface mb-6">
              Upgrade zu{' '}
              <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                ZauberKoch Premium
              </span>
            </h1>
            
            <p className="text-xl text-on-surface-variant max-w-3xl mx-auto mb-8 leading-relaxed">
              Entdecke unbegrenzte kulinarische Möglichkeiten mit künstlicher Intelligenz. 
              Generiere so viele personalisierte Rezepte wie du möchtest – ohne Limits, ohne Wartezeiten.
            </p>

            {!user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" leftIcon={<FiStar />}>
                    Kostenlos registrieren
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline">
                    Anmelden
                  </Button>
                </Link>
              </div>
            ) : isPremium ? (
              <div className="bg-success/10 border border-success/20 rounded-lg p-6 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 text-success mb-2">
                  <FiCheck size={20} />
                  <span className="font-semibold">Du bist bereits Premium!</span>
                </div>
                <p className="text-sm text-success/80">
                  Gültig bis: {new Date(user.premiumExpiration!).toLocaleDateString('de-DE')}
                </p>
              </div>
            ) : (
              <Button 
                size="lg" 
                onClick={() => handleSelectPlan('monthly')}
                leftIcon={<FiZap />}
                className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
              >
                Jetzt Premium werden
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      {userStats && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center"
            >
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {userStats.totalUsers.toLocaleString()}+
                  </div>
                  <div className="text-sm text-on-surface-variant">
                    Zufriedene Nutzer
                  </div>
                  <FiUsers className="mx-auto mt-3 text-primary" size={24} />
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {user ? userStats.recipesGenerated.toLocaleString() : '10K+'}
                  </div>
                  <div className="text-sm text-on-surface-variant">
                    {user ? 'Deine generierten Rezepte' : 'Generierte Rezepte'}
                  </div>
                  <FiTrendingUp className="mx-auto mt-3 text-primary" size={24} />
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {user ? userStats.savedRecipes.toLocaleString() : '50K+'}
                  </div>
                  <div className="text-sm text-on-surface-variant">
                    {user ? 'Deine gespeicherten Rezepte' : 'Gespeicherte Rezepte'}
                  </div>
                  <FiHeart className="mx-auto mt-3 text-primary" size={24} />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Features Comparison */}
      <section className="py-16 px-4 bg-surface-variant/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-on-surface mb-4">
              Free vs Premium Vergleich
            </h2>
            <p className="text-on-surface-variant">
              Sieh selbst, welche Vorteile Premium bietet
            </p>
          </motion.div>

          <Card className="shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-primary/10 to-secondary/10">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <FiGift className="text-info" />
                        Free
                      </div>
                    </th>
                    <th className="text-center p-4 font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <FiCrown className="text-primary" />
                        Premium
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <motion.tr
                      key={feature.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="border-b border-outline/20 hover:bg-surface-variant/20"
                    >
                      <td className="p-4 font-medium">{feature.name}</td>
                      <td className="p-4 text-center">
                        {feature.free === '✓' ? (
                          <FiCheck className="text-success mx-auto" size={20} />
                        ) : feature.free === '✗' ? (
                          <span className="text-error">✗</span>
                        ) : (
                          <span className="text-on-surface-variant">{feature.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {feature.premium === '✓' ? (
                          <FiCheck className="text-success mx-auto" size={20} />
                        ) : feature.premium === '✗' ? (
                          <span className="text-error">✗</span>
                        ) : (
                          <span className="text-primary font-semibold">{feature.premium}</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-on-surface mb-4">
              Wähle deinen perfekten Plan
            </h2>
            <p className="text-on-surface-variant">
              Flexibel, fair und jederzeit kündbar
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {SUBSCRIPTION_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <PremiumPlan
                  plan={plan}
                  currentPlan={currentUserPlan}
                  isPopular={plan.id === 'yearly'}
                  onSelectPlan={handleSelectPlan}
                  loading={isProcessing && selectedPlan === plan.id}
                  disabled={isProcessing}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-surface-variant/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-on-surface mb-4">
              Was unsere Nutzer sagen
            </h2>
            <p className="text-on-surface-variant">
              Echte Bewertungen von echten Köchen
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <Card className="h-full shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <FiStar key={i} className="text-yellow-500 fill-current" size={16} />
                      ))}
                    </div>
                    
                    <blockquote className="text-on-surface-variant italic mb-4">
                      "{testimonial.text}"
                    </blockquote>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-on-surface">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-primary">
                          {testimonial.plan} Nutzer
                        </div>
                      </div>
                      <FiAward className="text-primary" size={20} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Card className="shadow-2xl border-primary/20">
              <CardContent className="p-12">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full">
                    <FiZap className="text-primary" size={32} />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-on-surface mb-4">
                  Bereit für unbegrenzte Rezepte?
                </h2>
                
                <p className="text-lg text-on-surface-variant mb-8">
                  Werde noch heute Premium und entdecke, was ZauberKoch alles für dich bereithält. 
                  Mit unserer 30-Tage Geld-zurück-Garantie gehst du kein Risiko ein.
                </p>

                {user && !isPremium && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      onClick={() => handleSelectPlan('yearly')}
                      leftIcon={<FiCrown />}
                      className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                    >
                      Jährlich & Sparen
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleSelectPlan('monthly')}
                      rightIcon={<FiArrowRight />}
                    >
                      Monatlich starten
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Security & Support */}
      <section className="py-16 px-4 bg-surface-variant/20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="grid md:grid-cols-3 gap-8 text-center"
          >
            <div>
              <FiShield className="text-primary mx-auto mb-3" size={32} />
              <h3 className="font-semibold text-on-surface mb-2">
                Sicher & Verschlüsselt
              </h3>
              <p className="text-sm text-on-surface-variant">
                Alle Zahlungen werden sicher über PayPal abgewickelt
              </p>
            </div>
            
            <div>
              <FiCheck className="text-success mx-auto mb-3" size={32} />
              <h3 className="font-semibold text-on-surface mb-2">
                Jederzeit kündbar
              </h3>
              <p className="text-sm text-on-surface-variant">
                Keine Vertragslaufzeit, kündige jederzeit online
              </p>
            </div>
            
            <div>
              <FiHeart className="text-primary mx-auto mb-3" size={32} />
              <h3 className="font-semibold text-on-surface mb-2">
                30 Tage Garantie
              </h3>
              <p className="text-sm text-on-surface-variant">
                Nicht zufrieden? Geld zurück, ohne Wenn und Aber
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default PremiumView;