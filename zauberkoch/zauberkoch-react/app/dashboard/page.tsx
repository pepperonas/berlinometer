'use client';

import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Willkommen bei ZauberKoch! 🍳
          </h1>
          <p className="text-muted-foreground">
            Deine AI-gestützte Küche wartet auf dich
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Rezept generieren */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-2xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold mb-2">Rezept generieren</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Lass die KI ein perfektes Rezept für dich erstellen
            </p>
            <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Rezept erstellen
            </button>
          </div>

          {/* Meine Rezepte */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-2xl mb-4">📚</div>
            <h2 className="text-xl font-semibold mb-2">Meine Rezepte</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Verwalte und durchsuche deine gespeicherten Rezepte
            </p>
            <button className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors">
              Rezepte anzeigen
            </button>
          </div>

          {/* Favoriten */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-2xl mb-4">❤️</div>
            <h2 className="text-xl font-semibold mb-2">Favoriten</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Deine liebsten Rezepte auf einen Blick
            </p>
            <button className="w-full bg-accent text-accent-foreground px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors">
              Favoriten ansehen
            </button>
          </div>

          {/* Cocktails */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-2xl mb-4">🍹</div>
            <h2 className="text-xl font-semibold mb-2">Cocktail-Rezepte</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Entdecke kreative Drink-Rezepte
            </p>
            <button className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
              Cocktails mixen
            </button>
          </div>

          {/* Einstellungen */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-2xl mb-4">⚙️</div>
            <h2 className="text-xl font-semibold mb-2">Einstellungen</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Passe deine Präferenzen an
            </p>
            <button className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
              Einstellungen öffnen
            </button>
          </div>

          {/* Premium */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-white">
            <div className="text-2xl mb-4">⭐</div>
            <h2 className="text-xl font-semibold mb-2">Premium</h2>
            <p className="text-purple-100 mb-4">
              Unbegrenzte Rezepte und exklusive Features
            </p>
            <button className="w-full bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium">
              Upgrade jetzt
            </button>
          </div>
        </div>

        {/* Statistiken */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Deine Küchen-Statistiken</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Rezepte erstellt</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Favoriten</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Cocktails</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">Free</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Account Status</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}