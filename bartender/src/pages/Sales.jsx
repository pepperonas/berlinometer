import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Autocomplete,
  Menu
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  UploadFile as UploadIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  ShoppingBag as SaleIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { PAYMENT_METHODS } from '../utils/constants';
import { salesApi, drinksApi, staffApi } from '../services/api';
import { posFormats } from '../services/mockData';

// Tab-Panel für die verschiedenen Ansichten
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sales-tabpanel-${index}`}
      aria-labelledby={`sales-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Sales = () => {
  // State für die Tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State für die Verkaufsdaten
  const [sales, setSales] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State für die Tabelle
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State für die Filterung
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)), // 7 Tage zurück
    endDate: new Date(),
  });
  
  // State für den Verkaufs-Dialog
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // State für den Import-Dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFormat, setImportFormat] = useState('csv');
  const [importData, setImportData] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  
  // State für Export-Menu
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportLoading, setExportLoading] = useState(false);
  
  // Laden der Daten
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Lade alle relevanten Daten parallel
        const [salesData, drinksData, staffData] = await Promise.all([
          salesApi.getAll(),
          drinksApi.getAll(),
          staffApi.getAll()
        ]);
        
        console.log('Sales data loaded:', salesData);
        console.log('Drinks data loaded:', drinksData);
        console.log('Staff data loaded:', staffData);
        
        // Sicherstellen, dass die salesData ein Array ist
        const processedSalesData = Array.isArray(salesData) ? salesData : [];
        
        setSales(processedSalesData);
        setDrinks(drinksData);
        setStaff(staffData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Fehler beim Laden der Daten: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Tab-Wechsel
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
  
  // Dialog für neuen Verkauf öffnen
  const handleAddSale = () => {
    setCurrentSale({
      date: new Date().toISOString(),
      items: [],
      paymentMethod: 'cash',
      staffId: staff.length > 0 ? staff[0].id : '',
      notes: ''
    });
    setSelectedItems([
      { 
        drinkId: '', 
        name: '', 
        quantity: 1, 
        pricePerUnit: 0 
      }
    ]);
    setSaleDialogOpen(true);
  };
  
  // Dialog für Bearbeitung öffnen
  const handleEditSale = (sale) => {
    setCurrentSale(sale);
    setSelectedItems([...sale.items]);
    setSaleDialogOpen(true);
  };
  
  // Dialog schließen
  const handleCloseDialog = () => {
    setSaleDialogOpen(false);
    setCurrentSale(null);
    setSelectedItems([]);
  };
  
  // Verkaufsposition hinzufügen
  const handleAddItem = () => {
    setSelectedItems([
      ...selectedItems, 
      { 
        drinkId: '', 
        name: '', 
        quantity: 1, 
        pricePerUnit: 0 
      }
    ]);
  };
  
  // Verkaufsposition entfernen
  const handleRemoveItem = (index) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };
  
  // Verkaufsposition ändern
  const handleItemChange = (index, field, value) => {
    const newItems = [...selectedItems];
    
    if (field === 'drinkId') {
      // Prüfe ob die ID gültig ist
      if (!value || value === '') {
        newItems[index] = {
          ...newItems[index],
          drinkId: '',
          name: '',
          pricePerUnit: 0
        };
      } else {
        // Finde das ausgewählte Getränk und aktualisiere die Werte
        const selectedDrink = drinks.find(d => d._id === value || d.id === value);
        
        if (selectedDrink) {
          // Verwende bevorzugt die MongoDB _id, wenn verfügbar
          const drinkId = selectedDrink._id || selectedDrink.id;
          
          newItems[index] = {
            ...newItems[index],
            drinkId: drinkId,
            name: selectedDrink.name,
            pricePerUnit: selectedDrink.price,
            quantity: newItems[index].quantity || 1
          };
          
          console.log('Ausgewähltes Getränk:', selectedDrink.name, 'ID:', drinkId);
        } else {
          console.warn('Getränk nicht gefunden für ID:', value);
        }
      }
    } else if (field === 'quantity' || field === 'pricePerUnit') {
      // Stelle sicher, dass numerische Werte korrekt konvertiert werden
      const numValue = parseFloat(value);
      newItems[index] = {
        ...newItems[index],
        [field]: isNaN(numValue) ? 0 : numValue
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
    }
    
    console.log('Aktualisierte Verkaufspositionen:', newItems);
    setSelectedItems(newItems);
  };
  
  // Gesamtsumme berechnen
  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.pricePerUnit));
    }, 0).toFixed(2);
  };
  
  // Verkauf speichern
  const handleSaveSale = async () => {
    if (selectedItems.length === 0 || selectedItems.some(item => !item.drinkId || item.drinkId === '')) {
      setError('Bitte wählen Sie mindestens ein Getränk aus');
      return;
    }
    
    setLoading(true);
    
    try {
      // Daten vorbereiten und sicherstellen, dass alle Felder korrekt formatiert sind
      const saleData = {
        ...currentSale,
        items: selectedItems.map(item => ({
          ...item,
          drinkId: item.drinkId,
          quantity: parseFloat(item.quantity) || 1,
          pricePerUnit: parseFloat(item.pricePerUnit) || 0
        })),
        total: parseFloat(calculateTotal())
      };
      
      console.log('Sende Verkaufsdaten:', saleData);
      
      if (currentSale.id) {
        await salesApi.update(currentSale.id, saleData);
      } else {
        await salesApi.create(saleData);
      }
      
      // Daten neu laden
      const salesData = await salesApi.getAll();
      setSales(salesData);
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving sale:', err);
      setError('Fehler beim Speichern des Verkaufs: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Verkauf löschen
  const handleDeleteSale = async (id) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Verkauf löschen möchten?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await salesApi.delete(id);
      
      // Daten neu laden
      const salesData = await salesApi.getAll();
      setSales(salesData);
    } catch (err) {
      console.error('Error deleting sale:', err);
      setError('Fehler beim Löschen des Verkaufs');
    } finally {
      setLoading(false);
    }
  };
  
  // Import-Dialog öffnen
  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
    setImportData('');
    setImportFormat('csv');
  };
  
  // Import-Dialog schließen
  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
  };
  
  // Daten importieren
  const handleImportData = async () => {
    if (!importData.trim()) {
      setError('Bitte geben Sie Daten ein');
      return;
    }
    
    setImportLoading(true);
    
    try {
      // Importieren mit Fehlerbehandlung
      console.log(`Importing ${importData.length} bytes in ${importFormat} format`);
      const importedSales = await salesApi.importFromPOS(importData, importFormat);
      
      // Log more detailed information about the response
      console.log(`Import response received, ${importedSales.length} sales imported`);
      if (importedSales.length > 0) {
        console.log(`First imported sale: ${JSON.stringify(importedSales[0], null, 2)}`);
      } else {
        console.warn("No sales were returned from the import call - this may be an error");
      }
      
      // Erfolgsmeldung anzeigen
      let message = `${importedSales.length} Verkäufe erfolgreich importiert!`;
      
      // Neuladen aller Verkäufe
      const salesData = await salesApi.getAll();
      console.log(`Reloaded ${salesData.length} sales after import (${importedSales.length} were just imported)`);
      setSales(salesData);
      
      // Dialog schließen
      handleCloseImportDialog();
      
      // Temporary success message
      setError(null);
      alert(message);
    } catch (err) {
      console.error('Error importing data:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unbekannter Fehler';
      setError(`Fehler beim Importieren der Daten: ${errorMsg}`);
    } finally {
      setImportLoading(false);
    }
  };
  
  // Export-Menu öffnen
  const handleOpenExportMenu = (event) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  // Export-Menu schließen
  const handleCloseExportMenu = () => {
    setExportMenuAnchorEl(null);
  };
  
  // Daten exportieren
  const handleExportData = (format) => {
    setExportFormat(format);
    setExportLoading(true);
    
    try {
      // Exportiere die gefilterten Verkäufe
      let exportContent = '';
      
      switch (format) {
        case 'csv':
          // CSV-Header
          exportContent = 'Datum,Getränk,Menge,Preis,Zahlungsart,Mitarbeiter,Notizen\n';
          
          // CSV-Zeilen
          filteredSales.forEach(sale => {
            const saleDate = formatDate(sale.date);
            const paymentMethod = getPaymentMethodLabel(sale.paymentMethod);
            const staffName = staff.find(s => s.id === sale.staffId)?.name || sale.staffId;
            
            // Für jedes Item eine Zeile
            sale.items.forEach(item => {
              exportContent += `${saleDate},${item.name},${item.quantity},${item.pricePerUnit},${paymentMethod},${staffName},${sale.notes}\n`;
            });
          });
          break;
          
        case 'json':
          // JSON-Format
          exportContent = JSON.stringify(filteredSales, null, 2);
          break;
      }
      
      // Datei herunterladen
      const blob = new Blob([exportContent], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verkaufe-${format === 'csv' ? 'csv' : 'json'}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      handleCloseExportMenu();
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Fehler beim Exportieren der Daten');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Formatieren des Datums
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };
  
  // Filtern der Verkäufe nach Datumsbereich
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
  });
  
  // Formatieren der Zahlungsmethode
  const getPaymentMethodLabel = (method) => {
    const paymentMethod = PAYMENT_METHODS.find(m => m.id === method);
    return paymentMethod ? paymentMethod.name : method;
  };
  
  // Paginierte Verkäufe
  const paginatedSales = filteredSales
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Seitenkopf */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Verkäufe
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Erfassen und verwalten Sie Ihre Verkäufe
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={handleOpenExportMenu}
            sx={{ mr: 1 }}
            disabled={filteredSales.length === 0}
          >
            Exportieren
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />}
            onClick={handleOpenImportDialog}
            sx={{ mr: 1 }}
          >
            Importieren
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddSale}
          >
            Verkauf erfassen
          </Button>
          
          {/* Export-Menu */}
          <Menu
            anchorEl={exportMenuAnchorEl}
            open={Boolean(exportMenuAnchorEl)}
            onClose={handleCloseExportMenu}
          >
            <MenuItem onClick={() => handleExportData('csv')} disabled={exportLoading}>
              CSV-Format
            </MenuItem>
            <MenuItem onClick={() => handleExportData('json')} disabled={exportLoading}>
              JSON-Format
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {/* Tabs für verschiedene Ansichten */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Verkaufsübersicht" />
          <Tab label="Statistiken" />
          <Tab label="Tagesumsätze" />
        </Tabs>
      </Paper>
      
      {/* Fehlermeldung */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 4 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {/* Tab-Inhalte */}
      {/* Verkaufsübersicht */}
      <TabPanel value={tabValue} index={0}>
        <Box mb={4}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <DateTimePicker
                      label="Von"
                      value={dateRange.startDate}
                      onChange={(newDate) => setDateRange({...dateRange, startDate: newDate})}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                    <DateTimePicker
                      label="Bis"
                      value={dateRange.endDate}
                      onChange={(newDate) => setDateRange({...dateRange, endDate: newDate})}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Box>
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  placeholder="Suchen..."
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>
        
        {/* Verkaufstabelle */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Datum</TableCell>
                  <TableCell>Artikel</TableCell>
                  <TableCell align="right">Betrag</TableCell>
                  <TableCell>Zahlungsart</TableCell>
                  <TableCell>Mitarbeiter</TableCell>
                  <TableCell>Notizen</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && !sales.length ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : paginatedSales.length > 0 ? (
                  paginatedSales.map((sale) => (
                    <TableRow key={sale._id || sale.id} hover>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell>
                        <Box>
                          {sale.items.map((item, index) => (
                            <Box key={index} display="flex" alignItems="center" mb={index < sale.items.length - 1 ? 1 : 0}>
                              <Typography variant="body2">
                                {item.quantity}x {item.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                ({parseFloat(item.pricePerUnit).toFixed(2)}€)
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          {parseFloat(sale.total).toFixed(2)}€
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getPaymentMethodLabel(sale.paymentMethod)} 
                          size="small"
                          color={sale.paymentMethod === 'cash' ? 'success' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        {staff.find(s => s.id === sale.staffId || s._id === sale.staffId)?.name || sale.staffId}
                      </TableCell>
                      <TableCell>{sale.notes}</TableCell>
                      <TableCell align="right">
                        <Box>
                          <Tooltip title="Bearbeiten">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => {
                                console.log('Editing sale:', sale);
                                handleEditSale(sale);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Löschen">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteSale(sale._id || sale.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        Keine Verkäufe im ausgewählten Zeitraum
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredSales.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Zeilen pro Seite:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} von ${count}`}
          />
        </Paper>
      </TabPanel>
      
      {/* Statistiken */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Verkaufsstatistiken
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Top-Verkäufe
              </Typography>
              {filteredSales.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {/* Berechne Top-Getränke aus den gefilterten Verkäufen */}
                  {(() => {
                    const drinkStats = {};
                    
                    // Sammle alle verkauften Getränke
                    filteredSales.forEach(sale => {
                      sale.items.forEach(item => {
                        if (!drinkStats[item.name]) {
                          drinkStats[item.name] = {
                            name: item.name,
                            quantity: 0,
                            revenue: 0
                          };
                        }
                        drinkStats[item.name].quantity += item.quantity;
                        drinkStats[item.name].revenue += item.quantity * item.pricePerUnit;
                      });
                    });
                    
                    // Sortiere nach Umsatz absteigend
                    const topDrinks = Object.values(drinkStats)
                      .sort((a, b) => b.revenue - a.revenue)
                      .slice(0, 5);
                    
                    return (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Getränk</TableCell>
                              <TableCell align="right">Menge</TableCell>
                              <TableCell align="right">Umsatz</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {topDrinks.map((drink, index) => (
                              <TableRow key={index}>
                                <TableCell>{drink.name}</TableCell>
                                <TableCell align="right">{drink.quantity}</TableCell>
                                <TableCell align="right">{drink.revenue.toFixed(2)}€</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    );
                  })()}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Keine Verkaufsdaten im ausgewählten Zeitraum.
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Verkäufe nach Zahlungsart
              </Typography>
              {filteredSales.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {/* Berechne Zahlungsmethoden-Statistik */}
                  {(() => {
                    const paymentStats = {};
                    
                    // Zahlungsmethoden initialisieren
                    PAYMENT_METHODS.forEach(method => {
                      paymentStats[method.id] = {
                        name: method.name,
                        count: 0,
                        total: 0
                      };
                    });
                    
                    // Sammle alle Zahlungsmethoden
                    filteredSales.forEach(sale => {
                      if (paymentStats[sale.paymentMethod]) {
                        paymentStats[sale.paymentMethod].count += 1;
                        paymentStats[sale.paymentMethod].total += sale.total;
                      }
                    });
                    
                    const paymentData = Object.values(paymentStats)
                      .sort((a, b) => b.total - a.total);
                    
                    return (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Zahlungsart</TableCell>
                              <TableCell align="right">Anzahl</TableCell>
                              <TableCell align="right">Umsatz</TableCell>
                              <TableCell align="right">Anteil</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paymentData.map((payment, index) => {
                              const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
                              const percentage = totalSales > 0 ? (payment.total / totalSales * 100).toFixed(1) : '0.0';
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Box display="flex" alignItems="center">
                                      <Chip 
                                        size="small" 
                                        label={payment.name}
                                        color={Object.keys(paymentStats)[index] === 'cash' ? 'success' : 'primary'}
                                        sx={{ mr: 1 }}
                                      />
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right">{payment.count}</TableCell>
                                  <TableCell align="right">{payment.total.toFixed(2)}€</TableCell>
                                  <TableCell align="right">{percentage}%</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    );
                  })()}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Keine Verkaufsdaten im ausgewählten Zeitraum.
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>
      
      {/* Tagesumsätze */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tagesumsätze
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          {filteredSales.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              {(() => {
                // Gruppiere Verkäufe nach Datum (nur Tag, nicht Uhrzeit)
                const dailySales = {};
                
                filteredSales.forEach(sale => {
                  const saleDate = new Date(sale.date);
                  const dateKey = format(saleDate, 'yyyy-MM-dd');
                  
                  if (!dailySales[dateKey]) {
                    dailySales[dateKey] = {
                      date: format(saleDate, 'dd.MM.yyyy'),
                      totalSales: 0,
                      totalRevenue: 0,
                      paymentMethods: {},
                      items: {}
                    };
                    
                    // Zahlungsmethoden initialisieren
                    PAYMENT_METHODS.forEach(method => {
                      dailySales[dateKey].paymentMethods[method.id] = 0;
                    });
                  }
                  
                  // Umsatz hinzufügen
                  dailySales[dateKey].totalSales++;
                  dailySales[dateKey].totalRevenue += sale.total;
                  
                  // Zahlungsmethode zählen
                  dailySales[dateKey].paymentMethods[sale.paymentMethod]++;
                  
                  // Getränke zählen
                  sale.items.forEach(item => {
                    if (!dailySales[dateKey].items[item.name]) {
                      dailySales[dateKey].items[item.name] = {
                        quantity: 0,
                        revenue: 0
                      };
                    }
                    dailySales[dateKey].items[item.name].quantity += item.quantity;
                    dailySales[dateKey].items[item.name].revenue += item.quantity * item.pricePerUnit;
                  });
                });
                
                // Sortieren nach Datum (absteigend)
                const sortedDays = Object.values(dailySales)
                  .sort((a, b) => {
                    const dateA = new Date(a.date.split('.').reverse().join('-'));
                    const dateB = new Date(b.date.split('.').reverse().join('-'));
                    return dateB - dateA;
                  });
                
                return (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Datum</TableCell>
                          <TableCell align="right">Anzahl Verkäufe</TableCell>
                          <TableCell align="right">Umsatz</TableCell>
                          <TableCell>Beliebteste Getränke</TableCell>
                          <TableCell>Zahlungsarten</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedDays.map((day, index) => {
                          // Top-3 Getränke für diesen Tag
                          const topDrinks = Object.entries(day.items)
                            .sort(([, a], [, b]) => b.revenue - a.revenue)
                            .slice(0, 3);
                            
                          // Zahlungsmethoden für diesen Tag
                          const payments = Object.entries(day.paymentMethods)
                            .filter(([, count]) => count > 0)
                            .sort(([, a], [, b]) => b - a);
                            
                          return (
                            <TableRow key={index} hover>
                              <TableCell>{day.date}</TableCell>
                              <TableCell align="right">{day.totalSales}</TableCell>
                              <TableCell align="right">
                                <Typography fontWeight="bold">
                                  {day.totalRevenue.toFixed(2)}€
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {topDrinks.map(([name, stats], i) => (
                                  <Box key={i} sx={{ mb: i < topDrinks.length - 1 ? 0.5 : 0 }}>
                                    <Typography variant="body2">
                                      {name} ({stats.quantity}x)
                                    </Typography>
                                  </Box>
                                ))}
                              </TableCell>
                              <TableCell>
                                {payments.map(([method, count], i) => {
                                  const paymentMethod = PAYMENT_METHODS.find(m => m.id === method);
                                  return (
                                    <Box key={i} sx={{ mb: i < payments.length - 1 ? 0.5 : 0 }}>
                                      <Chip 
                                        size="small" 
                                        label={`${paymentMethod?.name || method} (${count})`}
                                        color={method === 'cash' ? 'success' : 'primary'}
                                        sx={{ mr: 1 }}
                                      />
                                    </Box>
                                  );
                                })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                );
              })()}
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Keine Verkaufsdaten im ausgewählten Zeitraum.
            </Typography>
          )}
        </Paper>
      </TabPanel>
      
      {/* Dialog für Verkauf erfassen/bearbeiten */}
      <Dialog
        open={saleDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentSale?.id ? 'Verkauf bearbeiten' : 'Neuen Verkauf erfassen'}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          {currentSale && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Datum und Uhrzeit"
                    value={new Date(currentSale.date)}
                    onChange={(newDate) => setCurrentSale({...currentSale, date: newDate.toISOString()})}
                    slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Mitarbeiter</InputLabel>
                  <Select
                    value={currentSale.staffId}
                    onChange={(e) => setCurrentSale({...currentSale, staffId: e.target.value})}
                    label="Mitarbeiter"
                  >
                    {staff.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
                  Verkaufte Artikel
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {/* Artikel-Liste */}
                {selectedItems.map((item, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      mb: 2, 
                      p: 2, 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      position: 'relative'
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={5}>
                        <FormControl fullWidth>
                          <InputLabel>Getränk</InputLabel>
                          <Select
                            value={item.drinkId}
                            onChange={(e) => handleItemChange(index, 'drinkId', e.target.value)}
                            label="Getränk"
                            required
                          >
                            <MenuItem value="">
                              <em>Bitte wählen</em>
                            </MenuItem>
                            {drinks.map((drink) => {
                              // Verwende bevorzugt die MongoDB _id, wenn verfügbar
                              const drinkId = drink._id || drink.id;
                              return (
                                <MenuItem key={drinkId} value={drinkId}>
                                  {drink.name} ({parseFloat(drink.price).toFixed(2)}€)
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <TextField
                          label="Menge"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                          fullWidth
                          InputProps={{ inputProps: { min: 1 } }}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <TextField
                          label="Preis pro Einheit"
                          type="number"
                          value={item.pricePerUnit}
                          onChange={(e) => handleItemChange(index, 'pricePerUnit', parseFloat(e.target.value))}
                          fullWidth
                          InputProps={{
                            startAdornment: <InputAdornment position="start">€</InputAdornment>,
                            inputProps: { min: 0, step: 0.01 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <IconButton 
                          color="error" 
                          onClick={() => handleRemoveItem(index)}
                          disabled={selectedItems.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
                
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Artikel hinzufügen
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Zahlungsart</InputLabel>
                  <Select
                    value={currentSale.paymentMethod}
                    onChange={(e) => setCurrentSale({...currentSale, paymentMethod: e.target.value})}
                    label="Zahlungsart"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        {method.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Gesamtbetrag"
                  value={calculateTotal()}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notizen"
                  value={currentSale.notes}
                  onChange={(e) => setCurrentSale({...currentSale, notes: e.target.value})}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button 
            onClick={handleSaveSale} 
            variant="contained" 
            color="primary"
            disabled={loading || selectedItems.length === 0 || selectedItems.some(item => !item.drinkId || item.drinkId === '')}
          >
            {loading ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog für Datenimport */}
      <Dialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Daten aus Kassensystem importieren
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Importformat</InputLabel>
                <Select
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value)}
                  label="Importformat"
                >
                  {posFormats.map((format) => (
                    <MenuItem key={format.id} value={format.id}>
                      {format.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                {posFormats.find(f => f.id === importFormat)?.description}
              </Typography>
              <Box mb={2} p={2} sx={{ bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {posFormats.find(f => f.id === importFormat)?.example}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box
                component="div"
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  position: 'relative',
                  minHeight: '150px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.style.borderColor = 'primary.main';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.backgroundColor = '';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.backgroundColor = '';
                  
                  if (e.dataTransfer.files.length) {
                    const file = e.dataTransfer.files[0];
                    
                    // Prüfen, ob es sich um CSV oder JSON handelt
                    if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
                      setImportFormat('csv');
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setImportData(ev.target.result);
                      };
                      reader.readAsText(file);
                    } else if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
                      setImportFormat('json');
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setImportData(ev.target.result);
                      };
                      reader.readAsText(file);
                    } else {
                      // Nicht unterstütztes Format
                      setError(`Dateiformat nicht unterstützt: ${file.type || file.name.split('.').pop()}`);
                    }
                  } else if (e.dataTransfer.items && e.dataTransfer.items.length) {
                    // Versuchen, Text aus der Zwischenablage zu bekommen
                    for (const item of e.dataTransfer.items) {
                      if (item.kind === 'string') {
                        item.getAsString((text) => {
                          setImportData(text);
                        });
                        break;
                      }
                    }
                  }
                }}
              >
                <input
                  type="file"
                  accept=".csv,.json"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files.length) {
                      const file = e.target.files[0];
                      if (file.name.toLowerCase().endsWith('.csv')) {
                        setImportFormat('csv');
                      } else if (file.name.toLowerCase().endsWith('.json')) {
                        setImportFormat('json');
                      }
                      
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setImportData(ev.target.result);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
                
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <UploadIcon color="action" sx={{ fontSize: 48, mb: 1, color: 'text.secondary' }} />
                  <Typography variant="body1" gutterBottom>
                    Dateien hier ablegen oder
                  </Typography>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    htmlFor="file-upload"
                    size="small"
                  >
                    Datei auswählen
                  </Button>
                  <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                    Akzeptierte Formate: CSV, JSON
                  </Typography>
                </Box>
                
                <Divider sx={{ width: '100%', my: 2 }} />
                
                <TextField
                  label="Daten eingeben oder einfügen"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  fullWidth
                  multiline
                  rows={6}
                  placeholder={`Fügen Sie hier Ihre ${
                    importFormat === 'csv' ? 'CSV' : importFormat === 'json' ? 'JSON' : 'Excel'
                  } Daten ein...`}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>Abbrechen</Button>
          <Button 
            onClick={handleImportData} 
            variant="contained" 
            color="primary"
            disabled={importLoading || !importData.trim() || (importFormat === 'excel')}
          >
            {importLoading ? 'Wird importiert...' : 'Importieren'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sales;