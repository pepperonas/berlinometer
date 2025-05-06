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
    // Get period parameter (default to monthly)
    const period = req.query.period || 'monthly';
    const now = new Date();
    
    let currentStart, currentEnd, previousStart, previousEnd, trendDescription;
    
    // Set date ranges based on the period
    if (period === 'today') {
      // Today's data compared to yesterday
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      // Yesterday
      previousStart = new Date(now);
      previousStart.setDate(previousStart.getDate() - 1);
      previousStart.setHours(0, 0, 0, 0);
      
      previousEnd = new Date(previousStart);
      previousEnd.setHours(23, 59, 59);
      
      trendDescription = "vs. gestern";
    } else if (period === 'weekly') {
      // Current week data compared to previous week
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      // Current week (starting from Monday)
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - daysFromMonday);
      currentStart.setHours(0, 0, 0, 0);
      
      currentEnd = new Date(now);
      currentEnd.setHours(23, 59, 59);
      
      // Previous week
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      
      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59);
      
      trendDescription = "vs. letzte Woche";
    } else {
      // Default: monthly view
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      currentStart = new Date(currentYear, currentMonth, 1);
      currentEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      
      // Previous month
      previousStart = new Date(currentYear, currentMonth - 1, 1);
      previousEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
      
      trendDescription = "vs. letzter Monat";
    }
    
    // Aktuellen Zeitraum berechnen
    const currentSales = await Sale.find({
      date: { $gte: currentStart, $lte: currentEnd },
      bar: req.barId
    });
    
    // Vorherigen Zeitraum berechnen
    const prevSales = await Sale.find({
      date: { $gte: previousStart, $lte: previousEnd },
      bar: req.barId
    });
    
    // Gesamtumsatz aktueller Zeitraum
    const currentRevenue = currentSales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Gesamtumsatz vorheriger Zeitraum
    const prevRevenue = prevSales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Trendberechnung
    const revenueTrend = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;
    
    // Angenommener Gewinn (30% vom Umsatz)
    const currentProfit = currentRevenue * 0.3;
    const prevProfit = prevRevenue * 0.3;
    const profitTrend = prevProfit === 0 ? 100 : ((currentProfit - prevProfit) / prevProfit) * 100;
    
    // Anzahl der Kunden (einfach die Anzahl der Verkäufe)
    const currentCustomers = currentSales.length;
    const prevCustomers = prevSales.length;
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
        trendDescription 
      },
      profit: { 
        value: `${currentProfit.toFixed(2)} €`, 
        trend: parseFloat(profitTrend.toFixed(1)), 
        trendDescription 
      },
      customers: { 
        value: currentCustomers.toString(), 
        trend: parseFloat(customersTrend.toFixed(1)), 
        trendDescription
      },
      avgOrder: { 
        value: `${currentAvgOrder.toFixed(2)} €`, 
        trend: parseFloat(avgOrderTrend.toFixed(1)), 
        trendDescription
      },
      // Add period information
      period,
      dateRange: {
        start: currentStart,
        end: currentEnd
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
    // Get period parameter (default to monthly)
    const period = req.query.period || 'monthly';
    
    // Aktuelles Jahr
    const currentYear = new Date().getFullYear();
    const now = new Date();
    
    let labels = [];
    let salesData = [];
    
    // Handle different periods
    if (period === 'today') {
      // For today, show hourly data
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      // Create array for every 2 hours (12 points total)
      for (let hour = 0; hour < 24; hour += 2) {
        const startHour = new Date(startOfDay);
        startHour.setHours(hour);
        
        const endHour = new Date(startOfDay);
        endHour.setHours(hour + 2 - 0.01); // End 1 minute before next period
        
        // Add label for this time period (e.g., "08:00")
        const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
        labels.push(hourLabel);
        
        // Get sales for this hour range
        const hourlySales = await Sale.find({
          date: { $gte: startHour, $lte: endHour },
          bar: req.barId
        });
        
        const hourlyRevenue = hourlySales.reduce((sum, sale) => sum + sale.total, 0);
        salesData.push(parseFloat(hourlyRevenue.toFixed(2)));
      }
    } else if (period === 'weekly') {
      // For the current week, show daily data
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      const startOfWeek = new Date(now); 
      startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Start from Monday
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Get data for each day of the current week
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        
        // Add day name (e.g., "Mo")
        const dayName = date.toLocaleString('de-DE', { weekday: 'short' });
        labels.push(dayName);
        
        // Get sales for this day
        const dailySales = await Sale.find({
          date: { $gte: date, $lt: nextDate },
          bar: req.barId
        });
        
        const dailyRevenue = dailySales.reduce((sum, sale) => sum + sale.total, 0);
        salesData.push(parseFloat(dailyRevenue.toFixed(2)));
      }
    } else {
      // Default: monthly view (last 6 months)
      // Umsatzdaten für die letzten 6 Monate berechnen
      
      // Für jeden der letzten 6 Monate
      for (let i = 5; i >= 0; i--) {
        const month = now.getMonth() - i;
        const year = month < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = month < 0 ? month + 12 : month;
        
        const firstDayOfMonth = new Date(year, adjustedMonth, 1);
        const lastDayOfMonth = new Date(year, adjustedMonth + 1, 0, 23, 59, 59, 999);
        
        // Monatsnamen hinzufügen
        const monthName = firstDayOfMonth.toLocaleString('de-DE', { month: 'short' });
        labels.push(monthName);
        
        // Umsatz für diesen Monat berechnen
        const monthlySales = await Sale.find({
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
          bar: req.barId
        });
        
        const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + sale.total, 0);
        salesData.push(parseFloat(monthlyRevenue.toFixed(2)));
      }
    }
    
    const chartData = {
      labels: labels,
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
    // Get period parameter (default to monthly)
    const period = req.query.period || 'monthly';
    const now = new Date();
    
    let startDate;
    
    // Set the date range based on the period
    if (period === 'today') {
      // Just today's data
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === 'weekly') {
      // Last 7 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else {
      // Default: last month
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    const sales = await Sale.find({
      date: { $gte: startDate },
      bar: req.barId
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