import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Divider, 
  Chip, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop,
  useTheme
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalBar as DrinkIcon,
  Euro as EuroIcon,
  Inventory as InventoryIcon,
  List as ListIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

import DrinkForm from '../components/Drinks/DrinkForm';
import { drinksApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const DrinkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [drink, setDrink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openForm, setOpenForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Getränk laden
  const loadDrink = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await drinksApi.getById(id);
      setDrink(data);
    } catch (err) {
      console.error('Error loading drink:', err);
      setError('Getränk konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  // Beim ersten Laden und wenn sich die ID ändert
  useEffect(() => {
    loadDrink();
  }, [id]);

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

  // Formular speichern
  const handleSaveForm = async (values) => {
    setLoading(true);
    try {
      await drinksApi.update(id, values);
      setOpenForm(false);
      loadDrink();
    } catch (err) {
      console.error('Error updating drink:', err);
      setError('Fehler beim Speichern des Getränks');
    } finally {
      setLoading(false);
    }
  };

  // Getränk löschen
  const handleDelete = async () => {
    setLoading(true);
    try {
      await drinksApi.delete(id);
      navigate('/drinks');
    } catch (err) {
      console.error('Error deleting drink:', err);
      setError('Fehler beim Löschen des Getränks');
      setLoading(false);
    }
  };

  // Laden oder Fehler
  if (loading && !drink) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="500px">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error && !drink) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadDrink}
            >
              Erneut laden
            </Button>
          }
        >
          {error}
        </Alert>
        <Box mt={2} display="flex" justifyContent="center">
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/drinks')}
          >
            Zurück zur Getränkeliste
          </Button>
        </Box>
      </Box>
    );
  }

  if (!drink) {
    return (
      <Box p={3}>
        <Alert severity="warning">Getränk nicht gefunden</Alert>
        <Box mt={2} display="flex" justifyContent="center">
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/drinks')}
          >
            Zurück zur Getränkeliste
          </Button>
        </Box>
      </Box>
    );
  }

  // Gewinnmarge berechnen
  const margin = drink.price - drink.cost;
  const marginPercent = ((margin / drink.price) * 100).toFixed(0);

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Titel und Aktionsbuttons */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/drinks')}
            sx={{ mr: 2 }}
          >
            Zurück
          </Button>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              {drink.name}
            </Typography>
            <Box display="flex" alignItems="center">
              <Chip 
                label={getCategoryLabel(drink.category)} 
                color={getCategoryColor(drink.category)}
                size="small"
                sx={{ mr: 1 }}
              />
              {drink.popular && (
                <Chip 
                  label="Beliebt" 
                  color="primary" 
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                />
              )}
              {!drink.isActive && (
                <Chip 
                  label="Inaktiv" 
                  color="default"
                  size="small"
                />
              )}
            </Box>
          </Box>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={loadDrink}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Aktualisieren
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => setOpenForm(true)}
            sx={{ mr: 1 }}
          >
            Bearbeiten
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteConfirm(true)}
          >
            Löschen
          </Button>
        </Box>
      </Box>

      {/* Getränkedetails */}
      <Grid container spacing={3}>
        {/* Hauptinfos */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
              <DrinkIcon sx={{ mr: 1 }} />
              Getränk-Details
            </Typography>
            
            <TableContainer sx={{ mt: 2 }}>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', width: '30%' }}>
                      Name
                    </TableCell>
                    <TableCell>{drink.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                      Kategorie
                    </TableCell>
                    <TableCell>{getCategoryLabel(drink.category)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                      Zutaten
                    </TableCell>
                    <TableCell>
                      {drink.ingredients?.length > 0
                        ? drink.ingredients.join(', ')
                        : 'Keine Zutaten angegeben'
                      }
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                      Status
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={drink.isActive ? 'Aktiv' : 'Inaktiv'} 
                        color={drink.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                      Beliebt
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={drink.popular ? 'Ja' : 'Nein'} 
                        color={drink.popular ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Finanzinfos */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
              <EuroIcon sx={{ mr: 1 }} />
              Preise und Margen
            </Typography>
            
            <Grid container spacing={3} my={1}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Verkaufspreis
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(drink.price)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Einkaufspreis
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                      {formatCurrency(drink.cost)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Gewinn pro Einheit
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(margin)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box mt={3}>
              <Typography variant="body1">
                Gewinnmarge: <strong>{marginPercent}%</strong>
              </Typography>
              <Box 
                sx={{ 
                  mt: 1,
                  height: 8, 
                  bgcolor: 'background.paper',
                  borderRadius: 4,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${marginPercent}%`,
                    bgcolor: 'success.main',
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Seitenleiste */}
        <Grid item xs={12} md={4}>
          {/* Bestandsinfo */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
              <InventoryIcon sx={{ mr: 1 }} />
              Lagerbestand
            </Typography>
            
            {drink.stock === 0 ? (
              <Box mt={2}>
                <Typography variant="body1" gutterBottom>
                  Dieses Getränk wird frisch zubereitet und nicht auf Lager gehalten.
                </Typography>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 
                      drink.stock <= 5 
                        ? 'error.light' 
                        : drink.stock <= 10 
                          ? 'warning.light' 
                          : 'success.light',
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h3" fontWeight="bold">
                    {drink.stock}
                  </Typography>
                  <Typography variant="subtitle1">
                    verfügbare Einheiten
                  </Typography>
                </Box>
                
                <Box mt={2}>
                  <Button 
                    fullWidth 
                    variant="outlined"
                    startIcon={<AssignmentIcon />}
                  >
                    Bestellung aufgeben
                  </Button>
                </Box>
              </>
            )}
          </Paper>

          {/* Aktionen */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
              <ListIcon sx={{ mr: 1 }} />
              Aktionen
            </Typography>
            
            <Box mt={2} display="flex" flexDirection="column" gap={2}>
              <Button 
                variant="outlined" 
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => setOpenForm(true)}
                fullWidth
              >
                Getränk bearbeiten
              </Button>
              
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteConfirm(true)}
                fullWidth
              >
                Getränk löschen
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Getränk bearbeiten Dialog */}
      <Dialog 
        open={openForm} 
        onClose={() => setOpenForm(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Getränk bearbeiten
        </DialogTitle>
        <DialogContent dividers>
          <DrinkForm 
            initialValues={drink}
            onSubmit={handleSaveForm}
            onCancel={() => setOpenForm(false)}
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
            Sind Sie sicher, dass Sie das Getränk "{drink.name}" löschen möchten?
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

export default DrinkDetail;