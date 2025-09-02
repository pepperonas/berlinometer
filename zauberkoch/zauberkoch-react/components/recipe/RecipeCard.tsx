'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiClock, 
  FiUsers, 
  FiBookmark, 
  FiStar,
  FiChef,
  FiEye,
  FiHeart
} from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DIFFICULTY_LEVELS } from '@/lib/constants';
import type { Recipe, FoodPreference } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onView?: (recipe: Recipe) => void;
  onSave?: (recipe: Recipe) => void;
  onRate?: (recipe: Recipe, rating: number) => void;
  isSaved?: boolean;
  className?: string;
}

export function RecipeCard({ 
  recipe, 
  onView, 
  onSave, 
  onRate, 
  isSaved = false,
  className = ''
}: RecipeCardProps) {
  
  const handleViewRecipe = () => {
    onView?.(recipe);
  };

  const handleSaveRecipe = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.(recipe);
  };

  const handleRateRecipe = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onRate?.(recipe, rating);
  };

  const difficultyConfig = DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty);

  const getPreferenceEmojis = (preferences: FoodPreference[]): string => {
    const emojiMap: Record<FoodPreference, string> = {
      vegetarian: '🥕',
      vegan: '🌱',
      gluten_free: '🌾',
      lactose_free: '🥛',
      low_carb: '🥩',
      keto: '🥑',
      diabetic: '💊',
      halal: '🕌',
    };

    return preferences.map(pref => emojiMap[pref] || '').join('');
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 shadow-md overflow-hidden"
        onClick={handleViewRecipe}
      >
        <div className="relative">
          {/* Recipe Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-on-surface truncate">
                  {recipe.title}
                </h3>
                {recipe.description && (
                  <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveRecipe}
                className={`ml-2 ${isSaved ? 'text-primary' : 'text-on-surface-variant'}`}
              >
                <FiBookmark size={18} className={isSaved ? 'fill-current' : ''} />
              </Button>
            </div>

            {/* Recipe Meta */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                <div className="flex items-center gap-1">
                  <FiUsers size={14} />
                  <span>{recipe.servings}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiClock size={14} />
                  <span>{recipe.cookingTime}min</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{difficultyConfig?.emoji}</span>
                  <span className="capitalize">{recipe.difficulty}</span>
                </div>
              </div>

              {/* Food Preferences */}
              {recipe.preferences && recipe.preferences.length > 0 && (
                <div className="text-sm">
                  {getPreferenceEmojis(recipe.preferences)}
                </div>
              )}
            </div>
          </div>

          {/* Recipe Content */}
          <CardContent className="p-4">
            {/* Ingredients Preview */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-on-surface mb-2 flex items-center gap-1">
                <FiChef size={14} />
                Hauptzutaten
              </h4>
              <div className="flex flex-wrap gap-1">
                {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
                  <span
                    key={index}
                    className="inline-block bg-surface-variant text-on-surface-variant px-2 py-1 rounded-md text-xs"
                  >
                    {ingredient.name}
                  </span>
                ))}
                {recipe.ingredients.length > 4 && (
                  <span className="inline-block bg-surface-variant text-on-surface-variant px-2 py-1 rounded-md text-xs">
                    +{recipe.ingredients.length - 4} weitere
                  </span>
                )}
              </div>
            </div>

            {/* Nutritional Info Preview */}
            {recipe.nutritionalInfo && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-on-surface mb-2">
                  Nährwerte pro Portion
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-sm font-semibold text-primary">
                      {recipe.nutritionalInfo.calories}
                    </div>
                    <div className="text-xs text-on-surface-variant">kcal</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary">
                      {recipe.nutritionalInfo.protein}g
                    </div>
                    <div className="text-xs text-on-surface-variant">Eiweiß</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary">
                      {recipe.nutritionalInfo.carbs}g
                    </div>
                    <div className="text-xs text-on-surface-variant">KH</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary">
                      {recipe.nutritionalInfo.fat}g
                    </div>
                    <div className="text-xs text-on-surface-variant">Fett</div>
                  </div>
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={(e) => handleRateRecipe(star, e)}
                    className="hover:scale-110 transition-transform"
                  >
                    <FiStar
                      size={16}
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
                    ({recipe.rating})
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewRecipe}
                  leftIcon={<FiEye size={14} />}
                >
                  Ansehen
                </Button>
              </div>
            </div>

            {/* Recipe Meta Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline/20 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span>Erstellt am {formatDate(recipe.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>via</span>
                <span className="capitalize font-medium text-primary">
                  {recipe.aiProvider}
                </span>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}

export default RecipeCard;