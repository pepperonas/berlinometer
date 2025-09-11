'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ExcludeIngredientsManagerProps {
  excludedIngredients: string[];
  onChange: (ingredients: string[]) => void;
  className?: string;
  commonIngredients?: string[];
}

const DEFAULT_COMMON_INGREDIENTS = [
  'Nüsse', 'Erdnüsse', 'Mandeln', 'Walnüsse',
  'Garnelen', 'Fisch', 'Meeresfrüchte', 'Lachs',
  'Eier', 'Milch', 'Butter', 'Käse', 'Sahne',
  'Gluten', 'Weizen', 'Roggen', 'Gerste',
  'Soja', 'Tofu', 'Sojasauce',
  'Sellerie', 'Sesam', 'Senf',
  'Zwiebeln', 'Knoblauch', 'Koriander',
  'Alkohol', 'Wein', 'Bier',
  'Schweinefleisch', 'Rindfleisch', 'Hähnchen',
  'Pilze', 'Paprika', 'Tomaten'
];

export function ExcludeIngredientsManager({
  excludedIngredients,
  onChange,
  className,
  commonIngredients = DEFAULT_COMMON_INGREDIENTS
}: ExcludeIngredientsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customIngredient, setCustomIngredient] = useState('');

  const filteredIngredients = commonIngredients.filter(
    ingredient =>
      ingredient.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !excludedIngredients.includes(ingredient)
  );

  const addIngredient = (ingredient: string) => {
    if (!excludedIngredients.includes(ingredient)) {
      onChange([...excludedIngredients, ingredient]);
    }
  };

  const removeIngredient = (ingredientToRemove: string) => {
    onChange(excludedIngredients.filter(ingredient => ingredient !== ingredientToRemove));
  };

  const addCustomIngredient = () => {
    const ingredient = customIngredient.trim();
    if (ingredient && !excludedIngredients.includes(ingredient)) {
      onChange([...excludedIngredients, ingredient]);
      setCustomIngredient('');
    }
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomIngredient();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Zutatenverwaltung
        </h3>
        
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-200',
            'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50',
            isOpen
              ? 'border-red-400 bg-red-50 text-red-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:bg-red-25'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-lg">🚫</span>
          <span className="font-medium">Zutaten ausschließen</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.button>
      </div>

      {/* Excluded Ingredients Display */}
      {excludedIngredients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <p className="text-sm text-gray-600">Ausgeschlossene Zutaten:</p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {excludedIngredients.map((ingredient, index) => (
                <motion.span
                  key={`${ingredient}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  <span>🚫</span>
                  <span>{ingredient}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(ingredient)}
                    className="text-red-600 hover:text-red-800 transition-colors ml-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Ingredient Selection Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-2 border-gray-200 rounded-2xl p-6 bg-gray-50"
          >
            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suche Zutaten
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="z.B. Nüsse, Fisch, Gluten..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Common Ingredients */}
              {filteredIngredients.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Häufige Allergene & Zutaten:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {filteredIngredients.slice(0, 12).map((ingredient) => (
                      <motion.button
                        key={ingredient}
                        type="button"
                        onClick={() => addIngredient(ingredient)}
                        className="p-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-25 transition-colors text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {ingredient}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Ingredient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eigene Zutat hinzufügen
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customIngredient}
                    onChange={(e) => setCustomIngredient(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    placeholder="Zutat eingeben..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <motion.button
                    type="button"
                    onClick={addCustomIngredient}
                    disabled={!customIngredient.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Hinzufügen
                  </motion.button>
                </div>
              </div>

              {/* Clear All */}
              {excludedIngredients.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    Alle ausgeschlossenen Zutaten entfernen
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExcludeIngredientsManager;