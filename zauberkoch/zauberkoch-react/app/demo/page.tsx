'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FiPlay, 
  FiPause, 
  FiZap, 
  FiArrowRight,
  FiClock,
  FiUsers,
  FiStar
} from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function DemoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      title: "Zutaten eingeben",
      description: "Gib einfach die Zutaten ein, die du zuhause hast",
      example: "Tomaten, Pasta, Basilikum, Mozzarella",
      duration: "30 Sekunden"
    },
    {
      title: "AI-Präferenzen wählen",
      description: "Wähle deine Ernährungsweise und Schwierigkeit",
      example: "Vegetarisch, Mittlere Schwierigkeit",
      duration: "15 Sekunden"
    },
    {
      title: "Rezept generieren",
      description: "Unsere AI erstellt ein personalisiertes Rezept",
      example: "Caprese Pasta mit frischem Basilikum",
      duration: "10 Sekunden"
    },
    {
      title: "Kochen & Genießen",
      description: "Folge den detaillierten Schritten und genieße dein Gericht",
      example: "Perfekt zubereitete Pasta für 2 Personen",
      duration: "20 Minuten"
    }
  ];

  const handlePlayDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    
    // Simulate demo progression
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= demoSteps.length - 1) {
          setIsPlaying(false);
          clearInterval(interval);
          return 0;
        }
        return prev + 1;
      });
    }, 3000);
  };

  const resetDemo = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div 
          className="text-center max-w-4xl mx-auto mb-16"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              🎬 Interaktive Demo
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-on-background leading-tight mb-6">
              Sehe ZauberKoch in <span className="text-primary">Aktion</span>
            </h1>
            <p className="text-xl text-on-surface-variant mb-8 leading-relaxed">
              Erlebe, wie einfach es ist, mit ZauberKoch personalisierte Rezepte zu erstellen. 
              Diese Demo zeigt dir den kompletten Prozess in unter 2 Minuten.
            </p>
          </motion.div>
        </motion.div>

        {/* Demo Player */}
        <motion.div 
          className="max-w-4xl mx-auto mb-16"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
              <div className="text-center mb-8">
                {!isPlaying ? (
                  <Button
                    size="lg"
                    onClick={handlePlayDemo}
                    leftIcon={<FiPlay />}
                    className="px-8 py-4"
                  >
                    Demo starten
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={resetDemo}
                    leftIcon={<FiPause />}
                    className="px-8 py-4"
                  >
                    Demo zurücksetzen
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {isPlaying && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-on-surface">
                      Schritt {currentStep + 1} von {demoSteps.length}
                    </span>
                    <span className="text-sm text-on-surface-variant">
                      {demoSteps[currentStep].duration}
                    </span>
                  </div>
                  <div className="w-full bg-surface-variant rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Demo Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {demoSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      currentStep === index && isPlaying 
                        ? 'border-primary bg-primary/10 scale-105' 
                        : 'border-outline bg-surface'
                    }`}
                    animate={{
                      scale: currentStep === index && isPlaying ? 1.05 : 1,
                      opacity: isPlaying ? (currentStep >= index ? 1 : 0.5) : 1
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentStep === index && isPlaying
                          ? 'bg-primary text-white'
                          : 'bg-surface-variant text-on-surface-variant'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <FiClock size={12} />
                        {step.duration}
                      </div>
                    </div>
                    <h3 className="font-semibold text-on-background mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-3">
                      {step.description}
                    </p>
                    <div className="text-xs font-mono bg-background p-2 rounded text-primary">
                      {step.example}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Features Highlight */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          {[
            {
              icon: FiZap,
              title: "Blitzschnell",
              description: "Rezepte in unter 30 Sekunden generiert",
              color: "text-warning"
            },
            {
              icon: FiUsers,
              title: "Personalisiert",
              description: "Basiert auf deinen Vorlieben und Zutaten",
              color: "text-primary"
            },
            {
              icon: FiStar,
              title: "Professionell",
              description: "Von Köchen inspirierte Qualität",
              color: "text-secondary"
            }
          ].map((feature, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card hoverable>
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-3 rounded-full bg-surface-variant mb-4 ${feature.color}`}>
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-on-background mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center bg-gradient-to-r from-primary to-secondary rounded-2xl p-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Bereit, selbst zu starten?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Erstelle dein kostenloses Konto und generiere dein erstes Rezept.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100"
                leftIcon={<FiUsers />}
                rightIcon={<FiArrowRight />}
              >
                Kostenlos registrieren
              </Button>
            </Link>
            <Link href="/recipes/generate">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-primary"
                leftIcon={<FiZap />}
              >
                Direkt loslegen
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}