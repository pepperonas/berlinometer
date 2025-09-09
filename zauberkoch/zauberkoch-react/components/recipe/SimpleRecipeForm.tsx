'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SimpleRecipeForm() {
  const [ingredients, setIngredients] = useState('');
  const [servings, setServings] = useState('2');
  const [cookingTime, setCookingTime] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      // Simulate recipe generation for now
      setTimeout(() => {
        setRecipe({
          title: 'Generiertes Testrezept',
          description: 'Ein einfaches Rezept basierend auf deinen Zutaten',
          instructions: ['Zutaten vorbereiten', 'Zusammen mischen', 'Kochen', 'Servieren']
        });
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Simple Navigation */}
      <nav className="bg-primary text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            🍳 ZauberKoch
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-primary-light">Dashboard</Link>
            <Link href="/auth/login" className="bg-white text-primary px-4 py-2 rounded">Anmelden</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Rezept generieren</h1>
          
          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="ingredients" className="block text-sm font-medium mb-2">
                  Verfügbare Zutaten
                </label>
                <textarea
                  id="ingredients"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="z.B. Tomaten, Nudeln, Käse..."
                  className="w-full p-3 border border-outline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="servings" className="block text-sm font-medium mb-2">
                    Portionen
                  </label>
                  <input
                    type="number"
                    id="servings"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    min="1"
                    max="20"
                    className="w-full p-3 border border-outline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cookingTime" className="block text-sm font-medium mb-2">
                    Zubereitungszeit (Min)
                  </label>
                  <input
                    type="number"
                    id="cookingTime"
                    value={cookingTime}
                    onChange={(e) => setCookingTime(e.target.value)}
                    min="5"
                    max="240"
                    className="w-full p-3 border border-outline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !ingredients.trim()}
                className="btn btn-primary w-full py-3 text-lg"
              >
                {isGenerating ? 'Rezept wird generiert...' : 'Rezept generieren'}
              </button>
            </form>
          </div>

          {recipe && (
            <div className="card p-6 mt-8">
              <h2 className="text-2xl font-bold mb-4">{recipe.title}</h2>
              <p className="text-on-surface-variant mb-4">{recipe.description}</p>
              <div>
                <h3 className="text-lg font-semibold mb-2">Zubereitung:</h3>
                <ol className="space-y-2">
                  {recipe.instructions.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-on-surface-variant">
                  ⚠️ Dies ist eine Demo-Version. Für vollständige KI-Rezepte bitte einloggen.
                </p>
                <Link href="/auth/login" className="btn btn-outline mt-4">
                  Jetzt anmelden
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}