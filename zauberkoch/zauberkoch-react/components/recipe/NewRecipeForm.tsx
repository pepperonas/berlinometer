'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCoffee, 
  FiClock, 
  FiUsers, 
  FiSend, 
  FiPlus, 
  FiX, 
  FiSettings,
  FiRefreshCw,
  FiBookmark,
  FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { AI_PROVIDERS_ARRAY, COOKING_TIMES, DIFFICULTY_LEVELS } from '@/lib/constants';
import type { RecipeRequest, Recipe, FoodPreference, AiProvider } from '@/types';

interface NewRecipeFormProps {
  onRecipeGenerated?: (recipe: Recipe) => void;
}

function NewRecipeForm({ onRecipeGenerated }: NewRecipeFormProps) {
  const { user } = useAuth();
  
  // Form state - completely independent, no external form libraries
  const [servings, setServings] = useState('2');
  const [cookingTime, setCookingTime] = useState('30');
  const [difficulty, setDifficulty] = useState('medium');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [additionalRequests, setAdditionalRequests] = useState('');
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('openai');
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Validation errors - simple object
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const ingredientInputRef = useRef<HTMLInputElement>(null);

  // Simple validation function - no external dependencies
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Servings validation
    const servingsNum = parseInt(servings);
    if (!servings || isNaN(servingsNum)) {
      newErrors.servings = 'Bitte gib eine gültige Zahl ein';
    } else if (servingsNum < 1 || servingsNum > 20) {
      newErrors.servings = 'Anzahl muss zwischen 1 und 20 liegen';
    }
    
    // Cooking time validation
    const cookingTimeNum = parseInt(cookingTime);
    if (!cookingTime || isNaN(cookingTimeNum)) {
      newErrors.cookingTime = 'Bitte gib eine gültige Zubereitungszeit ein';
    } else if (cookingTimeNum < 5 || cookingTimeNum > 240) {
      newErrors.cookingTime = 'Zubereitungszeit muss zwischen 5 und 240 Minuten liegen';
    }
    
    // Ingredients validation
    if (availableIngredients.length === 0) {
      newErrors.ingredients = 'Bitte füge mindestens eine Zutat hinzu';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user) {
      toast.error('Bitte melde dich an, um Rezepte zu generieren');
      return;
    }

    if (!validateForm()) {
      toast.error('Bitte korrigiere die Formularfehler');
      return;
    }

    setIsGenerating(true);

    try {
      const request: RecipeRequest = {
        ingredients: availableIngredients,
        servings: parseInt(servings),
        cookingTime: parseInt(cookingTime),
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        preferences: preferences as FoodPreference[],
        additionalRequests: additionalRequests || undefined,
        aiProvider: selectedProvider,
      };

      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Fehler bei der Rezeptgenerierung');
      }

      const recipe: Recipe = data.recipe;
      setGeneratedRecipe(recipe);
      onRecipeGenerated?.(recipe);
      
      toast.success('🍳 Rezept erfolgreich generiert!');
    } catch (error: any) {
      console.error('Recipe generation error:', error);
      toast.error(error?.message || 'Fehler bei der Rezeptgenerierung');
    } finally {
      setIsGenerating(false);
    }
  }

  // Ingredient management
  const addIngredient = () => {
    if (currentIngredient.trim() && !availableIngredients.includes(currentIngredient.trim())) {
      const newIngredient = currentIngredient.trim();
      setAvailableIngredients(prev => [...prev, newIngredient]);
      setCurrentIngredient('');
      ingredientInputRef.current?.focus();
      // Clear ingredients error if it exists
      if (errors.ingredients) {
        setErrors(prev => ({ ...prev, ingredients: '' }));
      }
    }
  };

  const removeIngredient = (ingredient: string) => {
    setAvailableIngredients(prev => prev.filter(i => i !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  // Preferences management
  const togglePreference = (preference: FoodPreference) => {
    const current = preferences;
    if (current.includes(preference)) {
      setPreferences(current.filter(p => p !== preference));
    } else {
      setPreferences([...current, preference]);
    }
  };

  // Recipe actions
  const handleRegenerateRecipe = () => {
    if (availableIngredients.length > 0) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  const saveRecipe = async () => {
    if (!generatedRecipe || !user) return;

    try {
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: generatedRecipe.id,
        }),
      });

      if (response.ok) {
        toast.success('📚 Rezept gespeichert!');
      } else {
        throw new Error('Fehler beim Speichern');
      }
    } catch (error) {
      toast.error('Fehler beim Speichern des Rezepts');
    }
  };

  const foodPreferences: { key: FoodPreference; label: string; emoji: string }[] = [
    { key: 'vegetarian', label: 'Vegetarisch', emoji: '🥕' },
    { key: 'vegan', label: 'Vegan', emoji: '🌱' },
    { key: 'gluten_free', label: 'Glutenfrei', emoji: '🌾' },
    { key: 'lactose_free', label: 'Laktosefrei', emoji: '🥛' },
    { key: 'low_carb', label: 'Low Carb', emoji: '🥩' },
    { key: 'keto', label: 'Keto', emoji: '🥑' },
    { key: 'diabetic', label: 'Diabetiker', emoji: '💊' },
    { key: 'halal', label: 'Halal', emoji: '🕌' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Recipe Generation Form */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FiCoffee className="text-primary" />
              Rezept generieren
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as AiProvider)}
                className="px-3 py-1 border border-outline rounded-lg bg-surface text-sm"
                disabled={isGenerating}
              >
                {AI_PROVIDERS_ARRAY.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                leftIcon={<FiSettings />}
              >
                Erweitert
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ingredients Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold">Verfügbare Zutaten</h3>
              
              <div className="flex gap-2">
                <Input
                  ref={ingredientInputRef}
                  placeholder="Zutat hinzufügen (z.B. Tomaten, Nudeln...)"
                  value={currentIngredient}
                  onChange={(e) => setCurrentIngredient(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={addIngredient}
                  leftIcon={<FiPlus />}
                  disabled={!currentIngredient.trim()}
                >
                  Hinzufügen
                </Button>
              </div>

              {errors.ingredients && (
                <p className="text-error text-sm">{errors.ingredients}</p>
              )}

              <AnimatePresence>
                <div className="flex flex-wrap gap-2">
                  {availableIngredients.map((ingredient, index) => (
                    <motion.div
                      key={ingredient}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full"
                    >
                      <span className="text-sm font-medium">{ingredient}</span>
                      <button
                        type="button"
                        onClick={() => removeIngredient(ingredient)}
                        className="hover:bg-primary/20 rounded-full p-1 transition-colors"
                      >
                        <FiX size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>

              {availableIngredients.length === 0 && (
                <p className="text-on-surface-variant text-sm">
                  Füge Zutaten hinzu, die du zur Verfügung hast. ZauberKoch generiert dann ein passendes Rezept!
                </p>
              )}
            </motion.div>

            {/* Basic Settings */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <Input
                  id="servings"
                  type="number"
                  label="Portionen"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => {
                    setServings(e.target.value);
                    if (errors.servings) {
                      setErrors(prev => ({ ...prev, servings: '' }));
                    }
                  }}
                  error={errors.servings || ''}
                  leftIcon={<FiUsers size={20} />}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  <FiClock className="inline mr-2" size={16} />
                  Zubereitungszeit
                </label>
                <select
                  value={cookingTime}
                  onChange={(e) => {
                    setCookingTime(e.target.value);
                    if (errors.cookingTime) {
                      setErrors(prev => ({ ...prev, cookingTime: '' }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {COOKING_TIMES.map(time => (
                    <option key={time.id} value={time.id}>
                      {time.name}
                    </option>
                  ))}
                </select>
                {errors.cookingTime && (
                  <p className="text-error text-sm mt-1">{errors.cookingTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Schwierigkeit
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-outline rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {DIFFICULTY_LEVELS.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>

            {/* Food Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h3 className="text-lg font-semibold">Ernährungsvorlieben</h3>
              <div className="flex flex-wrap gap-2">
                {foodPreferences.map(pref => (
                  <button
                    key={pref.key}
                    type="button"
                    onClick={() => togglePreference(pref.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      preferences.includes(pref.key)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-surface hover:bg-surface-variant border-outline'
                    }`}
                  >
                    <span>{pref.emoji}</span>
                    <span className="text-sm font-medium">{pref.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Advanced Settings */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold">Erweiterte Optionen</h3>
                  <Input
                    id="additionalRequests"
                    label="Zusätzliche Wünsche"
                    placeholder="z.B. besonders scharf, ohne Zwiebeln, mediterran..."
                    value={additionalRequests}
                    onChange={(e) => setAdditionalRequests(e.target.value)}
                    helperText="Beschreibe besondere Wünsche oder Anforderungen für das Rezept"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isGenerating}
                disabled={isGenerating || availableIngredients.length === 0}
                leftIcon={isGenerating ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
              >
                {isGenerating 
                  ? `Rezept wird generiert mit ${AI_PROVIDERS_ARRAY.find(p => p.id === selectedProvider)?.name}...`
                  : 'Rezept generieren'
                }
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>

      {/* Generated Recipe Display */}
      <AnimatePresence>
        {generatedRecipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-lg border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FiCoffee className="text-primary" />
                    {generatedRecipe.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          size={16}
                          className={i < 4 ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerateRecipe}
                      leftIcon={<FiRefreshCw />}
                      disabled={isGenerating}
                    >
                      Neu generieren
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveRecipe}
                      leftIcon={<FiBookmark />}
                    >
                      Speichern
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <FiUsers size={14} /> {generatedRecipe.servings} Portionen
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock size={14} /> {generatedRecipe.cookingTime || generatedRecipe.preparationTime} Min
                  </span>
                  <span className="capitalize">
                    {DIFFICULTY_LEVELS.find(d => d.value === generatedRecipe.difficulty)?.emoji}{' '}
                    {generatedRecipe.difficulty}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {generatedRecipe.description && (
                  <p className="text-on-surface-variant italic">
                    {generatedRecipe.description}
                  </p>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Ingredients */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Zutaten</h3>
                    <ul className="space-y-2">
                      {generatedRecipe.ingredients.map((ingredient, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-surface-variant/50 transition-colors"
                        >
                          <span className="text-primary font-mono text-sm mt-1">•</span>
                          <span>
                            {ingredient.amount && (
                              <span className="font-medium">{ingredient.amount} </span>
                            )}
                            {ingredient.unit && (
                              <span className="text-on-surface-variant">{ingredient.unit} </span>
                            )}
                            {ingredient.name}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Zubereitung</h3>
                    <ol className="space-y-3">
                      {(Array.isArray(generatedRecipe.instructions) 
                        ? generatedRecipe.instructions 
                        : [generatedRecipe.instructions]
                      ).map((instruction, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex gap-3 p-3 rounded-lg hover:bg-surface-variant/50 transition-colors"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="pt-1">{instruction}</span>
                        </motion.li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Nutritional Info */}
                {generatedRecipe.nutritionalInfo && (
                  <div className="bg-surface-variant/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Nährwerte pro Portion</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {generatedRecipe.nutritionalInfo.calories}
                        </div>
                        <div className="text-sm text-on-surface-variant">kcal</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {generatedRecipe.nutritionalInfo.protein}g
                        </div>
                        <div className="text-sm text-on-surface-variant">Eiweiß</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {generatedRecipe.nutritionalInfo.carbs}g
                        </div>
                        <div className="text-sm text-on-surface-variant">Kohlenhydrate</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {generatedRecipe.nutritionalInfo.fat}g
                        </div>
                        <div className="text-sm text-on-surface-variant">Fett</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Provider Info */}
                <div className="text-xs text-on-surface-variant text-center">
                  Generiert von {AI_PROVIDERS_ARRAY.find(p => p.id === selectedProvider)?.name}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NewRecipeForm;