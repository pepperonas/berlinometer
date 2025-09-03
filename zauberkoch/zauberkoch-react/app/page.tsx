'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiZap, 
  FiHeart, 
  FiSmartphone,
  FiStar,
  FiUsers,
  FiArrowRight,
  FiPlay
} from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { usePWA } from '@/hooks/usePWA';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function HomePage() {
  const { user } = useAuth();
  const { isInstallable: canInstall, installApp: install } = usePWA();

  const features = [
    {
      icon: FiZap,
      title: 'KI-Powered',
      description: 'Fortschrittliche AI-Technologie erstellt personalisierte Rezepte basierend auf deinen Vorlieben',
      color: 'text-yellow-500'
    },
    {
      icon: FiZap,
      title: 'Professionell',
      description: 'Rezepte von erfahrenen Köchen inspiriert und für Hobbyköche optimiert',
      color: 'text-primary'
    },
    {
      icon: FiHeart,
      title: 'Personalisiert',
      description: 'Berücksichtigt deine Ernährungsweise, Allergien und persönliche Geschmackspräferenzen',
      color: 'text-error'
    },
    {
      icon: FiSmartphone,
      title: 'Überall verfügbar',
      description: 'Progressive Web App funktioniert auf allen Geräten - online und offline',
      color: 'text-info'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Generierte Rezepte' },
    { value: '5,000+', label: 'Aktive Nutzer' },
    { value: '4.9/5', label: 'Durchschnittliche Bewertung' },
    { value: '98%', label: 'Nutzerzufriedenheit' }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Hobbykoch',
      content: 'ZauberKoch hat mein Kocherlebnis revolutioniert! Die AI-generierten Rezepte sind immer perfekt auf meinen Geschmack abgestimmt.',
      rating: 5
    },
    {
      name: 'Thomas K.',
      role: 'Vegetarier',
      content: 'Endlich eine App, die meine veganen Wünsche versteht und kreative Rezepte vorschlägt. Absolute Empfehlung!',
      rating: 5
    },
    {
      name: 'Lisa B.',
      role: 'Berufstätig',
      content: 'Perfect für meinen stressigen Alltag. Schnelle, leckere Rezepte die immer funktionieren.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <motion.div 
              className="text-center max-w-4xl mx-auto"
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                  🚀 Neue AI-Features verfügbar
                </span>
                <h1 className="text-4xl md:text-6xl font-bold text-on-background leading-tight">
                  Entdecke <span className="text-primary">magische</span> Rezepte mit{' '}
                  <span className="text-secondary">Künstlicher Intelligenz</span>
                </h1>
              </motion.div>
              
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-on-surface-variant mb-8 leading-relaxed"
              >
                ZauberKoch nutzt fortschrittliche AI-Technologie, um personalisierte Koch- und Cocktailrezepte 
                zu erstellen, die perfekt zu deinen Vorlieben, Ernährungszielen und verfügbaren Zutaten passen.
              </motion.p>
              
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              >
                {user ? (
                  <Link href="/recipes/generate" className="inline-block">
                    <Button size="lg" leftIcon={<FiZap />}>
                      Rezept generieren
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/register" className="inline-block">
                      <Button size="lg" leftIcon={<FiZap />}>
                        Kostenlos starten
                      </Button>
                    </Link>
                    <Link href="/demo" className="inline-block">
                      <Button variant="outline" size="lg" leftIcon={<FiPlay />}>
                        Demo ansehen
                      </Button>
                    </Link>
                  </>
                )}
                
                {canInstall && (
                  <Button variant="ghost" size="lg" onClick={install} leftIcon={<FiSmartphone />}>
                    Als App installieren
                  </Button>
                )}
              </motion.div>

              <motion.div variants={fadeInUp} className="relative">
                <div className="bg-surface rounded-2xl shadow-xl border border-outline p-8 mx-auto max-w-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-error rounded-full"></div>
                    <div className="w-3 h-3 bg-warning rounded-full"></div>
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                  </div>
                  <div className="text-left text-sm font-mono">
                    <div className="text-primary">🍳 ZauberKoch AI:</div>
                    <div className="text-on-surface-variant mt-2">
                      Ich erstelle dir ein leckeres italienisches Pasta-Gericht 
                      für 2 Personen mit den Zutaten in deinem Kühlschrank...
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-primary">Generiere Rezept...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-surface">
          <div className="container mx-auto px-4">
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={stagger}
            >
              {stats.map((stat, index) => (
                <motion.div key={index} variants={fadeInUp} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-on-surface-variant">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-on-background mb-4">
                Warum ZauberKoch?
              </h2>
              <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
                Entdecke die Features, die ZauberKoch zur intelligentesten 
                Kochapp der Welt machen
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={stagger}
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card hoverable className="h-full">
                    <CardContent className="p-6 text-center">
                      <div className={`inline-flex p-3 rounded-full bg-surface-variant mb-4 ${feature.color}`}>
                        <feature.icon size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-on-background mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-on-surface-variant text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-surface">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-on-background mb-4">
                Was unsere Nutzer sagen
              </h2>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={stagger}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <FiStar key={i} className="text-warning fill-current" size={16} />
                        ))}
                      </div>
                      <p className="text-on-surface-variant mb-4 leading-relaxed">
                        "{testimonial.content}"
                      </p>
                      <div>
                        <div className="font-medium text-on-background">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-on-surface-variant">
                          {testimonial.role}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary to-secondary">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Bereit für kulinarische Magie?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Starte noch heute und entdecke Rezepte, die perfekt zu dir passen. 
                Kostenlos und ohne Verpflichtung.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link href="/recipes/generate" className="inline-block">
                    <Button 
                      size="lg" 
                      variant="secondary"
                      leftIcon={<FiZap />}
                      rightIcon={<FiArrowRight />}
                    >
                      Jetzt Rezept erstellen
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/register" className="inline-block">
                      <Button 
                        size="lg" 
                        className="bg-white text-primary hover:bg-gray-100"
                        leftIcon={<FiUsers />}
                        rightIcon={<FiArrowRight />}
                      >
                        Kostenlos registrieren
                      </Button>
                    </Link>
                    <Link href="/premium" className="inline-block">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="border-white text-white hover:bg-white hover:text-primary"
                        leftIcon={<FiStar />}
                      >
                        Premium entdecken
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}