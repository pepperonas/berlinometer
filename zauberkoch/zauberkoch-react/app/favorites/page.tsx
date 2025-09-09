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

export default function FavoritesPage() {
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
            <h1 className="text-4xl font-bold mb-4">❤️ Meine Favoriten</h1>
            <p className="text-on-surface-variant text-lg">
              Deine liebsten Rezepte auf einen Blick
            </p>
          </motion.div>

          <motion.div className="card p-8 text-center" variants={itemVariants}>
            <div className="text-6xl mb-6">🍽️</div>
            <h2 className="text-2xl font-bold mb-4">Noch keine Favoriten</h2>
            <p className="text-on-surface-variant mb-8 max-w-2xl mx-auto">
              Du hast noch keine Rezepte zu deinen Favoriten hinzugefügt. 
              Generiere dein erstes Rezept oder durchstöbere die vorhandenen Rezepte!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/recipes/generate">
                <button className="btn btn-primary btn-lg">
                  Erstes Rezept generieren
                </button>
              </Link>
              <Link href="/recipes">
                <button className="btn btn-outline btn-lg">
                  Rezepte durchsuchen
                </button>
              </Link>
            </div>
          </motion.div>

          <motion.div className="mt-8 text-center" variants={itemVariants}>
            <Link href="/dashboard">
              <button className="btn btn-ghost">
                ← Zurück zum Dashboard
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}