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
  FiCoffee,
  FiCalendar,
  FiUsers,
  FiStar,
  FiTrendingUp,
  FiTag,
  FiX
} from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import RecipeCard from '@/components/recipe/RecipeCard';
import RecipeDetail from '@/components/recipe/RecipeDetail';
import ShareRecipeModal from '@/components/recipe/ShareRecipeModal';
import { useAuth } from '@/contexts/AuthContext';
import type { Recipe, FoodPreference } from '@/types';

interface RecipeListViewProps {
  showSavedOnly?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'created' | 'rating' | 'cookingTime' | 'difficulty' | 'title' | 'servings';
type FilterBy = 'all' | 'vegetarian' | 'vegan' | 'gluten_free' | 'quick' | 'easy';

interface AdvancedFilters {
  category: string;
  difficultyLevel: string;
  maxCookingTime: number;
  minServings: number;
  maxServings: number;
  aiProvider: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  hasNutritionalInfo: boolean;
  minRating: number;
}

export function RecipeListView({ showSavedOnly = false }: RecipeListViewProps) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [shareRecipe, setShareRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    category: 'all',
    difficultyLevel: 'all',
    maxCookingTime: 180,
    minServings: 1,
    maxServings: 12,
    aiProvider: 'all',
    dateRange: {
      from: null,
      to: null
    },
    hasNutritionalInfo: false,
    minRating: 0
  });

  useEffect(() => {
    if (user) {
      loadRecipes();
      loadSavedRecipes();
    }
  }, [user, showSavedOnly]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [recipes, searchTerm, sortBy, filterBy, advancedFilters, savedRecipes, showSavedOnly]);

  const loadRecipes = async () => {
    try {
      const endpoint = showSavedOnly ? '/api/recipes/saved' : '/api/recipes/user';
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Bitte melde dich an, um deine Rezepte zu sehen');
          // Redirect to login page
          window.location.href = '/auth/login';
          return;
        }
        throw new Error('Fehler beim Laden der Rezepte');
      }
      
      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (error: any) {
      console.error('Error loading recipes:', error);
      if (error.message !== 'Fehler beim Laden der Rezepte') {
        toast.error(error?.message || 'Fehler beim Laden der Rezepte');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/saved/ids');
      if (response.ok) {
        const data = await response.json();
        setSavedRecipes(new Set(data.savedIds || []));
      } else if (response.status === 401) {
        // User not authenticated, clear saved recipes
        setSavedRecipes(new Set());
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
      setSavedRecipes(new Set());
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
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(search)) ||
        recipe.category?.toLowerCase().includes(search) ||
        (Array.isArray(recipe.instructions) 
          ? recipe.instructions.some(instruction => instruction.toLowerCase().includes(search))
          : recipe.instructions.toLowerCase().includes(search))
      );
    }

    // Apply basic category filter
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
            return (parseInt(recipe.preparationTime || '0') + parseInt(recipe.cookingTime || '0')) <= 30;
          case 'easy':
            return recipe.difficulty === 'easy';
          default:
            return true;
        }
      });
    }

    // Apply advanced filters
    // Category filter
    if (advancedFilters.category !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === advancedFilters.category);
    }

    // Difficulty filter
    if (advancedFilters.difficultyLevel !== 'all') {
      filtered = filtered.filter(recipe => recipe.difficulty === advancedFilters.difficultyLevel);
    }

    // Cooking time filter
    filtered = filtered.filter(recipe => {
      const totalTime = parseInt(recipe.preparationTime || '0') + parseInt(recipe.cookingTime || '0');
      return totalTime <= advancedFilters.maxCookingTime;
    });

    // Servings filter
    filtered = filtered.filter(recipe => 
      recipe.servings >= advancedFilters.minServings && 
      recipe.servings <= advancedFilters.maxServings
    );

    // AI provider filter
    if (advancedFilters.aiProvider !== 'all') {
      filtered = filtered.filter(recipe => recipe.aiProvider === advancedFilters.aiProvider);
    }

    // Date range filter
    if (advancedFilters.dateRange.from) {
      filtered = filtered.filter(recipe => 
        new Date(recipe.created) >= advancedFilters.dateRange.from!
      );
    }
    if (advancedFilters.dateRange.to) {
      filtered = filtered.filter(recipe => 
        new Date(recipe.created) <= advancedFilters.dateRange.to!
      );
    }

    // Nutritional info filter
    if (advancedFilters.hasNutritionalInfo) {
      filtered = filtered.filter(recipe => recipe.nutritionalInfo);
    }

    // Rating filter
    if (advancedFilters.minRating > 0) {
      filtered = filtered.filter(recipe => (recipe.rating || 0) >= advancedFilters.minRating);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'cookingTime':
          const aTime = parseInt(a.preparationTime || '0') + parseInt(a.cookingTime || '0');
          const bTime = parseInt(b.preparationTime || '0') + parseInt(b.cookingTime || '0');
          return aTime - bTime;
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'servings':
          return a.servings - b.servings;
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

  const handleShareRecipe = (recipe: Recipe) => {
    if (!user) {
      toast.error('Du musst angemeldet sein, um Rezepte zu teilen');
      return;
    }
    setShareRecipe(recipe);
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
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Start', href: '/', icon: '🏠' },
            { label: showSavedOnly ? 'Favoriten' : 'Meine Rezepte', icon: showSavedOnly ? '⭐' : '📚' }
          ]}
          className="mb-6"
        />
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
                    <option value="title">Alphabetisch</option>
                    <option value="servings">Nach Portionen</option>
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

                  <Button
                    variant={showAdvancedFilters ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    leftIcon={<FiFilter />}
                  >
                    Erweitert
                  </Button>

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

              {/* Advanced Filters */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="pt-4 mt-4 border-t border-outline/20"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                          <FiTag className="inline mr-1" />
                          Kategorie
                        </label>
                        <select
                          value={advancedFilters.category}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-outline rounded-lg bg-surface text-sm"
                        >
                          <option value="all">Alle Kategorien</option>
                          <option value="hauptgericht">🍽️ Hauptgericht</option>
                          <option value="vorspeise">🥗 Vorspeise</option>
                          <option value="dessert">🍰 Dessert</option>
                          <option value="snack">🥨 Snack</option>
                          <option value="getraenk">🥤 Getränk</option>
                          <option value="beilage">🍚 Beilage</option>
                        </select>
                      </div>

                      {/* Difficulty Filter */}
                      <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                          <FiStar className="inline mr-1" />
                          Schwierigkeit
                        </label>
                        <select
                          value={advancedFilters.difficultyLevel}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, difficultyLevel: e.target.value }))}
                          className="w-full px-3 py-2 border border-outline rounded-lg bg-surface text-sm"
                        >
                          <option value="all">Alle Schwierigkeiten</option>
                          <option value="easy">😊 Einfach</option>
                          <option value="medium">🤔 Mittel</option>
                          <option value="hard">🔥 Schwer</option>
                        </select>
                      </div>

                      {/* AI Provider Filter */}
                      <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                          <FiCoffee className="inline mr-1" />
                          KI-Provider
                        </label>
                        <select
                          value={advancedFilters.aiProvider}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, aiProvider: e.target.value }))}
                          className="w-full px-3 py-2 border border-outline rounded-lg bg-surface text-sm"
                        >
                          <option value="all">Alle Provider</option>
                          <option value="openai">🤖 OpenAI</option>
                          <option value="deepseek">🧠 DeepSeek</option>
                          <option value="grok">⚡ Grok</option>
                        </select>
                      </div>

                      {/* Cooking Time Filter */}
                      <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                          <FiClock className="inline mr-1" />
                          Max. Zubereitungszeit: {advancedFilters.maxCookingTime} Min
                        </label>
                        <input
                          type="range"
                          min="15"
                          max="180"
                          step="15"
                          value={advancedFilters.maxCookingTime}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxCookingTime: Number(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                          <span>15 Min</span>
                          <span>3h</span>
                        </div>
                      </div>

                      {/* Servings Range Filter */}
                      <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                          <FiUsers className="inline mr-1" />
                          Portionen: {advancedFilters.minServings}-{advancedFilters.maxServings}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="12"
                            value={advancedFilters.minServings}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setAdvancedFilters(prev => ({ 
                                ...prev, 
                                minServings: value,
                                maxServings: Math.max(value, prev.maxServings)
                              }));
                            }}
                            className="flex-1 accent-primary"
                          />
                          <input
                            type="range"
                            min="1"
                            max="12"
                            value={advancedFilters.maxServings}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setAdvancedFilters(prev => ({ 
                                ...prev, 
                                maxServings: value,
                                minServings: Math.min(value, prev.minServings)
                              }));
                            }}
                            className="flex-1 accent-primary"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                          <span>1</span>
                          <span>12</span>
                        </div>
                      </div>

                      {/* Rating Filter */}
                      <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                          <FiStar className="inline mr-1" />
                          Min. Bewertung: {advancedFilters.minRating} ⭐
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={advancedFilters.minRating}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                          <span>0 ⭐</span>
                          <span>5 ⭐</span>
                        </div>
                      </div>

                      {/* Date Range Filter */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-on-surface mb-2">
                          <FiCalendar className="inline mr-1" />
                          Zeitraum
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={advancedFilters.dateRange.from ? advancedFilters.dateRange.from.toISOString().split('T')[0] : ''}
                            onChange={(e) => setAdvancedFilters(prev => ({ 
                              ...prev, 
                              dateRange: { 
                                ...prev.dateRange, 
                                from: e.target.value ? new Date(e.target.value) : null 
                              } 
                            }))}
                            className="flex-1 px-3 py-2 border border-outline rounded-lg bg-surface text-sm"
                          />
                          <span className="text-on-surface-variant">bis</span>
                          <input
                            type="date"
                            value={advancedFilters.dateRange.to ? advancedFilters.dateRange.to.toISOString().split('T')[0] : ''}
                            onChange={(e) => setAdvancedFilters(prev => ({ 
                              ...prev, 
                              dateRange: { 
                                ...prev.dateRange, 
                                to: e.target.value ? new Date(e.target.value) : null 
                              } 
                            }))}
                            className="flex-1 px-3 py-2 border border-outline rounded-lg bg-surface text-sm"
                          />
                        </div>
                      </div>

                      {/* Additional Options */}
                      <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                          Zusätzliche Filter
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={advancedFilters.hasNutritionalInfo}
                              onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasNutritionalInfo: e.target.checked }))}
                              className="rounded border-outline accent-primary"
                            />
                            Mit Nährwerten
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Filter Reset */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-outline/20">
                      <div className="text-sm text-on-surface-variant">
                        {filteredRecipes.length} von {recipes.length} Rezepten gefunden
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAdvancedFilters({
                            category: 'all',
                            difficultyLevel: 'all',
                            maxCookingTime: 180,
                            minServings: 1,
                            maxServings: 12,
                            aiProvider: 'all',
                            dateRange: { from: null, to: null },
                            hasNutritionalInfo: false,
                            minRating: 0
                          });
                          setFilterBy('all');
                          setSearchTerm('');
                        }}
                        leftIcon={<FiX />}
                      >
                        Filter zurücksetzen
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                    onShare={handleShareRecipe}
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

      {/* Share Recipe Modal */}
      <ShareRecipeModal
        recipe={shareRecipe}
        isOpen={shareRecipe !== null}
        onClose={() => setShareRecipe(null)}
      />
    </div>
  );
}

export default RecipeListView;