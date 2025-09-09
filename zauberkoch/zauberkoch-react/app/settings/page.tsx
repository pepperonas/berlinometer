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
            <h1 className="text-4xl font-bold mb-4">⚙️ Einstellungen</h1>
            <p className="text-on-surface-variant text-lg">
              Passe deine kulinarischen Präferenzen an
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Ernährungsvorlieben */}
            <motion.div className="card p-6" variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-4">🥗 Ernährungsvorlieben</h2>
              <p className="text-on-surface-variant mb-4">
                Wähle deine Ernährungsvorlieben aus, damit die KI passende Rezepte für dich generiert:
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Vegetarisch', 'Vegan', 'Glutenfrei', 
                  'Laktosefrei', 'Low Carb', 'Keto',
                  'Paleo', 'Mediterran', 'Asiatisch'
                ].map(preference => (
                  <button
                    key={preference}
                    onClick={() => handlePreferenceToggle(preference)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      dietaryPreferences.includes(preference)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-variant/30 border-outline hover:border-primary'
                    }`}
                  >
                    {preference}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Standard-Schwierigkeitsgrad */}
            <motion.div className="card p-6" variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-4">👨‍🍳 Standard-Schwierigkeitsgrad</h2>
              <p className="text-on-surface-variant mb-4">
                Lege deinen bevorzugten Schwierigkeitsgrad für neue Rezepte fest:
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'easy', label: 'Einfach', emoji: '😊' },
                  { value: 'medium', label: 'Mittel', emoji: '👍' },
                  { value: 'hard', label: 'Schwer', emoji: '💪' }
                ].map(level => (
                  <button
                    key={level.value}
                    onClick={() => setDifficulty(level.value)}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      difficulty === level.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-variant/30 border-outline hover:border-primary'
                    }`}
                  >
                    <div className="text-2xl mb-2">{level.emoji}</div>
                    <div className="font-medium">{level.label}</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* KI-Provider Auswahl */}
            <motion.div className="card p-6" variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-4">🤖 KI-Provider</h2>
              <p className="text-on-surface-variant mb-4">
                Wähle deinen bevorzugten KI-Provider für die Rezeptgenerierung:
              </p>
              
              <div className="space-y-3">
                {[
                  { value: 'openai', label: 'OpenAI GPT-4', description: 'Hochwertige und kreative Rezepte' },
                  { value: 'deepseek', label: 'DeepSeek', description: 'Schnelle und effiziente Generierung' },
                  { value: 'grok', label: 'Grok AI', description: 'Innovative und überraschende Rezepte' }
                ].map(provider => (
                  <button
                    key={provider.value}
                    onClick={() => setAiProvider(provider.value)}
                    className={`w-full p-4 rounded-lg border text-left transition-colors ${
                      aiProvider === provider.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-variant/30 border-outline hover:border-primary'
                    }`}
                  >
                    <div className="font-medium mb-1">{provider.label}</div>
                    <div className={`text-sm ${aiProvider === provider.value ? 'text-primary-light' : 'text-on-surface-variant'}`}>
                      {provider.description}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Benachrichtigungen */}
            <motion.div className="card p-6" variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-4">🔔 Benachrichtigungen</h2>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Rezept-Benachrichtigungen</h3>
                  <p className="text-sm text-on-surface-variant">
                    Erhalte Benachrichtigungen über neue Features und Rezeptvorschläge
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications ? 'bg-primary' : 'bg-outline'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </motion.div>

            {/* Speichern Button */}
            <motion.div className="card p-6 text-center" variants={itemVariants}>
              <button className="btn btn-primary btn-lg mr-4">
                Einstellungen speichern
              </button>
              <Link href="/dashboard">
                <button className="btn btn-outline btn-lg">
                  Zurück zum Dashboard
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}