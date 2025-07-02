// Food preferences management dialog

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Chip,
  IconButton,
  Typography,
  Card,
  CardContent,
  Tooltip,
  InputAdornment,
  useTheme,
  Grid,
} from '@mui/material';
import {
  Add,
  Delete,
  ThumbUp,
  ThumbDown,
  Search,
  Restaurant,
} from '@mui/icons-material';
import { FoodPreference } from '../../types';
import { apiService } from '../../services/api';

interface FoodPreferencesDialogProps {
  open: boolean;
  onClose: () => void;
  preferences: FoodPreference[];
  onSave: (preferences: FoodPreference[]) => void;
}

export const FoodPreferencesDialog: React.FC<FoodPreferencesDialogProps> = ({
  open,
  onClose,
  preferences,
  onSave,
}) => {
  const theme = useTheme();
  const [localPreferences, setLocalPreferences] = useState<FoodPreference[]>(preferences);
  const [newFood, setNewFood] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  // Common food suggestions
  const commonFoods = [
    'Tomaten', 'Zwiebeln', 'Knoblauch', 'Paprika', 'Karotten', 'Brokkoli',
    'Spinat', 'Pilze', 'Avocado', 'Zucchini', 'Aubergine', 'Gurke',
    'Hähnchen', 'Rind', 'Schwein', 'Lachs', 'Thunfisch', 'Garnelen',
    'Eier', 'Käse', 'Milch', 'Joghurt', 'Butter', 'Sahne',
    'Reis', 'Nudeln', 'Kartoffeln', 'Brot', 'Quinoa', 'Couscous',
    'Basilikum', 'Oregano', 'Thymian', 'Rosmarin', 'Petersilie', 'Koriander',
    'Zimt', 'Paprika', 'Kreuzkümmel', 'Ingwer', 'Chili', 'Pfeffer',
  ];

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences, open]);

  const filteredPreferences = localPreferences.filter(pref =>
    pref.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const suggestedFoods = commonFoods.filter(food =>
    !localPreferences.some(pref => pref.name.toLowerCase() === food.toLowerCase()) &&
    food.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addFood = async (food: string, liked: boolean) => {
    if (!food.trim()) return;

    const newPreference: FoodPreference = {
      id: Date.now(), // Temporary ID
      userId: 0, // Will be set by the server
      name: food.trim(),
      liked,
    };

    setLocalPreferences(prev => [...prev, newPreference]);
    setNewFood('');
  };

  const togglePreference = (id: number) => {
    setLocalPreferences(prev =>
      prev.map(pref =>
        pref.id === id ? { ...pref, liked: !pref.liked } : pref
      )
    );
  };

  const removePreference = (id: number) => {
    setLocalPreferences(prev => prev.filter(pref => pref.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedPreferences = await apiService.updateFoodPreferences(localPreferences);
      onSave(updatedPreferences);
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalPreferences(preferences);
    setNewFood('');
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Restaurant sx={{ mr: 1 }} />
          Lebensmittelpräferenzen verwalten
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="textSecondary" paragraph>
          Geben Sie Ihre Vorlieben für verschiedene Lebensmittel an, um personalisierte Rezepte zu erhalten.
        </Typography>

        {/* Search/Add new food */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Lebensmittel hinzufügen oder suchen"
            value={newFood || searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setNewFood(value);
              setSearchTerm(value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: newFood && (
                <InputAdornment position="end">
                  <Tooltip title="Mag ich">
                    <IconButton
                      size="small"
                      onClick={() => addFood(newFood, true)}
                      sx={{ color: 'success.main', mr: 1 }}
                    >
                      <ThumbUp />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Mag ich nicht">
                    <IconButton
                      size="small"
                      onClick={() => addFood(newFood, false)}
                      sx={{ color: 'error.main' }}
                    >
                      <ThumbDown />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newFood.trim()) {
                addFood(newFood, true);
              }
            }}
          />
        </Box>

        {/* Suggested foods */}
        {suggestedFoods.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Vorschläge:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {suggestedFoods.slice(0, 10).map((food) => (
                <Chip
                  key={food}
                  label={food}
                  variant="outlined"
                  size="small"
                  onClick={() => addFood(food, true)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Current preferences */}
        <Typography variant="subtitle2" gutterBottom>
          Ihre Präferenzen ({localPreferences.length}):
        </Typography>
        
        {filteredPreferences.length === 0 ? (
          <Card variant="outlined" sx={{ textAlign: 'center', py: 4 }}>
            <CardContent>
              <Restaurant sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="textSecondary">
                {searchTerm ? 'Keine Präferenzen gefunden' : 'Noch keine Präferenzen hinzugefügt'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={1}>
            {filteredPreferences.map((pref) => (
              <Grid item xs={12} sm={6} md={4} key={pref.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: pref.liked ? 'success.main' : 'error.main',
                    backgroundColor: pref.liked 
                      ? theme.palette.success.light + '20' 
                      : theme.palette.error.light + '20',
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {pref.name}
                      </Typography>
                      <Box>
                        <Tooltip title={pref.liked ? 'Mag ich nicht' : 'Mag ich'}>
                          <IconButton
                            size="small"
                            onClick={() => togglePreference(pref.id)}
                            sx={{
                              color: pref.liked ? 'success.main' : 'error.main',
                              mr: 0.5,
                            }}
                          >
                            {pref.liked ? <ThumbUp /> : <ThumbDown />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Entfernen">
                          <IconButton
                            size="small"
                            onClick={() => removePreference(pref.id)}
                            sx={{ color: 'text.secondary' }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCancel} disabled={saving}>
          Abbrechen
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FoodPreferencesDialog;