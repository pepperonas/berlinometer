'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiSend, FiUsers, FiStar, FiTrendingUp, FiHeart } from 'react-icons/fi';

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
  const [chatInput, setChatInput] = useState('');

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      // Redirect to recipe generation with query
      window.location.href = `/recipes/generate?q=${encodeURIComponent(chatInput)}`;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="container py-12 lg:py-16">
          <motion.div 
            className="text-center lg:text-left max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1 
              className="text-3xl lg:text-5xl font-bold mb-4 leading-tight"
              variants={itemVariants}
            >
              Willkommen bei ZauberKoch! 🍳
            </motion.h1>
            <motion.p 
              className="text-lg lg:text-xl text-primary-light mb-6 leading-relaxed"
              variants={itemVariants}
            >
              Deine AI-gestützte Küche wartet auf dich. Entdecke unbegrenzte kulinarische Möglichkeiten mit der Kraft der künstlichen Intelligenz.
            </motion.p>

            {/* AI Chat Input */}
            <motion.form 
              onSubmit={handleChatSubmit}
              className="bg-surface-variant/20 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20"
              variants={itemVariants}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Was möchtest du heute kochen? Z.B. 'Pasta mit Tomaten und Basilikum'"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-6 py-3 bg-white text-primary rounded-lg hover:bg-surface transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                >
                  <FiSend className="w-4 h-4" />
                  Rezept erstellen
                </button>
              </div>
            </motion.form>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              variants={itemVariants}
            >
              <Link href="/recipes/generate">
                <button className="btn btn-lg bg-white text-primary hover:bg-surface transition-all transform hover:scale-105">
                  Generator öffnen
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

      {/* Statistics Section */}
      <div className="bg-surface-variant py-16">
        <div className="container">
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div 
              className="text-center p-6 bg-surface rounded-lg shadow-sm border border-outline/20"
              variants={itemVariants}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiTrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-primary mb-1">10,000+</div>
              <div className="text-sm text-on-surface-variant">Generierte Rezepte</div>
            </motion.div>
            <motion.div 
              className="text-center p-6 bg-surface rounded-lg shadow-sm border border-outline/20"
              variants={itemVariants}
            >
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiUsers className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-secondary mb-1">5,000+</div>
              <div className="text-sm text-on-surface-variant">Aktive Nutzer</div>
            </motion.div>
            <motion.div 
              className="text-center p-6 bg-surface rounded-lg shadow-sm border border-outline/20"
              variants={itemVariants}
            >
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiStar className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-yellow-500 mb-1">4.9/5</div>
              <div className="text-sm text-on-surface-variant">Durchschnittsbewertung</div>
            </motion.div>
            <motion.div 
              className="text-center p-6 bg-surface rounded-lg shadow-sm border border-outline/20"
              variants={itemVariants}
            >
              <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiHeart className="w-6 h-6 text-pink-500" />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-pink-500 mb-1">98%</div>
              <div className="text-sm text-on-surface-variant">Nutzerzufriedenheit</div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-20 lg:py-24">
        <motion.div 
          className="mb-12 text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-secondary/15 text-primary border border-primary/20 px-4 py-2 rounded-full text-sm font-semibold mb-4"
            variants={itemVariants}
          >
            ✨ Warum ZauberKoch?
          </motion.div>
          <motion.h2 
            className="text-2xl lg:text-3xl font-bold mb-4"
            variants={itemVariants}
          >
            Die Zukunft des Kochens
          </motion.h2>
          <motion.p 
            className="text-on-surface-variant max-w-2xl mx-auto text-base leading-relaxed"
            variants={itemVariants}
          >
            Entdecke kulinarische Möglichkeiten mit der Kraft der künstlichen Intelligenz. 
            Von einfachen Alltagsrezepten bis zu außergewöhnlichen Kreationen.
          </motion.p>
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
              className="card p-6 shadow-lg border border-outline/20 hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              variants={itemVariants}
              whileHover={{ y: -8 }}
            >
              <div className="text-center">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center text-white text-xl mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.emoji}
                </div>
                <h3 className="text-lg font-bold mb-3 text-on-surface group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
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
            className="card p-8 lg:p-10 shadow-xl border border-outline/20 bg-gradient-to-br from-surface to-surface-variant/20 max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-secondary/15 text-primary border border-primary/20 px-4 py-2 rounded-full text-sm font-semibold mb-6"
              variants={itemVariants}
            >
              🚀 Bereit loszulegen?
            </motion.div>
            
            <motion.h2 
              className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Entdecke kulinarische Abenteuer
            </motion.h2>
            
            <motion.p 
              className="text-lg text-on-surface-variant mb-8 leading-relaxed max-w-xl mx-auto"
              variants={itemVariants}
            >
              Verwandle deine verfügbaren Zutaten in außergewöhnliche Gerichte. 
              Starte jetzt und lass dich von unserer KI inspirieren!
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={itemVariants}
            >
              <Link href="/recipes/generate">
                <button className="btn btn-primary btn-lg px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                  🍳 Erstes Rezept erstellen
                </button>
              </Link>
              <Link href="/auth/register">
                <button className="btn btn-outline btn-lg px-6 py-3 text-base font-semibold border-2 hover:bg-primary hover:text-white transition-all">
                  Kostenlos registrieren
                </button>
              </Link>
            </motion.div>
            
            <motion.div 
              className="mt-8 flex flex-col sm:flex-row gap-6 justify-center text-sm text-on-surface-variant"
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