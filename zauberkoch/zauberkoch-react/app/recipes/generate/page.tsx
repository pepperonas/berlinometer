'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RecipeGeneratePage() {
  const [ingredients, setIngredients] = useState('');
  const [servings, setServings] = useState('2');
  const [cookingTime, setCookingTime] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const ingredientsList = ingredients.split(',').map(item => item.trim()).filter(Boolean);
      
      const recipeRequest = {
        ingredients: ingredientsList,
        servings: parseInt(servings),
        cookingTime: parseInt(cookingTime),
        difficulty: 'medium',
        aiProvider: 'openai'
      };

      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unbekannter Fehler' }));
        throw new Error(errorData.message || 'Fehler beim Generieren des Rezepts');
      }

      const data = await response.json();
      setRecipe(data.recipe);
      setIsGenerating(false);
    } catch (error) {
      console.error('Recipe generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Generieren des Rezepts';
      
      // Fallback zu Demo-Rezept bei Fehler
      setRecipe({
        title: 'Demo-Rezept (Fehler bei KI-Generation)',
        description: `Fallback-Rezept mit ${ingredients} für ${servings} Personen - ${errorMessage}`,
        instructions: [
          'Alle Zutaten vorbereiten und waschen',
          'Die Hauptzutaten in einer Pfanne erhitzen',
          'Nach Belieben würzen und für ' + cookingTime + ' Minuten kochen',
          'Heiß servieren und genießen!'
        ]
      });
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
            <Link href="/dashboard" className="hover:text-primary-light transition-colors">Dashboard</Link>
            <Link href="/auth/login" className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100 transition-colors">
              Anmelden
            </Link>
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
                  placeholder="z.B. Tomaten, Nudeln, Käse, Zwiebeln..."
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
                className="btn btn-primary w-full py-3 text-lg disabled:opacity-50"
              >
                {isGenerating ? 'Rezept wird generiert... 🤖' : 'Rezept generieren ✨'}
              </button>
            </form>
          </div>

          {recipe && (
            <div className="mt-12 space-y-12">
              {/* Recipe Header */}
              <div className="card p-10 shadow-xl border-2 border-primary/30 bg-gradient-to-br from-surface to-surface-variant/20">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-secondary/15 text-primary border border-primary/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                    ✨ {recipe.category || 'Hauptgericht'}
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-bold text-on-surface mb-6 leading-tight">
                    {recipe.title}
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
                  <p className="text-on-surface-variant text-xl leading-relaxed max-w-3xl mx-auto font-light">
                    {recipe.description}
                  </p>
                </div>
                
                {/* Recipe Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                  <div className="bg-gradient-to-br from-surface-variant/20 to-surface-variant/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-outline/10 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="text-3xl mb-3">👥</div>
                    <div className="text-sm text-on-surface-variant font-medium mb-1">Portionen</div>
                    <div className="text-2xl font-bold text-on-surface">{recipe.servings}</div>
                  </div>
                  <div className="bg-gradient-to-br from-surface-variant/20 to-surface-variant/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-outline/10 hover:border-secondary/20 hover:shadow-lg transition-all duration-300">
                    <div className="text-3xl mb-3">⏱️</div>
                    <div className="text-sm text-on-surface-variant font-medium mb-1">Zeit</div>
                    <div className="text-2xl font-bold text-on-surface">{recipe.preparationTime}</div>
                  </div>
                  <div className="bg-gradient-to-br from-surface-variant/20 to-surface-variant/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-outline/10 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="text-3xl mb-3">📊</div>
                    <div className="text-sm text-on-surface-variant font-medium mb-1">Schwierigkeit</div>
                    <div className="text-2xl font-bold text-on-surface capitalize">{recipe.difficulty}</div>
                  </div>
                  <div className="bg-gradient-to-br from-surface-variant/20 to-surface-variant/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-outline/10 hover:border-success/20 hover:shadow-lg transition-all duration-300">
                    <div className="text-3xl mb-3">🔥</div>
                    <div className="text-sm text-on-surface-variant font-medium mb-1">Kalorien</div>
                    <div className="text-2xl font-bold text-on-surface">{recipe.nutritionalInfo?.calories || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div className="card p-8 shadow-lg border border-outline/20">
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">🛒</span>
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface">Zutaten</h3>
                  </div>
                  <p className="text-on-surface-variant ml-14">Für {recipe.servings} Portionen</p>
                </div>
                
                <div className="space-y-4">
                  {recipe.ingredients && recipe.ingredients.length > 0 ? (
                    recipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="group relative mb-4">
                        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-surface-variant/10 to-surface-variant/5 rounded-xl border border-outline/10 hover:border-primary/20 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 bg-gradient-to-br from-primary to-secondary rounded-full flex-shrink-0 group-hover:scale-110 transition-transform"></div>
                            <div>
                              <span className="font-semibold text-on-surface text-lg leading-tight">
                                {ingredient.name}
                              </span>
                              {ingredient.preparation && (
                                <div className="text-on-surface-variant text-sm mt-1 italic">
                                  {ingredient.preparation}
                                </div>
                              )}
                              {ingredient.category && (
                                <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium mt-2">
                                  {ingredient.category}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-primary font-bold text-lg">
                              {ingredient.amount}
                            </div>
                            <div className="text-on-surface-variant text-sm font-medium">
                              {ingredient.unit}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📝</div>
                      <p className="text-on-surface-variant text-lg">Keine Zutaten verfügbar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="card p-8 shadow-lg border border-outline/20">
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary-dark rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">👨‍🍳</span>
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface">Zubereitung</h3>
                  </div>
                  <p className="text-on-surface-variant ml-14">Schritt für Schritt Anleitung</p>
                </div>
                
                <div className="space-y-6">
                  {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 ? (
                    recipe.instructions.map((step, index) => (
                      <div key={index} className="group relative">
                        <div className="flex gap-5 items-start p-8 bg-gradient-to-r from-surface-variant/8 to-surface-variant/4 rounded-xl border border-outline/8 hover:border-secondary/20 hover:shadow-lg transition-all duration-300">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-dark text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md group-hover:scale-105 transition-transform">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <p className="text-on-surface leading-relaxed text-lg font-medium">{step}</p>
                          </div>
                        </div>
                        {/* Connection line to next step */}
                        {index < recipe.instructions.length - 1 && (
                          <div className="w-0.5 h-4 bg-gradient-to-b from-secondary/40 to-transparent ml-6 mt-2"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📋</div>
                      <p className="text-on-surface-variant text-lg">Keine Anweisungen verfügbar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cooking Tips */}
              {recipe.cookingTips && (
                <div className="card p-8 shadow-lg bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/30">
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">💡</span>
                      </div>
                      <h3 className="text-2xl font-bold text-primary">Profi-Tipps</h3>
                    </div>
                    <p className="text-primary/80 ml-14 text-sm">Für perfekte Ergebnisse</p>
                  </div>
                  <div className="p-6 bg-white/50 dark:bg-surface/30 rounded-xl border border-primary/20">
                    <p className="text-on-surface leading-relaxed text-lg font-medium">{recipe.cookingTips}</p>
                  </div>
                </div>
              )}

              {/* Serving Tips */}
              {recipe.servingTips && (
                <div className="card p-8 shadow-lg bg-gradient-to-br from-success/8 to-success/3 border border-success/30">
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-success to-success-dark rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">🍽️</span>
                      </div>
                      <h3 className="text-2xl font-bold text-success">Serviervorschlag</h3>
                    </div>
                    <p className="text-success/80 ml-14 text-sm">So wird&apos;s perfekt präsentiert</p>
                  </div>
                  <div className="p-6 bg-white/50 dark:bg-surface/30 rounded-xl border border-success/20">
                    <p className="text-on-surface leading-relaxed text-lg font-medium">{recipe.servingTips}</p>
                  </div>
                </div>
              )}

              {/* Nutritional Info */}
              {recipe.nutritionalInfo && (
                <div className="card p-8 shadow-lg border border-outline/20">
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-info to-info-dark rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">📈</span>
                      </div>
                      <h3 className="text-2xl font-bold text-on-surface">Nährwerte pro Portion</h3>
                    </div>
                    <p className="text-on-surface-variant ml-14">Detaillierte Nährwertangaben</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="text-center p-6 bg-gradient-to-br from-surface-variant/15 to-surface-variant/5 rounded-2xl border border-outline/10 hover:border-primary/20 hover:shadow-md transition-all duration-300">
                      <div className="text-3xl font-bold text-primary mb-2">{recipe.nutritionalInfo.calories}</div>
                      <div className="text-sm text-on-surface-variant font-medium">kcal</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-surface-variant/15 to-surface-variant/5 rounded-2xl border border-outline/10 hover:border-secondary/20 hover:shadow-md transition-all duration-300">
                      <div className="text-3xl font-bold text-secondary mb-2">{recipe.nutritionalInfo.protein}g</div>
                      <div className="text-sm text-on-surface-variant font-medium">Protein</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-surface-variant/15 to-surface-variant/5 rounded-2xl border border-outline/10 hover:border-success/20 hover:shadow-md transition-all duration-300">
                      <div className="text-3xl font-bold text-success mb-2">{recipe.nutritionalInfo.carbs}g</div>
                      <div className="text-sm text-on-surface-variant font-medium">Kohlenhydrate</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-surface-variant/15 to-surface-variant/5 rounded-2xl border border-outline/10 hover:border-warning/20 hover:shadow-md transition-all duration-300">
                      <div className="text-3xl font-bold text-warning mb-2">{recipe.nutritionalInfo.fat}g</div>
                      <div className="text-sm text-on-surface-variant font-medium">Fett</div>
                    </div>
                    {recipe.nutritionalInfo.fiber && (
                      <div className="text-center p-6 bg-gradient-to-br from-surface-variant/15 to-surface-variant/5 rounded-2xl border border-outline/10 hover:border-info/20 hover:shadow-md transition-all duration-300">
                        <div className="text-3xl font-bold text-info mb-2">{recipe.nutritionalInfo.fiber}g</div>
                        <div className="text-sm text-on-surface-variant font-medium">Ballaststoffe</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="card p-6 text-center bg-gradient-to-r from-success/5 to-primary/5">
                <p className="text-sm text-success mb-4 flex items-center justify-center gap-2">
                  ✨ <span>Generiert mit OpenAI GPT-4 KI-Technologie</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => setRecipe(null)} 
                    className="btn btn-primary btn-lg"
                  >
                    🔄 Neues Rezept generieren
                  </button>
                  <Link href="/recipes" className="btn btn-outline btn-lg">
                    📚 Alle Rezepte anzeigen
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}