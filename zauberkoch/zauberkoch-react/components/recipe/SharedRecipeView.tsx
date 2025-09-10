'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiClock, 
  FiUsers, 
  FiStar, 
  FiHeart,
  FiUser,
  FiCoffee,
  FiCheck,
  FiArrowRight,
  FiEye,
  FiShare2,
  FiBookOpen,
  FiInfo,
  FiUser
} from 'react-icons/fi';
import type { Recipe } from '@/types';
import toast from 'react-hot-toast';

interface SharedRecipeViewProps {
  shareCode: string;
}

interface SharedRecipeData {
  recipe: Recipe;
  shareCode: string;
  viewCount: number;
  created: Date;
}

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

export default function SharedRecipeView({ shareCode }: SharedRecipeViewProps) {
  const [sharedData, setSharedData] = useState<SharedRecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedRecipe();
  }, [shareCode]);

  const fetchSharedRecipe = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/shared/${shareCode}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Dieses geteilte Rezept existiert nicht oder ist nicht mehr verfügbar.');
        }
        throw new Error('Fehler beim Laden des Rezepts');
      }

      const data = await response.json();
      setSharedData(data);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden des Rezepts');
    } finally {
      setIsLoading(false);
    }
  };

  const shareRecipe = async () => {
    if (!sharedData) return;
    
    const shareData = {
      title: `🍳 ${sharedData.recipe.title}`,
      text: sharedData.recipe.description || 'Ein leckeres Rezept von ZauberKoch',
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link kopiert! 📋');
      }
    } catch (err) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link kopiert! 📋');
      } catch (clipboardErr) {
        toast.error('Teilen fehlgeschlagen');
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-success bg-success/10 border-success/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'hard': return 'text-error bg-error/10 border-error/20';
      default: return 'text-on-surface-variant bg-surface-variant/20 border-outline/20';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Einfach';
      case 'medium': return 'Mittel';
      case 'hard': return 'Schwer';
      default: return 'Unbekannt';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-on-surface-variant">Rezept wird geladen...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen bg-surface">
        {/* Header */}
        <div className="bg-gradient-to-r from-error to-red-600 text-white">
          <div className="container py-16 lg:py-20">
            <motion.div 
              className="text-center max-w-2xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiInfo className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-bold mb-4">Rezept nicht gefunden</h1>
                <p className="text-red-100 mb-8">{error}</p>
                <Link href="/">
                  <button className="btn btn-lg px-8 py-4 bg-white text-error hover:bg-red-50 transition-colors">
                    <FiArrowRight className="mr-2" />
                    Zu ZauberKoch
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const { recipe } = sharedData;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="container py-16 lg:py-20">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div className="text-center mb-8" variants={itemVariants}>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <FiShare2 className="w-4 h-4" />
                Geteiltes Rezept
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-xl text-primary-light leading-relaxed max-w-3xl mx-auto">
                  {recipe.description}
                </p>
              )}
            </motion.div>

            {/* Recipe Meta */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              variants={itemVariants}
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <FiUsers className="w-8 h-8 mx-auto mb-2" />
                <div className="font-semibold">{recipe.servings}</div>
                <div className="text-sm text-primary-light">Portionen</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <FiClock className="w-8 h-8 mx-auto mb-2" />
                <div className="font-semibold">{recipe.preparationTime || 'N/A'}</div>
                <div className="text-sm text-primary-light">Zubereitung</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <FiStar className="w-8 h-8 mx-auto mb-2" />
                <div className="font-semibold">{getDifficultyText(recipe.difficulty)}</div>
                <div className="text-sm text-primary-light">Schwierigkeit</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <FiEye className="w-8 h-8 mx-auto mb-2" />
                <div className="font-semibold">{sharedData.viewCount}</div>
                <div className="text-sm text-primary-light">Aufrufe</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12 lg:py-16">
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ingredients */}
            <motion.div className="space-y-6" variants={itemVariants}>
              <div className="card p-6 shadow-lg border border-outline/20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <FiCoffee className="text-primary" />
                  Zutaten
                </h2>
                <div className="space-y-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-surface-variant/20 rounded-lg">
                      <FiCheck className="text-success flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">
                          {ingredient.amount && ingredient.unit && `${ingredient.amount} ${ingredient.unit} `}
                          {ingredient.name}
                        </div>
                        {ingredient.preparation && (
                          <div className="text-sm text-on-surface-variant">
                            {ingredient.preparation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutritional Info */}
              {recipe.nutritionalInfo && (
                <motion.div className="card p-6 shadow-lg border border-outline/20" variants={itemVariants}>
                  <h3 className="text-xl font-semibold mb-4">Nährwerte pro Portion</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <div className="text-lg font-bold text-primary">{recipe.nutritionalInfo.calories}</div>
                      <div className="text-sm text-on-surface-variant">Kalorien</div>
                    </div>
                    <div className="text-center p-3 bg-success/5 rounded-lg">
                      <div className="text-lg font-bold text-success">{recipe.nutritionalInfo.protein}g</div>
                      <div className="text-sm text-on-surface-variant">Eiweiß</div>
                    </div>
                    <div className="text-center p-3 bg-warning/5 rounded-lg">
                      <div className="text-lg font-bold text-warning">{recipe.nutritionalInfo.carbs}g</div>
                      <div className="text-sm text-on-surface-variant">Kohlenhydrate</div>
                    </div>
                    <div className="text-center p-3 bg-info/5 rounded-lg">
                      <div className="text-lg font-bold text-info">{recipe.nutritionalInfo.fat}g</div>
                      <div className="text-sm text-on-surface-variant">Fett</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Instructions */}
            <motion.div className="space-y-6" variants={itemVariants}>
              <div className="card p-6 shadow-lg border border-outline/20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <FiBookOpen className="text-primary" />
                  Zubereitung
                </h2>
                <div className="space-y-4">
                  {(Array.isArray(recipe.instructions) ? recipe.instructions : [recipe.instructions]).map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-on-surface-variant pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              {recipe.tips && (
                <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-info/5 to-blue-500/5 border-info/20">
                  <h3 className="text-xl font-semibold text-info mb-4 flex items-center gap-2">
                    <FiUser className="w-5 h-5" />
                    Koch-Tipp
                  </h3>
                  <p className="text-info/80">{recipe.tips}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Actions & Info */}
          <motion.div className="mt-12 space-y-6" variants={itemVariants}>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={shareRecipe}
                className="btn btn-primary btn-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                <FiShare2 className="mr-2" />
                Rezept teilen
              </button>
              <Link href="/auth/register">
                <button className="btn btn-outline btn-lg px-8 py-4 border-2 hover:bg-primary hover:text-white">
                  <FiHeart className="mr-2" />
                  Eigene Rezepte erstellen
                </button>
              </Link>
            </div>

            {/* Recipe Info */}
            <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-surface-variant/30 to-surface-variant/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-semibold text-on-surface mb-2 flex items-center gap-2">
                    <FiInfo className="w-5 h-5 text-primary" />
                    Rezept-Informationen
                  </h3>
                  <div className="text-sm text-on-surface-variant space-y-1">
                    <div>Geteilt am {formatDate(sharedData.created)}</div>
                    <div className="flex items-center gap-2">
                      <span>Erstellt mit</span>
                      <span className="font-medium text-primary capitalize">ZauberKoch KI</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{sharedData.viewCount}</div>
                  <div className="text-sm text-on-surface-variant">mal angesehen</div>
                </div>
              </div>
            </div>

            {/* ZauberKoch Promotion */}
            <div className="card p-8 shadow-lg border border-outline/20 bg-gradient-to-br from-primary/5 to-primary-dark/5 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUser className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4">Erstelle deine eigenen Rezepte</h3>
                <p className="text-on-surface-variant mb-6">
                  Mit ZauberKoch generierst du personalisierte Rezepte basierend auf deinen Vorlieben, 
                  verfügbaren Zutaten und Kochfähigkeiten. Unsere KI erstellt einzigartige Gerichte speziell für dich!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/register">
                    <button className="btn btn-primary btn-lg px-8 py-4">
                      <FiUser className="mr-2" />
                      Kostenlos registrieren
                    </button>
                  </Link>
                  <Link href="/">
                    <button className="btn btn-outline btn-lg px-8 py-4 border-2">
                      <FiArrowRight className="mr-2" />
                      Mehr erfahren
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}