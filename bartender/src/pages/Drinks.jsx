import React, { useState, useEffect, forwardRef } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  CircularProgress, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Slide,
  useMediaQuery,
  useTheme,
  Backdrop
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  LocalBar as DrinkIcon,
  Refresh as RefreshIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import DrinkCard from '../components/Drinks/DrinkCard';
import DrinkFilter from '../components/Drinks/DrinkFilter';
import DrinkForm from '../components/Drinks/DrinkForm';
import { drinksApi } from '../services/api';
import { filterBySearchTerm } from '../utils/helpers';

// Transition für Dialog
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Drinks = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openForm, setOpenForm] = useState(false);
  const [currentDrink, setCurrentDrink] = useState(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [drinkToDelete, setDrinkToDelete] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    minPrice: '',
    maxPrice: '',
    onlyActive: true,
    onlyPopular: false,
    onlyInStock: false
  });

  // Getränke laden
  const loadDrinks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await drinksApi.getAll();
      console.log('Geladene Getränke:', data);
      
      // Stellen sicher, dass jedes Getränk ein isActive-Feld hat
      const processedDrinks = data.map(drink => ({
        ...drink,
        // Setze isActive auf true, wenn es nicht explizit false ist
        isActive: drink.isActive === false ? false : true,
        // Stellen sicher, dass ingredients korrekt formatiert ist
        ingredients: Array.isArray(drink.ingredients) 
          ? drink.ingredients
          : []
      }));
      
      setDrinks(processedDrinks);
    } catch (err) {
      console.error('Error loading drinks:', err);
      setError(`Fehler beim Laden der Getränke: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Beim ersten Laden die Getränke laden
  useEffect(() => {
    loadDrinks();
  }, []);

  // Getränk hinzufügen/bearbeiten Dialog öffnen
  const handleOpenForm = (drink = null) => {
    // Wenn ein Getränk bearbeitet wird, formatieren wir die Daten richtig
    if (drink) {
      // MongoDB verwendet _id statt id
      const formattedDrink = {
        ...drink,
        id: drink._id || drink.id, // Unterstütze beide ID-Formate
        // Stellen sicher, dass ingredients richtig formatiert sind
        ingredients: Array.isArray(drink.ingredients) 
          ? drink.ingredients.map(ing => typeof ing === 'object' ? ing.name : ing)
          : [],
        // Setze isActive, auch wenn das Backend es nicht verwendet
        isActive: drink.isActive !== undefined ? drink.isActive : true
      };
      setCurrentDrink(formattedDrink);
    } else {
      setCurrentDrink(null);
    }
    setOpenForm(true);
  };

  // Getränk hinzufügen/bearbeiten Dialog schließen
  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentDrink(null);
  };

  // Formular speichern
  const handleSaveForm = async (values) => {
    setLoading(true);
    try {
      // Die Zutaten im korrekten Format bereitstellen
      const formattedValues = {
        ...values,
        ingredients: Array.isArray(values.ingredients) 
          ? values.ingredients.map(ing => typeof ing === 'object' ? ing : { name: ing })
          : []
      };
      
      console.log('Sende folgende Daten an API:', formattedValues);
      
      if (currentDrink) {
        // Getränk aktualisieren
        const drinkId = currentDrink._id || currentDrink.id;
        await drinksApi.update(drinkId, formattedValues);
      } else {
        // Neues Getränk erstellen
        await drinksApi.create(formattedValues);
      }
      
      loadDrinks();
      handleCloseForm();
    } catch (err) {
      console.error('Error saving drink:', err);
      setError(`Fehler beim Speichern des Getränks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Lösch-Dialog öffnen
  const handleDeleteConfirm = (drinkId) => {
    // MongoDB verwendet _id statt id
    const drink = drinks.find(d => d._id === drinkId || d.id === drinkId);
    if (drink) {
      setDrinkToDelete(drink);
      setDeleteConfirm(true);
    } else {
      console.error('Getränk nicht gefunden:', drinkId);
      setError('Getränk nicht gefunden');
    }
  };

  // Getränk löschen
  const handleDelete = async () => {
    if (!drinkToDelete) return;
    
    setLoading(true);
    try {
      // Verwende entweder _id oder id, je nachdem was verfügbar ist
      const drinkId = drinkToDelete._id || drinkToDelete.id;
      await drinksApi.delete(drinkId);
      setDeleteConfirm(false);
      setDrinkToDelete(null);
      loadDrinks();
    } catch (err) {
      console.error('Error deleting drink:', err);
      setError(`Fehler beim Löschen des Getränks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter anwenden
  const filteredDrinks = drinks.filter(drink => {
    // Aktiv-Filter - Da das isActive Feld nicht im Backend-Schema existiert,
    // behandeln wir alle Getränke als aktiv, wenn nicht explizit auf false gesetzt
    if (filters.onlyActive && drink.isActive === false) {
      return false;
    }
    
    // Beliebt-Filter
    if (filters.onlyPopular && !drink.popular) {
      return false;
    }
    
    // Auf Lager-Filter
    if (filters.onlyInStock && (!drink.stock || drink.stock <= 0)) {
      return false;
    }
    
    // Kategorie-Filter
    if (filters.categories?.length > 0 && !filters.categories.includes(drink.category)) {
      return false;
    }
    
    // Preis-Filter
    if (filters.minPrice && (!drink.price || drink.price < parseFloat(filters.minPrice))) {
      return false;
    }
    
    if (filters.maxPrice && (!drink.price || drink.price > parseFloat(filters.maxPrice))) {
      return false;
    }
    
    // Suchfilter
    if (filters.search) {
      // Getränkename suchen
      const nameMatch = drink.name.toLowerCase().includes(filters.search.toLowerCase());
      
      // Suche in Zutaten, berücksichtige beide Formate (Array von Objekten oder Strings)
      let ingredientsMatch = false;
      if (Array.isArray(drink.ingredients)) {
        ingredientsMatch = drink.ingredients.some(ingredient => {
          if (typeof ingredient === 'string') {
            return ingredient.toLowerCase().includes(filters.search.toLowerCase());
          } else if (typeof ingredient === 'object' && ingredient.name) {
            return ingredient.name.toLowerCase().includes(filters.search.toLowerCase());
          }
          return false;
        });
      }
      
      return nameMatch || ingredientsMatch;
    }
    
    return true;
  });

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Titel und Aktionsbuttons */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Getränke
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Verwalten Sie Ihr Getränkeangebot und die Preise
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={loadDrinks}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Aktualisieren
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Getränk hinzufügen
          </Button>
        </Box>
      </Box>

      {/* Filter */}
      <DrinkFilter 
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Fehlermeldung */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 4 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadDrinks}
            >
              Erneut laden
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Getränkeliste */}
      {loading && !drinks.length ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      ) : filteredDrinks.length > 0 ? (
        <Grid container spacing={3}>
          {filteredDrinks.map(drink => (
            <Grid item key={drink.id} xs={12} sm={6} md={4} lg={3}>
              <DrinkCard 
                drink={drink} 
                onDelete={handleDeleteConfirm}
                onEdit={() => handleOpenForm(drink)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box 
          sx={{ 
            py: 8, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 4,
          }}
        >
          <DrinkIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Keine Getränke gefunden
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" mb={3}>
            {drinks.length > 0 
              ? 'Keine Getränke entsprechen den ausgewählten Filterkriterien.'
              : 'Es wurden noch keine Getränke hinzugefügt. Fügen Sie jetzt ein Getränk hinzu!'
            }
          </Typography>
          {drinks.length > 0 ? (
            <Button 
              variant="outlined" 
              onClick={() => setFilters({
                search: '',
                categories: [],
                minPrice: '',
                maxPrice: '',
                onlyActive: true,
                onlyPopular: false,
                onlyInStock: false
              })}
              startIcon={<RefreshIcon />}
            >
              Filter zurücksetzen
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={() => handleOpenForm()}
              startIcon={<AddIcon />}
            >
              Getränk hinzufügen
            </Button>
          )}
        </Box>
      )}

      {/* Floating Action Button auf kleinen Bildschirmen */}
      {useMediaQuery(theme.breakpoints.down('sm')) && (
        <Fab 
          color="primary" 
          aria-label="Getränk hinzufügen"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleOpenForm()}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Getränk hinzufügen/bearbeiten Dialog */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="md"
        TransitionComponent={Transition}
      >
        <DialogTitle>
          {currentDrink ? 'Getränk bearbeiten' : 'Neues Getränk hinzufügen'}
        </DialogTitle>
        <DialogContent dividers>
          <DrinkForm 
            initialValues={currentDrink}
            onSubmit={handleSaveForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Lösch-Dialog */}
      <Dialog 
        open={deleteConfirm} 
        onClose={() => setDeleteConfirm(false)}
      >
        <DialogTitle>
          Getränk löschen
        </DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie das Getränk "{drinkToDelete?.name}" löschen möchten?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirm(false)}
          >
            Abbrechen
          </Button>
          <Button 
            color="error" 
            onClick={handleDelete}
            startIcon={<DeleteIcon />}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: theme.zIndex.drawer + 1 }}
        open={loading && (openForm || deleteConfirm)}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default Drinks;