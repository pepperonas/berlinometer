'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="container py-12 lg:py-20">
          {/* Simple Navigation */}
          <nav className="mb-8">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-white">
                🍳 ZauberKoch
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/auth/login" className="text-white hover:text-primary-light transition-colors">
                  Anmelden
                </Link>
                <Link href="/recipes" className="text-white hover:text-primary-light transition-colors">
                  Rezepte
                </Link>
                <Link href="/dashboard" className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  Dashboard
                </Link>
              </div>
            </div>
          </nav>

          <motion.div 
            className="text-center lg:text-left max-w-4xl"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1 
              className="text-4xl lg:text-6xl font-bold mb-4 leading-tight"
              variants={itemVariants}
            >
              Willkommen bei ZauberKoch! 🍳
            </motion.h1>
            <motion.p 
              className="text-lg lg:text-xl text-primary-light mb-8 leading-relaxed"
              variants={itemVariants}
            >
              Deine AI-gestützte Küche wartet auf dich. Entdecke unbegrenzte kulinarische Möglichkeiten mit der Kraft der künstlichen Intelligenz.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              variants={itemVariants}
            >
              <Link href="/recipes/generate">
                <button className="btn btn-lg bg-white text-primary hover:bg-surface transition-all transform hover:scale-105">
                  Erstes Rezept erstellen
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="btn btn-lg btn-outline text-white border-white hover:bg-white hover:text-primary">
                  Features entdecken
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-12 lg:py-16">
        <motion.div 
          className="mb-12 text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Warum ZauberKoch?
          </h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            Entdecke die Zukunft des Kochens mit unserer innovativen Plattform
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {[
            {
              emoji: '🤖',
              title: 'KI-Powered Rezepte',
              description: 'Fortschrittliche AI erstellt personalisierte Rezepte basierend auf deinen Vorlieben'
            },
            {
              emoji: '⚡',
              title: 'Blitzschnell',
              description: 'Generiere in Sekunden kreative Rezepte aus deinen verfügbaren Zutaten'
            },
            {
              emoji: '🎯',
              title: 'Personalisiert',
              description: 'Berücksichtigt deine Ernährungsvorlieben und Allergien automatisch'
            },
            {
              emoji: '📱',
              title: 'PWA-Ready',
              description: 'Installiere die App auf dein Smartphone für den ultimativen Komfort'
            },
            {
              emoji: '🔄',
              title: 'Immer verfügbar',
              description: 'Funktioniert online und offline - deine Rezepte sind immer da'
            },
            {
              emoji: '⭐',
              title: 'Premium Features',
              description: 'Erweiterte Funktionen für Hobbyköche und Profis'
            }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              className="card hover:transform hover:scale-105 transition-all"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">{feature.emoji}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="bg-surface-variant py-16">
        <div className="container">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h2 
              className="text-3xl lg:text-4xl font-bold mb-6"
              variants={itemVariants}
            >
              Bereit für kulinarische Abenteuer?
            </motion.h2>
            <motion.p 
              className="text-lg text-on-surface-variant mb-8"
              variants={itemVariants}
            >
              Starte noch heute und entdecke, was aus deinen Zutaten entstehen kann!
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={itemVariants}
            >
              <Link href="/auth/login">
                <button className="btn btn-primary btn-lg">
                  Kostenlos starten
                </button>
              </Link>
              <Link href="/recipes/generate">
                <button className="btn btn-outline btn-lg">
                  Demo ausprobieren
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}