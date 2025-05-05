import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  IconButton, 
  CardActionArea, 
  Tooltip, 
  Button
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  LocalBar as DrinkIcon,
  Euro as EuroIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';

const DrinkCard = ({ drink, onDelete, onEdit }) => {
  const navigate = useNavigate();
  
  // Kategorie als lesbarer Text
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'beer': return 'Bier';
      case 'wine': return 'Wein';
      case 'spirits': return 'Spirituosen';
      case 'cocktails': return 'Cocktail';
      case 'softDrinks': return 'Alkoholfrei';
      default: return category;
    }
  };
  
  // Gewinnmarge berechnen (wir haben kein cost-Feld mehr, zeigen daher einen Standardwert)
  const cost = drink.cost || 0; // Fallback für den Fall, dass kein cost-Feld vorhanden ist
  const marginPercent = ((drink.price - cost) / drink.price * 100).toFixed(0);
  
  // Kategorie-Farbe
  const getCategoryColor = (category) => {
    switch (category) {
      case 'beer': return 'warning';
      case 'wine': return 'error';
      case 'spirits': return 'secondary';
      case 'cocktails': return 'success';
      case 'softDrinks': return 'info';
      default: return 'default';
    }
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardActionArea 
        onClick={() => navigate(`/drinks/${drink._id || drink.id}`)}
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Chip 
              label={getCategoryLabel(drink.category)} 
              size="small" 
              color={getCategoryColor(drink.category)}
              sx={{ mb: 1 }}
            />
            {drink.popular && (
              <Chip 
                label="Beliebt" 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
          </Box>

          <Typography variant="h6" component="div" gutterBottom>
            {drink.name}
          </Typography>

          <Box display="flex" alignItems="center" mt={2}>
            <DrinkIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {Array.isArray(drink.ingredients) 
                ? drink.ingredients.map(ing => 
                    typeof ing === 'object' && ing.name ? ing.name : ing
                  ).join(', ')
                : ''}
            </Typography>
          </Box>

          {drink.stock !== 0 && (
            <Box mt={1} display="flex" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Bestand: {drink.stock} Stück
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>

      <Box 
        sx={{ 
          borderTop: 1, 
          borderColor: 'divider',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h6" component="div" color="primary.main" fontWeight="bold">
            {formatCurrency(drink.price)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
            <EuroIcon fontSize="inherit" sx={{ mr: 0.5 }} />
            {marginPercent}% Marge
          </Typography>
        </Box>
        
        <Box>
          <Tooltip title="Bearbeiten">
            <IconButton 
              size="small" 
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(drink);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Löschen">
            <IconButton 
              size="small" 
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                // Verwende _id (MongoDB) oder id (Frontend), je nachdem was verfügbar ist
                onDelete(drink._id || drink.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {!drink.isActive && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'inherit',
          }}
        >
          <Chip 
            label="Inaktiv" 
            color="default"
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>
      )}
    </Card>
  );
};

export default DrinkCard;