'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiFilter, 
  FiGrid, 
  FiList,
  FiPlus,
  FiBookmark,
  FiClock,
  FiCoffee
} from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import RecipeCard from '@/components/recipe/RecipeCard';
import RecipeDetail from '@/components/recipe/RecipeDetail';
import { useAuth } from '@/contexts/AuthContext';
import type { Recipe, FoodPreference } from '@/types';

interface RecipeListViewProps {
  showSavedOnly?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'created' | 'rating' | 'cookingTime' | 'difficulty';
type FilterBy = 'all' | 'vegetarian' | 'vegan' | 'gluten_free' | 'quick' | 'easy';

export function RecipeListView({ showSavedOnly = false }: RecipeListViewProps) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    if (user) {
      loadRecipes();
      loadSavedRecipes();
    }
  }, [user, showSavedOnly]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [recipes, searchTerm, sortBy, filterBy, savedRecipes, showSavedOnly]);

  const loadRecipes = async () => {
    try {
      const endpoint = showSavedOnly ? '/api/recipes/saved' : '/api/recipes/user';
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Rezepte');
      }
      
      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (error: any) {
      console.error('Error loading recipes:', error);
      toast.error(error?.message || 'Fehler beim Laden der Rezepte');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/saved/ids');
      if (response.ok) {
        const data = await response.json();
        setSavedRecipes(new Set(data.savedRecipeIds || []));
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...recipes];

    // Apply saved filter if needed
    if (showSavedOnly) {
      filtered = filtered.filter(recipe => savedRecipes.has(recipe.id));
    }

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(search) ||
        recipe.description?.toLowerCase().includes(search) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(search))
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(recipe => {
        switch (filterBy) {
          case 'vegetarian':
            return recipe.preferences?.includes('vegetarian');
          case 'vegan':
            return recipe.preferences?.includes('vegan');
          case 'gluten_free':
            return recipe.preferences?.includes('gluten_free');
          case 'quick':
            return recipe.cookingTime <= 30;
          case 'easy':
            return recipe.difficulty === 'easy';
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'cookingTime':
          return a.cookingTime - b.cookingTime;
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        default:
          return 0;
      }
    });

    setFilteredRecipes(filtered);
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!user) return;

    try {
      const isSaved = savedRecipes.has(recipe.id);
      const endpoint = isSaved ? '/api/recipes/unsave' : '/api/recipes/save';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeId: recipe.id }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern');
      }

      const newSavedRecipes = new Set(savedRecipes);
      if (isSaved) {
        newSavedRecipes.delete(recipe.id);
        toast.success('Rezept entfernt 📚');
      } else {
        newSavedRecipes.add(recipe.id);
        toast.success('Rezept gespeichert! 📚');
      }
      
      setSavedRecipes(newSavedRecipes);
    } catch (error: any) {
      toast.error(error?.message || 'Fehler beim Speichern');
    }
  };

  const handleRateRecipe = async (recipe: Recipe, rating: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/recipes/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeId: recipe.id, rating }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Bewerten');
      }

      // Update local state
      setRecipes(prev => prev.map(r => 
        r.id === recipe.id ? { ...r, rating } : r
      ));
      
      if (selectedRecipe?.id === recipe.id) {
        setSelectedRecipe({ ...selectedRecipe, rating });
      }
      
      toast.success(`Rezept mit ${rating} ⭐ bewertet!`);
    } catch (error: any) {
      toast.error(error?.message || 'Fehler beim Bewerten');
    }
  };

  const handleRegenerateRecipe = (recipe: Recipe) => {
    // This would navigate to generate page with pre-filled data
    // For now, just show a message
    toast('Rezept-Regenerierung wird in der nächsten Version verfügbar sein!', {
      icon: '🔄',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <FiCoffee size={48} className="text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Anmeldung erforderlich</h1>
          <p className="text-on-surface-variant">
            Melde dich an, um deine Rezepte zu sehen und zu verwalten.
          </p>
          <Link href="/auth/login">
            <Button size="lg">
              Jetzt anmelden
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-on-surface-variant">Rezepte werden geladen...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-on-surface mb-2">
                {showSavedOnly ? 'Gespeicherte Rezepte' : 'Meine Rezepte'}
              </h1>
              <p className="text-on-surface-variant">
                {showSavedOnly 
                  ? 'Deine Lieblings-Rezepte in einer praktischen Übersicht'
                  : 'Alle deine generierten und gespeicherten Rezepte'
                }
              </p>
            </div>
            
            <Link href="/recipes/generate">
              <Button size="lg" leftIcon={<FiPlus />}>
                Neues Rezept generieren
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <Input
                    placeholder="Rezepte durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<FiSearch size={20} />}
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="px-3 py-2 border border-outline rounded-lg bg-surface text-sm"
                  >
                    <option value="created">Neueste zuerst</option>
                    <option value="rating">Beste Bewertung</option>
                    <option value="cookingTime">Schnellste zuerst</option>
                    <option value="difficulty">Einfachste zuerst</option>
                  </select>

                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                    className="px-3 py-2 border border-outline rounded-lg bg-surface text-sm"
                  >
                    <option value="all">Alle Rezepte</option>
                    <option value="vegetarian">🥕 Vegetarisch</option>
                    <option value="vegan">🌱 Vegan</option>
                    <option value="gluten_free">🌾 Glutenfrei</option>
                    <option value="quick">⚡ Schnell (≤30 Min)</option>
                    <option value="easy">😊 Einfach</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      leftIcon={<FiGrid />}
                    />
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      leftIcon={<FiList />}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recipe Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {filteredRecipes.length}
              </div>
              <div className="text-sm text-on-surface-variant">
                {showSavedOnly ? 'Gespeicherte Rezepte' : 'Gefundene Rezepte'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {Math.round(filteredRecipes.reduce((sum, r) => sum + r.cookingTime, 0) / filteredRecipes.length) || 0}
              </div>
              <div className="text-sm text-on-surface-variant">
                ⌀ Zubereitungszeit
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {(filteredRecipes.reduce((sum, r) => sum + (r.rating || 0), 0) / filteredRecipes.filter(r => r.rating).length || 0).toFixed(1)}
              </div>
              <div className="text-sm text-on-surface-variant">
                ⌀ Bewertung
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recipes Grid/List */}
        {filteredRecipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <FiBookmark size={48} className="text-on-surface-variant mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-on-surface mb-2">
              {searchTerm || filterBy !== 'all' 
                ? 'Keine Rezepte gefunden'
                : showSavedOnly
                ? 'Noch keine gespeicherten Rezepte'
                : 'Noch keine Rezepte erstellt'
              }
            </h3>
            <p className="text-on-surface-variant mb-6">
              {searchTerm || filterBy !== 'all'
                ? 'Versuche andere Suchbegriffe oder Filter.'
                : showSavedOnly
                ? 'Speichere deine Lieblings-Rezepte, um sie hier zu sehen.'
                : 'Generiere dein erstes Rezept mit ZauberKoch!'
              }
            </p>
            {!showSavedOnly && !searchTerm && filterBy === 'all' && (
              <Link href="/recipes/generate">
                <Button size="lg" leftIcon={<FiPlus />}>
                  Erstes Rezept generieren
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            <AnimatePresence>
              {filteredRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RecipeCard
                    recipe={recipe}
                    onView={setSelectedRecipe}
                    onSave={handleSaveRecipe}
                    onRate={handleRateRecipe}
                    isSaved={savedRecipes.has(recipe.id)}
                    className={viewMode === 'list' ? 'max-w-none' : ''}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      <RecipeDetail
        recipe={selectedRecipe!}
        isOpen={selectedRecipe !== null}
        onClose={() => setSelectedRecipe(null)}
        onSave={handleSaveRecipe}
        onRate={handleRateRecipe}
        onRegenerate={handleRegenerateRecipe}
        isSaved={selectedRecipe ? savedRecipes.has(selectedRecipe.id) : false}
      />
    </div>
  );
}

export default RecipeListView;