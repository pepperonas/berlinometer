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
  DialogActions
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

import { inventoryApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

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
  
  // Inventar laden
  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await inventoryApi.getAll();
      setInventory(data);
    } catch (err) {
      console.error('Error loading inventory:', err);
      setError('Fehler beim Laden des Inventars');
    } finally {
      setLoading(false);
    }
  };

  // Beim ersten Laden das Inventar laden
  useEffect(() => {
    loadInventory();
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
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
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
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell>{formatDate(item.lastOrderDate)}</TableCell>
                      <TableCell align="right">
                        <Box>
                          <Tooltip title="Bearbeiten">
                            <IconButton size="small" color="primary">
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
    </Box>
  );
};

// alpha-Funktion, die in Material-UI vorhanden ist, hier definiert
function alpha(color, value) {
  return color + value.toString(16).padStart(2, '0');
}

export default Inventory;