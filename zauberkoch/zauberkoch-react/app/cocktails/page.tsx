'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiWine, FiCoffee, FiZap, FiSettings, FiStar, FiClock, FiDroplet, FiGlass, FiShuffle, FiCheck, FiHeart, FiBookOpen, FiLoader } from 'react-icons/fi';
import { useAuth, usePremium } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface CocktailGenerationForm {
  drinkType: 'all' | 'alcoholic' | 'non_alcoholic' | 'low_alcohol';
  style: 'classic' | 'modern' | 'exotic' | 'simple';
  diversity: number;
  complexity: number;
  alcoholContent: number;
  glasses: number;
  isFruity: boolean;
  isDessert: boolean;
  focusPhrase: string;
  api: 'openai' | 'deepseek' | 'grok';
}

interface GeneratedCocktail {
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
    preparation?: string;
  }>;
  instructions: string[];
  glassType: string;
  garnish?: string;
  alcoholContent?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  preparationTime: string;
  tips?: string;
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

const slideVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5 }
  },
  exit: { 
    opacity: 0, 
    x: -50,
    transition: { duration: 0.3 }
  }
};

export default function CocktailsPage() {
  const { user } = useAuth();
  const { isPremium, checkPremiumAccess, showUpgradePrompt } = usePremium();
  
  const [formData, setFormData] = useState<CocktailGenerationForm>({
    drinkType: 'all',
    style: 'classic',
    diversity: 3,
    complexity: 2,
    alcoholContent: 3,
    glasses: 1,
    isFruity: false,
    isDessert: false,
    focusPhrase: '',
    api: 'openai'
  });

  const [generatedCocktail, setGeneratedCocktail] = useState<GeneratedCocktail | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    // Load user's cocktail settings if available
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        credentials: 'include',
      });
      if (response.ok) {
        const settings = await response.json();
        setFormData(prev => ({
          ...prev,
          drinkType: settings.rgTypeDrink || 'all',
          style: settings.rgStyleDrink || 'classic',
          diversity: settings.sliderDiversityDrink || 3,
          complexity: settings.sliderComplexityDrink || 2,
          alcoholContent: settings.sliderAlcoholContentDrink || 3,
          glasses: settings.sliderGlassesDrink || 1,
          isFruity: settings.cbxFruityDrink || false,
          isDessert: settings.cbxDessertDrink || false,
          api: settings.rgApi || 'openai'
        }));
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const handleInputChange = (field: keyof CocktailGenerationForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateCocktail = async () => {
    if (!user) {
      toast.error('Bitte melde dich an, um Cocktails zu generieren');
      return;
    }

    if (!checkPremiumAccess('cocktail generation')) {
      showUpgradePrompt('Cocktail-Generator');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate/cocktail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Cocktail-Generierung fehlgeschlagen');
      }

      setGeneratedCocktail(data.cocktail);
      setShowResult(true);
      toast.success('Cocktail erfolgreich generiert! 🍹');
      
      // Save to user's cocktail history
      saveCocktailToHistory(data.cocktail);

    } catch (error: any) {
      console.error('Error generating cocktail:', error);
      toast.error(error.message || 'Fehler bei der Cocktail-Generierung');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCocktailToHistory = async (cocktail: GeneratedCocktail) => {
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: cocktail.title,
          description: cocktail.description,
          ingredients: cocktail.ingredients,
          instructions: Array.isArray(cocktail.instructions) ? cocktail.instructions : [cocktail.instructions],
          alcoholContent: cocktail.alcoholContent,
          difficulty: cocktail.difficulty,
          preparationTime: cocktail.preparationTime,
          cookingTime: '0',
          servings: formData.glasses,
          category: 'Cocktail',
          tips: cocktail.tips
        }),
      });

      if (response.ok) {
        console.log('Cocktail saved to history');
      }
    } catch (error) {
      console.error('Error saving cocktail:', error);
    }
  };

  const addToFavorites = async () => {
    if (!generatedCocktail) return;

    try {
      // First save as recipe, then add to favorites
      const saveResponse = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: generatedCocktail.title,
          description: generatedCocktail.description,
          ingredients: generatedCocktail.ingredients,
          instructions: Array.isArray(generatedCocktail.instructions) ? generatedCocktail.instructions : [generatedCocktail.instructions],
          alcoholContent: generatedCocktail.alcoholContent,
          difficulty: generatedCocktail.difficulty,
          preparationTime: generatedCocktail.preparationTime,
          cookingTime: '0',
          servings: formData.glasses,
          category: 'Cocktail',
          tips: generatedCocktail.tips,
          isFavorite: true
        }),
      });

      if (saveResponse.ok) {
        toast.success('Cocktail zu Favoriten hinzugefügt! ⭐');
      } else {
        throw new Error('Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Fehler beim Hinzufügen zu Favoriten');
    }
  };

  const getDrinkTypeIcon = (type: string) => {
    switch (type) {
      case 'alcoholic': return '🍸';
      case 'non_alcoholic': return '🥤';
      case 'low_alcohol': return '🍷';
      default: return '🍹';
    }
  };

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'classic': return '🥃';
      case 'modern': return '🍾';
      case 'exotic': return '🌺';
      case 'simple': return '🧊';
      default: return '🍹';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-success';
      case 'medium': return 'text-warning';
      case 'hard': return 'text-error';
      default: return 'text-on-surface-variant';
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

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
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
              <FiWine className="w-4 h-4" />
              KI-Cocktail-Generator
            </motion.div>
            
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              Cocktail-Kreationen
            </motion.h1>
            
            <motion.p 
              className="text-xl text-purple-100 leading-relaxed"
              variants={itemVariants}
            >
              Kreiere einzigartige Cocktails mit unserem KI-gestützten Generator
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="container py-12 lg:py-16">
        <AnimatePresence mode="wait">
          {!showResult ? (
            /* Generation Form */
            <motion.div
              key="form"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideVariants}
              className="space-y-8"
            >
              <motion.div 
                className="max-w-4xl mx-auto"
                variants={containerVariants}
              >
                {/* Main Form */}
                <motion.div className="card p-8 shadow-xl border border-outline/20" variants={itemVariants}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <FiSettings className="text-purple-600" />
                    Cocktail-Einstellungen
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Drink Type */}
                      <div>
                        <label className="block text-sm font-semibold mb-3">Getränke-Typ</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'all', label: 'Alle', icon: '🍹' },
                            { value: 'alcoholic', label: 'Alkoholisch', icon: '🍸' },
                            { value: 'non_alcoholic', label: 'Alkoholfrei', icon: '🥤' },
                            { value: 'low_alcohol', label: 'Wenig Alkohol', icon: '🍷' }
                          ].map(option => (
                            <button
                              key={option.value}
                              onClick={() => handleInputChange('drinkType', option.value)}
                              className={`p-3 rounded-xl border-2 transition-all text-left ${
                                formData.drinkType === option.value
                                  ? 'border-purple-600 bg-purple-50 text-purple-600'
                                  : 'border-outline/30 hover:border-outline/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{option.icon}</span>
                                <span className="text-sm font-medium">{option.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Style */}
                      <div>
                        <label className="block text-sm font-semibold mb-3">Stil</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'classic', label: 'Klassisch', icon: '🥃' },
                            { value: 'modern', label: 'Modern', icon: '🍾' },
                            { value: 'exotic', label: 'Exotisch', icon: '🌺' },
                            { value: 'simple', label: 'Einfach', icon: '🧊' }
                          ].map(option => (
                            <button
                              key={option.value}
                              onClick={() => handleInputChange('style', option.value)}
                              className={`p-3 rounded-xl border-2 transition-all text-left ${
                                formData.style === option.value
                                  ? 'border-purple-600 bg-purple-50 text-purple-600'
                                  : 'border-outline/30 hover:border-outline/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{option.icon}</span>
                                <span className="text-sm font-medium">{option.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Special Options */}
                      <div>
                        <label className="block text-sm font-semibold mb-3">Besondere Wünsche</label>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isFruity}
                              onChange={(e) => handleInputChange('isFruity', e.target.checked)}
                              className="w-5 h-5 text-purple-600 rounded border-outline/30 focus:ring-purple-500"
                            />
                            <span className="flex items-center gap-2">
                              <span>🍓</span>
                              <span>Fruchtig</span>
                            </span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isDessert}
                              onChange={(e) => handleInputChange('isDessert', e.target.checked)}
                              className="w-5 h-5 text-purple-600 rounded border-outline/30 focus:ring-purple-500"
                            />
                            <span className="flex items-center gap-2">
                              <span>🍰</span>
                              <span>Dessert-Cocktail</span>
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Sliders */}
                      <div>
                        <label className="block text-sm font-semibold mb-3">
                          Vielfalt: {formData.diversity}/5
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={formData.diversity}
                          onChange={(e) => handleInputChange('diversity', parseInt(e.target.value))}
                          className="w-full h-2 bg-outline/20 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                          <span>Klassisch</span>
                          <span>Experimentell</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-3">
                          Komplexität: {formData.complexity}/5
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={formData.complexity}
                          onChange={(e) => handleInputChange('complexity', parseInt(e.target.value))}
                          className="w-full h-2 bg-outline/20 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                          <span>Einfach</span>
                          <span>Komplex</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-3">
                          Alkoholgehalt: {formData.alcoholContent}/5
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={formData.alcoholContent}
                          onChange={(e) => handleInputChange('alcoholContent', parseInt(e.target.value))}
                          className="w-full h-2 bg-outline/20 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                          <span>Mild</span>
                          <span>Stark</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-3">
                          Anzahl Gläser: {formData.glasses}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.glasses}
                          onChange={(e) => handleInputChange('glasses', parseInt(e.target.value))}
                          className="w-full h-2 bg-outline/20 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>

                      {/* AI Provider */}
                      <div>
                        <label className="block text-sm font-semibold mb-3">KI-Provider</label>
                        <select
                          value={formData.api}
                          onChange={(e) => handleInputChange('api', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface focus:border-purple-600 transition-all duration-300 focus:outline-none"
                        >
                          <option value="openai">OpenAI GPT</option>
                          <option value="deepseek">DeepSeek</option>
                          <option value="grok">Grok</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Focus Phrase */}
                  <div className="mt-6">
                    <label className="block text-sm font-semibold mb-3">
                      Spezielle Zutaten oder Wünsche (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.focusPhrase}
                      onChange={(e) => handleInputChange('focusPhrase', e.target.value)}
                      placeholder="z.B. mit Gin und Limette, tropisch, für Party..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface focus:border-purple-600 transition-all duration-300 focus:outline-none"
                    />
                  </div>

                  {/* Generate Button */}
                  <div className="mt-8">
                    <button
                      onClick={generateCocktail}
                      disabled={isGenerating || !user}
                      className="w-full btn btn-lg py-4 shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      {isGenerating ? (
                        <>
                          <FiLoader className="animate-spin mr-2" />
                          Mixe deinen Cocktail...
                        </>
                      ) : (
                        <>
                          <FiShuffle className="mr-2" />
                          Cocktail generieren
                        </>
                      )}
                    </button>

                    {!user && (
                      <p className="text-center text-on-surface-variant text-sm mt-3">
                        Du musst angemeldet sein, um Cocktails zu generieren.
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Feature Cards */}
                <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8" variants={itemVariants}>
                  <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white mb-4">
                      <FiZap className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold mb-2">KI-gestützt</h3>
                    <p className="text-sm text-on-surface-variant">
                      Intelligente Cocktail-Rezepte basierend auf deinen Vorlieben
                    </p>
                  </div>
                  <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white mb-4">
                      <FiGlass className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold mb-2">Perfekte Balance</h3>
                    <p className="text-sm text-on-surface-variant">
                      Ausgewogene Rezepte mit präzisen Mengenangaben
                    </p>
                  </div>
                  <div className="card p-6 shadow-lg border border-outline/20 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white mb-4">
                      <FiStar className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold mb-2">Personalisiert</h3>
                    <p className="text-sm text-on-surface-variant">
                      Angepasst an deine Geschmacksvorlieben und Erfahrung
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            /* Generated Cocktail Result */
            <motion.div
              key="result"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideVariants}
              className="max-w-4xl mx-auto"
            >
              {generatedCocktail && (
                <motion.div className="space-y-8" variants={containerVariants}>
                  {/* Back Button */}
                  <motion.button
                    onClick={() => setShowResult(false)}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors font-medium"
                    variants={itemVariants}
                  >
                    ← Neuen Cocktail generieren
                  </motion.button>

                  {/* Cocktail Card */}
                  <motion.div className="card p-8 shadow-xl border border-outline/20" variants={itemVariants}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{generatedCocktail.title}</h1>
                        <p className="text-on-surface-variant text-lg">{generatedCocktail.description}</p>
                      </div>
                      <div className="text-4xl ml-4">{getDrinkTypeIcon(formData.drinkType)}</div>
                    </div>

                    {/* Meta Information */}
                    <div className="flex flex-wrap gap-4 mb-6 text-sm">
                      <span className="flex items-center gap-1">
                        <FiGlass className="w-4 h-4 text-purple-600" />
                        {generatedCocktail.glassType}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiClock className="w-4 h-4 text-purple-600" />
                        {generatedCocktail.preparationTime}
                      </span>
                      <span className={`flex items-center gap-1 ${getDifficultyColor(generatedCocktail.difficulty)}`}>
                        <FiStar className="w-4 h-4" />
                        {getDifficultyText(generatedCocktail.difficulty)}
                      </span>
                      {generatedCocktail.alcoholContent && (
                        <span className="flex items-center gap-1">
                          <FiDroplet className="w-4 h-4 text-purple-600" />
                          {generatedCocktail.alcoholContent}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Ingredients */}
                      <div>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <FiDroplet className="text-purple-600" />
                          Zutaten
                        </h3>
                        <div className="space-y-3">
                          {generatedCocktail.ingredients.map((ingredient, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-surface-variant/20 rounded-lg">
                              <FiCheck className="text-purple-600 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium">
                                  {ingredient.amount} {ingredient.unit} {ingredient.name}
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

                      {/* Instructions */}
                      <div>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <FiBookOpen className="text-purple-600" />
                          Zubereitung
                        </h3>
                        <div className="space-y-3">
                          {generatedCocktail.instructions.map((step, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <p className="text-on-surface-variant">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Tips & Garnish */}
                    {(generatedCocktail.tips || generatedCocktail.garnish) && (
                      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        {generatedCocktail.garnish && (
                          <div className="mb-2">
                            <span className="font-semibold text-purple-700">Garnierung:</span>{' '}
                            <span className="text-purple-600">{generatedCocktail.garnish}</span>
                          </div>
                        )}
                        {generatedCocktail.tips && (
                          <div>
                            <span className="font-semibold text-purple-700">Tipp:</span>{' '}
                            <span className="text-purple-600">{generatedCocktail.tips}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={addToFavorites}
                        className="flex-1 btn btn-outline border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white py-3"
                      >
                        <FiHeart className="mr-2" />
                        Zu Favoriten
                      </button>
                      <button
                        onClick={() => setShowResult(false)}
                        className="flex-1 btn py-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                        style={{ 
                          background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        <FiShuffle className="mr-2" />
                        Neuer Cocktail
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}