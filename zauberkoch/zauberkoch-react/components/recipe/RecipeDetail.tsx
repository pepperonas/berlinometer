'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, 
  FiUsers, 
  FiBookmark, 
  FiStar,
  FiCoffee,
  FiX,
  FiShare,
  FiPrinter,
  FiDownload,
  FiHeart,
  FiRefreshCw
} from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DIFFICULTY_LEVELS, AI_PROVIDERS } from '@/lib/constants';
import type { Recipe, FoodPreference } from '@/types';

interface RecipeDetailProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (recipe: Recipe) => void;
  onRate?: (recipe: Recipe, rating: number) => void;
  onRegenerate?: (recipe: Recipe) => void;
  isSaved?: boolean;
}

export function RecipeDetail({ 
  recipe, 
  isOpen, 
  onClose, 
  onSave, 
  onRate, 
  onRegenerate,
  isSaved = false 
}: RecipeDetailProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const difficultyConfig = DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty);
  const aiProvider = AI_PROVIDERS.find(p => p.id === recipe.aiProvider);

  const getPreferenceInfo = (preferences: FoodPreference[]) => {
    const preferenceMap: Record<FoodPreference, { label: string; emoji: string; color: string }> = {
      vegetarian: { label: 'Vegetarisch', emoji: '🥕', color: 'bg-green-100 text-green-800' },
      vegan: { label: 'Vegan', emoji: '🌱', color: 'bg-green-100 text-green-800' },
      gluten_free: { label: 'Glutenfrei', emoji: '🌾', color: 'bg-yellow-100 text-yellow-800' },
      lactose_free: { label: 'Laktosefrei', emoji: '🥛', color: 'bg-blue-100 text-blue-800' },
      low_carb: { label: 'Low Carb', emoji: '🥩', color: 'bg-red-100 text-red-800' },
      keto: { label: 'Keto', emoji: '🥑', color: 'bg-purple-100 text-purple-800' },
      diabetic: { label: 'Diabetiker', emoji: '💊', color: 'bg-blue-100 text-blue-800' },
      halal: { label: 'Halal', emoji: '🕌', color: 'bg-green-100 text-green-800' },
    };

    return preferences.map(pref => preferenceMap[pref]).filter(Boolean);
  };

  const toggleStepComplete = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    if (completedSteps.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const handleRate = (rating: number) => {
    onRate?.(recipe, rating);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description || 'Leckeres Rezept von ZauberKoch',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share was cancelled or failed');
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-screen px-4 py-8 flex items-start justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl bg-surface rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 border-b border-outline/20">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <FiCoffee className="text-primary" size={24} />
                    <h1 className="text-2xl font-bold text-on-surface">
                      {recipe.title}
                    </h1>
                  </div>
                  {recipe.description && (
                    <p className="text-on-surface-variant">
                      {recipe.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    leftIcon={<FiShare size={16} />}
                  >
                    Teilen
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrint}
                    leftIcon={<FiPrinter size={16} />}
                  >
                    Drucken
                  </Button>
                  {onSave && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSave(recipe)}
                      leftIcon={<FiBookmark size={16} className={isSaved ? 'fill-current' : ''} />}
                      className={isSaved ? 'text-primary' : ''}
                    >
                      {isSaved ? 'Gespeichert' : 'Speichern'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    leftIcon={<FiX size={16} />}
                  >
                    Schließen
                  </Button>
                </div>
              </div>

              {/* Recipe Meta */}
              <div className="flex flex-wrap items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <FiUsers className="text-primary" size={16} />
                  <span className="text-sm font-medium">{recipe.servings} Portionen</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="text-primary" size={16} />
                  <span className="text-sm font-medium">{recipe.cookingTime} Minuten</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{difficultyConfig?.emoji}</span>
                  <span className="text-sm font-medium capitalize">{recipe.difficulty}</span>
                </div>
                {recipe.preferences && recipe.preferences.length > 0 && (
                  <div className="flex items-center gap-2">
                    {getPreferenceInfo(recipe.preferences).map((pref, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${pref.color}`}
                      >
                        <span>{pref.emoji}</span>
                        {pref.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Bewertung:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      className="hover:scale-110 transition-transform"
                    >
                      <FiStar
                        size={18}
                        className={
                          recipe.rating && star <= recipe.rating
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300 hover:text-yellow-400'
                        }
                      />
                    </button>
                  ))}
                  {recipe.rating && (
                    <span className="text-sm text-on-surface-variant ml-1">
                      ({recipe.rating}/5)
                    </span>
                  )}
                </div>
                
                {onRegenerate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRegenerate(recipe)}
                    leftIcon={<FiRefreshCw size={16} />}
                  >
                    Neu generieren
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Ingredients */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiCoffee className="text-primary" size={20} />
                    Zutaten
                  </h2>
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <ul className="space-y-3">
                        {recipe.ingredients.map((ingredient, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-variant/30 transition-colors"
                          >
                            <span className="text-primary font-mono text-lg leading-none mt-1">•</span>
                            <span className="flex-1">
                              {ingredient.amount && (
                                <span className="font-semibold text-primary">
                                  {ingredient.amount}{' '}
                                </span>
                              )}
                              {ingredient.unit && (
                                <span className="text-on-surface-variant">
                                  {ingredient.unit}{' '}
                                </span>
                              )}
                              <span className="text-on-surface">
                                {ingredient.name}
                              </span>
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Instructions */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiClock className="text-primary" size={20} />
                    Zubereitung
                  </h2>
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <ol className="space-y-4">
                        {recipe.instructions.map((instruction, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex gap-4 p-3 rounded-lg transition-all cursor-pointer ${
                              completedSteps.has(index)
                                ? 'bg-success/10 border border-success/20'
                                : selectedStep === index
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-surface-variant/30'
                            }`}
                            onClick={() => {
                              setSelectedStep(selectedStep === index ? null : index);
                              toggleStepComplete(index);
                            }}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                              completedSteps.has(index)
                                ? 'bg-success text-success-foreground'
                                : 'bg-primary text-primary-foreground'
                            }`}>
                              {completedSteps.has(index) ? '✓' : index + 1}
                            </div>
                            <span className={`flex-1 leading-relaxed ${
                              completedSteps.has(index) 
                                ? 'text-on-surface-variant line-through' 
                                : 'text-on-surface'
                            }`}>
                              {instruction}
                            </span>
                          </motion.li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Nutritional Information */}
              {recipe.nutritionalInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiHeart className="text-primary" size={20} />
                    Nährwerte pro Portion
                  </h2>
                  <Card className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div className="bg-primary/5 rounded-lg p-4">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {recipe.nutritionalInfo.calories}
                          </div>
                          <div className="text-sm text-on-surface-variant font-medium">
                            Kalorien
                          </div>
                        </div>
                        <div className="bg-primary/5 rounded-lg p-4">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {recipe.nutritionalInfo.protein}g
                          </div>
                          <div className="text-sm text-on-surface-variant font-medium">
                            Eiweiß
                          </div>
                        </div>
                        <div className="bg-primary/5 rounded-lg p-4">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {recipe.nutritionalInfo.carbs}g
                          </div>
                          <div className="text-sm text-on-surface-variant font-medium">
                            Kohlenhydrate
                          </div>
                        </div>
                        <div className="bg-primary/5 rounded-lg p-4">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {recipe.nutritionalInfo.fat}g
                          </div>
                          <div className="text-sm text-on-surface-variant font-medium">
                            Fett
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-outline/20 flex items-center justify-between text-sm text-on-surface-variant">
                <div className="flex items-center gap-4">
                  <span>Erstellt am {formatDate(recipe.createdAt)}</span>
                  {recipe.createdBy && (
                    <span>von Benutzer {recipe.createdBy}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>Generiert mit</span>
                  <span className="font-medium text-primary">
                    {aiProvider?.name || recipe.aiProvider}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RecipeDetail;