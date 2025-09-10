'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiCalendar, FiTrendingUp, FiSearch, FiFilter, FiUsers, FiUser, FiCoffee, FiActivity, FiBarChart3, FiZap, FiStar, FiEye, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import type { Recipe, ApiLog } from '@/types';

interface HistoryEntry {
  id: string;
  type: 'recipe' | 'generation';
  date: Date;
  title: string;
  description: string;
  apiProvider?: 'openai' | 'deepseek' | 'grok';
  executionTime?: number;
  recipeType?: 'food' | 'cocktail';
  category?: string;
  isFavorite?: boolean;
  data?: Recipe | ApiLog;
}

interface HistoryStats {
  totalRecipes: number;
  totalGenerations: number;
  favoriteRecipes: number;
  averageExecutionTime: number;
  mostUsedProvider: string;
  recipesThisWeek: number;
  recipesThisMonth: number;
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

const timelineVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 }
  }
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recipes' | 'generations'>('all');
  const [filterProvider, setFilterProvider] = useState<'all' | 'openai' | 'deepseek' | 'grok'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  useEffect(() => {
    if (user) {
      fetchHistoryData();
    }
  }, [user]);

  const fetchHistoryData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch both recipes and API logs
      const [recipesRes, apiLogsRes] = await Promise.all([
        fetch('/api/recipes/user', { credentials: 'include' }),
        fetch('/api/history/logs', { credentials: 'include' })
      ]);

      const recipesData = recipesRes.ok ? await recipesRes.json() : { recipes: [] };
      const apiLogsData = apiLogsRes.ok ? await apiLogsRes.json() : { logs: [] };
      
      const recipes: Recipe[] = Array.isArray(recipesData) ? recipesData : (recipesData.recipes || []);
      const historyRecipes: Recipe[] = Array.isArray(apiLogsData) ? apiLogsData : (apiLogsData.recipes || []);
      const apiLogs: ApiLog[] = Array.isArray(apiLogsData) ? [] : (apiLogsData.logs || []);

      // Convert to unified history entries
      const entries: HistoryEntry[] = [
        ...recipes.map(recipe => ({
          id: recipe.id,
          type: 'recipe' as const,
          date: new Date(recipe.createdAt || recipe.created),
          title: recipe.title || recipe.name || 'Unnamed Recipe',
          description: recipe.description || `${recipe.servings || 4} Portionen • ${recipe.cookingTime || 'Unknown time'}`,
          category: recipe.type || recipe.category || 'recipe',
          isFavorite: recipe.saved || recipe.isFavorite,
          data: recipe
        })),
        ...historyRecipes.map(recipe => ({
          id: recipe.id,
          type: 'generation' as const,
          date: new Date(recipe.createdAt || recipe.created),
          title: recipe.title || 'Rezept Generierung',
          description: recipe.description || `${recipe.type || 'recipe'} • ${recipe.cookingTime}`,
          apiProvider: 'openai' as const,
          executionTime: 2000,
          recipeType: recipe.type === 'cocktail' ? 'cocktail' : 'food',
          data: recipe
        }))
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      setHistoryEntries(entries);

      // Calculate statistics with defensive programming
      const safeApiLogs = Array.isArray(apiLogs) ? apiLogs : [];
      const stats: HistoryStats = {
        totalRecipes: recipes.length,
        totalGenerations: safeApiLogs.length,
        favoriteRecipes: recipes.filter(r => r.isFavorite).length,
        averageExecutionTime: safeApiLogs.length > 0 ? 
          Math.round(safeApiLogs.reduce((sum, log) => sum + (log.executionTime || 0), 0) / safeApiLogs.length) : 0,
        mostUsedProvider: getMostUsedProvider(safeApiLogs),
        recipesThisWeek: getRecipesInPeriod(recipes, 7),
        recipesThisMonth: getRecipesInPeriod(recipes, 30),
        topCategory: getTopCategory(recipes)
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMostUsedProvider = (logs: ApiLog[]): string => {
    if (!Array.isArray(logs) || logs.length === 0) {
      return 'openai';
    }

    const counts = logs.reduce((acc, log) => {
      const provider = log?.apiProvider || 'openai';
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(counts);
    if (entries.length === 0) {
      return 'openai';
    }

    return entries.reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0] || 'openai';
  };

  const getRecipesInPeriod = (recipes: Recipe[], days: number): number => {
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return 0;
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return recipes.filter(r => {
      const recipeDate = r?.created || r?.createdAt;
      if (!recipeDate) return false;
      return new Date(recipeDate) >= cutoff;
    }).length;
  };

  const getTopCategory = (recipes: Recipe[]): string => {
    const counts = recipes.reduce((acc, recipe) => {
      const category = recipe.category || 'Unbekannt';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)?.[0] || 'Unbekannt';
  };

  const getFilteredEntries = () => {
    return historyEntries.filter(entry => {
      // Search filter
      if (searchTerm && !entry.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !entry.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'recipes' && entry.type !== 'recipe') return false;
        if (filterType === 'generations' && entry.type !== 'generation') return false;
      }

      // Provider filter
      if (filterProvider !== 'all' && entry.apiProvider !== filterProvider) {
        return false;
      }

      // Time filter
      if (timeFilter !== 'all') {
        const now = new Date();
        const entryDate = entry.date;
        let cutoff = new Date();

        switch (timeFilter) {
          case 'week':
            cutoff.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoff.setDate(now.getDate() - 30);
            break;
          case 'year':
            cutoff.setFullYear(now.getFullYear() - 1);
            break;
        }

        if (entryDate < cutoff) return false;
      }

      return true;
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Heute';
    if (days === 1) return 'Gestern';
    if (days < 7) return `vor ${days} Tagen`;
    if (days < 30) return `vor ${Math.floor(days / 7)} Woche${Math.floor(days / 7) > 1 ? 'n' : ''}`;
    if (days < 365) return `vor ${Math.floor(days / 30)} Monat${Math.floor(days / 30) > 1 ? 'en' : ''}`;
    return `vor ${Math.floor(days / 365)} Jahr${Math.floor(days / 365) > 1 ? 'en' : ''}`;
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-emerald-500';
      case 'deepseek': return 'bg-blue-500';
      case 'grok': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'deepseek': return '🔮';
      case 'grok': return '⚡';
      default: return '🤖';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-on-surface mb-4">Anmeldung erforderlich</h1>
          <p className="text-on-surface-variant">Bitte melde dich an, um deine Rezept-Historie zu sehen.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Lade deine Geschichte...</p>
        </div>
      </div>
    );
  }

  const filteredEntries = getFilteredEntries();

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
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
              <FiClock className="w-4 h-4" />
              Deine Koch-Geschichte
            </motion.div>
            
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              Rezept-Historie
            </motion.h1>
            
            <motion.p 
              className="text-xl text-primary-light leading-relaxed"
              variants={itemVariants}
            >
              Verfolge deine kulinarische Reise und entdecke deine Lieblings-Kreationen
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
          {stats && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={itemVariants}
            >
              <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-success/5 to-emerald-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center text-white">
                    <FiUser className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{stats.totalRecipes}</h3>
                    <p className="text-sm text-on-surface-variant">Rezepte erstellt</p>
                  </div>
                </div>
                <div className="text-xs text-success">
                  <span>{stats.recipesThisWeek} diese Woche</span>
                </div>
              </div>

              <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-info/5 to-blue-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-info to-blue-600 rounded-full flex items-center justify-center text-white">
                    <FiZap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{stats.totalGenerations}</h3>
                    <p className="text-sm text-on-surface-variant">KI-Generierungen</p>
                  </div>
                </div>
                <div className="text-xs text-info">
                  <span>∅ {stats.averageExecutionTime}ms</span>
                </div>
              </div>

              <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-warning/5 to-orange-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-warning to-orange-500 rounded-full flex items-center justify-center text-white">
                    <FiStar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{stats.favoriteRecipes}</h3>
                    <p className="text-sm text-on-surface-variant">Favoriten</p>
                  </div>
                </div>
                <div className="text-xs text-warning">
                  <span>{stats.topCategory}</span>
                </div>
              </div>

              <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-primary/5 to-primary-dark/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white">
                    <FiActivity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{getProviderIcon(stats.mostUsedProvider)}</h3>
                    <p className="text-sm text-on-surface-variant">Lieblings-KI</p>
                  </div>
                </div>
                <div className="text-xs text-primary">
                  <span>{stats.mostUsedProvider.toUpperCase()}</span>
                </div>
              </div>
            </motion.div>
          )}

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
                  placeholder="Durchsuche deine Historie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all duration-300 focus:outline-none"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary transition-all duration-300 focus:outline-none"
                >
                  <option value="all">Alles</option>
                  <option value="recipes">Rezepte</option>
                  <option value="generations">Generierungen</option>
                </select>

                <select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value as any)}
                  className="px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary transition-all duration-300 focus:outline-none"
                >
                  <option value="all">Alle KI</option>
                  <option value="openai">OpenAI</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="grok">Grok</option>
                </select>

                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary transition-all duration-300 focus:outline-none"
                >
                  <option value="all">Alle Zeit</option>
                  <option value="week">Diese Woche</option>
                  <option value="month">Dieser Monat</option>
                  <option value="year">Dieses Jahr</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div 
            className="space-y-6"
            variants={itemVariants}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <FiCalendar className="text-primary" />
              Timeline ({filteredEntries.length} Einträge)
            </h2>

            {filteredEntries.length === 0 ? (
              <div className="card p-12 shadow-lg border border-outline/20 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary-dark/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSearch className="w-8 h-8 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold text-on-surface-variant mb-2">Keine Einträge gefunden</h3>
                <p className="text-on-surface-variant">Versuche andere Filter oder erstelle dein erstes Rezept!</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent"></div>

                <div className="space-y-8">
                  {filteredEntries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      className="relative flex gap-6"
                      variants={timelineVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                    >
                      {/* Timeline dot */}
                      <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                        entry.type === 'recipe' 
                          ? 'bg-gradient-to-br from-success to-emerald-600' 
                          : `bg-gradient-to-br from-info to-blue-600 ${entry.apiProvider ? getProviderColor(entry.apiProvider) : ''}`
                      }`}>
                        {entry.type === 'recipe' ? (
                          <FiUser className="w-8 h-8" />
                        ) : (
                          <span className="text-2xl">
                            {entry.apiProvider ? getProviderIcon(entry.apiProvider) : '🤖'}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 card p-6 shadow-lg border border-outline/20 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-on-surface group-hover:text-primary transition-colors">
                              {entry.title}
                              {entry.isFavorite && (
                                <FiStar className="inline-block ml-2 w-5 h-5 text-warning fill-current" />
                              )}
                            </h3>
                            <p className="text-on-surface-variant text-sm">{entry.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-on-surface-variant">{formatDate(entry.date)}</div>
                            <div className="text-xs text-on-surface-variant">
                              {entry.date.toLocaleDateString('de-DE', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Additional info */}
                        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            entry.type === 'recipe' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-info/10 text-info'
                          }`}>
                            {entry.type === 'recipe' ? (
                              <>
                                <FiUser className="w-3 h-3" />
                                Rezept
                              </>
                            ) : (
                              <>
                                <FiZap className="w-3 h-3" />
                                Generierung
                              </>
                            )}
                          </span>

                          {entry.executionTime && (
                            <span className="inline-flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              {entry.executionTime}ms
                            </span>
                          )}

                          {entry.recipeType && (
                            <span className="inline-flex items-center gap-1">
                              {entry.recipeType === 'food' ? (
                                <>
                                  <FiUser className="w-3 h-3" />
                                  Essen
                                </>
                              ) : (
                                <>
                                  <FiCoffee className="w-3 h-3" />
                                  Getränk
                                </>
                              )}
                            </span>
                          )}

                          {entry.category && (
                            <span className="inline-flex items-center gap-1">
                              <FiTrendingUp className="w-3 h-3" />
                              {entry.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}