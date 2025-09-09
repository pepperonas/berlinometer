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

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="bg-primary text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            🍳 ZauberKoch
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-primary-light transition-colors">Dashboard</Link>
            <Link href="/recipes" className="hover:text-primary-light transition-colors">Rezepte</Link>
            <Link href="/recipes/generate" className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100 transition-colors">
              Generieren
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div className="text-center mb-8" variants={itemVariants}>
            <h1 className="text-4xl font-bold mb-4">📖 Hilfe & Tutorial</h1>
            <p className="text-on-surface-variant text-lg">
              Lerne, wie du ZauberKoch optimal nutzt
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Erste Schritte */}
            <motion.div className="card p-6" variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-4">🚀 Erste Schritte</h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="font-semibold mb-2">Account erstellen oder Demo nutzen</h3>
                    <p className="text-on-surface-variant">
                      Erstelle einen kostenlosen Account oder nutze den Demo-Login (demo@zauberkoch.com / demo123) 
                      um sofort loszulegen.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="font-semibold mb-2">Erstes Rezept generieren</h3>
                    <p className="text-on-surface-variant">
                      Gehe zum Rezept-Generator, gib deine verfügbaren Zutaten ein und lass die KI ein 
                      perfektes Rezept für dich erstellen.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="font-semibold mb-2">Einstellungen anpassen</h3>
                    <p className="text-on-surface-variant">
                      Passe deine Ernährungsvorlieben und KI-Provider in den Einstellungen an, 
                      um personalisierte Ergebnisse zu erhalten.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features */}
            <motion.div className="card p-6" variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-4">✨ Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    🤖 KI-Rezeptgenerierung
                  </h3>
                  <p className="text-on-surface-variant text-sm">
                    Nutze modernste KI-Technologie (OpenAI, DeepSeek, Grok) um kreative 
                    Rezepte basierend auf deinen Zutaten zu erstellen.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    📚 Rezeptverwaltung
                  </h3>
                  <p className="text-on-surface-variant text-sm">
                    Speichere und organisiere all deine generierten und eigenen Rezepte 
                    an einem zentralen Ort.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    ❤️ Favoriten
                  </h3>
                  <p className="text-on-surface-variant text-sm">
                    Markiere deine liebsten Rezepte als Favoriten für schnellen Zugriff.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    🍹 Cocktails (Bald)
                  </h3>
                  <p className="text-on-surface-variant text-sm">
                    Ein spezieller Cocktail-Generator wird bald verfügbar sein.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* FAQ */}
            <motion.div className="card p-6" variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-4">❓ Häufige Fragen</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Wie funktioniert die KI-Rezeptgenerierung?</h3>
                  <p className="text-on-surface-variant text-sm">
                    Unsere KI analysiert deine eingegebenen Zutaten und erstellt basierend auf 
                    Millionen von Rezepten und Kochprinzipien ein maßgeschneidertes Rezept für dich.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Welche KI-Provider werden unterstützt?</h3>
                  <p className="text-on-surface-variant text-sm">
                    Wir unterstützen OpenAI GPT-4 (Standard), DeepSeek und Grok AI. 
                    Du kannst in den Einstellungen deinen bevorzugten Provider auswählen.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Ist ZauberKoch kostenlos?</h3>
                  <p className="text-on-surface-variant text-sm">
                    Ja! Du kannst täglich 3 kostenlose Rezepte generieren. Mit Premium erhältst du 
                    unbegrenzte Generierungen und weitere exklusive Features.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Support */}
            <motion.div className="card p-6 text-center" variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-4">🤝 Support</h2>
              <p className="text-on-surface-variant mb-6">
                Hast du weitere Fragen oder brauchst Hilfe? Wir sind für dich da!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <button className="btn btn-primary btn-lg">
                    Zurück zum Dashboard
                  </button>
                </Link>
                <Link href="/recipes/generate">
                  <button className="btn btn-outline btn-lg">
                    Erstes Rezept generieren
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}