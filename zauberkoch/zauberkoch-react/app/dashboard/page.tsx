'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="container py-12 lg:py-20">
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
              <button 
                onClick={() => router.push('/recipes')}
                className="btn btn-lg btn-outline text-white border-white hover:bg-white hover:text-primary"
              >
                Features entdecken
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12 lg:py-16">
        <motion.div 
          className="mb-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-4">
            Was möchtest du heute kochen?
          </h2>
          <p className="text-center text-on-surface-variant max-w-2xl mx-auto">
            Wähle aus unseren beliebtesten Features oder entdecke neue kulinarische Abenteuer
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Rezept generieren */}
          <motion.div 
            className="card group cursor-pointer hover:transform hover:scale-105"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
            <h3 className="text-xl lg:text-2xl font-bold mb-3 text-on-surface">Rezept generieren</h3>
            <p className="text-on-surface-variant mb-6 leading-relaxed">
              Lass die KI ein perfektes Rezept für dich erstellen basierend auf deinen Vorlieben
            </p>
            <Link href="/recipes/generate">
              <button className="btn btn-primary w-full">
                Rezept erstellen
              </button>
            </Link>
          </motion.div>

          {/* Meine Rezepte */}
          <motion.div 
            className="card group cursor-pointer hover:transform hover:scale-105"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📚</div>
            <h3 className="text-xl lg:text-2xl font-bold mb-3 text-on-surface">Meine Rezepte</h3>
            <p className="text-on-surface-variant mb-6 leading-relaxed">
              Verwalte und durchsuche deine gespeicherten Rezepte
            </p>
            <Link href="/recipes">
              <button className="btn btn-secondary w-full">
                Rezepte anzeigen
              </button>
            </Link>
          </motion.div>

          {/* Favoriten */}
          <motion.div 
            className="card group cursor-pointer hover:transform hover:scale-105"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">❤️</div>
            <h3 className="text-xl lg:text-2xl font-bold mb-3 text-on-surface">Favoriten</h3>
            <p className="text-on-surface-variant mb-6 leading-relaxed">
              Deine liebsten Rezepte auf einen Blick
            </p>
            <Link href="/favorites">
              <button className="btn btn-outline w-full">
                Favoriten ansehen
              </button>
            </Link>
          </motion.div>

          {/* Cocktails */}
          <motion.div 
            className="card group cursor-pointer hover:transform hover:scale-105"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🍹</div>
            <h3 className="text-xl lg:text-2xl font-bold mb-3 text-on-surface">Cocktail-Rezepte</h3>
            <p className="text-on-surface-variant mb-6 leading-relaxed">
              Entdecke kreative Drink-Rezepte für jeden Anlass
            </p>
            <Link href="/cocktails">
              <button className="btn w-full" style={{ backgroundColor: '#FF6B35', color: 'white' }}>
                Cocktails mixen
              </button>
            </Link>
          </motion.div>

          {/* Einstellungen */}
          <motion.div 
            className="card group cursor-pointer hover:transform hover:scale-105"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
            <h3 className="text-xl lg:text-2xl font-bold mb-3 text-on-surface">Einstellungen</h3>
            <p className="text-on-surface-variant mb-6 leading-relaxed">
              Passe deine kulinarischen Präferenzen an
            </p>
            <Link href="/settings">
              <button className="btn btn-ghost w-full">
                Einstellungen öffnen
              </button>
            </Link>
          </motion.div>

          {/* Premium */}
          <motion.div 
            className="relative overflow-hidden rounded-2xl shadow-xl p-8 cursor-pointer hover:transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl lg:text-2xl font-bold mb-3 text-white">Premium</h3>
              <p className="text-white/90 mb-6 leading-relaxed">
                Unbegrenzte Rezepte, exklusive KI-Features und Premium-Support
              </p>
              <Link href="/premium">
                <button className="btn w-full bg-white/20 text-white border-white/30 hover:bg-white hover:text-gray-800">
                  Upgrade jetzt
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Statistiken */}
        <motion.div 
          className="card"
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <h2 className="text-2xl lg:text-3xl font-bold mb-8 text-center text-on-surface">
            Deine Küchen-Statistiken
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="text-center p-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl lg:text-3xl font-bold text-primary">0</span>
              </div>
              <div className="text-sm lg:text-base font-medium text-on-surface-variant">Rezepte erstellt</div>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl lg:text-3xl font-bold text-error">0</span>
              </div>
              <div className="text-sm lg:text-base font-medium text-on-surface-variant">Favoriten</div>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl lg:text-3xl font-bold" style={{ color: '#FF6B35' }}>0</span>
              </div>
              <div className="text-sm lg:text-base font-medium text-on-surface-variant">Cocktails</div>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-base lg:text-lg font-bold text-success">Free</span>
              </div>
              <div className="text-sm lg:text-base font-medium text-on-surface-variant">Account Status</div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="mt-12 text-center"
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <h3 className="text-xl lg:text-2xl font-bold mb-6 text-on-surface">
            Bereit zum Loslegen?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/recipes/generate">
              <button className="btn btn-primary btn-lg">
                🍳 Erstes Rezept generieren
              </button>
            </Link>
            <button 
              onClick={() => router.push('/help')}
              className="btn btn-outline btn-lg"
            >
              📖 Tutorial anschauen
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}