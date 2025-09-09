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

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="container py-16 lg:py-24">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-full text-sm font-semibold mb-6"
              variants={itemVariants}
            >
              🏠 Willkommen zurück!
            </motion.div>
            
            <motion.h1 
              className="text-4xl lg:text-6xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              Dein Küchenuniversum
            </motion.h1>
            
            <motion.p 
              className="text-xl text-primary-light mb-8 leading-relaxed max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Entdecke neue Rezepte, verwalte deine Favoriten und lass dich von der KI zu kulinarischen Höchstleistungen inspirieren.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={itemVariants}
            >
              <Link href="/recipes/generate">
                <button className="btn btn-lg bg-white text-primary hover:bg-surface transition-all transform hover:scale-105 shadow-lg px-8 py-4">
                  🎨 Neues Rezept generieren
                </button>
              </Link>
              <Link href="/recipes">
                <button className="btn btn-lg btn-outline text-white border-white hover:bg-white hover:text-primary px-8 py-4">
                  📚 Meine Rezepte ansehen
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container py-16 lg:py-20">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Quick Actions */}
          <motion.div 
            className="lg:col-span-2 space-y-8"
            variants={itemVariants}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Schnellzugriff</h2>
              <p className="text-on-surface-variant">Alles was du für den perfekten Kochstart brauchst</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Rezept Generieren',
                  description: 'Erstelle ein neues Rezept aus deinen verfügbaren Zutaten',
                  icon: '🍳',
                  href: '/recipes/generate',
                  gradient: 'from-primary to-primary-dark',
                  textColor: 'text-white'
                },
                {
                  title: 'Cocktail Mixen',
                  description: 'Entdecke einzigartige Cocktail-Rezepte für jeden Anlass',
                  icon: '🍸',
                  href: '/cocktails',
                  gradient: 'from-purple-500 to-pink-500',
                  textColor: 'text-white'
                },
                {
                  title: 'Meine Rezepte',
                  description: 'Durchsuche und verwalte deine gespeicherten Rezepte',
                  icon: '📚',
                  href: '/recipes',
                  gradient: 'from-blue-500 to-indigo-600',
                  textColor: 'text-white'
                },
                {
                  title: 'Favoriten',
                  description: 'Deine Lieblingsrezepte auf einen Blick',
                  icon: '⭐',
                  href: '/favorites',
                  gradient: 'from-amber-500 to-orange-500',
                  textColor: 'text-white'
                }
              ].map((action, index) => (
                <Link key={index} href={action.href}>
                  <motion.div 
                    className={`card p-6 shadow-lg border border-outline/20 bg-gradient-to-br ${action.gradient} ${action.textColor} hover:shadow-xl hover:scale-105 transition-all duration-300 group cursor-pointer`}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl group-hover:scale-110 transition-transform">
                        {action.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2 group-hover:text-opacity-90">
                          {action.title}
                        </h3>
                        <p className="text-sm opacity-90 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Stats & Info */}
          <motion.div 
            className="space-y-8"
            variants={itemVariants}
          >
            <div className="card p-6 shadow-lg border border-outline/20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                📊 Deine Statistiken
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Generierte Rezepte', value: '12', icon: '🍳' },
                  { label: 'Favoriten', value: '8', icon: '⭐' },
                  { label: 'Diese Woche', value: '3', icon: '📅' }
                ].map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{stat.icon}</span>
                      <span className="text-sm text-on-surface-variant">{stat.label}</span>
                    </div>
                    <span className="font-bold text-primary">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-secondary/10 to-secondary/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-secondary">
                💡 Tipp des Tages
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                Experimentiere mit verschiedenen KI-Providern! Jeder hat seinen eigenen Kochstil und 
                kann dir einzigartige Rezeptideen liefern.
              </p>
              <Link href="/settings">
                <button className="btn btn-sm btn-outline border-secondary text-secondary hover:bg-secondary hover:text-white">
                  KI-Einstellungen
                </button>
              </Link>
            </div>

            <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-success/10 to-success/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-success">
                🚀 Premium Features
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                Upgrade zu Premium für unbegrenzte Rezepte, alle KI-Provider und exklusive Features.
              </p>
              <Link href="/premium">
                <button className="btn btn-sm btn-primary">
                  Jetzt upgraden
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          className="mt-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="card p-8 shadow-lg border border-outline/20"
            variants={itemVariants}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              🕒 Letzte Aktivitäten
            </h2>
            <div className="space-y-4">
              {[
                {
                  action: 'Pasta Carbonara generiert',
                  time: 'vor 2 Stunden',
                  icon: '🍝'
                },
                {
                  action: 'Mojito Cocktail zu Favoriten hinzugefügt',
                  time: 'vor 1 Tag',
                  icon: '🍸'
                },
                {
                  action: 'Profil aktualisiert',
                  time: 'vor 3 Tagen',
                  icon: '👤'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors">
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-on-surface-variant">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}