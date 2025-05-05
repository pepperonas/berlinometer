import React, { useState, useEffect } from 'react';
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
  Paper,
  Tabs,
  Tab,
  Divider,
  useTheme,
  Backdrop
} from '@mui/material';
import { 
  Add as AddIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon,
  AddCircle as AddCircleIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';

import TransactionList from '../components/Finances/TransactionList';
import ExpenseForm from '../components/Finances/ExpenseForm';
import IncomeForm from '../components/Finances/IncomeForm';
import { financesApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const Finances = () => {
  const theme = useTheme();
  
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [tabValue, setTabValue] = useState(0);
  const [openExpenseForm, setOpenExpenseForm] = useState(false);
  const [openIncomeForm, setOpenIncomeForm] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [currentIncome, setCurrentIncome] = useState(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('expense'); // 'expense' oder 'income'
  
  // Finanzdaten laden
  const loadFinances = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Ausgaben und Einnahmen parallel laden
      const [expensesData, incomeData] = await Promise.all([
        financesApi.getExpenses(),
        financesApi.getIncome()
      ]);
      
      setExpenses(expensesData);
      setIncome(incomeData);
    } catch (err) {
      console.error('Error loading finances:', err);
      setError('Fehler beim Laden der Finanzdaten');
    } finally {
      setLoading(false);
    }
  };
  
  // Beim ersten Laden die Finanzdaten laden
  useEffect(() => {
    loadFinances();
  }, []);
  
  // Tab wechseln
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Ausgabe hinzufügen/bearbeiten Dialog öffnen
  const handleOpenExpenseForm = (expense = null) => {
    setCurrentExpense(expense);
    setOpenExpenseForm(true);
  };
  
  // Einnahme hinzufügen/bearbeiten Dialog öffnen
  const handleOpenIncomeForm = (income = null) => {
    setCurrentIncome(income);
    setOpenIncomeForm(true);
  };
  
  // Ausgabe speichern
  const handleSaveExpense = async (values) => {
    setLoading(true);
    try {
      if (currentExpense) {
        // Ausgabe aktualisieren
        await financesApi.updateExpense(currentExpense.id, values);
      } else {
        // Neue Ausgabe erstellen
        await financesApi.addExpense(values);
      }
      
      setOpenExpenseForm(false);
      setCurrentExpense(null);
      loadFinances();
    } catch (err) {
      console.error('Error saving expense:', err);
      setError('Fehler beim Speichern der Ausgabe');
      setLoading(false);
    }
  };
  
  // Einnahme speichern
  const handleSaveIncome = async (values) => {
    setLoading(true);
    try {
      if (currentIncome) {
        // Einnahme aktualisieren
        await financesApi.updateIncome(currentIncome.id, values);
      } else {
        // Neue Einnahme erstellen
        await financesApi.addIncome(values);
      }
      
      setOpenIncomeForm(false);
      setCurrentIncome(null);
      loadFinances();
    } catch (err) {
      console.error('Error saving income:', err);
      setError('Fehler beim Speichern der Einnahme');
      setLoading(false);
    }
  };
  
  // Lösch-Dialog öffnen
  const handleDeleteConfirm = (id, type) => {
    console.log(`Öffne Löschdialog für ${type} mit ID ${id}`);
    
    const item = type === 'expense' 
      ? expenses.find(e => e.id === id || e._id === id)
      : income.find(i => i.id === id || i._id === id);
    
    if (!item) {
      console.error(`${type} mit ID ${id} nicht gefunden!`);
      setError(`${type === 'expense' ? 'Ausgabe' : 'Einnahme'} zum Löschen nicht gefunden.`);
      return;
    }
      
    setItemToDelete(item);
    setDeleteType(type);
    setDeleteConfirm(true);
  };
  
  // Item löschen
  const handleDelete = async () => {
    if (!itemToDelete) {
      console.error('Löschen nicht möglich: Kein Item zum Löschen ausgewählt');
      setError('Fehler: Kein Element zum Löschen ausgewählt');
      return;
    }
    
    console.log(`Lösche ${deleteType}:`, itemToDelete);
    setLoading(true);
    
    try {
      let result;
      if (deleteType === 'expense') {
        console.log(`Rufe deleteExpense(${itemToDelete.id}) auf`);
        result = await financesApi.deleteExpense(itemToDelete.id);
        console.log('Ergebnis des Löschvorgangs (Ausgabe):', result);
      } else {
        console.log(`Rufe deleteIncome(${itemToDelete.id}) auf`);
        result = await financesApi.deleteIncome(itemToDelete.id);
        console.log('Ergebnis des Löschvorgangs (Einnahme):', result);
      }
      
      // Prüfen, ob der Löschvorgang erfolgreich war
      if (!result || !result.success) {
        throw new Error('Löschvorgang lieferte kein Erfolgsergebnis zurück');
      }
      
      setDeleteConfirm(false);
      setItemToDelete(null);
      
      // UI sofort aktualisieren, ohne auf loadFinances zu warten
      if (deleteType === 'expense') {
        // Ausgabe aus dem lokalen State entfernen
        setExpenses(prevExpenses => 
          prevExpenses.filter(expense => expense.id !== itemToDelete.id && expense._id !== itemToDelete.id)
        );
      } else {
        // Einnahme aus dem lokalen State entfernen
        setIncome(prevIncome => 
          prevIncome.filter(inc => inc.id !== itemToDelete.id && inc._id !== itemToDelete.id)
        );
      }
      
      // Im Hintergrund komplett neu laden
      loadFinances().catch(err => {
        console.error('Fehler beim Neuladen der Finanzdaten nach dem Löschen:', err);
      });
      
      // Status zurücksetzen
      setLoading(false);
    } catch (err) {
      console.error('Fehler beim Löschen des Elements:', err);
      setError(`Fehler beim Löschen der ${deleteType === 'expense' ? 'Ausgabe' : 'Einnahme'}: ${err.message || 'Unbekannter Fehler'}`);
      setLoading(false);
    }
  };
  
  // Gesamtsummen berechnen
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpenses;
  
  // Balancestatus (positiv, negativ, ausgeglichen)
  const balanceStatus = balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral';
  
  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Titel und Aktionsbuttons */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Finanzen
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Überwachen Sie Ihre Einnahmen und Ausgaben
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={loadFinances}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Aktualisieren
          </Button>
          {tabValue === 0 ? (
            <Button 
              variant="contained" 
              startIcon={<PaymentIcon />}
              onClick={() => handleOpenExpenseForm()}
            >
              Ausgabe hinzufügen
            </Button>
          ) : (
            <Button 
              variant="contained" 
              startIcon={<AddCircleIcon />}
              onClick={() => handleOpenIncomeForm()}
            >
              Einnahme hinzufügen
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Übersichtskarten */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Gesamteinnahmen
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {formatCurrency(totalIncome)}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Gesamtausgaben
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="error.main">
              {formatCurrency(totalExpenses)}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Bilanz
            </Typography>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              color={
                balanceStatus === 'positive' 
                  ? 'success.main' 
                  : balanceStatus === 'negative' 
                    ? 'error.main' 
                    : 'text.primary'
              }
            >
              {formatCurrency(balance)}
            </Typography>
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
              onClick={loadFinances}
            >
              Erneut laden
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Tabs für Ausgaben und Einnahmen */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label="Ausgaben" 
            icon={<PaymentIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Einnahmen" 
            icon={<AddCircleIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>
      
      {/* Transaktionslisten */}
      <Box mt={2}>
        {loading && !expenses.length && !income.length ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : (
          <>
            {/* Ausgabenliste */}
            <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
              <TransactionList 
                title="Ausgaben"
                transactions={expenses}
                onEdit={handleOpenExpenseForm}
                onDelete={(id) => handleDeleteConfirm(id, 'expense')}
                type="expense"
              />
            </Box>
            
            {/* Einnahmenliste */}
            <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
              <TransactionList 
                title="Einnahmen"
                transactions={income}
                onEdit={handleOpenIncomeForm}
                onDelete={(id) => handleDeleteConfirm(id, 'income')}
                type="income"
              />
            </Box>
          </>
        )}
      </Box>
      
      {/* Ausgabe-Formular-Dialog */}
      <Dialog 
        open={openExpenseForm} 
        onClose={() => {
          setOpenExpenseForm(false);
          setCurrentExpense(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {currentExpense ? 'Ausgabe bearbeiten' : 'Neue Ausgabe hinzufügen'}
        </DialogTitle>
        <DialogContent dividers>
          <ExpenseForm 
            initialValues={currentExpense}
            onSubmit={handleSaveExpense}
            onCancel={() => {
              setOpenExpenseForm(false);
              setCurrentExpense(null);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Einnahme-Formular-Dialog */}
      <Dialog 
        open={openIncomeForm} 
        onClose={() => {
          setOpenIncomeForm(false);
          setCurrentIncome(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {currentIncome ? 'Einnahme bearbeiten' : 'Neue Einnahme hinzufügen'}
        </DialogTitle>
        <DialogContent dividers>
          <IncomeForm 
            initialValues={currentIncome}
            onSubmit={handleSaveIncome}
            onCancel={() => {
              setOpenIncomeForm(false);
              setCurrentIncome(null);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Lösch-Dialog */}
      <Dialog 
        open={deleteConfirm} 
        onClose={() => setDeleteConfirm(false)}
      >
        <DialogTitle>
          {deleteType === 'expense' ? 'Ausgabe löschen' : 'Einnahme löschen'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie 
            {deleteType === 'expense' ? ' diese Ausgabe ' : ' diese Einnahme '}
            löschen möchten?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <Box display="flex" justifyContent="flex-end" p={2}>
          <Button 
            onClick={() => setDeleteConfirm(false)}
            sx={{ mr: 1 }}
          >
            Abbrechen
          </Button>
          <Button 
            variant="contained"
            color="error" 
            onClick={handleDelete}
          >
            Löschen
          </Button>
        </Box>
      </Dialog>
      
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: theme.zIndex.drawer + 1 }}
        open={loading && (openExpenseForm || openIncomeForm || deleteConfirm)}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default Finances;