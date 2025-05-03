import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  MonetizationOn as RevenueIcon,
  Savings as ProfitIcon,
  People as CustomersIcon,
  ShoppingBag as OrderIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

import StatCard from '../components/Dashboard/StatCard';
import SalesChart from '../components/Dashboard/SalesChart';
import TopSellingItems from '../components/Dashboard/TopSellingItems';
import ExpensesPieChart from '../components/Dashboard/ExpensesPieChart';

import { dashboardApi, inventoryApi } from '../services/api';

const Dashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [topSellingDrinks, setTopSellingDrinks] = useState(null);
  const [expensesData, setExpensesData] = useState(null);
  const [lowStockItems, setLowStockItems] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Parallele API-Aufrufe
      const [statsData, weeklyData, topDrinks, monthlyExpenses, lowStock] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getSalesData('weekly'),
        dashboardApi.getTopSellingDrinks(),
        dashboardApi.getExpensesData('monthly'),
        inventoryApi.getLowStock()
      ]);
      
      // Parallele API-Aufrufe für monatliche und jährliche Daten
      const [monthlyData, yearlyData, quarterlyExpenses, yearlyExpenses] = await Promise.all([
        dashboardApi.getSalesData('monthly'),
        dashboardApi.getSalesData('yearly'),
        dashboardApi.getExpensesData('quarterly'),
        dashboardApi.getExpensesData('yearly')
      ]);
      
      setStats(statsData);
      setSalesData({
        weekly: weeklyData,
        monthly: monthlyData,
        yearly: yearlyData
      });
      setTopSellingDrinks(topDrinks);
      setExpensesData({
        monthly: monthlyExpenses,
        quarterly: quarterlyExpenses,
        yearly: yearlyExpenses
      });
      setLowStockItems(lowStock);
      
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  };
  
  // Daten beim ersten Laden laden
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  // Wenn noch geladen wird
  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 120px)' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }
  
  // Wenn ein Fehler aufgetreten ist
  if (error && !stats) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadDashboardData}
              startIcon={<RefreshIcon />}
            >
              Erneut laden
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Seitenkopf */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Willkommen zurück! Hier ist ein Überblick über Ihre Bar.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={loadDashboardData}
          disabled={loading}
        >
          {loading ? 'Wird geladen...' : 'Aktualisieren'}
        </Button>
      </Box>
      
      {/* KPI-Karten */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Umsatz"
            value={stats?.revenue.value}
            icon={<RevenueIcon />}
            color="primary"
            description="Gesamtumsatz des laufenden Monats"
            trend={stats?.revenue.trend}
            trendDescription={stats?.revenue.trendDescription}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Gewinn"
            value={stats?.profit.value}
            icon={<ProfitIcon />}
            color="success"
            description="Gewinn nach Abzug aller Kosten"
            trend={stats?.profit.trend}
            trendDescription={stats?.profit.trendDescription}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Kunden"
            value={stats?.customers.value}
            icon={<CustomersIcon />}
            color="info"
            description="Besucherzahl diesen Monat"
            trend={stats?.customers.trend}
            trendDescription={stats?.customers.trendDescription}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Durchschn. Bestellung"
            value={stats?.avgOrder.value}
            icon={<OrderIcon />}
            color="secondary"
            description="Durchschnittlicher Bestellwert"
            trend={stats?.avgOrder.trend}
            trendDescription={stats?.avgOrder.trendDescription}
          />
        </Grid>
      </Grid>
      
      {/* Diagramme */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <SalesChart data={salesData} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <ExpensesPieChart data={expensesData} />
        </Grid>
      </Grid>
      
      {/* Top-Getränke und Bestandswarnung */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <TopSellingItems items={topSellingDrinks || []} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ padding: 0 }}>
              <Box p={2}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                  <InventoryIcon sx={{ mr: 1, color: 'warning.main' }} />
                  Lagerbestand-Warnungen
                </Typography>
              </Box>
              
              {lowStockItems && lowStockItems.length > 0 ? (
                <Box>
                  {lowStockItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <Box 
                        sx={{ 
                          px: 2, 
                          py: 1.5,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <Box display="flex" justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {item.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.category === 'spirits' && 'Spirituosen'}
                              {item.category === 'beer' && 'Bier'}
                              {item.category === 'wine' && 'Wein'}
                              {item.category === 'softDrinks' && 'Alkoholfreie Getränke'}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography 
                              variant="subtitle2" 
                              fontWeight="bold" 
                              color={item.quantity <= item.minQuantity / 2 ? 'error.main' : 'warning.main'}
                            >
                              {item.quantity} {item.unit}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Min: {item.minQuantity} {item.unit}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box 
                          sx={{ 
                            mt: 1, 
                            display: 'flex', 
                            alignItems: 'center' 
                          }}
                        >
                          <Box
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'background.paper',
                              width: '100%',
                              mr: 2,
                              position: 'relative',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${(item.quantity / (item.minQuantity * 3)) * 100}%`,
                                maxWidth: '100%',
                                bgcolor: item.quantity <= item.minQuantity / 2 
                                  ? 'error.main' 
                                  : 'warning.main',
                                borderRadius: 3,
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {Math.round((item.quantity / (item.minQuantity * 3)) * 100)}%
                          </Typography>
                        </Box>
                      </Box>
                      {index < lowStockItems.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              ) : (
                <Box p={4} textAlign="center">
                  <Typography variant="body1" color="text.secondary">
                    Keine Bestandswarnungen vorhanden
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;