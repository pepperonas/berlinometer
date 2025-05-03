import React, { useState } from 'react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography,
  IconButton,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  TablePagination,
  Collapse,
  TableSortLabel
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/helpers';

const TransactionList = ({ 
  title, 
  transactions, 
  onEdit, 
  onDelete, 
  type = 'expense' // 'expense' oder 'income'
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');
  
  // Sortierung ändern
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Zeile ein-/ausklappen
  const toggleExpandRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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
    // Für Ausgaben
    if (type === 'expense') {
      switch (category) {
        case 'rent': return 'Miete';
        case 'utilities': return 'Nebenkosten';
        case 'inventory': return 'Inventar';
        case 'salaries': return 'Gehälter';
        case 'marketing': return 'Marketing';
        case 'maintenance': return 'Instandhaltung';
        case 'licenses': return 'Lizenzen';
        case 'other': return 'Sonstiges';
        default: return category;
      }
    }
    
    // Für Einnahmen
    switch (category) {
      case 'bar': return 'Bar';
      case 'food': return 'Essen';
      case 'events': return 'Events';
      default: return category;
    }
  };
  
  // Kategorie-Farbe
  const getCategoryColor = (category) => {
    // Für Ausgaben
    if (type === 'expense') {
      switch (category) {
        case 'rent': return 'error';
        case 'utilities': return 'warning';
        case 'inventory': return 'info';
        case 'salaries': return 'secondary';
        case 'marketing': return 'success';
        case 'maintenance': return 'primary';
        case 'licenses': return 'default';
        case 'other': return 'default';
        default: return 'default';
      }
    }
    
    // Für Einnahmen
    switch (category) {
      case 'bar': return 'primary';
      case 'food': return 'success';
      case 'events': return 'info';
      default: return 'default';
    }
  };
  
  // Datum formatieren
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };
  
  // Transaktionen filtern und sortieren
  const filteredTransactions = transactions
    .filter(transaction => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(searchLower) ||
        getCategoryLabel(transaction.category).toLowerCase().includes(searchLower) ||
        transaction.amount.toString().includes(searchLower) ||
        formatDate(transaction.date).includes(searchLower)
      );
    })
    .sort((a, b) => {
      let result;
      
      switch (orderBy) {
        case 'date':
          result = new Date(a.date) - new Date(b.date);
          break;
        case 'amount':
          result = a.amount - b.amount;
          break;
        case 'category':
          result = getCategoryLabel(a.category).localeCompare(getCategoryLabel(b.category));
          break;
        case 'description':
          result = a.description.localeCompare(b.description);
          break;
        default:
          result = 0;
      }
      
      return order === 'asc' ? result : -result;
    });
  
  // Paginierte Transaktionen
  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        
        <TextField
          placeholder="Suchen..."
          size="small"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          sx={{ width: '250px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="transactions table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell sortDirection={orderBy === 'date' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'asc'}
                  onClick={() => handleRequestSort('date')}
                >
                  Datum
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'category' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'category'}
                  direction={orderBy === 'category' ? order : 'asc'}
                  onClick={() => handleRequestSort('category')}
                >
                  Kategorie
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'description' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'description'}
                  direction={orderBy === 'description' ? order : 'asc'}
                  onClick={() => handleRequestSort('description')}
                >
                  Beschreibung
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={orderBy === 'amount' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'amount'}
                  direction={orderBy === 'amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('amount')}
                >
                  Betrag
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <TableRow
                    hover
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleExpandRow(transaction.id)}
                  >
                    <TableCell padding="checkbox">
                      <IconButton size="small">
                        {expandedRows[transaction.id] ? (
                          <KeyboardArrowUpIcon fontSize="small" />
                        ) : (
                          <KeyboardArrowDownIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getCategoryLabel(transaction.category)} 
                        color={getCategoryColor(transaction.category)}
                        size="small"
                      />
                      {type === 'expense' && transaction.recurring && (
                        <Chip 
                          label="Wiederkehrend" 
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      <Typography 
                        color={type === 'expense' ? 'error' : 'success.main'}
                        fontWeight="bold"
                      >
                        {type === 'expense' ? '- ' : '+ '}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Bearbeiten">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => onEdit(transaction)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Löschen">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => onDelete(transaction.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  
                  {/* Erweiterte Zeile mit zusätzlichen Details */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                      <Collapse in={expandedRows[transaction.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                          <Typography variant="subtitle2" gutterBottom component="div">
                            Details
                          </Typography>
                          <Table size="small" aria-label="transaction details">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" sx={{ fontWeight: 'bold', width: 180, borderBottom: 'none' }}>
                                  ID
                                </TableCell>
                                <TableCell sx={{ borderBottom: 'none' }}>
                                  {transaction.id}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                                  Vollständige Beschreibung
                                </TableCell>
                                <TableCell sx={{ borderBottom: 'none' }}>
                                  {transaction.description}
                                </TableCell>
                              </TableRow>
                              {type === 'expense' && (
                                <TableRow>
                                  <TableCell component="th" sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                                    Wiederkehrende Ausgabe
                                  </TableCell>
                                  <TableCell sx={{ borderBottom: 'none' }}>
                                    {transaction.recurring ? 'Ja' : 'Nein'}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  {searchTerm ? (
                    <Typography color="text.secondary">
                      Keine Ergebnisse für "{searchTerm}"
                    </Typography>
                  ) : (
                    <Typography color="text.secondary">
                      Keine Einträge vorhanden
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTransactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Zeilen pro Seite:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} von ${count}`}
      />
    </Paper>
  );
};

export default TransactionList;