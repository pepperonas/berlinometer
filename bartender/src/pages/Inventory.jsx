import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  LinearProgress,
  CircularProgress,
  Alert,
  Tooltip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon, 
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';

import { inventoryApi, suppliersApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import { INVENTORY_CATEGORIES, INVENTORY_UNITS } from '../utils/constants';
import { alpha } from '@mui/material/styles';

const Inventory = () => {
  const theme = useTheme();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  
  // Dialog-Status für Bearbeitung
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [savingInventory, setSavingInventory] = useState(false);
  
  // Inventar laden
  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await inventoryApi.getAll();
      console.log('Loaded inventory items:', data);
      
      if (data && data.length > 0) {
        // Process each item to ensure lastOrderDate is formatted correctly
        const processedData = data.map(item => {
          // Ensure each item has a lastOrderDate
          if (!item.lastOrderDate) {
            console.log(`Item ${item.name} has no lastOrderDate, setting to today`);
            item.lastOrderDate = new Date().toISOString();
          }
          
          // Log details about supplier references
          console.log(`Item (${item.name}): supplier=${item.supplier}, lastOrderDate=${item.lastOrderDate}`);
          
          return item;
        });
        
        console.log('Available suppliers for lookup:', suppliers);
        setInventory(processedData);
      } else {
        console.log('No inventory items loaded or empty data.');
        setInventory([]);
      }
    } catch (err) {
      console.error('Error loading inventory:', err);
      setError('Fehler beim Laden des Inventars');
    } finally {
      setLoading(false);
    }
  };

  // Lieferanten laden
  const loadSuppliers = async () => {
    try {
      const data = await suppliersApi.getAll();
      console.log('Loaded suppliers:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setSuppliers(data);
        return data;
      } else {
        console.warn('No suppliers found or invalid data format');
        // Just set an empty array instead of using test suppliers with invalid IDs
        setSuppliers([]);
        return [];
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
      // If error occurs, just return an empty array
      setSuppliers([]);
      return [];
    }
  };
  
  // Beim ersten Laden das Inventar und Lieferanten laden
  useEffect(() => {
    // Sequenzielle Ausführung: Erst Lieferanten, dann Inventar laden
    const initializeData = async () => {
      // Load suppliers first
      await loadSuppliers();
      // Then load inventory with suppliers available for reference
      await loadInventory();
    };
    
    initializeData();
  }, []);

  // Sortierung ändern
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Seitenänderung
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Zeilenanzahl ändern
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Kategorie als lesbarer Text
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'beer': return 'Bier';
      case 'wine': return 'Wein';
      case 'spirits': return 'Spirituosen';
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
      case 'softDrinks': return 'info';
      default: return 'default';
    }
  };
  
  // Bestandsstatus bestimmen
  const getStockStatus = (item) => {
    if (item.quantity <= item.minQuantity / 2) {
      return 'critical';
    } else if (item.quantity <= item.minQuantity) {
      return 'low';
    }
    return 'ok';
  };
  
  // Inventar filtern und sortieren
  const filteredInventory = inventory
    .filter(item => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        getCategoryLabel(item.category).toLowerCase().includes(searchLower) ||
        item.supplier.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let result;
      
      // Spezielle Sortierlogik für jedes Feld
      switch (orderBy) {
        case 'name':
          result = a.name.localeCompare(b.name);
          break;
        case 'category':
          result = getCategoryLabel(a.category).localeCompare(getCategoryLabel(b.category));
          break;
        case 'quantity':
          result = a.quantity - b.quantity;
          break;
        case 'minQuantity':
          result = a.minQuantity - b.minQuantity;
          break;
        case 'supplier':
          result = a.supplier.localeCompare(b.supplier);
          break;
        case 'lastOrderDate':
          result = new Date(a.lastOrderDate) - new Date(b.lastOrderDate);
          break;
        default:
          result = 0;
      }
      
      return order === 'asc' ? result : -result;
    });
  
  // Paginierte Inventardaten
  const paginatedInventory = filteredInventory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Datum formatieren
  const formatDate = (dateString) => {
    if (!dateString) return 'Keine Angabe';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date provided to formatDate:', dateString);
        return 'Ungültiges Datum';
      }
      
      const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
      return date.toLocaleDateString('de-DE', options);
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Fehler beim Formatieren';
    }
  };
  
  // Dialog für Bearbeitung öffnen
  const handleEditClick = (item) => {
    // Create a safe copy of the item with proper data conversion
    const editItem = {
      id: item._id, // Make sure to use _id from MongoDB as our id field
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minQuantity: item.minQuantity,
      costPerUnit: item.costPerUnit || 0,
      lastOrderDate: item.lastOrderDate ? 
        // Parse the date carefully to avoid invalid date errors
        (typeof item.lastOrderDate === 'string' ? 
          // If it's in ISO format with a 'T', split at 'T'
          (item.lastOrderDate.includes('T') ? 
            item.lastOrderDate.split('T')[0] : 
            // Otherwise use it as is if it's a valid date string
            (isNaN(Date.parse(item.lastOrderDate)) ? 
              new Date().toISOString().split('T')[0] : 
              item.lastOrderDate)) : 
          // Default to today if all else fails
          new Date().toISOString().split('T')[0]) : 
        new Date().toISOString().split('T')[0],
      supplier: item.supplier || (suppliers.length > 0 ? suppliers[0]._id || suppliers[0].id : ''),
    };
    
    console.log('Editing item:', editItem);
    setCurrentItem(editItem);
    setEditDialogOpen(true);
  };
  
  // Dialog schließen
  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setCurrentItem(null);
  };
  
  // Inventar-Element speichern (aktualisieren oder erstellen)
  const handleSaveInventory = async (updatedItem) => {
    setSavingInventory(true);
    setError(null);
    
    try {
      // Werte in korrekten Typen umwandeln
      const processedItem = {
        ...updatedItem,
        quantity: parseInt(updatedItem.quantity || 0, 10),
        minQuantity: parseInt(updatedItem.minQuantity || 0, 10),
        costPerUnit: parseFloat(updatedItem.costPerUnit || 0),
        // Ensure supplier is properly handled (convert empty string to null)
        supplier: updatedItem.supplier && updatedItem.supplier.trim() !== '' ? updatedItem.supplier : null,
        // Make sure lastOrderDate is included
        lastOrderDate: updatedItem.lastOrderDate || new Date().toISOString().split('T')[0],
      };
      
      // Eingabevalidierung
      if (!processedItem.name || processedItem.name.trim() === '') {
        setError('Bitte geben Sie einen Namen an');
        setSavingInventory(false);
        return;
      }
      
      if (!processedItem.unit || processedItem.unit.trim() === '') {
        setError('Bitte wählen Sie eine Einheit aus');
        setSavingInventory(false);
        return;
      }
      
      console.log('Saving inventory item:', processedItem);
      
      // Remove id from the processed item to avoid MongoDB errors
      const { id, ...itemToSave } = processedItem;
      
      // Ensure supplier is a valid MongoDB ObjectId or null
      if (itemToSave.supplier) {
        // Check if supplier is a valid MongoDB ObjectId (24 hex characters)
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(itemToSave.supplier);
        if (!isValidObjectId) {
          console.warn('Invalid supplier ID format, setting to null:', itemToSave.supplier);
          itemToSave.supplier = null;
        }
      }
      
      // Additional debug info to check what we're actually sending
      console.log('Item to save:', JSON.stringify(itemToSave, null, 2));
      console.log('Contains supplier field:', itemToSave.hasOwnProperty('supplier'));
      console.log('Supplier value:', itemToSave.supplier);
      console.log('Contains lastOrderDate field:', itemToSave.hasOwnProperty('lastOrderDate'));
      console.log('lastOrderDate value:', itemToSave.lastOrderDate);
      
      // Convert lastOrderDate to ISO string if it's a valid date
      if (itemToSave.lastOrderDate) {
        const parsedDate = new Date(itemToSave.lastOrderDate);
        if (!isNaN(parsedDate.getTime())) {
          itemToSave.lastOrderDate = parsedDate.toISOString();
          console.log('Converted lastOrderDate to ISO format:', itemToSave.lastOrderDate);
        } else {
          console.warn('Invalid lastOrderDate provided, using current date');
          itemToSave.lastOrderDate = new Date().toISOString();
        }
      } else {
        console.warn('No lastOrderDate provided, using current date');
        itemToSave.lastOrderDate = new Date().toISOString();
      }
      
      if (id) {
        console.log(`Updating inventory item with ID: ${id}`);
        // Bestehenden Eintrag aktualisieren
        const response = await inventoryApi.update(id, itemToSave);
        console.log('Update response:', response);
      } else {
        console.log('Creating new inventory item');
        // Neuen Eintrag erstellen
        const response = await inventoryApi.create(itemToSave);
        console.log('Create response:', response);
      }
      loadInventory(); // Neu laden nach dem Speichern
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving inventory item:', err);
      
      // Zeige spezifischen Fehler vom Backend an, falls verfügbar
      if (err.response && err.response.data && err.response.data.error) {
        setError('Fehler: ' + err.response.data.error);
      } else {
        setError('Fehler beim Speichern des Inventars: ' + (err.message || 'Unbekannter Fehler'));
      }
    } finally {
      setSavingInventory(false);
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Seitenkopf */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Inventar
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Verwalten Sie Ihren Lagerbestand und bestellen Sie Nachschub
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={loadInventory}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Aktualisieren
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              setCurrentItem({
                name: '',
                category: INVENTORY_CATEGORIES[0].id, // Use first category from constants
                quantity: 0,
                unit: INVENTORY_UNITS[0].id, // Use first unit from constants
                minQuantity: 0,
                costPerUnit: 0,
                lastOrderDate: new Date().toISOString().split('T')[0],
                supplier: suppliers.length > 0 && suppliers[0]._id ? suppliers[0]._id : null,
              });
              setEditDialogOpen(true);
            }}
          >
            Inventar hinzufügen
          </Button>
        </Box>
      </Box>
      
      {/* Suchleiste und Warnungen */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="subtitle2" component="div">
                Bestellungen erforderlich
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {inventory.filter(item => item.quantity <= item.minQuantity).length} Artikel unter Mindestbestand
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Fehlermeldung */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 4 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadInventory}
            >
              Erneut laden
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Inventartabelle */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 640 }}>
          <Table stickyHeader aria-label="inventory table">
            <TableHead>
              <TableRow>
                <TableCell
                  sortDirection={orderBy === 'name' ? order : false}
                  sx={{ minWidth: 180 }}
                >
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={orderBy === 'category' ? order : false}
                  sx={{ minWidth: 120 }}
                >
                  <TableSortLabel
                    active={orderBy === 'category'}
                    direction={orderBy === 'category' ? order : 'asc'}
                    onClick={() => handleRequestSort('category')}
                  >
                    Kategorie
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sortDirection={orderBy === 'quantity' ? order : false}
                  sx={{ minWidth: 120 }}
                >
                  <TableSortLabel
                    active={orderBy === 'quantity'}
                    direction={orderBy === 'quantity' ? order : 'asc'}
                    onClick={() => handleRequestSort('quantity')}
                  >
                    Bestand
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sortDirection={orderBy === 'minQuantity' ? order : false}
                  sx={{ minWidth: 120 }}
                >
                  <TableSortLabel
                    active={orderBy === 'minQuantity'}
                    direction={orderBy === 'minQuantity' ? order : 'asc'}
                    onClick={() => handleRequestSort('minQuantity')}
                  >
                    Mindestbestand
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={orderBy === 'supplier' ? order : false}
                  sx={{ minWidth: 180 }}
                >
                  <TableSortLabel
                    active={orderBy === 'supplier'}
                    direction={orderBy === 'supplier' ? order : 'asc'}
                    onClick={() => handleRequestSort('supplier')}
                  >
                    Lieferant
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={orderBy === 'lastOrderDate' ? order : false}
                  sx={{ minWidth: 150 }}
                >
                  <TableSortLabel
                    active={orderBy === 'lastOrderDate'}
                    direction={orderBy === 'lastOrderDate' ? order : 'asc'}
                    onClick={() => handleRequestSort('lastOrderDate')}
                  >
                    Letzte Bestellung
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ minWidth: 120 }}>
                  Aktionen
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && !inventory.length ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 3 }}>
                    <Box display="flex" justifyContent="center">
                      <CircularProgress size={40} thickness={4} />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : paginatedInventory.length > 0 ? (
                paginatedInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  
                  return (
                    <TableRow 
                      key={item.id} 
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        bgcolor: 
                          stockStatus === 'critical' 
                            ? alpha(theme.palette.error.light, 0.1)
                            : stockStatus === 'low'
                              ? alpha(theme.palette.warning.light, 0.1)
                              : 'inherit',
                      }}
                    >
                      <TableCell component="th" scope="row">
                        <Typography fontWeight={stockStatus !== 'ok' ? 'bold' : 'normal'}>
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getCategoryLabel(item.category)} 
                          color={getCategoryColor(item.category)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          <Typography 
                            fontWeight="bold" 
                            color={
                              stockStatus === 'critical' 
                                ? 'error.main' 
                                : stockStatus === 'low' 
                                  ? 'warning.main' 
                                  : 'inherit'
                            }
                          >
                            {item.quantity} {item.unit}
                          </Typography>
                          <Box 
                            sx={{ 
                              mt: 0.5,
                              width: '100%',
                              position: 'relative',
                            }}
                          >
                            <LinearProgress 
                              variant="determinate" 
                              value={(item.quantity / (item.minQuantity * 3)) * 100}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 2,
                                  bgcolor: 
                                    stockStatus === 'critical' 
                                      ? 'error.main' 
                                      : stockStatus === 'low' 
                                        ? 'warning.main' 
                                        : 'success.main',
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {item.minQuantity} {item.unit}
                      </TableCell>
                      <TableCell>
                        {item.supplier ? 
                          // Try to find supplier by _id first, then id
                          (() => {
                            // Check if the supplier exists in the list
                            const supplierObj = suppliers.find(s => 
                              s._id === item.supplier || 
                              s.id === item.supplier || 
                              s._id?.toString() === item.supplier.toString()
                            );
                            
                            // If found, return the name
                            if (supplierObj) {
                              return supplierObj.name;
                            } else {
                              // Otherwise show supplier ID and refresh button
                              return (
                                <Box display="flex" alignItems="center">
                                  <Typography component="span" mr={1}>
                                    Lieferant #{item.supplier.toString().substring(0, 6)}...
                                  </Typography>
                                  <Tooltip title="Lieferanten neu laden">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => loadSuppliers()}
                                    >
                                      <RefreshIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              );
                            }
                          })() : 
                          'Nicht zugewiesen'}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.lastOrderDate)}
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Tooltip title="Bearbeiten">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditClick(item)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Bestellen">
                            <IconButton 
                              size="small" 
                              color={stockStatus !== 'ok' ? 'warning' : 'primary'}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    {searchTerm ? (
                      <Typography color="text.secondary">
                        Keine Ergebnisse für "{searchTerm}"
                      </Typography>
                    ) : (
                      <Typography color="text.secondary">
                        Keine Inventareinträge vorhanden
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredInventory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Zeilen pro Seite:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} von ${count}`}
        />
      </Paper>
      
      {/* Bearbeitungsdialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            maxHeight: '90vh', // 90% of viewport height
            padding: '8px'
          },
        }}
      >
        <DialogTitle>
          {currentItem?.id ? 'Inventar bearbeiten' : 'Neues Inventar hinzufügen'}
        </DialogTitle>
        <DialogContent dividers>
          {currentItem && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  fullWidth
                  value={currentItem.name}
                  onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Kategorie"
                  fullWidth
                  value={currentItem.category}
                  onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})}
                  margin="normal"
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: '300px',
                        },
                      },
                    },
                  }}
                >
                  {INVENTORY_CATEGORIES.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Menge"
                  fullWidth
                  type="number"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({...currentItem, quantity: Number(e.target.value)})}
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{currentItem.unit}</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Einheit"
                  fullWidth
                  value={currentItem.unit}
                  onChange={(e) => setCurrentItem({...currentItem, unit: e.target.value})}
                  margin="normal"
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: '300px',
                        },
                      },
                    },
                  }}
                >
                  {INVENTORY_UNITS.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mindestbestand"
                  fullWidth
                  type="number"
                  value={currentItem.minQuantity}
                  onChange={(e) => setCurrentItem({...currentItem, minQuantity: Number(e.target.value)})}
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{currentItem.unit}</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kosten pro Einheit"
                  fullWidth
                  type="number"
                  value={currentItem.costPerUnit || 0}
                  onChange={(e) => setCurrentItem({...currentItem, costPerUnit: Number(e.target.value)})}
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="flex-start">
                  <TextField
                    select
                    label="Lieferant"
                    fullWidth
                    value={currentItem.supplier || ''}
                    onChange={(e) => {
                      console.log('Supplier dropdown changed to:', e.target.value);
                      console.log('Available suppliers:', suppliers);
                      
                      // Log the selected supplier for debugging
                      const selectedSupplier = suppliers.find(s => (s._id || s.id) === e.target.value);
                      console.log('Selected supplier:', selectedSupplier);
                      setCurrentItem({...currentItem, supplier: e.target.value});
                    }}
                    margin="normal"
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          style: {
                            maxHeight: '300px',
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Kein Lieferant</em>
                    </MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier._id || supplier.id} value={supplier._id || supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ ml: 1, mt: 2, height: 40, whiteSpace: 'nowrap' }}
                    onClick={() => window.open('/suppliers', '_blank')}
                  >
                    Verwalten
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Letzte Bestellung"
                  fullWidth
                  type="date"
                  value={
                    // If lastOrderDate exists and is a valid date string
                    currentItem.lastOrderDate ? 
                      // If it contains 'T' (ISO format), split at 'T'
                      (typeof currentItem.lastOrderDate === 'string' ? 
                        // Handle various date formats
                        (currentItem.lastOrderDate.includes('T') ? 
                          currentItem.lastOrderDate.split('T')[0] : 
                          currentItem.lastOrderDate) : 
                        // Last resort, use current date
                        new Date().toISOString().split('T')[0]) : 
                      // If no date exists, use current date
                      new Date().toISOString().split('T')[0]
                  }
                  onChange={(e) => setCurrentItem({...currentItem, lastOrderDate: e.target.value})}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button 
            onClick={() => handleSaveInventory(currentItem)} 
            variant="contained" 
            color="primary"
            disabled={savingInventory}
          >
            {savingInventory ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;