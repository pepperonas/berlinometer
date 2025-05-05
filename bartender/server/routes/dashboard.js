const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Drink = require('../models/Drink');
const Inventory = require('../models/Inventory');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Dashboard-Statistiken abrufen
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // Zeitraum festlegen (aktueller Monat)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    // Zeitraum des vorherigen Monats
    const firstDayOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
    // Aktuellen Monatsumsatz berechnen
    const currentMonthSales = await Sale.find({
      date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });
    
    // Vormonatsumsatz berechnen
    const prevMonthSales = await Sale.find({
      date: { $gte: firstDayOfPrevMonth, $lte: lastDayOfPrevMonth }
    });
    
    // Gesamtumsatz aktueller Monat
    const currentRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Gesamtumsatz Vormonat
    const prevRevenue = prevMonthSales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Trendberechnung
    const revenueTrend = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;
    
    // Angenommener Gewinn (30% vom Umsatz)
    const currentProfit = currentRevenue * 0.3;
    const prevProfit = prevRevenue * 0.3;
    const profitTrend = prevProfit === 0 ? 100 : ((currentProfit - prevProfit) / prevProfit) * 100;
    
    // Anzahl der Kunden (einfach die Anzahl der Verkäufe)
    const currentCustomers = currentMonthSales.length;
    const prevCustomers = prevMonthSales.length;
    const customersTrend = prevCustomers === 0 ? 100 : ((currentCustomers - prevCustomers) / prevCustomers) * 100;
    
    // Durchschnittlicher Bestellwert
    const currentAvgOrder = currentCustomers === 0 ? 0 : currentRevenue / currentCustomers;
    const prevAvgOrder = prevCustomers === 0 ? 0 : prevRevenue / prevCustomers;
    const avgOrderTrend = prevAvgOrder === 0 ? 100 : ((currentAvgOrder - prevAvgOrder) / prevAvgOrder) * 100;
    
    // Ergebnisse formatieren
    const stats = {
      revenue: { 
        value: `${currentRevenue.toFixed(2)} €`, 
        trend: parseFloat(revenueTrend.toFixed(1)), 
        trendDescription: "vs. letzter Monat" 
      },
      profit: { 
        value: `${currentProfit.toFixed(2)} €`, 
        trend: parseFloat(profitTrend.toFixed(1)), 
        trendDescription: "vs. letzter Monat" 
      },
      customers: { 
        value: currentCustomers.toString(), 
        trend: parseFloat(customersTrend.toFixed(1)), 
        trendDescription: "vs. letzter Monat" 
      },
      avgOrder: { 
        value: `${currentAvgOrder.toFixed(2)} €`, 
        trend: parseFloat(avgOrderTrend.toFixed(1)), 
        trendDescription: "vs. letzter Monat" 
      }
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Fehler beim Abrufen der Dashboard-Statistiken:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/dashboard/sales-data
// @desc    Umsatzdaten für Diagramm abrufen
// @access  Private
router.get('/sales-data', protect, async (req, res) => {
  try {
    // Aktuelles Jahr
    const currentYear = new Date().getFullYear();
    
    // Umsatzdaten für die letzten 6 Monate berechnen
    const monthLabels = [];
    const salesData = [];
    
    // Für jeden der letzten 6 Monate
    for (let i = 5; i >= 0; i--) {
      const month = new Date().getMonth() - i;
      const year = month < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = month < 0 ? month + 12 : month;
      
      const firstDayOfMonth = new Date(year, adjustedMonth, 1);
      const lastDayOfMonth = new Date(year, adjustedMonth + 1, 0, 23, 59, 59, 999);
      
      // Monatsnamen hinzufügen
      const monthName = firstDayOfMonth.toLocaleString('de-DE', { month: 'short' });
      monthLabels.push(monthName);
      
      // Umsatz für diesen Monat berechnen
      const monthlySales = await Sale.find({
        date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
      });
      
      const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + sale.total, 0);
      salesData.push(parseFloat(monthlyRevenue.toFixed(2)));
    }
    
    const chartData = {
      labels: monthLabels,
      datasets: [
        {
          label: 'Umsatz',
          data: salesData,
          borderColor: 'rgba(53, 162, 235, 0.8)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        }
      ]
    };
    
    res.json(chartData);
  } catch (err) {
    console.error('Fehler beim Abrufen der Umsatzdaten:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/dashboard/top-selling
// @desc    Meistverkaufte Getränke abrufen
// @access  Private
router.get('/top-selling', protect, async (req, res) => {
  try {
    // Alle Verkäufe des letzten Monats abrufen
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const sales = await Sale.find({
      date: { $gte: lastMonth }
    });
    
    // Verkaufsdaten nach Getränk aggregieren
    const drinkSales = {};
    
    for (const sale of sales) {
      for (const item of sale.items) {
        const drinkId = item.drinkId.toString();
        
        if (!drinkSales[drinkId]) {
          drinkSales[drinkId] = {
            id: drinkId,
            name: item.name,
            amount: 0,
            revenue: 0
          };
        }
        
        drinkSales[drinkId].amount += item.quantity;
        drinkSales[drinkId].revenue += item.quantity * item.pricePerUnit;
      }
    }
    
    // In Array umwandeln und nach Menge sortieren
    const topSellingItems = Object.values(drinkSales)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5
    
    res.json(topSellingItems);
  } catch (err) {
    console.error('Fehler beim Abrufen der meistverkauften Getränke:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/dashboard/expenses-data
// @desc    Ausgabendaten für Diagramm abrufen
// @access  Private
router.get('/expenses-data', protect, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    // Simulierte Ausgaben (echte Implementierung würde diese aus einer Datenbank abrufen)
    // In einer vollständigen Implementierung würden wir eine Expenses-Sammlung verwenden
    const expensesData = {
      monthly: [
        { name: 'Miete', value: 1200, percent: 0.30 },
        { name: 'Personal', value: 1600, percent: 0.40 },
        { name: 'Einkauf', value: 800, percent: 0.20 },
        { name: 'Marketing', value: 200, percent: 0.05 },
        { name: 'Sonstiges', value: 200, percent: 0.05 }
      ],
      quarterly: [
        { name: 'Miete', value: 3600, percent: 0.32 },
        { name: 'Personal', value: 4200, percent: 0.38 },
        { name: 'Einkauf', value: 2400, percent: 0.22 },
        { name: 'Marketing', value: 550, percent: 0.05 },
        { name: 'Sonstiges', value: 350, percent: 0.03 }
      ],
      yearly: [
        { name: 'Miete', value: 14400, percent: 0.33 },
        { name: 'Personal', value: 16500, percent: 0.37 },
        { name: 'Einkauf', value: 9800, percent: 0.22 },
        { name: 'Marketing', value: 2200, percent: 0.05 },
        { name: 'Sonstiges', value: 1500, percent: 0.03 }
      ]
    };
    
    // Wenn ein bestimmter Zeitraum angefordert wird, geben wir nur diesen zurück
    if (period in expensesData) {
      return res.json(expensesData[period]);
    }
    
    // Andernfalls geben wir alle Daten zurück
    res.json(expensesData);
  } catch (err) {
    console.error('Fehler beim Abrufen der Ausgabendaten:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;