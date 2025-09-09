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
        <div className="container py-16 lg:py-24">

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
      <div className="container py-16 lg:py-20">
        <motion.div 
          className="mb-16 text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-secondary/15 text-primary border border-primary/20 px-4 py-2 rounded-full text-sm font-semibold mb-6"
            variants={itemVariants}
          >
            ✨ Warum ZauberKoch?
          </motion.div>
          <motion.h2 
            className="text-3xl lg:text-4xl font-bold mb-6"
            variants={itemVariants}
          >
            Die Zukunft des Kochens
          </motion.h2>
          <motion.p 
            className="text-on-surface-variant max-w-3xl mx-auto text-lg leading-relaxed"
            variants={itemVariants}
          >
            Entdecke kulinarische Möglichkeiten mit der Kraft der künstlichen Intelligenz. 
            Von einfachen Alltagsrezepten bis zu außergewöhnlichen Kreationen.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {[
            {
              emoji: '🤖',
              title: 'KI-Powered Rezepte',
              description: 'Fortschrittliche AI mit OpenAI, DeepSeek und Grok erstellt personalisierte Rezepte basierend auf deinen Vorlieben',
              gradient: 'from-blue-500 to-blue-600'
            },
            {
              emoji: '⚡',
              title: 'Blitzschnell',
              description: 'Generiere in Sekunden kreative Rezepte aus deinen verfügbaren Zutaten mit professionellen Koch-Tipps',
              gradient: 'from-yellow-500 to-orange-500'
            },
            {
              emoji: '🎯',
              title: 'Personalisiert',
              description: 'Berücksichtigt automatisch deine Ernährungsvorlieben, Allergien und Koch-Erfahrung',
              gradient: 'from-green-500 to-emerald-500'
            },
            {
              emoji: '🍸',
              title: 'Cocktails & Getränke',
              description: 'Nicht nur Essen - entdecke auch einzigartige Cocktail-Rezepte für jeden Anlass',
              gradient: 'from-purple-500 to-pink-500'
            },
            {
              emoji: '📱',
              title: 'PWA-Ready',
              description: 'Installiere die App auf dein Smartphone für den ultimativen Komfort - funktioniert auch offline',
              gradient: 'from-indigo-500 to-purple-500'
            },
            {
              emoji: '⭐',
              title: 'Premium Features',
              description: 'Unbegrenzte Rezepte, erweiterte AI-Modelle und exklusive Funktionen für Hobbyköche und Profis',
              gradient: 'from-amber-500 to-yellow-500'
            }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              className="card p-8 shadow-lg border border-outline/20 hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              variants={itemVariants}
              whileHover={{ y: -8 }}
            >
              <div className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center text-white text-2xl mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.emoji}
                </div>
                <h3 className="text-xl font-bold mb-4 text-on-surface group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-surface-variant to-surface py-20">
        <div className="container">
          <motion.div 
            className="card p-12 shadow-xl border border-outline/20 bg-gradient-to-br from-surface to-surface-variant/20 max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-secondary/15 text-primary border border-primary/20 px-4 py-2 rounded-full text-sm font-semibold mb-8"
              variants={itemVariants}
            >
              🚀 Bereit loszulegen?
            </motion.div>
            
            <motion.h2 
              className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Entdecke kulinarische Abenteuer
            </motion.h2>
            
            <motion.p 
              className="text-xl text-on-surface-variant mb-10 leading-relaxed max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Verwandle deine verfügbaren Zutaten in außergewöhnliche Gerichte. 
              Starte jetzt und lass dich von unserer KI inspirieren!
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              variants={itemVariants}
            >
              <Link href="/recipes/generate">
                <button className="btn btn-primary btn-lg px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                  🍳 Erstes Rezept erstellen
                </button>
              </Link>
              <Link href="/auth/register">
                <button className="btn btn-outline btn-lg px-8 py-4 text-lg font-semibold border-2 hover:bg-primary hover:text-white transition-all">
                  Kostenlos registrieren
                </button>
              </Link>
            </motion.div>
            
            <motion.div 
              className="mt-10 flex flex-col sm:flex-row gap-8 justify-center text-sm text-on-surface-variant"
              variants={itemVariants}
            >
              <div className="flex items-center gap-2">
                ✅ Kostenlos starten
              </div>
              <div className="flex items-center gap-2">
                ✅ Keine Kreditkarte erforderlich
              </div>
              <div className="flex items-center gap-2">
                ✅ 3 Rezepte täglich gratis
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}