'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

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

export default function SettingsPage() {
  const { user } = useAuth();
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [aiProvider, setAiProvider] = useState('openai');
  const [notifications, setNotifications] = useState(true);

  const handlePreferenceToggle = (preference: string) => {
    setDietaryPreferences(prev => 
      prev.includes(preference) 
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="container py-16 lg:py-20">
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
              ⚙️ Persönliche Einstellungen
            </motion.div>
            
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              Deine Küchen-Präferenzen
            </motion.h1>
            
            <motion.p 
              className="text-xl text-primary-light mb-8 leading-relaxed max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Passe ZauberKoch an deinen persönlichen Geschmack an. Die KI wird deine Präferenzen bei der Rezeptgenerierung berücksichtigen.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="container py-16 lg:py-20">
        <motion.div 
          className="max-w-4xl mx-auto space-y-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Ernährungsvorlieben */}
          <motion.div 
            className="card p-8 shadow-lg border border-outline/20"
            variants={itemVariants}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                🥗
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Ernährungsvorlieben</h2>
                <p className="text-on-surface-variant">
                  Wähle deine Ernährungsvorlieben aus, damit die KI passende Rezepte für dich generiert
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'Vegetarisch', 'Vegan', 'Glutenfrei', 
                'Laktosefrei', 'Low Carb', 'Keto',
                'Paleo', 'Mediterran', 'Asiatisch'
              ].map(preference => (
                <button
                  key={preference}
                  onClick={() => handlePreferenceToggle(preference)}
                  className={`p-4 rounded-xl border-2 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                    dietaryPreferences.includes(preference)
                      ? 'bg-primary text-white border-primary shadow-lg'
                      : 'bg-surface-variant/30 border-outline/30 hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  {preference}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Standard-Schwierigkeitsgrad */}
          <motion.div 
            className="card p-8 shadow-lg border border-outline/20"
            variants={itemVariants}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                👨‍🍳
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Standard-Schwierigkeitsgrad</h2>
                <p className="text-on-surface-variant">
                  Lege deinen bevorzugten Schwierigkeitsgrad für neue Rezepte fest
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'easy', label: 'Einfach', emoji: '😊', desc: 'Schnell & unkompliziert', gradient: 'from-green-400 to-green-500' },
                { value: 'medium', label: 'Mittel', emoji: '👍', desc: 'Ausgewogen & lehrreich', gradient: 'from-yellow-400 to-orange-500' },
                { value: 'hard', label: 'Schwer', emoji: '💪', desc: 'Herausfordernd & komplex', gradient: 'from-red-500 to-pink-600' }
              ].map(level => (
                <button
                  key={level.value}
                  onClick={() => setDifficulty(level.value)}
                  className={`p-6 rounded-xl border-2 text-center transition-all duration-300 hover:scale-105 ${
                    difficulty === level.value
                      ? `bg-gradient-to-br ${level.gradient} text-white border-transparent shadow-lg`
                      : 'bg-surface-variant/30 border-outline/30 hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  <div className="text-3xl mb-3">{level.emoji}</div>
                  <div className="font-bold text-lg mb-1">{level.label}</div>
                  <div className={`text-sm ${difficulty === level.value ? 'text-white/90' : 'text-on-surface-variant'}`}>
                    {level.desc}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* KI-Provider Auswahl */}
          <motion.div 
            className="card p-8 shadow-lg border border-outline/20"
            variants={itemVariants}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                🤖
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">KI-Provider</h2>
                <p className="text-on-surface-variant">
                  Wähle deinen bevorzugten KI-Provider für die Rezeptgenerierung
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { 
                  value: 'openai', 
                  label: 'OpenAI GPT-4o', 
                  description: 'Hochwertige und kreative Rezepte mit professioneller Struktur',
                  icon: '🧠',
                  gradient: 'from-emerald-500 to-teal-600'
                },
                { 
                  value: 'deepseek', 
                  label: 'DeepSeek', 
                  description: 'Schnelle und effiziente Generierung mit praktischen Tipps',
                  icon: '⚡',
                  gradient: 'from-blue-500 to-cyan-600'
                },
                { 
                  value: 'grok', 
                  label: 'Grok AI', 
                  description: 'Innovative und überraschende Rezepte mit Humor und Kreativität',
                  icon: '🚀',
                  gradient: 'from-orange-500 to-red-500'
                }
              ].map(provider => (
                <button
                  key={provider.value}
                  onClick={() => setAiProvider(provider.value)}
                  className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-300 hover:scale-[1.02] ${
                    aiProvider === provider.value
                      ? `bg-gradient-to-br ${provider.gradient} text-white border-transparent shadow-lg`
                      : 'bg-surface-variant/30 border-outline/30 hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{provider.icon}</div>
                    <div>
                      <div className="font-bold text-lg mb-2">{provider.label}</div>
                      <div className={`text-sm leading-relaxed ${aiProvider === provider.value ? 'text-white/90' : 'text-on-surface-variant'}`}>
                        {provider.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Benachrichtigungen */}
          <motion.div 
            className="card p-8 shadow-lg border border-outline/20"
            variants={itemVariants}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                🔔
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Benachrichtigungen</h2>
                <p className="text-on-surface-variant">
                  Verwalte deine Benachrichtigungseinstellungen
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-variant/30">
                <div>
                  <h3 className="font-semibold text-lg">Rezept-Benachrichtigungen</h3>
                  <p className="text-sm text-on-surface-variant">
                    Erhalte Benachrichtigungen über neue Features und Rezeptvorschläge
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    notifications ? 'bg-primary' : 'bg-outline'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    notifications ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Speichern Button */}
          <motion.div 
            className="card p-8 shadow-lg border border-outline/20 bg-gradient-to-br from-surface-variant/50 to-surface-variant/20 text-center"
            variants={itemVariants}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="btn btn-primary btn-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                ✅ Einstellungen speichern
              </button>
              <Link href="/dashboard">
                <button className="btn btn-outline btn-lg px-8 py-4 border-2 hover:bg-primary hover:text-white">
                  ← Zurück zum Dashboard
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}