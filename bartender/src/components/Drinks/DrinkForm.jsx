import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Grid,
  Divider,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Paper,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  LocalBar as DrinkIcon, 
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DRINK_CATEGORIES } from '../../utils/constants';

const DrinkForm = ({ initialValues, onSubmit, onCancel }) => {
  const [values, setValues] = useState({
    name: '',
    category: '',
    price: '',
    cost: '',
    ingredients: [],
    isActive: true,
    popular: false,
    stock: 0,
    ...initialValues,
  });

  const [errors, setErrors] = useState({});
  const [newIngredient, setNewIngredient] = useState('');
  const [ingredientError, setIngredientError] = useState('');
  
  // Formularfelder aktualisieren
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Verschiedene Feldtypen behandeln
    const newValue = type === 'checkbox' ? checked : value;
    
    // Numerische Felder validieren
    if ((name === 'price' || name === 'cost' || name === 'stock') && value !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        setErrors(prev => ({ ...prev, [name]: 'Bitte geben Sie einen gültigen Wert ein' }));
        return;
      }
    }
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setValues(prev => ({ ...prev, [name]: newValue }));
  };
  
  // Zutaten hinzufügen
  const handleAddIngredient = () => {
    if (!newIngredient.trim()) {
      setIngredientError('Bitte geben Sie eine Zutat ein');
      return;
    }
    
    if (values.ingredients.includes(newIngredient.trim())) {
      setIngredientError('Diese Zutat ist bereits vorhanden');
      return;
    }
    
    setValues(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient.trim()]
    }));
    
    setNewIngredient('');
    setIngredientError('');
  };
  
  // Zutat entfernen
  const handleRemoveIngredient = (index) => {
    setValues(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };
  
  // Formular validieren
  const validateForm = () => {
    const newErrors = {};
    
    if (!values.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    if (!values.category) {
      newErrors.category = 'Kategorie ist erforderlich';
    }
    
    if (!values.price) {
      newErrors.price = 'Preis ist erforderlich';
    } else if (isNaN(parseFloat(values.price)) || parseFloat(values.price) <= 0) {
      newErrors.price = 'Bitte geben Sie einen gültigen Preis ein';
    }
    
    // Cost ist optional, da es vom Backend ignoriert wird
    if (values.cost && (isNaN(parseFloat(values.cost)) || parseFloat(values.cost) < 0)) {
      newErrors.cost = 'Bitte geben Sie gültige Kosten ein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Numerische Werte konvertieren und richtig formatieren
      const formattedValues = {
        ...values,
        price: parseFloat(values.price),
        // Das cost-Feld wird jetzt im Backend unterstützt
        cost: parseFloat(values.cost),
        stock: parseInt(values.stock, 10),
        // Zutaten im richtigen Format (Client-seitige Konvertierung)
        ingredients: values.ingredients.map(ingredient => {
          return typeof ingredient === 'object' ? ingredient : { name: ingredient };
        }),
      };
      
      console.log('Sende formatierte Daten an API:', formattedValues);
      onSubmit(formattedValues);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <DrinkIcon sx={{ mr: 1 }} />
          Getränk-Details
        </Typography>
        
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Name"
              name="name"
              value={values.name}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={!!errors.category}>
              <InputLabel id="category-label">Kategorie</InputLabel>
              <Select
                labelId="category-label"
                name="category"
                value={values.category}
                onChange={handleChange}
                label="Kategorie"
              >
                {DRINK_CATEGORIES.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Preis"
              name="price"
              value={values.price}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.price}
              helperText={errors.price}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
                type: 'number',
                step: '0.01',
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Kosten"
              name="cost"
              value={values.cost}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.cost}
              helperText={errors.cost}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
                type: 'number',
                step: '0.01',
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Zutaten
            </Typography>
            
            <Box display="flex" alignItems="flex-start" mb={2}>
              <TextField
                label="Neue Zutat"
                value={newIngredient}
                onChange={(e) => {
                  setNewIngredient(e.target.value);
                  if (ingredientError) setIngredientError('');
                }}
                error={!!ingredientError}
                helperText={ingredientError}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <Button 
                variant="outlined" 
                onClick={handleAddIngredient}
                startIcon={<AddIcon />}
                sx={{ height: 56 }}
              >
                Hinzufügen
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {values.ingredients.map((ingredient, index) => (
                <Chip
                  key={index}
                  label={ingredient}
                  onDelete={() => handleRemoveIngredient(index)}
                  color="primary"
                  variant="outlined"
                />
              ))}
              {values.ingredients.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Keine Zutaten hinzugefügt
                </Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Lagerbestand"
              name="stock"
              value={values.stock}
              onChange={handleChange}
              type="number"
              fullWidth
              error={!!errors.stock}
              helperText={errors.stock || 'Geben Sie 0 ein, wenn es frisch zubereitet wird'}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.isActive}
                    onChange={handleChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Aktiv"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={values.popular}
                    onChange={handleChange}
                    name="popular"
                    color="secondary"
                  />
                }
                label="Beliebt"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
        >
          Abbrechen
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          startIcon={<DrinkIcon />}
        >
          {initialValues ? 'Speichern' : 'Erstellen'}
        </Button>
      </Box>
    </Box>
  );
};

export default DrinkForm;