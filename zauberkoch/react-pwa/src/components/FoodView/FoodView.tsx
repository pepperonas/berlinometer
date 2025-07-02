// Main food view component for recipe generation

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore,
  Restaurant,
  Timer,
  Euro,
  People,
  Shuffle,
  Settings as SettingsIcon,
  Favorite,
  FavoriteBorder,
  Share,
  Refresh,
} from '@mui/icons-material';
import { useAuth, useRequirePremium } from '../../contexts/AuthContext';
import { 
  UserSettings, 
  FoodPreference, 
  RecipeGenerationRequest, 
  Recipe, 
  MealType, 
  RecipeType,
  AIProvider 
} from '../../types';
import { apiService } from '../../services/api';
import { CustomSlider } from '../common/CustomSlider';
import { RecipeDisplay } from '../common/RecipeDisplay';
import { FoodPreferencesDialog } from '../common/FoodPreferencesDialog';

const FoodView: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state: authState } = useAuth();
  const isPremium = useRequirePremium();

  // State management
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [foodPreferences, setFoodPreferences] = useState<FoodPreference[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);

  // Load user settings and preferences
  useEffect(() => {
    loadUserData();
  }, [authState.user]);

  const loadUserData = async () => {
    try {
      const [userSettings, userPreferences] = await Promise.all([
        apiService.getUserSettings(),
        apiService.getFoodPreferences(),
      ]);
      setSettings(userSettings);
      setFoodPreferences(userPreferences);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setError('Fehler beim Laden der Einstellungen');
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      await apiService.updateUserSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Fehler beim Speichern der Einstellungen');
    }
  }, [settings]);

  const generateRecipe = async (mealType: MealType) => {
    if (!settings || !authState.user) return;

    setIsGenerating(true);
    setError(null);

    try {
      const request: RecipeGenerationRequest = {
        mealType,
        preferences: settings,
        foodPreferences,
      };

      const response = await apiService.generateRecipe(request);
      setCurrentRecipe(response.recipe);
    } catch (error) {
      console.error('Recipe generation failed:', error);
      setError('Fehler beim Generieren des Rezepts. Bitte versuchen Sie es erneut.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRecipeFavorite = async () => {
    if (!currentRecipe) return;

    try {
      const updatedRecipe = await apiService.toggleRecipeFavorite(currentRecipe.id);
      setCurrentRecipe(updatedRecipe);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setError('Fehler beim Speichern der Favoriten');
    }
  };

  const shareRecipe = async () => {
    if (!currentRecipe) return;

    try {
      const shareData = await apiService.shareRecipe(currentRecipe.id);
      if (navigator.share) {
        await navigator.share({
          title: currentRecipe.title,
          text: `Schau dir dieses Rezept an: ${currentRecipe.title}`,
          url: shareData.shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.shareUrl);
        alert('Link wurde in die Zwischenablage kopiert!');
      }
    } catch (error) {
      console.error('Failed to share recipe:', error);
      setError('Fehler beim Teilen des Rezepts');
    }
  };

  if (!settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          🍳 Rezept Generator
          <Tooltip title="Einstellungen für Lebensmittelpräferenzen">
            <IconButton onClick={() => setShowPreferencesDialog(true)} sx={{ ml: 2 }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Erstellen Sie personalisierte Rezepte basierend auf Ihren Vorlieben
        </Typography>
      </Paper>

      {/* Error display */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Settings Panel */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Einstellungen
            </Typography>

            {/* Meal Type Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Mahlzeit auswählen
              </Typography>
              <Grid container spacing={1}>
                {(['Frühstück', 'Mittagessen', 'Abendessen', 'Snack', 'Dessert'] as MealType[]).map((meal) => (
                  <Grid item xs={6} sm={4} md={12} key={meal}>
                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={() => generateRecipe(meal)}
                      disabled={isGenerating}
                      startIcon={<Restaurant />}
                      sx={{ mb: 1 }}
                    >
                      {meal}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Recipe Type */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Ernährungsart</InputLabel>
              <Select
                value={settings.rgType}
                label="Ernährungsart"
                onChange={(e) => updateSettings({ rgType: e.target.value as RecipeType })}
              >
                <MenuItem value="Ich esse alles">Ich esse alles</MenuItem>
                <MenuItem value="Vegetarisch">Vegetarisch</MenuItem>
                <MenuItem value="Vegan">Vegan</MenuItem>
                <MenuItem value="Glutenfrei">Glutenfrei</MenuItem>
                <MenuItem value="Laktosefrei">Laktosefrei</MenuItem>
                <MenuItem value="Keto">Keto</MenuItem>
                <MenuItem value="Low-Carb">Low-Carb</MenuItem>
                <MenuItem value="High-Protein">High-Protein</MenuItem>
              </Select>
            </FormControl>

            {/* AI Provider */}
            {isPremium && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>KI-Anbieter</InputLabel>
                <Select
                  value={settings.rgApi}
                  label="KI-Anbieter"
                  onChange={(e) => updateSettings({ rgApi: e.target.value as AIProvider })}
                >
                  <MenuItem value="chat_gpt">ChatGPT</MenuItem>
                  <MenuItem value="deepseek">DeepSeek</MenuItem>
                  <MenuItem value="grok">Grok</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Advanced Settings */}
            <Accordion 
              expanded={expandedSettings} 
              onChange={(_, expanded) => setExpandedSettings(expanded)}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2">Erweiterte Einstellungen</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ space: 2 }}>
                  {/* Sliders */}
                  <CustomSlider
                    label="Vielfalt der Zutaten"
                    value={settings.sliderDiversity}
                    onChange={(value) => updateSettings({ sliderDiversity: value })}
                    min={0}
                    max={100}
                    step={5}
                    icon={<Shuffle />}
                    tooltip="Wie experimentell soll das Rezept sein?"
                    sx={{ mb: 3 }}
                  />

                  <CustomSlider
                    label="Zubereitungszeit"
                    value={settings.sliderDuration}
                    onChange={(value) => updateSettings({ sliderDuration: value })}
                    min={0}
                    max={100}
                    step={5}
                    icon={<Timer />}
                    tooltip="Wie viel Zeit möchten Sie investieren?"
                    sx={{ mb: 3 }}
                  />

                  <CustomSlider
                    label="Kostenrahmen"
                    value={settings.sliderCost}
                    onChange={(value) => updateSettings({ sliderCost: value })}
                    min={0}
                    max={100}
                    step={5}
                    icon={<Euro />}
                    tooltip="Wie teuer dürfen die Zutaten sein?"
                    sx={{ mb: 3 }}
                  />

                  <CustomSlider
                    label="Portionen"
                    value={settings.sliderPortions}
                    onChange={(value) => updateSettings({ sliderPortions: value })}
                    min={1}
                    max={8}
                    step={1}
                    icon={<People />}
                    tooltip="Für wie viele Personen soll gekocht werden?"
                    showValue
                    sx={{ mb: 3 }}
                  />

                  <CustomSlider
                    label="Komplexität"
                    value={settings.sliderComplexity}
                    onChange={(value) => updateSettings({ sliderComplexity: value })}
                    min={0}
                    max={100}
                    step={5}
                    icon={<Restaurant />}
                    tooltip="Wie aufwendig darf das Rezept sein?"
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Food Preferences */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Geschmackspräferenzen
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {foodPreferences.slice(0, 3).map((pref) => (
                  <Chip
                    key={pref.id}
                    label={pref.name}
                    size="small"
                    color={pref.liked ? 'success' : 'error'}
                  />
                ))}
                {foodPreferences.length > 3 && (
                  <Chip
                    label={`+${foodPreferences.length - 3} weitere`}
                    size="small"
                    variant="outlined"
                    onClick={() => setShowPreferencesDialog(true)}
                  />
                )}
              </Box>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => setShowPreferencesDialog(true)}
              >
                Präferenzen verwalten
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recipe Display */}
        <Grid item xs={12} md={8}>
          {isGenerating ? (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                🧙‍♂️ Zaubere dein Rezept...
              </Typography>
              <LinearProgress sx={{ mt: 2, mb: 2 }} />
              <Typography variant="body2" color="textSecondary">
                Dies kann einen Moment dauern
              </Typography>
            </Paper>
          ) : currentRecipe ? (
            <Paper elevation={2} sx={{ p: 3 }}>
              {/* Recipe Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {currentRecipe.title}
                </Typography>
                <Box>
                  <Tooltip title={currentRecipe.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}>
                    <IconButton onClick={toggleRecipeFavorite} color="primary">
                      {currentRecipe.favorite ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rezept teilen">
                    <IconButton onClick={shareRecipe} color="primary">
                      <Share />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Neues Rezept generieren">
                    <IconButton onClick={() => generateRecipe('Mittagessen')} color="primary">
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Recipe Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Timer color="primary" />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {currentRecipe.preparationTime}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Euro color="primary" />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {currentRecipe.cost}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <People color="primary" />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {currentRecipe.servings} Portionen
                    </Typography>
                  </Box>
                </Grid>
                {currentRecipe.alcoholContent && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Restaurant color="primary" />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {currentRecipe.alcoholContent}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {/* Recipe Content */}
              <RecipeDisplay recipe={currentRecipe} />
            </Paper>
          ) : (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Restaurant sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom color="textSecondary">
                Wählen Sie eine Mahlzeit aus, um zu beginnen
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Klicken Sie auf eine der Schaltflächen links, um ein personalisiertes Rezept zu generieren
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Food Preferences Dialog */}
      <FoodPreferencesDialog
        open={showPreferencesDialog}
        onClose={() => setShowPreferencesDialog(false)}
        preferences={foodPreferences}
        onSave={setFoodPreferences}
      />
    </Box>
  );
};

export default FoodView;