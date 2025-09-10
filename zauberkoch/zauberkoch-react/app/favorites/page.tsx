'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiHeart, FiSearch, FiFilter, FiGrid, FiList, FiClock, FiUsers, FiUser, FiStar, FiCalendar, FiTrendingUp, FiEye, FiBookmark, FiShare2 } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import type { Recipe, RecipeFilters, SortOption } from '@/types';
import toast from 'react-hot-toast';

interface FavoriteStats {
  totalFavorites: number;
  categoryCounts: Record<string, number>;
  averageRating: number;
  favoritesThisMonth: number;
  topCategory: string;
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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4 }
  }
};

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<FavoriteStats | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>({ field: 'created', direction: 'desc' });

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortFavorites();
  }, [favorites, searchTerm, categoryFilter, difficultyFilter, timeFilter, sortBy]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/recipes/favorites', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Defensive check: ensure data is an array
        const safeData = Array.isArray(data) ? data : [];
        setFavorites(safeData);
        calculateStats(safeData);
      } else {
        console.error('Failed to fetch favorites');
        toast.error('Fehler beim Laden der Favoriten');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Fehler beim Laden der Favoriten');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (recipes: Recipe[]) => {
    // Defensive check: ensure recipes is an array
    const safeRecipes = Array.isArray(recipes) ? recipes : [];
    
    const categoryCounts = safeRecipes.reduce((acc, recipe) => {
      const category = recipe.category || 'Unbekannt';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Keine';

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const favoritesThisMonth = safeRecipes.filter(recipe => 
      new Date(recipe.created) >= thisMonth
    ).length;

    const stats: FavoriteStats = {
      totalFavorites: safeRecipes.length,
      categoryCounts,
      averageRating: 4.5, // Mock rating - would come from actual rating system
      favoritesThisMonth,
      topCategory
    };

    setStats(stats);
  };

  const filterAndSortFavorites = () => {
    // Defensive check: ensure favorites is an array
    const safeFavorites = Array.isArray(favorites) ? favorites : [];
    let filtered = [...safeFavorites];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.some(ing => 
          ing.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === categoryFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(recipe => recipe.difficulty === difficultyFilter);
    }

    // Time filter (cooking + prep time)
    if (timeFilter !== 'all') {
      filtered = filtered.filter(recipe => {
        const totalTime = parseInt(recipe.preparationTime || '0') + parseInt(recipe.cookingTime || '0');
        switch (timeFilter) {
          case 'quick': return totalTime <= 30;
          case 'medium': return totalTime > 30 && totalTime <= 60;
          case 'long': return totalTime > 60;
          default: return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortBy.field];
      const bValue = b[sortBy.field];
      
      if (sortBy.field === 'created') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return sortBy.direction === 'desc' ? bDate - aDate : aDate - bDate;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortBy.direction === 'desc' 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }
      
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      return sortBy.direction === 'desc' ? bNum - aNum : aNum - bNum;
    });

    setFilteredFavorites(filtered);
  };

  const toggleFavorite = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Remove from favorites list since it's no longer a favorite
        setFavorites(prev => prev.filter(recipe => recipe.id !== recipeId));
        toast.success('Aus Favoriten entfernt');
      } else {
        toast.error('Fehler beim Entfernen aus Favoriten');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Fehler beim Entfernen aus Favoriten');
    }
  };

  const getAvailableCategories = () => {
    // Defensive check: ensure favorites is an array
    const safeFavorites = Array.isArray(favorites) ? favorites : [];
    const categories = [...new Set(safeFavorites.map(r => r.category).filter(Boolean))];
    return categories.sort();
  };

  const formatCookingTime = (recipe: Recipe) => {
    const prep = parseInt(recipe.preparationTime || '0');
    const cook = parseInt(recipe.cookingTime || '0');
    const total = prep + cook;
    
    if (total === 0) return 'Keine Angabe';
    if (total < 60) return `${total} Min`;
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-on-surface mb-4">Anmeldung erforderlich</h1>
          <p className="text-on-surface-variant">Bitte melde dich an, um deine Favoriten zu sehen.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Lade deine Favoriten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-error to-red-600 text-white">
        <div className="container py-16 lg:py-20">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-full text-sm font-semibold mb-6"
              variants={itemVariants}
            >
              <FiHeart className="w-4 h-4" />
              Deine Lieblings-Rezepte
            </motion.div>
            
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              Meine Favoriten
            </motion.h1>
            
            <motion.p 
              className="text-xl text-red-100 leading-relaxed"
              variants={itemVariants}
            >
              Alle deine gespeicherten Lieblings-Rezepte an einem Ort
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="container py-12 lg:py-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Statistics Cards */}
          {stats && stats.totalFavorites > 0 && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={itemVariants}
            >
              <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-error/5 to-red-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-error to-red-600 rounded-full flex items-center justify-center text-white">
                    <FiHeart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{stats.totalFavorites}</h3>
                    <p className="text-sm text-on-surface-variant">Favoriten</p>
                  </div>
                </div>
                <div className="text-xs text-error">
                  <span>{stats.favoritesThisMonth} diesen Monat</span>
                </div>
              </div>

              <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-warning/5 to-orange-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-warning to-orange-500 rounded-full flex items-center justify-center text-white">
                    <FiTrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{stats.topCategory}</h3>
                    <p className="text-sm text-on-surface-variant">Top Kategorie</p>
                  </div>
                </div>
                <div className="text-xs text-warning">
                  <span>{stats.categoryCounts[stats.topCategory] || 0} Rezepte</span>
                </div>
              </div>

              <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-success/5 to-emerald-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center text-white">
                    <FiStar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{stats.averageRating.toFixed(1)}</h3>
                    <p className="text-sm text-on-surface-variant">Durchschnitt</p>
                  </div>
                </div>
                <div className="text-xs text-success">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
              </div>

              <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-info/5 to-blue-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-info to-blue-600 rounded-full flex items-center justify-center text-white">
                    <FiGrid className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{Object.keys(stats.categoryCounts).length}</h3>
                    <p className="text-sm text-on-surface-variant">Kategorien</p>
                  </div>
                </div>
                <div className="text-xs text-info">
                  <span>Vielfalt</span>
                </div>
              </div>
            </motion.div>
          )}

          {(Array.isArray(favorites) ? favorites : []).length === 0 ? (
            /* Empty State */
            <motion.div className="card p-12 shadow-lg border border-outline/20 text-center" variants={itemVariants}>
              <div className="w-20 h-20 bg-gradient-to-br from-error/10 to-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiHeart className="w-10 h-10 text-error/60" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Noch keine Favoriten</h2>
              <p className="text-on-surface-variant mb-8 max-w-2xl mx-auto">
                Du hast noch keine Rezepte zu deinen Favoriten hinzugefügt. 
                Generiere dein erstes Rezept oder durchstöbere die vorhandenen Rezepte!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/recipes/generate">
                  <button className="btn btn-primary btn-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]">
                    <FiUser className="mr-2" />
                    Erstes Rezept generieren
                  </button>
                </Link>
                <Link href="/recipes">
                  <button className="btn btn-outline btn-lg px-8 py-4 border-2 hover:bg-primary hover:text-white">
                    <FiSearch className="mr-2" />
                    Rezepte durchsuchen
                  </button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Filters */}
              <motion.div 
                className="card p-6 shadow-lg border border-outline/20"
                variants={itemVariants}
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Durchsuche deine Favoriten..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all duration-300 focus:outline-none"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary transition-all duration-300 focus:outline-none"
                    >
                      <option value="all">Alle Kategorien</option>
                      {getAvailableCategories().map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>

                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary transition-all duration-300 focus:outline-none"
                    >
                      <option value="all">Alle Schwierigkeiten</option>
                      <option value="easy">Einfach</option>
                      <option value="medium">Mittel</option>
                      <option value="hard">Schwer</option>
                    </select>

                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary transition-all duration-300 focus:outline-none"
                    >
                      <option value="all">Alle Zeiten</option>
                      <option value="quick">Schnell (≤30 Min)</option>
                      <option value="medium">Mittel (30-60 Min)</option>
                      <option value="long">Lang (&gt;60 Min)</option>
                    </select>

                    <select
                      value={`${sortBy.field}-${sortBy.direction}`}
                      onChange={(e) => {
                        const [field, direction] = e.target.value.split('-');
                        setSortBy({ field: field as any, direction: direction as any });
                      }}
                      className="px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary transition-all duration-300 focus:outline-none"
                    >
                      <option value="created-desc">Neueste zuerst</option>
                      <option value="created-asc">Älteste zuerst</option>
                      <option value="title-asc">Name A-Z</option>
                      <option value="title-desc">Name Z-A</option>
                    </select>

                    {/* View Mode Toggle */}
                    <div className="flex bg-surface-variant/30 rounded-xl border-2 border-outline/30 p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${
                          viewMode === 'grid' 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'text-on-surface-variant hover:bg-surface-variant/50'
                        }`}
                      >
                        <FiGrid className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${
                          viewMode === 'list' 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'text-on-surface-variant hover:bg-surface-variant/50'
                        }`}
                      >
                        <FiList className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter summary */}
                <div className="mt-4 pt-4 border-t border-outline/20">
                  <div className="flex items-center justify-between text-sm text-on-surface-variant">
                    <span>{filteredFavorites.length} von {(Array.isArray(favorites) ? favorites : []).length} Favoriten</span>
                    {(searchTerm || categoryFilter !== 'all' || difficultyFilter !== 'all' || timeFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setCategoryFilter('all');
                          setDifficultyFilter('all');
                          setTimeFilter('all');
                        }}
                        className="text-primary hover:text-primary-dark transition-colors font-medium"
                      >
                        Filter zurücksetzen
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Recipe Grid/List */}
              {filteredFavorites.length === 0 ? (
                <motion.div className="card p-12 shadow-lg border border-outline/20 text-center" variants={itemVariants}>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary-dark/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiSearch className="w-8 h-8 text-primary/60" />
                  </div>
                  <h3 className="text-xl font-semibold text-on-surface-variant mb-2">Keine Favoriten gefunden</h3>
                  <p className="text-on-surface-variant">Versuche andere Filter oder füge neue Rezepte zu deinen Favoriten hinzu!</p>
                </motion.div>
              ) : (
                <motion.div 
                  className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1'
                  }`}
                  variants={itemVariants}
                >
                  {filteredFavorites.map((recipe, index) => (
                    <motion.div
                      key={recipe.id}
                      className={`card p-6 shadow-lg border border-outline/20 hover:shadow-xl transition-all duration-300 group ${
                        viewMode === 'list' ? 'flex gap-6' : ''
                      }`}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2 mb-2">
                              {recipe.title}
                            </h3>
                            {recipe.description && (
                              <p className="text-on-surface-variant text-sm line-clamp-2 mb-3">
                                {recipe.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => toggleFavorite(recipe.id)}
                            className="text-error hover:text-error/80 transition-colors p-1"
                            title="Aus Favoriten entfernen"
                          >
                            <FiHeart className="w-6 h-6 fill-current" />
                          </button>
                        </div>

                        {/* Recipe Meta */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                            {recipe.servings && (
                              <span className="inline-flex items-center gap-1">
                                <FiUsers className="w-4 h-4" />
                                {recipe.servings} Portionen
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <FiClock className="w-4 h-4" />
                              {formatCookingTime(recipe)}
                            </span>
                            {recipe.difficulty && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                recipe.difficulty === 'easy' ? 'bg-success/10 text-success' :
                                recipe.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                                'bg-error/10 text-error'
                              }`}>
                                {recipe.difficulty === 'easy' ? 'Einfach' :
                                 recipe.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                              <FiCalendar className="w-4 h-4" />
                              <span>Hinzugefügt am {formatDate(recipe.created)}</span>
                            </div>
                            {recipe.category && (
                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                                {recipe.category}
                              </span>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 pt-2">
                            <Link href={`/recipes/${recipe.id}`} className="flex-1">
                              <button className="w-full btn btn-primary py-2 text-sm">
                                <FiEye className="mr-2 w-4 h-4" />
                                Ansehen
                              </button>
                            </Link>
                            <button className="btn btn-outline py-2 px-3 text-sm">
                              <FiShare2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}