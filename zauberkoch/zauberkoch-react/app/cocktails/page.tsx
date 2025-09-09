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

export default function CocktailsPage() {
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
            <h1 className="text-4xl font-bold mb-4">🍹 Cocktail-Rezepte</h1>
            <p className="text-on-surface-variant text-lg">
              Entdecke kreative Drink-Rezepte für jeden Anlass
            </p>
          </motion.div>

          <motion.div className="card p-8 text-center" variants={itemVariants}>
            <div className="text-6xl mb-6">🍸</div>
            <h2 className="text-2xl font-bold mb-4">Cocktail-Generator kommt bald!</h2>
            <p className="text-on-surface-variant mb-8 max-w-2xl mx-auto">
              Wir arbeiten an einem speziellen KI-gestützten Cocktail-Generator, 
              der dir perfekte Drink-Rezepte basierend auf deinen verfügbaren Zutaten erstellt.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
              <div className="bg-surface-variant/30 p-4 rounded-lg">
                <div className="text-2xl mb-2">🥃</div>
                <h3 className="font-semibold mb-2">Klassiker</h3>
                <p className="text-sm text-on-surface-variant">
                  Zeitlose Cocktail-Klassiker wie Mojito, Negroni und Old Fashioned
                </p>
              </div>
              <div className="bg-surface-variant/30 p-4 rounded-lg">
                <div className="text-2xl mb-2">🍓</div>
                <h3 className="font-semibold mb-2">Fruchtig</h3>
                <p className="text-sm text-on-surface-variant">
                  Erfrischende Cocktails mit frischen Früchten und Säften
                </p>
              </div>
              <div className="bg-surface-variant/30 p-4 rounded-lg">
                <div className="text-2xl mb-2">🌿</div>
                <h3 className="font-semibold mb-2">Experimentell</h3>
                <p className="text-sm text-on-surface-variant">
                  Innovative Kreationen mit besonderen Zutaten und Techniken
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/recipes/generate">
                <button className="btn btn-lg" style={{ backgroundColor: '#FF6B35', color: 'white' }}>
                  Vorerst Rezepte generieren
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="btn btn-outline btn-lg">
                  Zurück zum Dashboard
                </button>
              </Link>
            </div>
          </motion.div>

          <motion.div className="mt-8" variants={itemVariants}>
            <div className="card p-6 bg-primary/5 border-primary/20">
              <h3 className="text-lg font-semibold mb-3 text-primary">✨ Premium Preview</h3>
              <p className="text-on-surface-variant">
                Mit einem Premium-Account erhältst du als einer der ersten Zugang zum 
                Cocktail-Generator und weitere exklusive Features!
              </p>
              <Link href="/premium" className="btn btn-primary mt-4">
                Premium werden
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}