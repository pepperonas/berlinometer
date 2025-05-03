import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Grid,
  Paper,
  InputAdornment,
  IconButton,
  Chip,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Button,
  useTheme
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { DRINK_CATEGORIES } from '../../utils/constants';

const DrinkFilter = ({ filters, onFilterChange }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Verschiedene Feldtypen behandeln
    const newValue = type === 'checkbox' ? checked : value;
    
    onFilterChange({
      ...filters,
      [name]: newValue
    });
  };
  
  const handleCategoryChange = (categoryId) => {
    const currentCategories = [...(filters.categories || [])];
    const categoryIndex = currentCategories.indexOf(categoryId);
    
    if (categoryIndex === -1) {
      // Kategorie hinzufügen
      currentCategories.push(categoryId);
    } else {
      // Kategorie entfernen
      currentCategories.splice(categoryIndex, 1);
    }
    
    onFilterChange({
      ...filters,
      categories: currentCategories
    });
  };
  
  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      categories: [],
      minPrice: '',
      maxPrice: '',
      onlyActive: true,
      onlyPopular: false,
      onlyInStock: false
    });
  };
  
  // Kategorie-Hintergrundfarbe
  const getCategoryColor = (category) => {
    switch (category) {
      case 'beer': return theme.palette.warning.light;
      case 'wine': return theme.palette.error.light;
      case 'spirits': return theme.palette.secondary.light;
      case 'cocktails': return theme.palette.success.light;
      case 'softDrinks': return theme.palette.info.light;
      default: return theme.palette.grey[300];
    }
  };
  
  // Kategorie-Textfarbe
  const getCategoryTextColor = (category) => {
    switch (category) {
      case 'beer': return theme.palette.warning.main;
      case 'wine': return theme.palette.error.main;
      case 'spirits': return theme.palette.secondary.main;
      case 'cocktails': return theme.palette.success.main;
      case 'softDrinks': return theme.palette.info.main;
      default: return theme.palette.text.primary;
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <FilterIcon sx={{ mr: 1 }} />
          Filter
        </Typography>
        
        <Button 
          size="small" 
          variant="text" 
          onClick={() => setExpanded(!expanded)}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expanded ? 'Weniger' : 'Mehr Filter'}
        </Button>
      </Box>
      
      <Box mb={2}>
        <TextField
          fullWidth
          label="Getränke suchen"
          name="search"
          value={filters.search || ''}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: filters.search ? (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => onFilterChange({ ...filters, search: '' })}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
      </Box>
      
      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>
          Kategorien
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {DRINK_CATEGORIES.map(category => (
            <Chip
              key={category.id}
              label={category.name}
              onClick={() => handleCategoryChange(category.id)}
              color={filters.categories?.includes(category.id) ? 'primary' : 'default'}
              variant={filters.categories?.includes(category.id) ? 'filled' : 'outlined'}
              sx={{ 
                backgroundColor: filters.categories?.includes(category.id) 
                  ? getCategoryColor(category.id)
                  : 'transparent',
                color: filters.categories?.includes(category.id) 
                  ? getCategoryTextColor(category.id)
                  : 'text.primary',
                borderColor: filters.categories?.includes(category.id) 
                  ? 'transparent'
                  : getCategoryTextColor(category.id),
                '&:hover': {
                  backgroundColor: filters.categories?.includes(category.id) 
                    ? getCategoryColor(category.id)
                    : `${getCategoryColor(category.id)}33`,
                }
              }}
            />
          ))}
        </Box>
      </Box>
      
      {expanded && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mindestpreis"
                name="minPrice"
                value={filters.minPrice || ''}
                onChange={handleChange}
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  inputProps: { min: 0, step: 0.5 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Höchstpreis"
                name="maxPrice"
                value={filters.maxPrice || ''}
                onChange={handleChange}
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  inputProps: { min: 0, step: 0.5 }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={filters.onlyActive || false}
                      onChange={handleChange}
                      name="onlyActive"
                    />
                  }
                  label="Nur aktive"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={filters.onlyPopular || false}
                      onChange={handleChange}
                      name="onlyPopular"
                    />
                  }
                  label="Nur beliebte"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={filters.onlyInStock || false}
                      onChange={handleChange}
                      name="onlyInStock"
                    />
                  }
                  label="Nur auf Lager"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </>
      )}
      
      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button 
          variant="outlined" 
          color="inherit"
          onClick={handleClearFilters}
          startIcon={<ClearIcon />}
          size="small"
        >
          Filter zurücksetzen
        </Button>
      </Box>
    </Paper>
  );
};

export default DrinkFilter;