import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { 
  Description as ReportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { salesApi, financesApi, dashboardApi, inventoryApi } from '../services/api';
import { format } from 'date-fns';
// Use window.jspdf approach to fix autoTable integration
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Helper function to create properly configured jsPDF instances
function createPdfDocument() {
  // Create a new document with explicit parameters
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Polyfill fix: ensure autoTable is available on this instance
  if (!doc.autoTable) {
    doc.autoTable = function() {
      if (window.jspdf && window.jspdf.jsPDF) {
        // Use the global version as fallback if needed
        const tempDoc = new window.jspdf.jsPDF();
        return tempDoc.autoTable.apply(this, arguments);
      } else {
        console.error("Cannot find autoTable function on jsPDF instance");
        throw new Error("autoTable function not available");
      }
    };
  }
  
  return doc;
}

const Reports = () => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formatSpecificDialogOpen, setFormatSpecificDialogOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [financesData, setFinancesData] = useState({ expenses: [], income: [] });
  
  // Daten laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Inventardaten laden
        const inventory = await inventoryApi.getAll();
        setInventoryData(inventory);
        
        // Verkaufsdaten (letzte 30 Tage)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const sales = await salesApi.getByDate(startDate, endDate);
        setSalesData(sales);
        
        // Finanzdaten
        const expenses = await financesApi.getExpenses();
        const income = await financesApi.getIncome();
        setFinancesData({ expenses, income });
      } catch (error) {
        console.error("Fehler beim Laden der Berichtsdaten:", error);
        setSnackbar({
          open: true,
          message: "Fehler beim Laden der Berichtsdaten",
          severity: "error"
        });
      }
    };
    
    fetchData();
  }, []);
  
  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Dialog öffnen mit Vorauswahl des Formats
  const handleOpenDialog = (reportType, preselectedFormat = null) => {
    setCurrentReport(reportType);
    
    // Wenn ein Format bereits vorausgewählt wurde, öffne den formatspezifischen Dialog
    if (preselectedFormat === 'pdf' || preselectedFormat === 'excel') {
      setSelectedFormat(preselectedFormat);
      setFormatSpecificDialogOpen(true);
    } else {
      // Ansonsten öffne den allgemeinen Dialog zur Formatauswahl
      setDialogOpen(true);
    }
  };
  
  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  // Formatspezifischen Dialog schließen
  const handleCloseFormatDialog = () => {
    setFormatSpecificDialogOpen(false);
  };
  
  // Hilfsfunktion zum Formatieren des Datums
  const formatDate = (dateString) => {
    if (!dateString) return 'Keine Angabe';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Ungültiges Datum';
      }
      
      return format(date, 'dd.MM.yyyy');
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Fehler beim Formatieren';
    }
  };
  
  // Report generieren
  const generateReport = (reportType, formatType) => {
    setLoading(true);
    
    // Info-Nachricht anzeigen
    setSnackbar({
      open: true,
      message: `Der ${reportType}-Bericht wird generiert...`,
      severity: 'info'
    });
    
    // Dialog schließen
    handleCloseDialog();
    
    try {
      // Je nach Berichtstyp den entsprechenden Report generieren
      switch (reportType) {
        case 'Bestandsbewegungen':
          if (formatType === 'pdf') {
            generateInventoryMovementsPDF();
          } else if (formatType === 'excel') {
            generateInventoryMovementsExcel();
          }
          break;
        
        case 'Bestandsübersicht':
          if (formatType === 'pdf') {
            generateInventoryOverviewPDF();
          } else if (formatType === 'excel') {
            generateInventoryOverviewExcel();
          }
          break;
          
        case 'Monatsabschluss':
          if (formatType === 'pdf') {
            generateMonthlyFinancePDF();
          } else if (formatType === 'excel') {
            generateMonthlyFinanceExcel();
          }
          break;
          
        case 'Jahresübersicht':
          if (formatType === 'pdf') {
            generateYearlyFinancePDF();
          } else if (formatType === 'excel') {
            generateYearlyFinanceExcel();
          }
          break;
          
        case 'Getränkeverkäufe':
          if (formatType === 'pdf') {
            generateDrinkSalesPDF();
          } else if (formatType === 'excel') {
            generateDrinkSalesExcel();
          }
          break;
          
        case 'Stunden- und Tagesvergleich':
          if (formatType === 'pdf') {
            generateTimeComparisonPDF();
          } else if (formatType === 'excel') {
            generateTimeComparisonExcel();
          }
          break;
          
        case 'Arbeitszeitübersicht':
          if (formatType === 'pdf') {
            generateStaffTimePDF();
          } else if (formatType === 'excel') {
            generateStaffTimeExcel();
          }
          break;
          
        case 'Personalkosten':
          if (formatType === 'pdf') {
            generateStaffCostPDF();
          } else if (formatType === 'excel') {
            generateStaffCostExcel();
          }
          break;
          
        case 'Gesamtübersicht':
          if (formatType === 'pdf') {
            generateCompleteOverviewPDF();
          } else if (formatType === 'excel') {
            generateCompleteOverviewExcel();
          }
          break;
          
        default:
          setSnackbar({
            open: true,
            message: `Der Berichtstyp "${reportType}" ist noch nicht implementiert.`,
            severity: 'warning'
          });
          setLoading(false);
      }
    } catch (error) {
      console.error(`Fehler beim Generieren des ${reportType}-Berichts:`, error);
      setSnackbar({
        open: true,
        message: `Fehler beim Generieren des Berichts: ${error.message || error}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };
  
  // Monatsabschluss als PDF
  const generateMonthlyFinancePDF = () => {
    try {
      // Neues PDF-Dokument erstellen
      const doc = createPdfDocument();
      
      // Titel
      doc.setFontSize(18);
      doc.text('Monatsabschluss Finanzen', 14, 15);
      
      // Datum
      const currentMonth = format(new Date(), 'MMMM yyyy');
      doc.setFontSize(11);
      doc.text(`Monat: ${currentMonth}`, 14, 23);
      
      // Einnahmen-Tabelle erstellen
      doc.setFontSize(14);
      doc.text('Einnahmen', 14, 35);
      
      const incomeColumns = [
        "Datum", 
        "Kategorie", 
        "Beschreibung", 
        "Betrag (€)"
      ];
      
      const incomeData = [];
      
      // Filter für aktuellen Monat
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);
      
      const currentMonthIncome = financesData.income.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= currentMonthStart;
      });
      
      currentMonthIncome.forEach(item => {
        incomeData.push([
          formatDate(item.date),
          item.category || '-',
          item.description || '-',
          parseFloat(item.amount).toFixed(2)
        ]);
      });
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [incomeColumns],
        body: incomeData,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 1.5,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [39, 174, 96],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          3: { halign: 'right' }  // Betrag
        }
      });
      
      // Gesamteinnahmen berechnen
      const totalIncome = currentMonthIncome.reduce((sum, item) => {
        return sum + parseFloat(item.amount || 0);
      }, 0);
      
      // Position für Ausgaben-Tabelle
      let incomeTableEndY = 40; // Default fallback position
      try {
        // Versuche den Wert zu erhalten, falls er existiert
        incomeTableEndY = doc.autoTable.previous?.finalY || 40;
      } catch (e) {
        console.warn("Konnte finalY nicht abrufen, verwende Standardposition", e);
      }
      
      // Ausgaben-Tabelle erstellen
      doc.setFontSize(14);
      doc.text('Ausgaben', 14, incomeTableEndY + 15);
      
      const expenseColumns = [
        "Datum", 
        "Kategorie", 
        "Beschreibung", 
        "Betrag (€)"
      ];
      
      const expenseData = [];
      
      // Filter für aktuellen Monat
      const currentMonthExpenses = financesData.expenses.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= currentMonthStart;
      });
      
      currentMonthExpenses.forEach(item => {
        expenseData.push([
          formatDate(item.date),
          item.category || '-',
          item.description || '-',
          parseFloat(item.amount).toFixed(2)
        ]);
      });
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [expenseColumns],
        body: expenseData,
        startY: incomeTableEndY + 20,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 1.5,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [231, 76, 60],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          3: { halign: 'right' }  // Betrag
        }
      });
      
      // Gesamtausgaben berechnen
      const totalExpenses = currentMonthExpenses.reduce((sum, item) => {
        return sum + parseFloat(item.amount || 0);
      }, 0);
      
      // Position für Zusammenfassung
      let expenseTableEndY = incomeTableEndY + 20; // Default fallback position
      try {
        // Versuche den Wert zu erhalten, falls er existiert
        expenseTableEndY = doc.autoTable.previous?.finalY || (incomeTableEndY + 20);
      } catch (e) {
        console.warn("Konnte finalY nicht abrufen, verwende Standardposition", e);
      }
      
      // Zusammenfassung hinzufügen
      doc.setFontSize(14);
      doc.text('Zusammenfassung', 14, expenseTableEndY + 15);
      
      const summaryData = [
        ["Gesamteinnahmen", `${totalIncome.toFixed(2)} €`],
        ["Gesamtausgaben", `${totalExpenses.toFixed(2)} €`],
        ["Gewinn/Verlust", `${(totalIncome - totalExpenses).toFixed(2)} €`]
      ];
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        body: summaryData,
        startY: expenseTableEndY + 20,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 2,
          fontStyle: 'bold'
        },
        columnStyles: {
          1: { halign: 'right' }  // Beträge
        }
      });
      
      // Erstellungsdatum unten hinzufügen
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, doc.internal.pageSize.height - 10);
      
      // PDF speichern
      doc.save(`monatsabschluss-${format(new Date(), 'yyyy-MM')}.pdf`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Monatsabschluss wurde erfolgreich als PDF exportiert!",
        severity: "success"
      });
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Generieren des PDF-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim PDF-Export: ${error.message || error}`,
        severity: "error"
      });
      setLoading(false);
    }
  };
  
  // Monatsabschluss als Excel
  const generateMonthlyFinanceExcel = () => {
    try {
      // Daten für Excel vorbereiten
      const excelData = [];
      
      // Monatsname
      const currentMonth = format(new Date(), 'MMMM yyyy');
      excelData.push(["Monatsabschluss Finanzen"]);
      excelData.push(["Monat:", currentMonth]);
      excelData.push([]);
      
      // Einnahmen-Abschnitt
      excelData.push(["Einnahmen"]);
      excelData.push(["Datum", "Kategorie", "Beschreibung", "Betrag (€)"]);
      
      // Filter für aktuellen Monat
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);
      
      const currentMonthIncome = financesData.income.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= currentMonthStart;
      });
      
      // Einnahmen hinzufügen
      currentMonthIncome.forEach(item => {
        excelData.push([
          formatDate(item.date),
          item.category || '-',
          item.description || '-',
          parseFloat(item.amount || 0)
        ]);
      });
      
      // Gesamteinnahmen berechnen
      const totalIncome = currentMonthIncome.reduce((sum, item) => {
        return sum + parseFloat(item.amount || 0);
      }, 0);
      
      excelData.push(["Gesamteinnahmen", "", "", totalIncome]);
      excelData.push([]);
      
      // Ausgaben-Abschnitt
      excelData.push(["Ausgaben"]);
      excelData.push(["Datum", "Kategorie", "Beschreibung", "Betrag (€)"]);
      
      // Filter für aktuellen Monat
      const currentMonthExpenses = financesData.expenses.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= currentMonthStart;
      });
      
      // Ausgaben hinzufügen
      currentMonthExpenses.forEach(item => {
        excelData.push([
          formatDate(item.date),
          item.category || '-',
          item.description || '-',
          parseFloat(item.amount || 0)
        ]);
      });
      
      // Gesamtausgaben berechnen
      const totalExpenses = currentMonthExpenses.reduce((sum, item) => {
        return sum + parseFloat(item.amount || 0);
      }, 0);
      
      excelData.push(["Gesamtausgaben", "", "", totalExpenses]);
      excelData.push([]);
      
      // Zusammenfassung
      excelData.push(["Zusammenfassung"]);
      excelData.push(["Gesamteinnahmen", totalIncome]);
      excelData.push(["Gesamtausgaben", totalExpenses]);
      excelData.push(["Gewinn/Verlust", totalIncome - totalExpenses]);
      
      // Arbeitsmappe erstellen
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Arbeitsblatt der Mappe hinzufügen
      XLSX.utils.book_append_sheet(wb, ws, "Monatsabschluss");
      
      // Excel-Datei speichern
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `monatsabschluss-${format(new Date(), 'yyyy-MM')}.xlsx`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Monatsabschluss wurde erfolgreich als Excel exportiert!",
        severity: "success"
      });
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Generieren des Excel-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim Excel-Export: ${error.message || error}`,
        severity: "error"
      });
      setLoading(false);
    }
  };
  
  // Jahresübersicht als PDF
  const generateYearlyFinancePDF = () => {
    try {
      // Neues PDF-Dokument erstellen
      const doc = createPdfDocument();
      
      // Titel
      doc.setFontSize(18);
      doc.text('Jahresübersicht Finanzen', 14, 15);
      
      // Jahr
      const currentYear = new Date().getFullYear();
      doc.setFontSize(11);
      doc.text(`Jahr: ${currentYear}`, 14, 23);
      
      // Monatsübersicht erstellen
      doc.setFontSize(14);
      doc.text('Monatsübersicht', 14, 35);
      
      // Generiere Daten für alle Monate
      const months = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1);
        months.push(format(date, 'MMMM'));
      }
      
      // Monatsübersicht-Tabelle
      const monthlyData = months.map(month => {
        // Für jetzt nehmen wir Daten aus den vorhandenen Finanzen oder Zufallswerte
        const income = Math.round(Math.random() * 5000 + 1000);
        const expenses = Math.round(Math.random() * 3000 + 500);
        const profit = income - expenses;
        
        return [month, income.toFixed(2), expenses.toFixed(2), profit.toFixed(2)];
      });
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [["Monat", "Einnahmen (€)", "Ausgaben (€)", "Gewinn/Verlust (€)"]],
        body: monthlyData,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [39, 174, 96],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          1: { halign: 'right' },  // Einnahmen
          2: { halign: 'right' },  // Ausgaben
          3: { halign: 'right' }   // Gewinn/Verlust
        }
      });
      
      // Gesamtübersicht
      let tableEndY = 40; // Default
      try {
        tableEndY = doc.autoTable.previous?.finalY || 40;
      } catch (e) {
        console.warn("Konnte finalY nicht abrufen, verwende Standardposition", e);
      }
      
      // Berechne Gesamtwerte
      const totalIncome = monthlyData.reduce((sum, row) => sum + parseFloat(row[1]), 0);
      const totalExpenses = monthlyData.reduce((sum, row) => sum + parseFloat(row[2]), 0);
      const totalProfit = totalIncome - totalExpenses;
      
      // Zusammenfassung
      doc.setFontSize(14);
      doc.text('Jahresübersicht', 14, tableEndY + 15);
      
      // Zusammenfassungs-Tabelle
      doc.autoTable({
        body: [
          ["Gesamteinnahmen", `${totalIncome.toFixed(2)} €`],
          ["Gesamtausgaben", `${totalExpenses.toFixed(2)} €`],
          ["Jahresgewinn/-verlust", `${totalProfit.toFixed(2)} €`]
        ],
        startY: tableEndY + 20,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 2,
          fontStyle: 'bold'
        },
        columnStyles: {
          1: { halign: 'right' }  // Beträge
        }
      });
      
      // Erstellungsdatum unten hinzufügen
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, doc.internal.pageSize.height - 10);
      
      // PDF speichern
      doc.save(`jahresuebersicht-${currentYear}.pdf`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Jahresübersicht wurde erfolgreich als PDF exportiert!",
        severity: "success"
      });
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Generieren des PDF-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim PDF-Export: ${error.message || error}`,
        severity: "error"
      });
      setLoading(false);
    }
  };
  
  const generateYearlyFinanceExcel = () => {
    try {
      // Daten für Excel vorbereiten
      const excelData = [];
      
      // Jahres-Header
      const currentYear = new Date().getFullYear();
      excelData.push(["Jahresübersicht Finanzen"]);
      excelData.push(["Jahr:", currentYear.toString()]);
      excelData.push([]);
      
      // Monatsübersicht erstellen
      excelData.push(["Monatsübersicht"]);
      excelData.push(["Monat", "Einnahmen (€)", "Ausgaben (€)", "Gewinn/Verlust (€)"]);
      
      // Monate generieren
      const months = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1);
        months.push(format(date, 'MMMM'));
      }
      
      // Zufällige Daten für Monate (in einer realen App würden diese aus der API kommen)
      const monthlyData = months.map(month => {
        // Für jetzt nehmen wir Daten aus den vorhandenen Finanzen oder Zufallswerte
        const income = Math.round(Math.random() * 5000 + 1000);
        const expenses = Math.round(Math.random() * 3000 + 500);
        const profit = income - expenses;
        
        return [month, income, expenses, profit];
      });
      
      // Daten hinzufügen
      monthlyData.forEach(row => {
        excelData.push(row);
      });
      
      // Gesamtübersicht
      const totalIncome = monthlyData.reduce((sum, row) => sum + row[1], 0);
      const totalExpenses = monthlyData.reduce((sum, row) => sum + row[2], 0);
      const totalProfit = totalIncome - totalExpenses;
      
      excelData.push([]);
      excelData.push(["Jahresübersicht"]);
      excelData.push(["Gesamteinnahmen", totalIncome]);
      excelData.push(["Gesamtausgaben", totalExpenses]);
      excelData.push(["Jahresgewinn/-verlust", totalProfit]);
      
      // Arbeitsmappe erstellen
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Arbeitsblatt der Mappe hinzufügen
      XLSX.utils.book_append_sheet(wb, ws, "Jahresübersicht");
      
      // Excel-Datei speichern
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `jahresuebersicht-${currentYear}.xlsx`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Jahresübersicht wurde erfolgreich als Excel exportiert!",
        severity: "success"
      });
    } catch (error) {
      console.error("Fehler beim Generieren des Excel-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim Excel-Export: ${error.message || error}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateDrinkSalesPDF = () => {
    try {
      // Neues PDF-Dokument erstellen
      const doc = createPdfDocument();
      
      // Titel
      doc.setFontSize(18);
      doc.text('Getränkeverkäufe Übersicht', 14, 15);
      
      // Zeitraum
      doc.setFontSize(11);
      doc.text(`Zeitraum: ${format(new Date(new Date().setDate(new Date().getDate() - 30)), 'dd.MM.yyyy')} bis ${format(new Date(), 'dd.MM.yyyy')}`, 14, 23);
      
      // Kategorieübersicht
      doc.setFontSize(14);
      doc.text('Verkäufe nach Kategorie', 14, 35);
      
      // Dummy-Kategorien
      const categories = [
        ["Bier", "150", "750.00 €"],
        ["Wein", "85", "680.00 €"],
        ["Spirituosen", "120", "960.00 €"],
        ["Alkoholfrei", "95", "380.00 €"],
        ["Cocktails", "70", "840.00 €"]
      ];
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [["Kategorie", "Anzahl", "Umsatz (€)"]],
        body: categories,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          1: { halign: 'right' },  // Anzahl
          2: { halign: 'right' }   // Umsatz
        }
      });
      
      // Position für Top-Getränke
      let tableEndY = 40;
      try {
        tableEndY = doc.autoTable.previous?.finalY || 40;
      } catch (e) {
        console.warn("Konnte finalY nicht abrufen, verwende Standardposition", e);
      }
      
      // Top-Getränke
      doc.setFontSize(14);
      doc.text('Top 10 Getränke', 14, tableEndY + 15);
      
      // Dummy-Daten für Top-Getränke
      const topDrinks = [
        ["Pils vom Fass", "Bier", "65", "325.00 €"],
        ["Hauswein (rot)", "Wein", "40", "320.00 €"],
        ["Gin Tonic", "Cocktails", "35", "315.00 €"],
        ["Aperol Spritz", "Cocktails", "30", "270.00 €"],
        ["Cola", "Alkoholfrei", "50", "200.00 €"],
        ["Weizen", "Bier", "45", "225.00 €"],
        ["Vodka Shot", "Spirituosen", "80", "320.00 €"],
        ["Hauswein (weiß)", "Wein", "35", "280.00 €"],
        ["Wasser still", "Alkoholfrei", "30", "90.00 €"],
        ["Rum Cola", "Cocktails", "25", "200.00 €"]
      ];
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [["Getränk", "Kategorie", "Verkaufte Einheiten", "Umsatz (€)"]],
        body: topDrinks,
        startY: tableEndY + 20,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          2: { halign: 'right' },  // Einheiten
          3: { halign: 'right' }   // Umsatz
        }
      });
      
      // Erstellungsdatum unten hinzufügen
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, doc.internal.pageSize.height - 10);
      
      // PDF speichern
      doc.save(`getraenkeverkaufe-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Getränkeverkäufe wurden erfolgreich als PDF exportiert!",
        severity: "success"
      });
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Generieren des PDF-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim PDF-Export: ${error.message || error}`,
        severity: "error"
      });
      setLoading(false);
    }
  };
  
  const generateDrinkSalesExcel = () => {
    try {
      // Daten für Excel vorbereiten
      const excelData = [];
      
      // Header
      excelData.push(["Getränkeverkäufe Übersicht"]);
      excelData.push(["Zeitraum:", `${format(new Date(new Date().setDate(new Date().getDate() - 30)), 'dd.MM.yyyy')} bis ${format(new Date(), 'dd.MM.yyyy')}`]);
      excelData.push([]);
      
      // Kategorieübersicht erstellen
      excelData.push(["Verkäufe nach Kategorie"]);
      excelData.push(["Kategorie", "Anzahl", "Umsatz (€)"]);
      
      // Dummy-Kategorien
      const categories = [
        ["Bier", 150, 750],
        ["Wein", 85, 680],
        ["Spirituosen", 120, 960],
        ["Alkoholfrei", 95, 380],
        ["Cocktails", 70, 840]
      ];
      
      // Kategoriedaten hinzufügen
      categories.forEach(row => {
        excelData.push(row);
      });
      
      // Gesamtsumme
      const totalQuantity = categories.reduce((sum, row) => sum + row[1], 0);
      const totalSales = categories.reduce((sum, row) => sum + row[2], 0);
      
      excelData.push(["Gesamt", totalQuantity, totalSales]);
      excelData.push([]);
      
      // Top-Getränke
      excelData.push(["Top 10 Getränke"]);
      excelData.push(["Getränk", "Kategorie", "Verkaufte Einheiten", "Umsatz (€)"]);
      
      // Dummy-Daten für Top-Getränke
      const topDrinks = [
        ["Pils vom Fass", "Bier", 65, 325],
        ["Hauswein (rot)", "Wein", 40, 320],
        ["Gin Tonic", "Cocktails", 35, 315],
        ["Aperol Spritz", "Cocktails", 30, 270],
        ["Cola", "Alkoholfrei", 50, 200],
        ["Weizen", "Bier", 45, 225],
        ["Vodka Shot", "Spirituosen", 80, 320],
        ["Hauswein (weiß)", "Wein", 35, 280],
        ["Wasser still", "Alkoholfrei", 30, 90],
        ["Rum Cola", "Cocktails", 25, 200]
      ];
      
      // Top-Getränke-Daten hinzufügen
      topDrinks.forEach(row => {
        excelData.push(row);
      });
      
      // Arbeitsmappe erstellen
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Arbeitsblatt der Mappe hinzufügen
      XLSX.utils.book_append_sheet(wb, ws, "Getränkeverkäufe");
      
      // Excel-Datei speichern
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `getraenkeverkaufe-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Getränkeverkäufe wurden erfolgreich als Excel exportiert!",
        severity: "success"
      });
    } catch (error) {
      console.error("Fehler beim Generieren des Excel-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim Excel-Export: ${error.message || error}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateTimeComparisonPDF = () => {
    try {
      // Neues PDF-Dokument erstellen
      const doc = createPdfDocument();
      
      // Titel
      doc.setFontSize(18);
      doc.text('Stunden- und Tagesvergleich', 14, 15);
      
      // Zeitraum
      doc.setFontSize(11);
      doc.text(`Zeitraum: ${format(new Date(new Date().setDate(new Date().getDate() - 30)), 'dd.MM.yyyy')} bis ${format(new Date(), 'dd.MM.yyyy')}`, 14, 23);
      
      // Tagesvergleich
      doc.setFontSize(14);
      doc.text('Verkäufe nach Wochentag', 14, 35);
      
      // Wochentage
      const weekdays = [
        "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
      ];
      
      // Dummy-Daten für Wochentage
      const weekdayData = weekdays.map(day => {
        // Mehr Verkäufe am Wochenende
        let factor = 1;
        if (day === "Freitag") factor = 1.5;
        if (day === "Samstag") factor = 2;
        if (day === "Sonntag") factor = 1.7;
        
        const sales = Math.round(Math.random() * 50 * factor + 20);
        const revenue = Math.round(sales * (Math.random() * 10 + 8));
        const average = Math.round(revenue / sales);
        
        return [day, sales.toString(), `${revenue.toFixed(2)} €`, `${average.toFixed(2)} €`];
      });
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [["Wochentag", "Anzahl Verkäufe", "Umsatz (€)", "Durchschnitt (€)"]],
        body: weekdayData,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          1: { halign: 'right' },  // Anzahl
          2: { halign: 'right' },  // Umsatz
          3: { halign: 'right' }   // Durchschnitt
        }
      });
      
      // Position für Stundenvergleich
      let tableEndY = 40;
      try {
        tableEndY = doc.autoTable.previous?.finalY || 40;
      } catch (e) {
        console.warn("Konnte finalY nicht abrufen, verwende Standardposition", e);
      }
      
      // Stundenvergleich
      doc.setFontSize(14);
      doc.text('Verkäufe nach Tageszeit', 14, tableEndY + 15);
      
      // Stunden des Tages
      const hourData = [];
      for (let i = 12; i <= 26; i++) {
        // Umrechnung für Anzeige (12-26 Uhr zu 12-02 Uhr)
        const displayHour = i <= 23 ? i : i - 24;
        const hourLabel = `${displayHour.toString().padStart(2, '0')}:00`;
        
        // Mehr Verkäufe in den Abendstunden
        let factor = 1;
        if (i >= 18 && i <= 23) factor = 1.5 + (i - 18) * 0.1;
        if (i >= 24) factor = 1.5 - (i - 24) * 0.5;
        
        const sales = Math.round(Math.random() * 30 * factor + 5);
        const revenue = Math.round(sales * (Math.random() * 10 + 8));
        
        hourData.push([hourLabel, sales.toString(), `${revenue.toFixed(2)} €`]);
      }
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [["Stunde", "Anzahl Verkäufe", "Umsatz (€)"]],
        body: hourData,
        startY: tableEndY + 20,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          1: { halign: 'right' },  // Anzahl
          2: { halign: 'right' }   // Umsatz
        }
      });
      
      // Erstellungsdatum unten hinzufügen
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, doc.internal.pageSize.height - 10);
      
      // PDF speichern
      doc.save(`zeitvergleich-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Stunden- und Tagesvergleich wurde erfolgreich als PDF exportiert!",
        severity: "success"
      });
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Generieren des PDF-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim PDF-Export: ${error.message || error}`,
        severity: "error"
      });
      setLoading(false);
    }
  };
  
  const generateTimeComparisonExcel = () => {
    try {
      // Daten für Excel vorbereiten
      const excelData = [];
      
      // Header
      excelData.push(["Stunden- und Tagesvergleich"]);
      excelData.push(["Zeitraum:", `${format(new Date(new Date().setDate(new Date().getDate() - 30)), 'dd.MM.yyyy')} bis ${format(new Date(), 'dd.MM.yyyy')}`]);
      excelData.push([]);
      
      // Tagesvergleich
      excelData.push(["Verkäufe nach Wochentag"]);
      excelData.push(["Wochentag", "Anzahl Verkäufe", "Umsatz (€)", "Durchschnitt (€)"]);
      
      // Wochentage
      const weekdays = [
        "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
      ];
      
      // Dummy-Daten für Wochentage (in einer realen App kämen diese aus der API)
      const weekdayData = weekdays.map(day => {
        // Mehr Verkäufe am Wochenende
        let factor = 1;
        if (day === "Freitag") factor = 1.5;
        if (day === "Samstag") factor = 2;
        if (day === "Sonntag") factor = 1.7;
        
        const sales = Math.round(Math.random() * 50 * factor + 20);
        const revenue = Math.round(sales * (Math.random() * 10 + 8));
        const average = Math.round(revenue / sales);
        
        return [day, sales, revenue, average];
      });
      
      // Daten hinzufügen
      weekdayData.forEach(row => {
        excelData.push(row);
      });
      
      // Leerzeile
      excelData.push([]);
      
      // Stundenvergleich
      excelData.push(["Verkäufe nach Tageszeit"]);
      excelData.push(["Stunde", "Anzahl Verkäufe", "Umsatz (€)"]);
      
      // Stunden des Tages
      const hourData = [];
      for (let i = 12; i <= 26; i++) {
        // Umrechnung für Anzeige (12-26 Uhr zu 12-02 Uhr)
        const displayHour = i <= 23 ? i : i - 24;
        const hourLabel = `${displayHour.toString().padStart(2, '0')}:00`;
        
        // Mehr Verkäufe in den Abendstunden
        let factor = 1;
        if (i >= 18 && i <= 23) factor = 1.5 + (i - 18) * 0.1;
        if (i >= 24) factor = 1.5 - (i - 24) * 0.5;
        
        const sales = Math.round(Math.random() * 30 * factor + 5);
        const revenue = Math.round(sales * (Math.random() * 10 + 8));
        
        hourData.push([hourLabel, sales, revenue]);
      }
      
      // Daten hinzufügen
      hourData.forEach(row => {
        excelData.push(row);
      });
      
      // Arbeitsmappe erstellen
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Arbeitsblatt der Mappe hinzufügen
      XLSX.utils.book_append_sheet(wb, ws, "Zeitvergleich");
      
      // Excel-Datei speichern
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `zeitvergleich-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Stunden- und Tagesvergleich wurde erfolgreich als Excel exportiert!",
        severity: "success"
      });
    } catch (error) {
      console.error("Fehler beim Generieren des Excel-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim Excel-Export: ${error.message || error}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateStaffTimePDF = () => {
    try {
      // Neues PDF-Dokument erstellen
      const doc = createPdfDocument();
      
      // Titel
      doc.setFontSize(18);
      doc.text('Arbeitszeitübersicht Personal', 14, 15);
      
      // Monat
      const currentMonth = format(new Date(), 'MMMM yyyy');
      doc.setFontSize(11);
      doc.text(`Monat: ${currentMonth}`, 14, 23);
      
      // Mitarbeiter (Dummy-Daten)
      const staffMembers = [
        { id: 1, name: "Max Mustermann", position: "Barkeeper" },
        { id: 2, name: "Anna Schmidt", position: "Servicekraft" },
        { id: 3, name: "Jan Müller", position: "Barkeeper" },
        { id: 4, name: "Lisa Wagner", position: "Servicekraft" },
        { id: 5, name: "Tom Schulz", position: "Koch" }
      ];
      
      // Mitarbeiterübersicht
      doc.setFontSize(14);
      doc.text('Mitarbeiterübersicht', 14, 35);
      
      // Mitarbeiterdaten (zufällig generiert)
      const staffData = staffMembers.map(staff => {
        const baseHours = staff.position === "Barkeeper" ? 160 : 140;
        const hours = baseHours + Math.round(Math.random() * 20 - 10);
        const overtime = Math.max(0, hours - baseHours);
        const hourlyRate = staff.position === "Barkeeper" ? 15 : (staff.position === "Koch" ? 17 : 13);
        const salary = (baseHours * hourlyRate) + (overtime * hourlyRate * 1.25);
        
        return [
          staff.name,
          staff.position,
          hours.toString(),
          overtime.toString(),
          `${hourlyRate.toFixed(2)} €`,
          `${salary.toFixed(2)} €`
        ];
      });
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [["Name", "Position", "Arbeitsstunden", "Überstunden", "Stundenlohn (€)", "Verdienst (€)"]],
        body: staffData,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          2: { halign: 'right' },  // Arbeitsstunden
          3: { halign: 'right' },  // Überstunden
          4: { halign: 'right' },  // Stundenlohn
          5: { halign: 'right' }   // Verdienst
        }
      });
      
      // Position für detaillierte Übersicht
      let tableEndY = 40;
      try {
        tableEndY = doc.autoTable.previous?.finalY || 40;
      } catch (e) {
        console.warn("Konnte finalY nicht abrufen, verwende Standardposition", e);
      }
      
      // Detaillierte Arbeitszeitübersicht
      doc.setFontSize(14);
      doc.text('Detaillierte Arbeitszeitübersicht', 14, tableEndY + 15);
      
      // Zufälliges Datum im aktuellen Monat
      const getRandomDay = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = Math.floor(Math.random() * 28) + 1;
        return new Date(year, month, day);
      };
      
      // Generiere Schichten für jeden Mitarbeiter (Beispieldaten)
      let shiftData = [];
      staffMembers.forEach(staff => {
        // 2-3 Schichten für diese PDF-Version
        const shiftsCount = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < shiftsCount; i++) {
          const date = getRandomDay();
          const startHour = 14 + Math.floor(Math.random() * 4);
          const startMinute = Math.floor(Math.random() * 4) * 15;
          const durationHours = 6 + Math.floor(Math.random() * 4);
          const breakMinutes = 30 + Math.floor(Math.random() * 3) * 15;
          
          const startTime = `${startHour}:${startMinute.toString().padStart(2, '0')}`;
          const endHour = startHour + durationHours;
          const endTime = `${endHour}:${startMinute.toString().padStart(2, '0')}`;
          
          const workHours = durationHours - (breakMinutes / 60);
          
          shiftData.push([
            staff.name,
            format(date, 'dd.MM.yyyy'),
            startTime,
            endTime,
            breakMinutes.toString(),
            workHours.toFixed(2)
          ]);
        }
      });
      
      // Sortiere nach Datum
      shiftData.sort((a, b) => {
        const dateA = a[1].split('.').reverse().join('');
        const dateB = b[1].split('.').reverse().join('');
        return dateA.localeCompare(dateB);
      });
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [["Mitarbeiter", "Datum", "Von", "Bis", "Pausen (Min)", "Arbeitsstunden"]],
        body: shiftData,
        startY: tableEndY + 20,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          4: { halign: 'right' },  // Pausen
          5: { halign: 'right' }   // Arbeitsstunden
        }
      });
      
      // Erstellungsdatum unten hinzufügen
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, doc.internal.pageSize.height - 10);
      
      // PDF speichern
      doc.save(`arbeitszeiten-${format(new Date(), 'yyyy-MM')}.pdf`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Arbeitszeitübersicht wurde erfolgreich als PDF exportiert!",
        severity: "success"
      });
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Generieren des PDF-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim PDF-Export: ${error.message || error}`,
        severity: "error"
      });
      setLoading(false);
    }
  };
  
  const generateStaffTimeExcel = () => {
    try {
      // Daten für Excel vorbereiten
      const excelData = [];
      
      // Header
      const currentMonth = format(new Date(), 'MMMM yyyy');
      excelData.push(["Arbeitszeitübersicht Personal"]);
      excelData.push(["Monat:", currentMonth]);
      excelData.push([]);
      
      // Mitarbeiter (Dummy-Daten, in einer realen App würden Sie von der API kommen)
      const staffMembers = [
        { id: 1, name: "Max Mustermann", position: "Barkeeper" },
        { id: 2, name: "Anna Schmidt", position: "Servicekraft" },
        { id: 3, name: "Jan Müller", position: "Barkeeper" },
        { id: 4, name: "Lisa Wagner", position: "Servicekraft" },
        { id: 5, name: "Tom Schulz", position: "Koch" }
      ];
      
      // Übersicht erstellen
      excelData.push(["Mitarbeiterübersicht"]);
      excelData.push(["Name", "Position", "Arbeitsstunden", "Überstunden", "Stundenlohn (€)", "Verdienst (€)"]);
      
      // Mitarbeiterdaten (zufällig generiert)
      const staffData = staffMembers.map(staff => {
        const baseHours = staff.position === "Barkeeper" ? 160 : 140;
        const hours = baseHours + Math.round(Math.random() * 20 - 10);
        const overtime = Math.max(0, hours - baseHours);
        const hourlyRate = staff.position === "Barkeeper" ? 15 : (staff.position === "Koch" ? 17 : 13);
        const salary = (baseHours * hourlyRate) + (overtime * hourlyRate * 1.25);
        
        return [
          staff.name,
          staff.position,
          hours,
          overtime,
          hourlyRate.toFixed(2),
          salary.toFixed(2)
        ];
      });
      
      // Daten hinzufügen
      staffData.forEach(row => {
        excelData.push(row);
      });
      
      // Leerzeile
      excelData.push([]);
      
      // Detaillierte Arbeitszeitübersicht
      excelData.push(["Detaillierte Arbeitszeitübersicht"]);
      excelData.push(["Mitarbeiter", "Datum", "Von", "Bis", "Pausen (Min)", "Arbeitsstunden"]);
      
      // Zufälliges Datum im aktuellen Monat
      const getRandomDay = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = Math.floor(Math.random() * 28) + 1;
        return new Date(year, month, day);
      };
      
      // Generiere Schichten für jeden Mitarbeiter
      let shiftData = [];
      staffMembers.forEach(staff => {
        // 10-15 Schichten pro Mitarbeiter
        const shiftsCount = Math.floor(Math.random() * 6) + 10;
        
        for (let i = 0; i < shiftsCount; i++) {
          const date = getRandomDay();
          const startHour = 14 + Math.floor(Math.random() * 4); // Zwischen 14-18 Uhr
          const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30 oder 45 Minuten
          const durationHours = 6 + Math.floor(Math.random() * 4); // 6-10 Stunden
          const breakMinutes = 30 + Math.floor(Math.random() * 3) * 15; // 30-60 Minuten
          
          const startTime = `${startHour}:${startMinute.toString().padStart(2, '0')}`;
          const endHour = startHour + durationHours;
          const endTime = `${endHour}:${startMinute.toString().padStart(2, '0')}`;
          
          const workHours = durationHours - (breakMinutes / 60);
          
          shiftData.push([
            staff.name,
            format(date, 'dd.MM.yyyy'),
            startTime,
            endTime,
            breakMinutes,
            workHours.toFixed(2)
          ]);
        }
      });
      
      // Sortiere nach Datum
      shiftData.sort((a, b) => {
        const dateA = a[1].split('.').reverse().join('');
        const dateB = b[1].split('.').reverse().join('');
        return dateA.localeCompare(dateB);
      });
      
      // Daten hinzufügen
      shiftData.forEach(row => {
        excelData.push(row);
      });
      
      // Arbeitsmappe erstellen
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Arbeitsblatt der Mappe hinzufügen
      XLSX.utils.book_append_sheet(wb, ws, "Arbeitszeiten");
      
      // Excel-Datei speichern
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `arbeitszeiten-${format(new Date(), 'yyyy-MM')}.xlsx`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Arbeitszeitübersicht wurde erfolgreich als Excel exportiert!",
        severity: "success"
      });
    } catch (error) {
      console.error("Fehler beim Generieren des Excel-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim Excel-Export: ${error.message || error}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateStaffCostPDF = () => {
    try {
      // Neues PDF-Dokument erstellen
      const doc = createPdfDocument();
      
      // Titel
      doc.setFontSize(18);
      doc.text('Personalkosten Übersicht', 14, 15);
      
      // Jahr
      const currentYear = new Date().getFullYear();
      doc.setFontSize(11);
      doc.text(`Jahr: ${currentYear}`, 14, 23);
      
      // Abteilungsübersicht
      doc.setFontSize(14);
      doc.text('Personalkosten nach Abteilung', 14, 35);
      
      // Abteilungen
      const departments = [
        { name: "Bar", budget: 85000, expenses: 81250 },
        { name: "Service", budget: 62000, expenses: 64100 },
        { name: "Küche", budget: 110000, expenses: 108400 },
        { name: "Management", budget: 55000, expenses: 53200 },
        { name: "Reinigung", budget: 35000, expenses: 33900 }
      ];
      
      // Abteilungsdaten für Tabelle
      const deptData = departments.map(dept => {
        const difference = dept.budget - dept.expenses;
        const percentage = (dept.expenses / dept.budget * 100).toFixed(1);
        
        return [
          dept.name,
          `${dept.budget.toFixed(2)} €`,
          `${dept.expenses.toFixed(2)} €`,
          `${difference.toFixed(2)} €`,
          `${percentage}%`
        ];
      });
      
      // Berechne Gesamtwerte
      const totalBudget = departments.reduce((sum, dept) => sum + dept.budget, 0);
      const totalExpenses = departments.reduce((sum, dept) => sum + dept.expenses, 0);
      const totalDifference = totalBudget - totalExpenses;
      const totalPercentage = (totalExpenses / totalBudget * 100).toFixed(1);
      
      // Füge Gesamtzeile hinzu
      deptData.push([
        "Gesamt",
        `${totalBudget.toFixed(2)} €`,
        `${totalExpenses.toFixed(2)} €`,
        `${totalDifference.toFixed(2)} €`,
        `${totalPercentage}%`
      ]);
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [["Abteilung", "Budget (€)", "Ausgaben (€)", "Einsparungen/Überzug (€)", "Prozent vom Budget"]],
        body: deptData,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          1: { halign: 'right' },  // Budget
          2: { halign: 'right' },  // Ausgaben
          3: { halign: 'right' },  // Einsparungen/Überzug
          4: { halign: 'right' }   // Prozent
        }
      });
      
      // Position für Kostenentwicklung
      let tableEndY = 40;
      try {
        tableEndY = doc.autoTable.previous?.finalY || 40;
      } catch (e) {
        console.warn("Konnte finalY nicht abrufen, verwende Standardposition", e);
      }
      
      // Kostenentwicklung nach Monat
      doc.setFontSize(14);
      doc.text('Kostenentwicklung nach Monat', 14, tableEndY + 15);
      
      // Monate generieren
      const months = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1);
        months.push(format(date, 'MMMM'));
      }
      
      // Kostendaten nach Monat (Beispieldaten)
      const monthlyData = months.map((month, index) => {
        let seasonalFactor = 1.0;
        
        // Höhere Kosten im Sommer, niedrigere im Winter
        if (index >= 5 && index <= 7) {  // Sommer (Juni-August)
          seasonalFactor = 1.2;
        } else if (index >= 11 || index <= 1) {  // Winter (Dezember-Februar)
          seasonalFactor = 0.8;
        }
        
        const baseCost = (totalExpenses / 12) * seasonalFactor;
        const mainCost = Math.round(baseCost * 0.75);  // 75% Hauptkosten
        const additionalCost = Math.round(baseCost * 0.25);  // 25% Nebenkosten
        const totalCost = mainCost + additionalCost;
        
        return [
          month,
          `${mainCost.toFixed(2)} €`,
          `${additionalCost.toFixed(2)} €`,
          `${totalCost.toFixed(2)} €`
        ];
      });
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [["Monat", "Personalkosten (€)", "Lohnnebenkosten (€)", "Gesamt (€)"]],
        body: monthlyData,
        startY: tableEndY + 20,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          1: { halign: 'right' },  // Personalkosten
          2: { halign: 'right' },  // Lohnnebenkosten
          3: { halign: 'right' }   // Gesamt
        }
      });
      
      // Erstellungsdatum unten hinzufügen
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, doc.internal.pageSize.height - 10);
      
      // PDF speichern
      doc.save(`personalkosten-${currentYear}.pdf`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Personalkosten wurden erfolgreich als PDF exportiert!",
        severity: "success"
      });
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Generieren des PDF-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim PDF-Export: ${error.message || error}`,
        severity: "error"
      });
      setLoading(false);
    }
  };
  
  const generateStaffCostExcel = () => {
    try {
      // Daten für Excel vorbereiten
      const excelData = [];
      
      // Header
      const currentYear = new Date().getFullYear();
      excelData.push(["Personalkosten Übersicht"]);
      excelData.push(["Jahr:", currentYear.toString()]);
      excelData.push([]);
      
      // Personalkosten nach Abteilung
      excelData.push(["Personalkosten nach Abteilung"]);
      excelData.push(["Abteilung", "Budget (€)", "Ausgaben (€)", "Einsparungen/Überzug (€)", "Prozent vom Budget"]);
      
      // Abteilungen
      const departments = [
        { name: "Bar", budget: 85000, expenses: 81250 },
        { name: "Service", budget: 62000, expenses: 64100 },
        { name: "Küche", budget: 110000, expenses: 108400 },
        { name: "Management", budget: 55000, expenses: 53200 },
        { name: "Reinigung", budget: 35000, expenses: 33900 }
      ];
      
      // Daten hinzufügen
      let totalBudget = 0;
      let totalExpenses = 0;
      
      departments.forEach(dept => {
        const difference = dept.budget - dept.expenses;
        const percentage = (dept.expenses / dept.budget * 100).toFixed(1);
        
        excelData.push([
          dept.name,
          dept.budget,
          dept.expenses,
          difference,
          `${percentage}%`
        ]);
        
        totalBudget += dept.budget;
        totalExpenses += dept.expenses;
      });
      
      // Gesamt-Budget
      const totalDifference = totalBudget - totalExpenses;
      const totalPercentage = (totalExpenses / totalBudget * 100).toFixed(1);
      
      excelData.push([
        "Gesamt",
        totalBudget,
        totalExpenses,
        totalDifference,
        `${totalPercentage}%`
      ]);
      
      // Leerzeile
      excelData.push([]);
      
      // Kostenentwicklung nach Monat
      excelData.push(["Kostenentwicklung nach Monat"]);
      excelData.push(["Monat", "Personalkosten (€)", "Lohnnebenkosten (€)", "Gesamt (€)"]);
      
      // Monate generieren
      const months = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1);
        months.push(format(date, 'MMMM'));
      }
      
      // Zufällige Kosten generieren (basierend auf der Jahreszeit)
      const monthlyData = months.map((month, index) => {
        let seasonalFactor = 1.0;
        
        // Höhere Kosten im Sommer, niedrigere im Winter
        if (index >= 5 && index <= 7) {  // Sommer (Juni-August)
          seasonalFactor = 1.2;
        } else if (index >= 11 || index <= 1) {  // Winter (Dezember-Februar)
          seasonalFactor = 0.8;
        }
        
        const baseCost = (totalExpenses / 12) * seasonalFactor;
        const mainCost = Math.round(baseCost * 0.75);  // 75% Hauptkosten
        const additionalCost = Math.round(baseCost * 0.25);  // 25% Nebenkosten
        
        return [
          month,
          mainCost,
          additionalCost,
          mainCost + additionalCost
        ];
      });
      
      // Daten hinzufügen
      monthlyData.forEach(row => {
        excelData.push(row);
      });
      
      // Arbeitsmappe erstellen
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Arbeitsblatt der Mappe hinzufügen
      XLSX.utils.book_append_sheet(wb, ws, "Personalkosten");
      
      // Excel-Datei speichern
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `personalkosten-${currentYear}.xlsx`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Personalkosten wurden erfolgreich als Excel exportiert!",
        severity: "success"
      });
    } catch (error) {
      console.error("Fehler beim Generieren des Excel-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim Excel-Export: ${error.message || error}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateCompleteOverviewPDF = () => {
    // Neues PDF-Dokument erstellen
    try {
      const doc = createPdfDocument();
      
      // Titel
      doc.setFontSize(18);
      doc.text('Komplettübersicht', 14, 15);
      
      // Datum
      doc.setFontSize(11);
      doc.text(`Stand: ${format(new Date(), 'dd.MM.yyyy')}`, 14, 23);
      
      // Kurze Zusammenfassung erstellen
      doc.setFontSize(14);
      doc.text('Zusammenfassung', 14, 35);
      
      // Daten vorbereiten
      const summaryData = [
        ["Inventarposten", inventoryData.length],
        ["Aktuelle Verkäufe (30 Tage)", salesData.length],
        ["Einnahmen (Monat)", financesData.income.filter(item => {
          const itemDate = new Date(item.date);
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          return itemDate >= monthStart;
        }).length],
        ["Ausgaben (Monat)", financesData.expenses.filter(item => {
          const itemDate = new Date(item.date);
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          return itemDate >= monthStart;
        }).length],
      ];
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        body: summaryData,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 2
        },
        columnStyles: {
          1: { halign: 'right' }
        }
      });
      
      // Hinweis
      let summaryEndY = 40; // Default fallback position
      try {
        // Versuche den Wert zu erhalten, falls er existiert
        summaryEndY = doc.autoTable.previous?.finalY || 40;
      } catch (e) {
        console.warn("Konnte finalY nicht abrufen, verwende Standardposition", e);
      }
      doc.setFontSize(10);
      doc.text('Dieser Bericht ist eine Übersicht aller Bereiche. Für detaillierte Daten nutzen Sie bitte die', 14, summaryEndY + 15);
      doc.text('entsprechenden Einzelberichte.', 14, summaryEndY + 20);
      
      // Erstellungsdatum unten hinzufügen
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, doc.internal.pageSize.height - 10);
      
      // PDF speichern
      doc.save(`gesamtuebersicht-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Komplettübersicht wurde als PDF exportiert!",
        severity: "success"
      });
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Generieren des PDF-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim PDF-Export: ${error.message || error}`,
        severity: "error"
      });
      setLoading(false);
    }
  };
  
  const generateCompleteOverviewExcel = () => {
    try {
      // Arbeitsmappe erstellen
      const wb = XLSX.utils.book_new();
      
      // Zusammenfassungsseite
      const summaryData = [
        ["Bartender Gesamtübersicht"],
        ["Stand:", format(new Date(), 'dd.MM.yyyy')],
        [],
        ["Bereich", "Anzahl"],
        ["Inventarposten", inventoryData.length],
        ["Aktuelle Verkäufe (30 Tage)", salesData.length],
        ["Einnahmen (Monat)", financesData.income.filter(item => {
          const itemDate = new Date(item.date);
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          return itemDate >= monthStart;
        }).length],
        ["Ausgaben (Monat)", financesData.expenses.filter(item => {
          const itemDate = new Date(item.date);
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          return itemDate >= monthStart;
        }).length],
        [],
        ["Dieser Bericht ist eine Übersicht aller Bereiche. Für detaillierte Daten nutzen Sie bitte die"],
        ["entsprechenden Einzelberichte."],
      ];
      
      // Arbeitsblatt mit Zusammenfassung
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Übersicht");
      
      // Inventardaten
      const inventoryHeader = ["Artikel", "Kategorie", "Bestand", "Einheit", "Mindestbestand"];
      const inventoryRows = inventoryData.map(item => [
        item.name,
        item.category || '-',
        item.quantity,
        item.unit || 'Stk',
        item.minQuantity || 0
      ]);
      inventoryRows.unshift(inventoryHeader);
      
      const inventoryWs = XLSX.utils.aoa_to_sheet(inventoryRows);
      XLSX.utils.book_append_sheet(wb, inventoryWs, "Inventar");
      
      // Verkaufsdaten
      const salesHeader = ["Datum", "Betrag", "Zahlungsart", "Mitarbeiter"];
      const salesRows = salesData.map(sale => [
        formatDate(sale.date),
        parseFloat(sale.total || 0).toFixed(2),
        sale.paymentMethod || '-',
        sale.staffId || '-'
      ]);
      salesRows.unshift(salesHeader);
      
      const salesWs = XLSX.utils.aoa_to_sheet(salesRows);
      XLSX.utils.book_append_sheet(wb, salesWs, "Verkäufe");
      
      // Finanzendaten (Einnahmen)
      const incomeHeader = ["Datum", "Kategorie", "Beschreibung", "Betrag (€)"];
      const incomeRows = financesData.income.map(item => [
        formatDate(item.date),
        item.category || '-',
        item.description || '-',
        parseFloat(item.amount || 0).toFixed(2)
      ]);
      incomeRows.unshift(incomeHeader);
      
      const incomeWs = XLSX.utils.aoa_to_sheet(incomeRows);
      XLSX.utils.book_append_sheet(wb, incomeWs, "Einnahmen");
      
      // Finanzendaten (Ausgaben)
      const expenseHeader = ["Datum", "Kategorie", "Beschreibung", "Betrag (€)"];
      const expenseRows = financesData.expenses.map(item => [
        formatDate(item.date),
        item.category || '-',
        item.description || '-',
        parseFloat(item.amount || 0).toFixed(2)
      ]);
      expenseRows.unshift(expenseHeader);
      
      const expenseWs = XLSX.utils.aoa_to_sheet(expenseRows);
      XLSX.utils.book_append_sheet(wb, expenseWs, "Ausgaben");
      
      // Excel-Datei speichern
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `gesamtuebersicht-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Komplettübersicht wurde als Excel exportiert!",
        severity: "success"
      });
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Generieren des Excel-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim Excel-Export: ${error.message || error}`,
        severity: "error"
      });
      setLoading(false);
    }
  };
  
  // Bestandsbewegungen als PDF generieren
  const generateInventoryMovementsPDF = () => {
    try {
      // Neues PDF-Dokument erstellen
      const doc = createPdfDocument();
      
      // Titel
      doc.setFontSize(18);
      doc.text('Bestandsbewegungen', 14, 15);
      
      // Zeitraum
      doc.setFontSize(11);
      doc.text(`Zeitraum: ${format(new Date(new Date().setDate(new Date().getDate() - 30)), 'dd.MM.yyyy')} bis ${format(new Date(), 'dd.MM.yyyy')}`, 14, 23);
      
      // Tabelle erstellen
      const tableColumn = [
        "Artikel", 
        "Kategorie", 
        "Bestand", 
        "Einheit", 
        "Min. Bestand", 
        "Letzte Bestellung",
        "Lieferant"
      ];
      
      // Daten für die Tabelle vorbereiten
      const tableData = [];
      
      inventoryData.forEach(item => {
        tableData.push([
          item.name,
          item.category || '-',
          item.quantity,
          item.unit || 'Stk',
          item.minQuantity || 0,
          formatDate(item.lastOrderDate),
          item.supplier || '-'
        ]);
      });
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [tableColumn],
        body: tableData,
        startY: 30,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 1.5,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          2: { halign: 'right' }, // Bestand
          4: { halign: 'right' }  // Mindestbestand
        }
      });
      
      // Erstellungsdatum unten hinzufügen
      let finalY = 30; // Default fallback position
      try {
        // Versuche den Wert zu erhalten, falls er existiert
        finalY = doc.autoTable.previous?.finalY || 30;
      } catch (e) {
        console.warn("Konnte finalY nicht abrufen, verwende Standardposition", e);
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, finalY + 15);
      
      // PDF speichern
      doc.save(`bestandsbewegungen-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Bestandsbewegungen wurden erfolgreich als PDF exportiert!",
        severity: "success"
      });
    } catch (error) {
      console.error("Fehler beim Generieren des PDF-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim PDF-Export: ${error.message || error}`,
        severity: "error"
      });
    }
  };
  
  // Bestandsbewegungen als Excel generieren
  const generateInventoryMovementsExcel = () => {
    try {
      // Daten für Excel vorbereiten
      const excelData = [];
      
      // Header-Zeile hinzufügen
      excelData.push([
        "Artikel", 
        "Kategorie", 
        "Bestand", 
        "Einheit", 
        "Min. Bestand", 
        "Letzte Bestellung",
        "Lieferant"
      ]);
      
      // Daten hinzufügen
      inventoryData.forEach(item => {
        excelData.push([
          item.name,
          item.category || '-',
          item.quantity,
          item.unit || 'Stk',
          item.minQuantity || 0,
          formatDate(item.lastOrderDate),
          item.supplier || '-'
        ]);
      });
      
      // Arbeitsmappe erstellen
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Arbeitsblatt der Mappe hinzufügen
      XLSX.utils.book_append_sheet(wb, ws, "Bestandsbewegungen");
      
      // Excel-Datei speichern
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `bestandsbewegungen-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Bestandsbewegungen wurden erfolgreich als Excel exportiert!",
        severity: "success"
      });
    } catch (error) {
      console.error("Fehler beim Generieren des Excel-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim Excel-Export: ${error.message || error}`,
        severity: "error"
      });
    }
  };
  
  // Bestandsübersicht als PDF generieren
  const generateInventoryOverviewPDF = () => {
    try {
      // Neues PDF-Dokument erstellen
      const doc = createPdfDocument();
      
      // Titel
      doc.setFontSize(18);
      doc.text('Bestandsübersicht', 14, 15);
      
      // Datum
      doc.setFontSize(11);
      doc.text(`Stand: ${format(new Date(), 'dd.MM.yyyy')}`, 14, 23);
      
      // Tabelle erstellen
      const tableColumn = [
        "Artikel", 
        "Kategorie", 
        "Bestand", 
        "Einheit", 
        "Status",
        "Kosten pro Einheit",
        "Gesamt"
      ];
      
      // Daten für die Tabelle vorbereiten
      const tableData = [];
      
      inventoryData.forEach(item => {
        // Status ermitteln (kritisch, niedrig, OK)
        let status = "OK";
        if (item.quantity <= item.minQuantity / 2) {
          status = "Kritisch";
        } else if (item.quantity <= item.minQuantity) {
          status = "Niedrig";
        }
        
        // Kosten berechnen
        const costPerUnit = item.costPerUnit || 0;
        const totalCost = (item.quantity * costPerUnit).toFixed(2);
        
        tableData.push([
          item.name,
          item.category || '-',
          item.quantity,
          item.unit || 'Stk',
          status,
          `${costPerUnit.toFixed(2)} €`,
          `${totalCost} €`
        ]);
      });
      
      // Tabelle zur PDF hinzufügen
      doc.autoTable({
        head: [tableColumn],
        body: tableData,
        startY: 30,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 1.5,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          2: { halign: 'right' }, // Bestand
          5: { halign: 'right' }, // Kosten pro Einheit
          6: { halign: 'right' }  // Gesamt
        }
      });
      
      // Gesamtwert berechnen
      const totalValue = inventoryData.reduce((sum, item) => {
        return sum + (item.quantity * (item.costPerUnit || 0));
      }, 0);
      
      // Gesamtwert und Erstellungsdatum unten hinzufügen
      let finalY = 30; // Default fallback position
      try {
        // Versuche den Wert zu erhalten, falls er existiert
        finalY = doc.autoTable.previous?.finalY || 30;
      } catch (e) {
        console.warn("Konnte finalY nicht abrufen, verwende Standardposition", e);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`Gesamtwert: ${totalValue.toFixed(2)} €`, 14, finalY + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, finalY + 15);
      
      // PDF speichern
      doc.save(`bestandsuebersicht-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Bestandsübersicht wurde erfolgreich als PDF exportiert!",
        severity: "success"
      });
    } catch (error) {
      console.error("Fehler beim Generieren des PDF-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim PDF-Export: ${error.message || error}`,
        severity: "error"
      });
    }
  };
  
  // Bestandsübersicht als Excel generieren
  const generateInventoryOverviewExcel = () => {
    try {
      // Daten für Excel vorbereiten
      const excelData = [];
      
      // Header-Zeile hinzufügen
      excelData.push([
        "Artikel", 
        "Kategorie", 
        "Bestand", 
        "Einheit", 
        "Status",
        "Kosten pro Einheit (€)",
        "Gesamt (€)"
      ]);
      
      // Daten hinzufügen
      inventoryData.forEach(item => {
        // Status ermitteln (kritisch, niedrig, OK)
        let status = "OK";
        if (item.quantity <= item.minQuantity / 2) {
          status = "Kritisch";
        } else if (item.quantity <= item.minQuantity) {
          status = "Niedrig";
        }
        
        // Kosten berechnen
        const costPerUnit = item.costPerUnit || 0;
        const totalCost = item.quantity * costPerUnit;
        
        excelData.push([
          item.name,
          item.category || '-',
          item.quantity,
          item.unit || 'Stk',
          status,
          costPerUnit,
          totalCost
        ]);
      });
      
      // Gesamtwert berechnen
      const totalValue = inventoryData.reduce((sum, item) => {
        return sum + (item.quantity * (item.costPerUnit || 0));
      }, 0);
      
      // Gesamtzeile hinzufügen
      excelData.push([
        "", "", "", "", "", "Gesamtwert:", totalValue
      ]);
      
      // Arbeitsmappe erstellen
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Arbeitsblatt der Mappe hinzufügen
      XLSX.utils.book_append_sheet(wb, ws, "Bestandsübersicht");
      
      // Excel-Datei speichern
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `bestandsuebersicht-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      // Erfolgs-Nachricht anzeigen
      setSnackbar({
        open: true,
        message: "Bestandsübersicht wurde erfolgreich als Excel exportiert!",
        severity: "success"
      });
    } catch (error) {
      console.error("Fehler beim Generieren des Excel-Berichts:", error);
      setSnackbar({
        open: true,
        message: `Fehler beim Excel-Export: ${error.message || error}`,
        severity: "error"
      });
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Snackbar für Benachrichtigungen */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Dialog zur Bestätigung (allgemein) */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>{currentReport} - Export</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bitte wählen Sie das Exportformat:
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button 
            onClick={() => generateReport(currentReport, 'excel')} 
            variant="outlined" 
            startIcon={<TableIcon />}
            disabled={loading}
          >
            {loading ? 'Wird generiert...' : 'Excel - Exportieren'}
          </Button>
          <Button 
            onClick={() => generateReport(currentReport, 'pdf')} 
            variant="contained" 
            startIcon={<PdfIcon />}
            disabled={loading}
          >
            {loading ? 'Wird generiert...' : 'PDF - Exportieren'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog für formatspezifischen Export */}
      <Dialog open={formatSpecificDialogOpen} onClose={handleCloseFormatDialog}>
        <DialogTitle>{currentReport}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie den Bericht als {selectedFormat === 'pdf' ? 'PDF' : 'Excel'} exportieren?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormatDialog}>Abbrechen</Button>
          <Button 
            onClick={() => {
              generateReport(currentReport, selectedFormat);
              handleCloseFormatDialog();
            }} 
            variant="contained" 
            startIcon={selectedFormat === 'pdf' ? <PdfIcon /> : <TableIcon />}
            color="primary"
            disabled={loading}
          >
            {loading ? 'Wird generiert...' : `${selectedFormat === 'pdf' ? 'PDF' : 'Excel'} - Exportieren`}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Ladeindikator */}
      {loading && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1300
        }}>
          <Paper sx={{ 
            padding: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2 
          }}>
            <CircularProgress />
            <Typography variant="body1">
              Report wird generiert...
            </Typography>
          </Paper>
        </Box>
      )}
    
      {/* Seitenkopf */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Berichte
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Erstellen und exportieren Sie Berichte über Ihre Bar-Daten
        </Typography>
      </Box>
      
      {/* Berichtskarten */}
      <Grid container spacing={3}>
        {/* Finanzberichte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ReportIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Finanzberichte</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Monatsabschluss
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Vollständiger Bericht über Einnahmen, Ausgaben und Gewinne für den aktuellen Monat.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                        onClick={() => handleOpenDialog('Monatsabschluss', 'pdf')}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                        onClick={() => handleOpenDialog('Monatsabschluss', 'excel')}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Jahresübersicht
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Finanzieller Jahresüberblick mit monatlicher Aufschlüsselung.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                        onClick={() => handleOpenDialog('Jahresübersicht', 'pdf')}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                        onClick={() => handleOpenDialog('Jahresübersicht', 'excel')}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Verkaufsberichte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ReportIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Verkaufsberichte</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Getränkeverkäufe
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Detaillierte Analyse der verkauften Getränke nach Kategorie und Einzelprodukt.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                        onClick={() => handleOpenDialog('Getränkeverkäufe', 'pdf')}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                        onClick={() => handleOpenDialog('Getränkeverkäufe', 'excel')}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Stunden- und Tagesvergleich
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Verkaufsanalyse nach Tageszeit und Wochentag.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                        onClick={() => handleOpenDialog('Stunden- und Tagesvergleich', 'pdf')}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                        onClick={() => handleOpenDialog('Stunden- und Tagesvergleich', 'excel')}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Inventarbeichte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ReportIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Inventarberichte</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Bestandsübersicht
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Vollständige Inventarliste mit aktuellem Bestand und Bestellempfehlungen.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                        onClick={() => handleOpenDialog('Bestandsübersicht', 'pdf')}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                        onClick={() => handleOpenDialog('Bestandsübersicht', 'excel')}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Bestandsbewegungen
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Bestandszugänge und -abgänge im vergangenen Monat.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                        onClick={() => handleOpenDialog('Bestandsbewegungen', 'pdf')}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                        onClick={() => handleOpenDialog('Bestandsbewegungen', 'excel')}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Personalberichte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ReportIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Personalberichte</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Arbeitszeitübersicht
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Arbeitsstunden und Vergütung nach Mitarbeiter.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                        onClick={() => handleOpenDialog('Arbeitszeitübersicht', 'pdf')}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                        onClick={() => handleOpenDialog('Arbeitszeitübersicht', 'excel')}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Personalkosten
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Vollständige Analyse aller Personalkosten nach Rolle und Abteilung.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                        onClick={() => handleOpenDialog('Personalkosten', 'pdf')}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                        onClick={() => handleOpenDialog('Personalkosten', 'excel')}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Aktionen/Funktionen */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h6">Berichtsaktionen</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Button 
                variant="outlined" 
                startIcon={<PrintIcon />}
                onClick={() => handleOpenDialog('Gesamtübersicht', 'pdf')}
              >
                Drucken
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<TableIcon />}
                onClick={() => handleOpenDialog('Gesamtübersicht', 'excel')}
              >
                Als Excel exportieren
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<PdfIcon />}
                onClick={() => handleOpenDialog('Gesamtübersicht', 'pdf')}
              >
                Als PDF exportieren
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ShareIcon />}
                onClick={() => {
                  setSnackbar({
                    open: true,
                    message: 'E-Mail-Funktion noch nicht implementiert',
                    severity: 'warning'
                  });
                }}
              >
                Per E-Mail senden
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;