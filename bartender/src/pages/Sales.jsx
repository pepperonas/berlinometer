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
  CalendarMonth as CalendarIcon,
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  Assessment as ReportIcon,
  BarChart as ChartIcon,
  Description as ReportFileIcon,
  FilePresent as FilePresentIcon,
  Analytics as AnalyticsIcon,
  DateRange as DateRangeIcon,
  Inventory as InventoryIcon,
  Insights as InsightsIcon,
  AccessTime as TimeIcon,
  ReceiptLong as ReceiptIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { PAYMENT_METHODS, INVENTORY_CATEGORIES, INVENTORY_UNITS, DRINK_CATEGORIES } from '../utils/constants';
import { salesApi, drinksApi, staffApi, inventoryApi, suppliersApi } from '../services/api';
import { posFormats } from '../services/mockData';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  
  // State für Report-Dialog
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('monthly');
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  
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
  
  // Report-Dialog öffnen
  const handleOpenReportDialog = () => {
    // Setze Standard-Zeitraum abhängig vom gewählten Bericht
    if (selectedReportType === 'monthly') {
      setReportDateRange({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59)
      });
    } else if (selectedReportType === 'yearly') {
      setReportDateRange({
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59)
      });
    } else if (selectedReportType === 'daily') {
      // Für Tagesvergleich: Die letzten 7 Tage
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      setReportDateRange({ startDate, endDate });
    }
    
    setReportDialogOpen(true);
  };
  
  // Report-Dialog schließen
  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
  };
  
  // Report-Typ ändern
  const handleReportTypeChange = (event) => {
    const newType = event.target.value;
    setSelectedReportType(newType);
    
    // Anpassen des Zeitraums abhängig vom Berichtstyp
    if (newType === 'monthly') {
      setReportDateRange({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59)
      });
    } else if (newType === 'yearly') {
      setReportDateRange({
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59)
      });
    } else if (newType === 'daily') {
      // Für Tagesvergleich: Die letzten 7 Tage
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      setReportDateRange({ startDate, endDate });
    }
  };
  
  // Bericht generieren
  const handleGenerateReport = () => {
    switch (selectedReportType) {
      case 'monthly':
        handleExportData('monthly-report');
        break;
      case 'yearly':
        handleExportData('yearly-report');
        break;
      case 'hourly-daily':
        handleExportData('hourly-daily-report');
        break;
      case 'drinks':
        handleExportData('drinks-report');
        break;
      case 'inventory-overview':
        handleExportData('inventory-overview-report');
        break;
      case 'inventory-movements':
        handleExportData('inventory-movements-report');
        break;
      case 'working-hours':
        handleExportData('working-hours-report');
        break;
      case 'overall':
        handleExportData('overall-report');
        break;
      default:
        handleExportData('monthly-report');
    }
    
    handleCloseReportDialog();
  };
  
  // PDF Export
  const handleExportPDF = () => {
    setExportFormat('pdf');
    setExportLoading(true);
    
    try {
      // PDF erstellen mit jsPDF
      const doc = new jsPDF();
      
      // Titel
      doc.setFontSize(18);
      doc.text('Verkaufsübersicht', 14, 15);
      
      // Zeitraum
      doc.setFontSize(11);
      doc.text(`Zeitraum: ${format(dateRange.startDate, 'dd.MM.yyyy')} bis ${format(dateRange.endDate, 'dd.MM.yyyy')}`, 14, 23);
      
      // Tabelle erstellen
      const tableColumn = [
        "Datum", 
        "Getränk", 
        "Menge", 
        "Preis (€)", 
        "Gesamt (€)", 
        "Zahlungsart", 
        "Mitarbeiter"
      ];
      
      // Daten für die Tabelle vorbereiten
      const tableData = [];
      
      filteredSales.forEach(sale => {
        const saleDate = formatDate(sale.date);
        const paymentMethod = getPaymentMethodLabel(sale.paymentMethod);
        const staffName = staff.find(s => s.id === sale.staffId || s._id === sale.staffId)?.name || 
                        (typeof sale.staffId === 'string' ? sale.staffId : 'Unbekannt');
        
        // Für jedes Item eine Zeile
        sale.items.forEach(item => {
          tableData.push([
            saleDate,
            item.name,
            item.quantity,
            parseFloat(item.pricePerUnit).toFixed(2),
            (parseFloat(item.quantity) * parseFloat(item.pricePerUnit)).toFixed(2),
            paymentMethod,
            staffName
          ]);
        });
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
          2: { halign: 'right' }, // Menge
          3: { halign: 'right' }, // Preis
          4: { halign: 'right' }  // Gesamt
        }
      });
      
      // Gesamtsumme berechnen
      const totalSales = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
      
      // Gesamtsumme und Erstellungsdatum unten hinzufügen
      const finalY = doc.autoTable.previous.finalY || 30;
      doc.setFont('helvetica', 'bold');
      doc.text(`Gesamtumsatz: ${totalSales.toFixed(2)} €`, 14, finalY + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, finalY + 15);
      
      // PDF speichern
      doc.save(`verkaufe-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      console.log('PDF export successful');
      
      handleCloseExportMenu();
      setExportLoading(false);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Fehler beim Exportieren als PDF: ' + (err.message || err));
      handleCloseExportMenu();
      setExportLoading(false);
    }
  };
  
  // Excel Export
  const handleExportExcel = () => {
    setExportFormat('excel');
    setExportLoading(true);
    
    try {
      // Daten für Excel vorbereiten
      const excelData = [];
      
      // Header-Zeile hinzufügen
      excelData.push([
        'Datum', 
        'Getränk', 
        'Menge', 
        'Preis (€)', 
        'Gesamt (€)', 
        'Zahlungsart', 
        'Mitarbeiter', 
        'Notizen'
      ]);
      
      // Daten hinzufügen
      filteredSales.forEach(sale => {
        const saleDate = formatDate(sale.date);
        const paymentMethod = getPaymentMethodLabel(sale.paymentMethod);
        const staffName = staff.find(s => s.id === sale.staffId || s._id === sale.staffId)?.name || 
                        (typeof sale.staffId === 'string' ? sale.staffId : 'Unbekannt');
        
        // Für jedes Item eine Zeile
        sale.items.forEach(item => {
          excelData.push([
            saleDate,
            item.name,
            item.quantity,
            parseFloat(item.pricePerUnit).toFixed(2),
            (parseFloat(item.quantity) * parseFloat(item.pricePerUnit)).toFixed(2),
            paymentMethod,
            staffName,
            sale.notes || ''
          ]);
        });
      });
      
      // Excel-Arbeitsblatt erstellen
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Spaltenbreiten anpassen
      const wscols = [
        { wch: 18 },  // Datum
        { wch: 25 },  // Getränk
        { wch: 7 },   // Menge
        { wch: 10 },  // Preis
        { wch: 10 },  // Gesamt
        { wch: 15 },  // Zahlungsart
        { wch: 20 },  // Mitarbeiter
        { wch: 30 }   // Notizen
      ];
      ws['!cols'] = wscols;
      
      // Arbeitsmappe erstellen und Arbeitsblatt hinzufügen
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Verkaufsübersicht');
      
      // Excel-Datei herunterladen
      XLSX.writeFile(wb, `verkaufe-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      console.log('Excel export successful');
      
      handleCloseExportMenu();
      setExportLoading(false);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Fehler beim Exportieren als Excel: ' + (err.message || err));
      handleCloseExportMenu();
      setExportLoading(false);
    }
  };

  // Monatsabschluss-Bericht generieren
  const generateMonthlyReport = () => {
    setExportFormat('monthly-report');
    setExportLoading(true);
    
    try {
      // Aktuellen Monat und Jahr bestimmen
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Start- und Enddatum für den aktuellen Monat
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      
      // Daten für den aktuellen Monat filtern
      const monthlySales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      });
      
      console.log(`Generating monthly report for ${format(startDate, 'MMMM yyyy')} with ${monthlySales.length} sales`);
      
      if (monthlySales.length === 0) {
        setError(`Keine Verkäufe im ${format(startDate, 'MMMM yyyy')} gefunden.`);
        setExportLoading(false);
        return;
      }
      
      // PDF erstellen
      const doc = new jsPDF();
      
      // Titel
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`Monatsabschluss ${format(startDate, 'MMMM yyyy')}`, 14, 15);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Erstellt am: ${format(currentDate, 'dd.MM.yyyy HH:mm')}`, 14, 22);
      
      // Zusammenfassung der monatlichen Verkäufe
      const totalRevenue = monthlySales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
      const totalItems = monthlySales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);
      
      // Aufteilung nach Zahlungsarten
      const paymentMethods = {};
      monthlySales.forEach(sale => {
        const method = sale.paymentMethod || 'cash';
        if (!paymentMethods[method]) {
          paymentMethods[method] = { count: 0, total: 0 };
        }
        paymentMethods[method].count += 1;
        paymentMethods[method].total += parseFloat(sale.total || 0);
      });
      
      // Getränkestatistik
      const drinkStats = {};
      monthlySales.forEach(sale => {
        sale.items.forEach(item => {
          if (!drinkStats[item.name]) {
            drinkStats[item.name] = { quantity: 0, revenue: 0 };
          }
          drinkStats[item.name].quantity += item.quantity;
          drinkStats[item.name].revenue += item.quantity * item.pricePerUnit;
        });
      });
      
      // Top-Getränke nach Umsatz
      const topDrinks = Object.entries(drinkStats)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10);
      
      // Tagesumsätze
      const dailySales = {};
      monthlySales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const dateKey = format(saleDate, 'yyyy-MM-dd');
        
        if (!dailySales[dateKey]) {
          dailySales[dateKey] = {
            date: format(saleDate, 'dd.MM.yyyy'),
            count: 0,
            total: 0
          };
        }
        
        dailySales[dateKey].count += 1;
        dailySales[dateKey].total += parseFloat(sale.total || 0);
      });
      
      // Sortierte Tagesumsätze für die Tabelle
      const sortedDailySales = Object.values(dailySales)
        .sort((a, b) => {
          const dateA = new Date(a.date.split('.').reverse().join('-'));
          const dateB = new Date(b.date.split('.').reverse().join('-'));
          return dateA - dateB;
        });
      
      // Zusammenfassung zeichnen
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Zusammenfassung', 14, 35);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gesamtumsatz: ${totalRevenue.toFixed(2)} €`, 20, 45);
      doc.text(`Anzahl Verkäufe: ${monthlySales.length}`, 20, 52);
      doc.text(`Verkaufte Artikel: ${totalItems}`, 20, 59);
      doc.text(`Durchschnittlicher Verkaufswert: ${(totalRevenue / monthlySales.length).toFixed(2)} €`, 20, 66);
      
      // Zahlungsarten-Tabelle
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Zahlungsarten', 14, 80);
      
      const paymentMethodRows = Object.entries(paymentMethods).map(([method, data]) => {
        const label = PAYMENT_METHODS.find(m => m.id === method)?.name || method;
        const percentage = ((data.total / totalRevenue) * 100).toFixed(1);
        return [label, data.count, `${data.total.toFixed(2)} €`, `${percentage}%`];
      });
      
      doc.autoTable({
        startY: 85,
        head: [['Zahlungsart', 'Anzahl', 'Umsatz', 'Anteil']],
        body: paymentMethodRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      // Top-Getränke-Tabelle
      const finalY1 = doc.autoTable.previous.finalY || 85;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Getränke', 14, finalY1 + 15);
      
      const topDrinkRows = topDrinks.map(([name, data]) => {
        const percentage = ((data.revenue / totalRevenue) * 100).toFixed(1);
        return [name, data.quantity, `${data.revenue.toFixed(2)} €`, `${percentage}%`];
      });
      
      doc.autoTable({
        startY: finalY1 + 20,
        head: [['Getränk', 'Menge', 'Umsatz', 'Anteil']],
        body: topDrinkRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      // Tagesumsätze-Tabelle auf neuer Seite
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Tagesumsätze', 14, 15);
      
      const dailySalesRows = sortedDailySales.map(day => [
        day.date, 
        day.count, 
        `${day.total.toFixed(2)} €`
      ]);
      
      doc.autoTable({
        startY: 25,
        head: [['Datum', 'Anzahl Verkäufe', 'Umsatz']],
        body: dailySalesRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' }
        }
      });
      
      // Fußzeile
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Seite ${i} von ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text('Bartender - Monatsabschluss', 14, doc.internal.pageSize.getHeight() - 10);
      }
      
      // PDF speichern
      doc.save(`Monatsabschluss-${format(startDate, 'yyyy-MM')}.pdf`);
      
      console.log('Monthly report generated successfully');
    } catch (err) {
      console.error('Error generating monthly report:', err);
      setError('Fehler beim Generieren des Monatsabschluss-Berichts');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Stunden- und Tagesvergleich-Bericht generieren
  const generateHourlyDailyReport = async () => {
    setExportFormat('hourly-daily-report');
    setExportLoading(true);
    
    try {
      // Verkaufsdaten vom Server laden
      const salesData = await salesApi.getAll();
      
      console.log(`Generating hourly and daily comparison report with ${salesData.length} sales`);
      
      if (salesData.length === 0) {
        setError('Keine Verkaufsdaten gefunden.');
        setExportLoading(false);
        return;
      }
      
      // Aktuelle Zeitperioden berechnen
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      // Monatsanfang bis heute
      const monthStartDate = new Date(currentYear, currentMonth, 1);
      
      // Verkäufe für den aktuellen Monat filtern
      const monthSales = salesData.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= monthStartDate && saleDate <= currentDate;
      });
      
      // PDF erstellen
      const doc = new jsPDF();
      
      // Titel
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Stunden- und Tagesvergleich', 14, 15);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Erstellt am: ${format(currentDate, 'dd.MM.yyyy HH:mm')}`, 14, 22);
      doc.text(`Zeitraum: ${format(monthStartDate, 'dd.MM.yyyy')} - ${format(currentDate, 'dd.MM.yyyy')}`, 14, 28);
      
      // Stündliche Verteilung der Verkäufe
      const hourlyDistribution = Array(24).fill(0); // 0-23 Stunden
      const hourlyRevenue = Array(24).fill(0);
      const hourlyCount = Array(24).fill(0);
      
      // Wöchentliche Verteilung der Verkäufe
      const weekdayDistribution = Array(7).fill(0); // 0-6 (Sonntag bis Samstag)
      const weekdayRevenue = Array(7).fill(0);
      const weekdayCount = Array(7).fill(0);
      
      // Daten für die Verteilungen sammeln
      monthSales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const hour = saleDate.getHours();
        const weekday = saleDate.getDay(); // 0 = Sonntag, 6 = Samstag
        
        // Stündliche Verteilung
        hourlyDistribution[hour] += parseFloat(sale.total || 0);
        hourlyCount[hour] += 1;
        hourlyRevenue[hour] += parseFloat(sale.total || 0);
        
        // Wöchentliche Verteilung
        weekdayDistribution[weekday] += parseFloat(sale.total || 0);
        weekdayCount[weekday] += 1;
        weekdayRevenue[weekday] += parseFloat(sale.total || 0);
      });
      
      // Stündliche Verteilung darstellen
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Umsatzverteilung nach Stunden', 14, 40);
      
      // Bestimmen der umsatzstärksten und -schwächsten Stunden
      const maxHourRevenue = Math.max(...hourlyRevenue);
      const minHourRevenue = Math.min(...hourlyRevenue.filter(r => r > 0)) || 0;
      const peakHour = hourlyRevenue.indexOf(maxHourRevenue);
      
      // Stündliche Verteilung als Tabelle
      const hourlyRows = hourlyRevenue.map((revenue, hour) => {
        const count = hourlyCount[hour];
        const avgPerSale = count > 0 ? revenue / count : 0;
        
        // Formatierte Stundendarstellung 
        const hourLabel = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
        
        // Uhrzeit-Kategorie bestimmen
        let timeCategory = '';
        if (hour >= 6 && hour < 11) timeCategory = 'Morgen';
        else if (hour >= 11 && hour < 14) timeCategory = 'Mittag';
        else if (hour >= 14 && hour < 17) timeCategory = 'Nachmittag';
        else if (hour >= 17 && hour < 22) timeCategory = 'Abend';
        else timeCategory = 'Nacht';
        
        return [
          hourLabel,
          timeCategory,
          count,
          `${revenue.toFixed(2)} €`,
          count > 0 ? `${avgPerSale.toFixed(2)} €` : '-',
          revenue === maxHourRevenue ? '★' : ''
        ];
      });
      
      doc.autoTable({
        startY: 45,
        head: [['Uhrzeit', 'Tageszeit', 'Anzahl Verkäufe', 'Umsatz', 'Ø pro Verkauf', 'Peak']],
        body: hourlyRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        },
        rowStyles: row => {
          // Besondere Formatierung für die Stoßzeiten
          const hour = row.index;
          if (hourlyRevenue[hour] === maxHourRevenue) {
            return { 
              fillColor: [230, 247, 255],
              textColor: [0, 0, 0],
              fontStyle: 'bold'
            };
          }
          return {};
        }
      });
      
      // Wöchentliche Verteilung auf einer neuen Seite
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Verteilung nach Wochentagen', 14, 15);
      
      const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      
      // Bestimmen des umsatzstärksten und -schwächsten Wochentags
      const maxWeekdayRevenue = Math.max(...weekdayRevenue);
      const minWeekdayRevenue = Math.min(...weekdayRevenue.filter(r => r > 0)) || 0;
      const peakWeekday = weekdayRevenue.indexOf(maxWeekdayRevenue);
      
      // Wöchentliche Verteilung als Tabelle
      const weekdayRows = weekdayRevenue.map((revenue, day) => {
        const count = weekdayCount[day];
        const avgPerSale = count > 0 ? revenue / count : 0;
        
        // Wochenende hervorheben
        const isWeekend = day === 0 || day === 6;
        
        return [
          weekdays[day],
          isWeekend ? 'Wochenende' : 'Wochentag',
          count,
          `${revenue.toFixed(2)} €`,
          count > 0 ? `${avgPerSale.toFixed(2)} €` : '-',
          revenue === maxWeekdayRevenue ? '★' : ''
        ];
      });
      
      doc.autoTable({
        startY: 25,
        head: [['Wochentag', 'Typ', 'Anzahl Verkäufe', 'Umsatz', 'Ø pro Verkauf', 'Peak']],
        body: weekdayRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        },
        rowStyles: row => {
          // Besondere Formatierung für die Stoßzeiten
          const day = row.index;
          if (weekdayRevenue[day] === maxWeekdayRevenue) {
            return { 
              fillColor: [230, 247, 255],
              textColor: [0, 0, 0],
              fontStyle: 'bold'
            };
          }
          // Wochenende hervorheben
          if (day === 0 || day === 6) {
            return { 
              fillColor: [255, 245, 230]
            };
          }
          return {};
        }
      });
      
      // Kombinierte Wochentag-Stunden-Heatmap
      const finalY1 = doc.autoTable.previous.finalY || 25;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Heatmap: Verkäufe nach Wochentag und Uhrzeit', 14, finalY1 + 15);
      
      // Die Heatmap zeigt die Verkaufszahlen für bestimmte Zeitblöcke nach Wochentagen
      // Vereinfachte Version mit 4 Zeitblöcken pro Tag
      const timeBlocks = [
        { name: 'Morgen', start: 6, end: 11 },
        { name: 'Mittag', start: 11, end: 14 },
        { name: 'Nachmittag', start: 14, end: 17 },
        { name: 'Abend', start: 17, end: 22 },
        { name: 'Nacht', start: 22, end: 6 }
      ];
      
      // Anzahl der Verkäufe pro Zeitblock und Wochentag zählen
      const heatmapData = Array(7).fill().map(() => Array(timeBlocks.length).fill(0));
      const heatmapRevenue = Array(7).fill().map(() => Array(timeBlocks.length).fill(0));
      
      monthSales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const hour = saleDate.getHours();
        const weekday = saleDate.getDay();
        
        // Zeitblock finden
        let blockIndex = -1;
        for (let i = 0; i < timeBlocks.length; i++) {
          const block = timeBlocks[i];
          if (block.start <= block.end) {
            // Normaler Zeitblock (z.B. 6-11 Uhr)
            if (hour >= block.start && hour < block.end) {
              blockIndex = i;
              break;
            }
          } else {
            // Zeitblock über Mitternacht (z.B. 22-6 Uhr)
            if (hour >= block.start || hour < block.end) {
              blockIndex = i;
              break;
            }
          }
        }
        
        if (blockIndex !== -1) {
          heatmapData[weekday][blockIndex] += 1;
          heatmapRevenue[weekday][blockIndex] += parseFloat(sale.total || 0);
        }
      });
      
      // Höchsten Wert für die Heatmap finden (für Farbskalierung)
      const maxHeatmapValue = Math.max(...heatmapData.flatMap(row => row));
      
      // Heatmap-Daten für die Tabelle formatieren
      const heatmapRows = weekdays.map((weekday, dayIndex) => {
        const rowData = [weekday];
        
        timeBlocks.forEach((block, blockIndex) => {
          const count = heatmapData[dayIndex][blockIndex];
          const revenue = heatmapRevenue[dayIndex][blockIndex];
          
          rowData.push(`${count} (${revenue.toFixed(0)} €)`);
        });
        
        return rowData;
      });
      
      doc.autoTable({
        startY: finalY1 + 20,
        head: [['Wochentag', ...timeBlocks.map(block => block.name)]],
        body: heatmapRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' }
        },
        didDrawCell: (data) => {
          // Zellen einfärben basierend auf der Anzahl der Verkäufe
          if (data.section === 'body' && data.column.index > 0) {
            const cellValue = heatmapData[data.row.index][data.column.index - 1];
            const intensity = cellValue / maxHeatmapValue;
            
            // Farbgebung von weiß bis dunkelblau
            const blue = Math.round(255 - intensity * 200);
            const red = Math.round(255 - intensity * 100);
            const green = Math.round(255 - intensity * 50);
            
            // Zelle einfärben
            doc.setFillColor(red, green, blue);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            
            // Text in schwarz oder weiß, je nach Farbintensität
            if (intensity > 0.7) {
              doc.setTextColor(255, 255, 255);
            } else {
              doc.setTextColor(0, 0, 0);
            }
            
            // Text neu schreiben
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const text = data.cell.text[0];
            const textWidth = doc.getStringUnitWidth(text) * 10 / doc.internal.scaleFactor;
            const textX = data.cell.x + (data.cell.width - textWidth) / 2;
            const textY = data.cell.y + data.cell.height / 2 + 3;
            doc.text(text, textX, textY);
          }
        }
      });
      
      // Neue Seite für Handlungsempfehlungen
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Analyse und Handlungsempfehlungen', 14, 15);
      
      // Analyse der Daten für Empfehlungen
      const totalRevenue = monthSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
      const totalSales = monthSales.length;
      
      // Peak-Stunden und Wochentage identifizieren
      const peakHours = hourlyRevenue.map((revenue, hour) => ({ hour, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3)
        .map(item => item.hour);
      
      const peakDays = weekdayRevenue.map((revenue, day) => ({ day, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3)
        .map(item => item.day);
      
      // Beste und schlechteste Zeiten für den Umsatz
      const bestHours = peakHours.map(hour => `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`).join(', ');
      const bestDays = peakDays.map(day => weekdays[day]).join(', ');
      
      // Schlüsselerkenntnisse
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Schlüsselerkenntnisse', 14, 25);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      let insightY = 35;
      const insights = [
        `Die umsatzstärksten Stunden sind: ${bestHours}`,
        `Die umsatzstärksten Wochentage sind: ${bestDays}`,
        `Durchschnittlicher Umsatz pro Verkauf: ${(totalRevenue / totalSales).toFixed(2)} €`,
        `Stoßzeiten: ${timeBlocks.find(block => block.start <= peakHours[0] && block.end > peakHours[0])?.name || 'Abend'} (${peakHours[0]}:00 Uhr)`,
        `Wochenenden generieren ${((weekdayRevenue[0] + weekdayRevenue[6]) / totalRevenue * 100).toFixed(1)}% des Gesamtumsatzes`
      ];
      
      insights.forEach(insight => {
        doc.text(`• ${insight}`, 20, insightY);
        insightY += 8;
      });
      
      // Empfehlungen
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Handlungsempfehlungen', 14, insightY + 10);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      let recommendationY = insightY + 20;
      
      // Empfehlungen basierend auf den Daten
      const recommendations = [
        `Personal-Ressourcen für die Stoßzeiten (${bestHours}) optimieren, um den Service zu verbessern.`,
        `Marketing-Aktionen für umsatzschwächere Tage planen, um eine gleichmäßigere Auslastung zu erreichen.`,
        `Happy Hour oder spezielle Angebote für die Zeit von ${hourlyRevenue.indexOf(minHourRevenue)}:00 Uhr einführen, um die Besucherzahlen zu steigern.`,
        `Öffnungszeiten auf die Hauptumsatzzeiten anpassen, um Personalkosten zu optimieren.`,
        `Spezielle Events am ${weekdays[peakDays[0]]} planen, um den bereits starken Umsatz weiter zu steigern.`,
        `Analysieren Sie die Kunden-Demografie zu verschiedenen Tageszeiten, um das Angebot besser anzupassen.`
      ];
      
      recommendations.forEach((recommendation, index) => {
        doc.text(`${index + 1}. ${recommendation}`, 20, recommendationY);
        recommendationY += 8;
      });
      
      // Fußzeile
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Seite ${i} von ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text('Bartender - Stunden- und Tagesvergleich', 14, doc.internal.pageSize.getHeight() - 10);
      }
      
      // PDF speichern
      doc.save(`Stunden-Tagesvergleich-${format(currentDate, 'yyyy-MM-dd')}.pdf`);
      
      console.log('Hourly and daily comparison report generated successfully');
    } catch (err) {
      console.error('Error generating hourly and daily comparison report:', err);
      setError('Fehler beim Generieren des Stunden- und Tagesvergleich-Berichts');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Getränkeverkäufe-Bericht generieren
  const generateDrinkSalesReport = async () => {
    setExportFormat('drinks-report');
    setExportLoading(true);
    
    try {
      // Verkaufs- und Getränkedaten vom Server laden
      const [salesData, drinksData] = await Promise.all([
        salesApi.getAll(),
        drinksApi.getAll()
      ]);
      
      console.log(`Generating drink sales report with ${salesData.length} sales and ${drinksData.length} drinks`);
      
      if (salesData.length === 0) {
        setError('Keine Verkaufsdaten gefunden.');
        setExportLoading(false);
        return;
      }
      
      if (drinksData.length === 0) {
        setError('Keine Getränkedaten gefunden.');
        setExportLoading(false);
        return;
      }
      
      // Filtere Verkaufsdaten nach dem ausgewählten Zeitraum
      const filteredSales = salesData.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= reportDateRange.startDate && saleDate <= reportDateRange.endDate;
      });
      
      if (filteredSales.length === 0) {
        setError('Keine Verkaufsdaten im ausgewählten Zeitraum gefunden.');
        setExportLoading(false);
        return;
      }
      
      // Erstelle ein Mapping von Getränk-IDs zu Getränkedaten für schnellen Zugriff
      const drinksMap = {};
      drinksData.forEach(drink => {
        // Verwende bevorzugt die MongoDB _id, ansonsten die normale id
        const drinkId = drink._id || drink.id;
        drinksMap[drinkId] = drink;
      });
      
      // Sammle Daten zu Getränkeverkäufen
      const drinkSales = {};
      let totalSales = 0;
      let totalRevenue = 0;
      
      filteredSales.forEach(sale => {
        sale.items.forEach(item => {
          const drinkId = item.drinkId;
          
          if (!drinkSales[drinkId]) {
            // Verwende die echten Getränkenamen wenn verfügbar
            const drinkName = (drinksMap[drinkId] ? drinksMap[drinkId].name : item.name) || 'Unbekanntes Getränk';
            const category = drinksMap[drinkId] ? drinksMap[drinkId].category : 'Sonstige';
            
            drinkSales[drinkId] = {
              drinkId,
              name: drinkName,
              category,
              quantity: 0,
              revenue: 0,
              averagePrice: 0,
              costPrice: drinksMap[drinkId] ? drinksMap[drinkId].costPrice || 0 : 0,
              profit: 0,
              profitMargin: 0,
              transactions: 0,
              dates: []
            };
          }
          
          const revenue = item.quantity * item.pricePerUnit;
          const costPrice = drinkSales[drinkId].costPrice * item.quantity;
          const profit = revenue - costPrice;
          
          drinkSales[drinkId].quantity += item.quantity;
          drinkSales[drinkId].revenue += revenue;
          drinkSales[drinkId].profit += profit;
          drinkSales[drinkId].transactions += 1;
          drinkSales[drinkId].dates.push(new Date(sale.date));
          
          totalSales += item.quantity;
          totalRevenue += revenue;
        });
      });
      
      // Berechne Durchschnittspreise und Gewinnmargen
      Object.values(drinkSales).forEach(drink => {
        drink.averagePrice = drink.revenue / drink.quantity;
        drink.profitMargin = (drink.profit / drink.revenue) * 100;
      });
      
      // Sortiere Getränke nach Umsatz
      const topDrinks = Object.values(drinkSales)
        .sort((a, b) => b.revenue - a.revenue);
      
      // Gruppieren nach Kategorien
      const categorySales = {};
      
      Object.values(drinkSales).forEach(drink => {
        if (!categorySales[drink.category]) {
          categorySales[drink.category] = {
            name: drink.category,
            quantity: 0,
            revenue: 0,
            profit: 0,
            items: []
          };
        }
        
        categorySales[drink.category].quantity += drink.quantity;
        categorySales[drink.category].revenue += drink.revenue;
        categorySales[drink.category].profit += drink.profit;
        categorySales[drink.category].items.push(drink);
      });
      
      // Sortiere Kategorien nach Umsatz
      const sortedCategories = Object.values(categorySales)
        .sort((a, b) => b.revenue - a.revenue);
      
      // PDF erstellen
      const doc = new jsPDF();
      
      // Titel
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Getränkeverkäufe-Bericht', 14, 15);
      
      const currentDate = new Date();
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Erstellt am: ${format(currentDate, 'dd.MM.yyyy HH:mm')}`, 14, 22);
      doc.text(`Zeitraum: ${format(reportDateRange.startDate, 'dd.MM.yyyy')} bis ${format(reportDateRange.endDate, 'dd.MM.yyyy')}`, 14, 28);
      
      // Zusammenfassung
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Verkaufsübersicht', 14, 38);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Anzahl verkaufter Getränke: ${totalSales}`, 20, 48);
      doc.text(`Gesamtumsatz: ${totalRevenue.toFixed(2)} €`, 20, 54);
      doc.text(`Verschiedene Getränke verkauft: ${Object.keys(drinkSales).length}`, 20, 60);
      doc.text(`Anzahl Kategorien: ${Object.keys(categorySales).length}`, 20, 66);
      
      // Top 10 Getränke nach Umsatz
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 10 Getränke nach Umsatz', 14, 78);
      
      const top10Rows = topDrinks.slice(0, 10).map(drink => [
        drink.name,
        drink.quantity,
        `${drink.revenue.toFixed(2)} €`,
        `${drink.averagePrice.toFixed(2)} €`,
        `${drink.profit.toFixed(2)} €`,
        `${drink.profitMargin.toFixed(1)}%`
      ]);
      
      doc.autoTable({
        startY: 83,
        head: [['Getränk', 'Menge', 'Umsatz', 'Ø Preis', 'Gewinn', 'Marge']],
        body: top10Rows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      });
      
      // Umsatz nach Kategorien
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Verkaufsanalyse nach Kategorien', 14, 15);
      
      // Kategorie-Tabelle
      const categoryRows = sortedCategories.map(category => {
        const percentage = totalRevenue > 0 ? ((category.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
        return [
          category.name,
          category.quantity,
          `${category.revenue.toFixed(2)} €`,
          `${percentage}%`,
          `${category.profit.toFixed(2)} €`,
          category.items.length
        ];
      });
      
      doc.autoTable({
        startY: 25,
        head: [['Kategorie', 'Menge', 'Umsatz', 'Anteil', 'Gewinn', 'Anzahl Sorten']],
        body: categoryRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      });
      
      // Getränke mit höchstem Gewinn
      const topProfitDrinks = [...topDrinks].sort((a, b) => b.profit - a.profit).slice(0, 5);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const lastY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 180;
      doc.text('Top 5 Getränke nach Gewinn', 14, lastY + 15);
      
      const profitRows = topProfitDrinks.map(drink => [
        drink.name,
        drink.quantity,
        `${drink.revenue.toFixed(2)} €`,
        `${drink.profit.toFixed(2)} €`,
        `${drink.profitMargin.toFixed(1)}%`
      ]);
      
      doc.autoTable({
        startY: lastY + 20,
        head: [['Getränk', 'Menge', 'Umsatz', 'Gewinn', 'Marge']],
        body: profitRows,
        theme: 'grid',
        headStyles: {
          fillColor: [46, 125, 50],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        }
      });
      
      // Getränke mit hoher Marge
      const topMarginDrinks = [...topDrinks]
        .filter(drink => drink.quantity >= 5) // Nur Getränke mit mindestens 5 Verkäufen
        .sort((a, b) => b.profitMargin - a.profitMargin)
        .slice(0, 5);
      
      // Detailanalyse der Top-Getränke (neue Seite)
      if (topDrinks.length > 0) {
        doc.addPage();
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Detailanalyse der meistverkauften Getränke', 14, 15);
        
        // Zeige Details zu den 3 meistverkauften Getränken
        for (let i = 0; i < Math.min(3, topDrinks.length); i++) {
          const drink = topDrinks[i];
          const yStart = 30 + (i * 80);
          
          if (yStart > 220) {
            doc.addPage();
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Detailanalyse der meistverkauften Getränke (Fortsetzung)', 14, 15);
            yStart = 30;
          }
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`${i + 1}. ${drink.name}`, 14, yStart);
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.text(`Kategorie: ${drink.category}`, 20, yStart + 10);
          doc.text(`Verkaufsmenge: ${drink.quantity}`, 20, yStart + 17);
          doc.text(`Umsatz: ${drink.revenue.toFixed(2)} €`, 20, yStart + 24);
          doc.text(`Durchschnittspreis: ${drink.averagePrice.toFixed(2)} €`, 20, yStart + 31);
          doc.text(`Gewinn: ${drink.profit.toFixed(2)} €`, 20, yStart + 38);
          doc.text(`Gewinnmarge: ${drink.profitMargin.toFixed(1)}%`, 20, yStart + 45);
          doc.text(`Anzahl Transaktionen: ${drink.transactions}`, 20, yStart + 52);
          
          // Verkaufshäufigkeit
          const averagePerDay = drink.quantity / ((reportDateRange.endDate - reportDateRange.startDate) / (1000 * 60 * 60 * 24));
          doc.text(`Durchschnittlicher Verkauf pro Tag: ${averagePerDay.toFixed(1)}`, 20, yStart + 59);
        }
      }
      
      // Handlungsempfehlungen
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Handlungsempfehlungen', 14, 15);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Empfehlungen basierend auf der Verkaufsanalyse:', 14, 30);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      let recY = 45;
      const recommendations = [];
      
      // Finde Getränke mit wenig Verkäufen
      const poorPerformers = topDrinks
        .filter(drink => drink.quantity < 5)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 3);
        
      if (poorPerformers.length > 0) {
        recommendations.push(`Getränke mit geringen Verkäufen überprüfen: ${poorPerformers.map(d => d.name).join(', ')}`);
      }
      
      // Empfehlung für Getränke mit hoher Marge
      if (topMarginDrinks.length > 0) {
        recommendations.push(`Getränke mit hoher Gewinnmarge stärker bewerben: ${topMarginDrinks.slice(0, 3).map(d => d.name).join(', ')}`);
      }
      
      // Empfehlung für die größte Kategorie
      if (sortedCategories.length > 0) {
        recommendations.push(`Die Kategorie "${sortedCategories[0].name}" generiert den höchsten Umsatz. Erwägen Sie eine Erweiterung des Angebots in dieser Kategorie.`);
      }
      
      // Empfehlung für kleine Kategorien
      const smallCategories = [...sortedCategories]
        .sort((a, b) => a.revenue - b.revenue)
        .slice(0, 2);
        
      if (smallCategories.length > 0) {
        recommendations.push(`Überprüfen Sie Kategorien mit geringem Umsatz: ${smallCategories.map(c => c.name).join(', ')}`);
      }
      
      // Empfehlung basierend auf Gewinnmargen
      const avgProfit = Object.values(drinkSales).reduce((sum, drink) => sum + drink.profitMargin, 0) / Object.values(drinkSales).length;
      recommendations.push(`Die durchschnittliche Gewinnmarge beträgt ${avgProfit.toFixed(1)}%. Getränke unter diesem Wert sollten auf Preisanpassungen überprüft werden.`);
      
      // Ausgabe der Empfehlungen
      recommendations.forEach((rec, index) => {
        doc.text(`${index + 1}. ${rec}`, 20, recY);
        recY += 10;
        
        // Seitenumbruch bei Bedarf
        if (recY > 270) {
          doc.addPage();
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('Handlungsempfehlungen (Fortsetzung)', 14, 15);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          recY = 30;
        }
      });
      
      // PDF speichern
      doc.save(`Getränkeverkäufe-Bericht-${format(currentDate, 'yyyy-MM-dd')}.pdf`);
      
      setExportLoading(false);
    } catch (err) {
      console.error('Error generating drink sales report:', err);
      setError('Fehler beim Generieren des Getränkeverkäufe-Berichts: ' + (err.message || err));
      setExportLoading(false);
    }
  };
  
  // Bestandsbewegungen-Bericht generieren
  const generateInventoryMovementsReport = async () => {
    setExportFormat('inventory-movements-report');
    setExportLoading(true);
    
    try {
      // Lade Inventardaten und Lieferanten
      const [inventory, suppliers] = await Promise.all([
        inventoryApi.getAll(),
        suppliersApi.getAll()
      ]);
      
      console.log(`Generating inventory movements report with ${inventory.length} items`);
      
      if (inventory.length === 0) {
        setError('Keine Inventareinträge gefunden.');
        setExportLoading(false);
        return;
      }
      
      // Erstelle ein Mapping von Lieferanten-IDs zu Namen für schnellen Zugriff
      const supplierMap = {};
      suppliers.forEach(supplier => {
        supplierMap[supplier._id] = supplier.name;
      });
      
      // Sortiere Inventareinträge nach Datum (neueste zuerst)
      const sortedInventory = [...inventory].sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      
      // Filtere Inventareinträge nach dem ausgewählten Zeitraum
      const filteredInventory = sortedInventory.filter(item => {
        const updatedDate = new Date(item.updatedAt);
        return updatedDate >= reportDateRange.startDate && updatedDate <= reportDateRange.endDate;
      });
      
      if (filteredInventory.length === 0) {
        setError('Keine Bestandsänderungen im ausgewählten Zeitraum gefunden.');
        setExportLoading(false);
        return;
      }
      
      // Gruppiere Inventareinträge nach Kategorien
      const categoryMovements = {};
      
      INVENTORY_CATEGORIES.forEach(category => {
        categoryMovements[category.id] = {
          name: category.name,
          items: []
        };
      });
      
      // Füge Artikel zu den entsprechenden Kategorien hinzu
      filteredInventory.forEach(item => {
        if (categoryMovements[item.category]) {
          categoryMovements[item.category].items.push(item);
        } else {
          if (!categoryMovements.other) {
            categoryMovements.other = {
              name: 'Sonstige',
              items: []
            };
          }
          categoryMovements.other.items.push(item);
        }
      });
      
      // PDF erstellen
      const doc = new jsPDF();
      
      // Titel
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Bestandsbewegungen-Bericht', 14, 15);
      
      const currentDate = new Date();
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Erstellt am: ${format(currentDate, 'dd.MM.yyyy HH:mm')}`, 14, 22);
      doc.text(`Zeitraum: ${format(reportDateRange.startDate, 'dd.MM.yyyy')} bis ${format(reportDateRange.endDate, 'dd.MM.yyyy')}`, 14, 28);
      
      // Übersicht
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Übersicht der Bestandsbewegungen', 14, 38);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gesamtanzahl der aktualisierten Artikel: ${filteredInventory.length}`, 20, 48);
      
      // Definiere Zeiträume für die Analyse
      const lastDay = new Date();
      lastDay.setDate(lastDay.getDate() - 1);
      
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      // Zähle Aktualisierungen in verschiedenen Zeiträumen
      const updatedLastDay = filteredInventory.filter(item => new Date(item.updatedAt) >= lastDay).length;
      const updatedLastWeek = filteredInventory.filter(item => new Date(item.updatedAt) >= lastWeek).length;
      const updatedLastMonth = filteredInventory.filter(item => new Date(item.updatedAt) >= lastMonth).length;
      
      doc.text(`Aktualisierte Artikel (letzte 24 Stunden): ${updatedLastDay}`, 20, 54);
      doc.text(`Aktualisierte Artikel (letzte 7 Tage): ${updatedLastWeek}`, 20, 60);
      doc.text(`Aktualisierte Artikel (letzter Monat): ${updatedLastMonth}`, 20, 66);
      
      // Kategorieübersicht - Wie viele Artikel pro Kategorie wurden aktualisiert
      const categoryRows = Object.values(categoryMovements)
        .filter(category => category.items.length > 0)
        .sort((a, b) => b.items.length - a.items.length)
        .map(category => [
          category.name,
          category.items.length,
          `${((category.items.length / filteredInventory.length) * 100).toFixed(1)}%`
        ]);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Aktualisierungen nach Kategorien', 14, 78);
      
      doc.autoTable({
        startY: 83,
        head: [['Kategorie', 'Anzahl Artikel', 'Anteil']],
        body: categoryRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' }
        }
      });
      
      // Detaillierte Liste der letzten Bestandsbewegungen auf einer neuen Seite
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Detaillierte Bestandsbewegungen', 14, 15);
      
      // Filtern der letzten 20 aktualisierten Artikel (die neuesten zuerst)
      const recentMovements = filteredInventory.slice(0, 20);
      
      const movementRows = recentMovements.map(item => {
        const supplierName = item.supplier ? (supplierMap[item.supplier] || 'Unbekannt') : '-';
        const daysSinceUpdate = Math.round((new Date() - new Date(item.updatedAt)) / (1000 * 60 * 60 * 24));
        
        return [
          item.name,
          item.category,
          `${item.quantity} ${item.unit}`,
          `${format(new Date(item.updatedAt), 'dd.MM.yyyy')}`,
          `${daysSinceUpdate} ${daysSinceUpdate === 1 ? 'Tag' : 'Tage'}`,
          supplierName
        ];
      });
      
      doc.autoTable({
        startY: 25,
        head: [['Artikel', 'Kategorie', 'Aktueller Bestand', 'Letzte Änderung', 'Vor', 'Lieferant']],
        body: movementRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        }
      });
      
      // Analyse: Artikel mit häufigen Bestandsänderungen
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Artikel mit häufigen Bestandsänderungen', 14, 15);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Basierend auf der Häufigkeit der Aktualisierungen im ausgewählten Zeitraum.', 14, 25);
      
      // Berechne die Differenz zwischen erstelltem und aktualisiertem Datum in Tagen
      // Da wir keine tatsächliche Historie haben, verwenden wir diese Näherung
      const itemsWithFrequentChanges = filteredInventory
        .filter(item => {
          const createdDate = new Date(item.createdAt);
          const updatedDate = new Date(item.updatedAt);
          return createdDate < updatedDate; // Nur Artikel, die nach der Erstellung aktualisiert wurden
        })
        .sort((a, b) => {
          // Sortiere nach der Differenz zwischen created und updated (kürzere Zeiträume zuerst)
          const aDiff = new Date(a.updatedAt) - new Date(a.createdAt);
          const bDiff = new Date(b.updatedAt) - new Date(b.createdAt);
          return aDiff - bDiff;
        })
        .slice(0, 10); // Top 10 Artikel mit häufigen Änderungen
      
      if (itemsWithFrequentChanges.length > 0) {
        const frequentChangesRows = itemsWithFrequentChanges.map(item => {
          const daysSinceCreation = Math.round((new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24));
          const daysBetweenUpdates = Math.round((new Date(item.updatedAt) - new Date(item.createdAt)) / (1000 * 60 * 60 * 24));
          
          return [
            item.name,
            item.category,
            `${item.quantity} ${item.unit}`,
            daysSinceCreation,
            daysBetweenUpdates || '<1',
            `${item.minQuantity} ${item.unit}`
          ];
        });
        
        doc.autoTable({
          startY: 35,
          head: [['Artikel', 'Kategorie', 'Aktueller Bestand', 'Tage im Inventar', 'Tage zwischen Updates', 'Mindestbestand']],
          body: frequentChangesRows,
          theme: 'grid',
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: 255
          }
        });
      } else {
        doc.text('Keine Artikel mit häufigen Bestandsänderungen gefunden.', 20, 35);
      }
      
      // Bestandswarnungen und kritische Artikel
      const lowStockItems = filteredInventory.filter(item => item.quantity <= item.minQuantity);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const lastY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 150;
      doc.text('Artikel mit kritischem Bestand', 14, lastY + 15);
      
      if (lowStockItems.length > 0) {
        const lowStockRows = lowStockItems.map(item => {
          const supplierName = item.supplier ? (supplierMap[item.supplier] || 'Unbekannt') : '-';
          const lastOrder = item.lastOrderDate ? format(new Date(item.lastOrderDate), 'dd.MM.yyyy') : '-';
          
          return [
            item.name,
            item.category,
            `${item.quantity}/${item.minQuantity} ${item.unit}`,
            `${item.costPerUnit.toFixed(2)} €`,
            supplierName,
            lastOrder
          ];
        });
        
        doc.autoTable({
          startY: lastY + 20,
          head: [['Artikel', 'Kategorie', 'Bestand/Min', 'Kosten/Einheit', 'Lieferant', 'Letzte Bestellung']],
          body: lowStockRows,
          theme: 'grid',
          headStyles: {
            fillColor: [255, 76, 76],
            textColor: 255
          }
        });
      } else {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text('Keine Artikel mit kritischem Bestand gefunden.', 20, lastY + 25);
      }
      
      // Handlungsempfehlungen
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Handlungsempfehlungen für das Inventarmanagement', 14, 15);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const recommendations = [];
      
      // Empfehlungen für Artikel mit kritischem Bestand
      if (lowStockItems.length > 0) {
        recommendations.push(`${lowStockItems.length} Artikel haben einen kritischen Bestand und sollten nachbestellt werden.`);
        
        // Gruppiere nach Lieferant für effiziente Bestellung
        const itemsBySupplier = {};
        lowStockItems.forEach(item => {
          if (item.supplier) {
            const supplierName = supplierMap[item.supplier] || item.supplier;
            if (!itemsBySupplier[supplierName]) {
              itemsBySupplier[supplierName] = [];
            }
            itemsBySupplier[supplierName].push(item.name);
          }
        });
        
        Object.entries(itemsBySupplier).forEach(([supplier, items]) => {
          if (items.length > 1) {
            recommendations.push(`Sammelbestellung bei "${supplier}" für ${items.length} Artikel in Betracht ziehen.`);
          }
        });
      }
      
      // Empfehlungen basierend auf Bestandsbewegungen
      const highTurnoverItems = itemsWithFrequentChanges.slice(0, 3);
      if (highTurnoverItems.length > 0) {
        recommendations.push(`Artikel mit hohem Umschlag: ${highTurnoverItems.map(item => item.name).join(', ')}. Erwägen Sie eine Erhöhung des Mindestbestands oder häufigere Bestellungen.`);
      }
      
      // Empfehlungen für Artikel ohne Bewegungen
      const unchangedItems = inventory.filter(item => {
        const lastUpdate = new Date(item.updatedAt);
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - 3);
        return lastUpdate < monthsAgo;
      }).slice(0, 5);
      
      if (unchangedItems.length > 0) {
        recommendations.push(`${unchangedItems.length} Artikel wurden seit mehr als 3 Monaten nicht aktualisiert. Überprüfen Sie diese auf Richtigkeit.`);
      }
      
      // Kategorie-basierte Empfehlungen
      const categoriesByItemCount = Object.values(categoryMovements)
        .filter(category => category.items.length > 0)
        .sort((a, b) => b.items.length - a.items.length);
      
      if (categoriesByItemCount.length > 0) {
        const topCategory = categoriesByItemCount[0];
        recommendations.push(`Die Kategorie "${topCategory.name}" hat die meisten Bestandsänderungen. Überprüfen Sie die Lagerrichtlinien für diese Kategorie.`);
      }
      
      // Ausgabe der Empfehlungen
      let recY = 30;
      recommendations.forEach((rec, index) => {
        doc.text(`${index + 1}. ${rec}`, 20, recY);
        recY += 10;
        
        // Seitenumbruch bei Bedarf
        if (recY > 270) {
          doc.addPage();
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('Handlungsempfehlungen (Fortsetzung)', 14, 15);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          recY = 30;
        }
      });
      
      // PDF speichern
      doc.save(`Bestandsbewegungen-Bericht-${format(currentDate, 'yyyy-MM-dd')}.pdf`);
      
      setExportLoading(false);
    } catch (err) {
      console.error('Error generating inventory movements report:', err);
      setError('Fehler beim Generieren des Bestandsbewegungen-Berichts: ' + (err.message || err));
      setExportLoading(false);
    }
  };
  
  // Arbeitszeitübersicht-Bericht generieren
  const generateWorkingHoursReport = async () => {
    setExportFormat('working-hours-report');
    setExportLoading(true);
    
    try {
      // Mitarbeiterdaten vom Server laden
      const staffData = await staffApi.getAll();
      
      console.log(`Generating working hours report with ${staffData.length} staff members`);
      
      if (staffData.length === 0) {
        setError('Keine Mitarbeiterdaten gefunden.');
        setExportLoading(false);
        return;
      }
      
      // Filtere nur aktive Mitarbeiter
      const activeStaff = staffData.filter(staff => staff.active || staff.isActive);
      
      // PDF erstellen
      const doc = new jsPDF();
      
      // Titel
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Arbeitszeitübersicht-Bericht', 14, 15);
      
      const currentDate = new Date();
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Erstellt am: ${format(currentDate, 'dd.MM.yyyy HH:mm')}`, 14, 22);
      
      // Übersicht
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Übersicht der Mitarbeiter', 14, 32);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gesamtanzahl Mitarbeiter: ${staffData.length}`, 20, 42);
      doc.text(`Aktive Mitarbeiter: ${activeStaff.length}`, 20, 48);
      doc.text(`Inaktive Mitarbeiter: ${staffData.length - activeStaff.length}`, 20, 54);
      
      // Zusammenfassung der Stunden pro Woche
      const totalHoursPerWeek = activeStaff.reduce((sum, staff) => sum + (staff.hoursPerWeek || 0), 0);
      const avgHoursPerStaff = activeStaff.length > 0 ? totalHoursPerWeek / activeStaff.length : 0;
      
      doc.text(`Gesamtstunden pro Woche: ${totalHoursPerWeek.toFixed(1)} Stunden`, 20, 60);
      doc.text(`Durchschnittliche Stunden pro Mitarbeiter: ${avgHoursPerStaff.toFixed(1)} Stunden/Woche`, 20, 66);
      
      // Zusammenfassung nach Position
      const positionStats = {};
      activeStaff.forEach(staff => {
        if (!positionStats[staff.position]) {
          positionStats[staff.position] = {
            count: 0,
            totalHours: 0
          };
        }
        positionStats[staff.position].count += 1;
        positionStats[staff.position].totalHours += staff.hoursPerWeek || 0;
      });
      
      // Mitarbeitertabelle
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Aktive Mitarbeiter nach Position', 14, 78);
      
      const positionRows = Object.entries(positionStats).map(([position, stats]) => [
        position,
        stats.count,
        `${stats.totalHours.toFixed(1)} Stunden`,
        `${(stats.totalHours / totalHoursPerWeek * 100).toFixed(1)}%`
      ]);
      
      doc.autoTable({
        startY: 83,
        head: [['Position', 'Anzahl Mitarbeiter', 'Stunden/Woche', 'Anteil']],
        body: positionRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      // Detaillierter Zeitplan der Mitarbeiter
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Detaillierter Mitarbeiter-Zeitplan', 14, 15);
      
      // Gruppiere nach Wochentagen für die Besetzungsübersicht
      const dayMapping = {
        'Montag': 1, 'Monday': 1,
        'Dienstag': 2, 'Tuesday': 2,
        'Mittwoch': 3, 'Wednesday': 3,
        'Donnerstag': 4, 'Thursday': 4,
        'Freitag': 5, 'Friday': 5,
        'Samstag': 6, 'Saturday': 6,
        'Sonntag': 0, 'Sunday': 0
      };
      
      const germanDays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      
      // Funktionen zum Parsen der Uhrzeiten
      const parseTime = (timeStr) => {
        if (!timeStr) return null;
        
        // Versuche verschiedene Formate zu parsen
        let hour = 0;
        let minute = 0;
        
        const match24h = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (match24h) {
          hour = parseInt(match24h[1], 10);
          minute = parseInt(match24h[2], 10);
          return { hour, minute };
        }
        
        const match12h = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
        if (match12h) {
          hour = parseInt(match12h[1], 10);
          minute = parseInt(match12h[2], 10);
          if (match12h[3].toLowerCase() === 'pm' && hour < 12) hour += 12;
          if (match12h[3].toLowerCase() === 'am' && hour === 12) hour = 0;
          return { hour, minute };
        }
        
        return { hour: 0, minute: 0 };
      };
      
      // Berechne die Anzahl der Stunden zwischen zwei Zeitangaben
      const getHoursBetween = (startTimeStr, endTimeStr) => {
        if (!startTimeStr || !endTimeStr) return 0;
        
        const start = parseTime(startTimeStr);
        const end = parseTime(endTimeStr);
        
        if (!start || !end) return 0;
        
        let hours = end.hour - start.hour;
        let minutes = end.minute - start.minute;
        
        if (minutes < 0) {
          hours -= 1;
          minutes += 60;
        }
        
        // Behandlung von Nachtschichten (Ende am nächsten Tag)
        if (hours < 0) {
          hours += 24;
        }
        
        return hours + (minutes / 60);
      };
      
      // Erstelle eine Mitarbeiterliste mit ihren Arbeitszeiten
      const staffScheduleData = activeStaff
        .filter(staff => staff.schedule && staff.schedule.length > 0)
        .map(staff => {
          // Gesamtstunden pro Woche berechnen
          let totalHours = 0;
          
          // Arbeitszeiten nach Wochentag sortieren
          const sortedSchedule = [...staff.schedule].sort((a, b) => {
            return (dayMapping[a.day] || 0) - (dayMapping[b.day] || 0);
          });
          
          // Formatiere für die Tabelle
          const scheduleStr = sortedSchedule.map(shift => {
            const hours = getHoursBetween(shift.startTime, shift.endTime);
            totalHours += hours;
            
            const dayName = germanDays[dayMapping[shift.day]] || shift.day;
            return `${dayName}: ${shift.startTime || '?'} - ${shift.endTime || '?'} (${hours.toFixed(1)}h)`;
          }).join('\n');
          
          return {
            name: staff.name,
            position: staff.position,
            hoursPerWeek: staff.hoursPerWeek || totalHours,
            hourlyRate: staff.hourlyRate || 0,
            scheduledHours: totalHours,
            schedule: scheduleStr
          };
        });
      
      // Füge Mitarbeiter ohne Zeitplan hinzu
      const staffWithoutSchedule = activeStaff
        .filter(staff => !staff.schedule || staff.schedule.length === 0)
        .map(staff => ({
          name: staff.name,
          position: staff.position,
          hoursPerWeek: staff.hoursPerWeek || 0,
          hourlyRate: staff.hourlyRate || 0,
          scheduledHours: 0,
          schedule: 'Kein Zeitplan hinterlegt'
        }));
      
      const allStaffSchedule = [...staffScheduleData, ...staffWithoutSchedule]
        .sort((a, b) => b.scheduledHours - a.scheduledHours);
      
      // Detaillierte Tabelle der Mitarbeiterzeiten
      const staffRows = allStaffSchedule.map(staff => [
        staff.name,
        staff.position,
        `${staff.hoursPerWeek.toFixed(1)}h`,
        `${staff.hourlyRate.toFixed(2)}€`,
        `${staff.scheduledHours.toFixed(1)}h`,
        staff.schedule
      ]);
      
      doc.autoTable({
        startY: 25,
        head: [['Name', 'Position', 'Std./Woche', 'Stundenlohn', 'Eingeplant', 'Zeitplan']],
        body: staffRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        },
        styles: {
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          5: { cellWidth: 'auto' }
        }
      });
      
      // Tagesübersicht - wieviele Mitarbeiter arbeiten an welchem Tag
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Personaleinsatz nach Wochentag', 14, 15);
      
      // Zähle Mitarbeiter je Wochentag
      const staffByDay = {};
      
      germanDays.forEach(day => {
        staffByDay[day] = [];
      });
      
      activeStaff.forEach(staff => {
        if (staff.schedule && staff.schedule.length > 0) {
          staff.schedule.forEach(shift => {
            const day = shift.day;
            const germanDay = germanDays[dayMapping[day]] || day;
            if (!staffByDay[germanDay]) {
              staffByDay[germanDay] = [];
            }
            staffByDay[germanDay].push({
              name: staff.name,
              position: staff.position,
              startTime: shift.startTime,
              endTime: shift.endTime,
              hours: getHoursBetween(shift.startTime, shift.endTime)
            });
          });
        }
      });
      
      // Erstelle Übersichtstabelle pro Wochentag
      const staffByDayRows = germanDays.map(day => {
        const staffOnDay = staffByDay[day] || [];
        const totalHoursOnDay = staffOnDay.reduce((sum, shift) => sum + shift.hours, 0);
        return [
          day,
          staffOnDay.length,
          totalHoursOnDay.toFixed(1),
          staffOnDay.length > 0 ? (totalHoursOnDay / staffOnDay.length).toFixed(1) : '-',
          staffOnDay.map(s => s.name).join(', ')
        ];
      });
      
      doc.autoTable({
        startY: 25,
        head: [['Tag', 'Mitarbeiter', 'Stunden gesamt', 'Std./Mitarbeiter', 'Personal']],
        body: staffByDayRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      // Stundenübersicht mit Heatmap
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const lastY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 150;
      doc.text('Personaleinsatz nach Uhrzeit', 14, lastY + 15);
      
      // Erstelle eine Stundenübersicht von 6 bis 24 Uhr
      const hourlyStaffCount = {};
      
      // Initialisiere die Stunden
      for (let hour = 6; hour <= 24; hour++) {
        hourlyStaffCount[hour] = {
          count: 0,
          staff: []
        };
      }
      
      // Zähle Mitarbeiter pro Stunde
      activeStaff.forEach(staff => {
        if (staff.schedule && staff.schedule.length > 0) {
          staff.schedule.forEach(shift => {
            const start = parseTime(shift.startTime);
            const end = parseTime(shift.endTime);
            
            if (start && end) {
              let startHour = start.hour;
              let endHour = end.hour;
              
              // Behandlung von Nachtschichten
              if (endHour < startHour) {
                endHour += 24;
              }
              
              // Zähle für jede Stunde zwischen Start und Ende
              for (let hour = startHour; hour < endHour; hour++) {
                const normalizedHour = hour >= 24 ? hour - 24 : hour;
                if (hourlyStaffCount[normalizedHour]) {
                  hourlyStaffCount[normalizedHour].count += 1;
                  hourlyStaffCount[normalizedHour].staff.push(staff.name);
                }
              }
            }
          });
        }
      });
      
      // Finde die maximal/minimal besetzte Stunde für Farbskalierung
      const maxStaffCount = Math.max(...Object.values(hourlyStaffCount).map(h => h.count));
      
      // Generiere Zeilen für die Stundentabelle
      const hourlyRows = Object.keys(hourlyStaffCount)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(hour => {
          const timeLabel = `${hour}:00 - ${(parseInt(hour) + 1)}:00`;
          const data = hourlyStaffCount[hour];
          
          // Bestimme, ob dies eine Stoßzeit ist (über 80% des Maximums)
          const isPeakTime = data.count >= maxStaffCount * 0.8;
          
          return [
            timeLabel,
            data.count,
            data.staff.slice(0, 3).join(', ') + (data.staff.length > 3 ? '...' : ''),
            isPeakTime ? '★' : ''
          ];
        });
      
      doc.autoTable({
        startY: lastY + 20,
        head: [['Uhrzeit', 'Anzahl Personal', 'Personal (Auswahl)', 'Stoßzeit']],
        body: hourlyRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' }
        },
        rowStyles: row => {
          const staffCount = parseInt(hourlyRows[row.index][1]);
          const intensity = Math.min(1, staffCount / maxStaffCount);
          
          // Farbabstufung von Weiß bis Blau basierend auf der Personalbesetzung
          return {
            fillColor: [
              255 - Math.round(intensity * 200),
              255 - Math.round(intensity * 100),
              255
            ]
          };
        }
      });
      
      // Handlungsempfehlungen
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Handlungsempfehlungen für die Personalplanung', 14, 15);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const recommendations = [];
      
      // Unterbesetzte Zeiten identifizieren (weniger als 30% des Maximums während der Hauptgeschäftszeiten)
      const understaffedHours = Object.entries(hourlyStaffCount)
        .filter(([hour, data]) => {
          const hourNum = parseInt(hour);
          // Zwischen 17 und 22 Uhr sind wichtige Geschäftszeiten für eine Bar
          return hourNum >= 17 && hourNum <= 22 && data.count < maxStaffCount * 0.3;
        })
        .map(([hour]) => `${hour}:00`);
      
      if (understaffedHours.length > 0) {
        recommendations.push(`Unzureichende Personalbesetzung zu folgenden Uhrzeiten: ${understaffedHours.join(', ')}. Zusätzliches Personal einplanen.`);
      }
      
      // Überbesetzte Tage/Zeiten (maximal besetzt, aber nicht unbedingt notwendig)
      const peakStaffCount = Object.entries(hourlyStaffCount)
        .filter(([hour, data]) => data.count === maxStaffCount)
        .map(([hour]) => `${hour}:00`);
      
      if (peakStaffCount.length > 0) {
        recommendations.push(`Maximale Personalbesetzung zu folgenden Uhrzeiten: ${peakStaffCount.join(', ')}. Überprüfen Sie, ob diese hohe Besetzung notwendig ist.`);
      }
      
      // Mitarbeiter ohne Zeitplan
      if (staffWithoutSchedule.length > 0) {
        recommendations.push(`${staffWithoutSchedule.length} Mitarbeiter haben keinen hinterlegten Zeitplan. Zeitpläne aktualisieren für: ${staffWithoutSchedule.map(s => s.name).join(', ')}.`);
      }
      
      // Ungleiche Verteilung zwischen Wochentagen
      const staffCountByDay = germanDays.map(day => ({
        day,
        count: (staffByDay[day] || []).length
      }));
      
      const maxStaffDay = staffCountByDay.reduce((max, current) => 
        current.count > max.count ? current : max, { count: 0 });
      
      const minStaffDay = staffCountByDay
        .filter(day => day.count > 0) // Nur Tage mit Personalbesetzung
        .reduce((min, current) => 
          current.count < min.count ? current : min, { count: Number.MAX_SAFE_INTEGER });
      
      if (maxStaffDay.count > 0 && minStaffDay.count < maxStaffDay.count * 0.5) {
        recommendations.push(`Große Unterschiede in der Personalbesetzung zwischen Wochentagen: ${maxStaffDay.day} (${maxStaffDay.count} MA) vs. ${minStaffDay.day} (${minStaffDay.count} MA). Erwägen Sie eine gleichmäßigere Verteilung.`);
      }
      
      // Überprüfung auf Überstunden oder ungleiche Arbeitszeiten
      const overworkedStaff = allStaffSchedule
        .filter(staff => staff.scheduledHours > staff.hoursPerWeek * 1.2) // 20% mehr als vereinbart
        .map(staff => `${staff.name} (${staff.scheduledHours.toFixed(1)}h statt ${staff.hoursPerWeek.toFixed(1)}h)`);
      
      if (overworkedStaff.length > 0) {
        recommendations.push(`Mitarbeiter mit mehr Arbeitsstunden als vereinbart: ${overworkedStaff.join(', ')}.`);
      }
      
      // Ausgabe der Empfehlungen
      let recY = 30;
      recommendations.forEach((rec, index) => {
        doc.text(`${index + 1}. ${rec}`, 20, recY);
        recY += 10;
        
        // Seitenumbruch bei Bedarf
        if (recY > 270) {
          doc.addPage();
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('Handlungsempfehlungen (Fortsetzung)', 14, 15);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          recY = 30;
        }
      });
      
      // PDF speichern
      doc.save(`Arbeitszeitübersicht-Bericht-${format(currentDate, 'yyyy-MM-dd')}.pdf`);
      
      setExportLoading(false);
    } catch (err) {
      console.error('Error generating working hours report:', err);
      setError('Fehler beim Generieren des Arbeitszeitübersicht-Berichts: ' + (err.message || err));
      setExportLoading(false);
    }
  };
  
  // Gesamtübersicht-Bericht generieren
  const generateOverallReport = async () => {
    setExportFormat('overall-report');
    setExportLoading(true);
    
    try {
      // Alle Daten vom Server laden, die wir für die Gesamtübersicht benötigen
      const [salesData, drinksData, inventoryData, 
             staffData, finances] = await Promise.all([
        salesApi.getAll(),
        drinksApi.getAll(),
        inventoryApi.getAll(),
        staffApi.getAll(),
        Promise.all([
          // Für einfachen Zugriff auf Finanzdaten
          salesApi.getAll(),
          // Hier könnten weitere Finanzdaten geladen werden, z.B. aus der financesApi
        ])
      ]);
      
      console.log(`Generating overall report with data from multiple sources`);
      
      // Aktuelle Zeitperioden berechnen
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      // Jahresbeginn bis heute
      const yearStartDate = new Date(currentYear, 0, 1);
      
      // Monatsbeginn bis heute
      const monthStartDate = new Date(currentYear, currentMonth, 1);
      
      // Letzte 7 Tage
      const weekStartDate = new Date();
      weekStartDate.setDate(weekStartDate.getDate() - 7);
      
      // Verkaufsdaten für verschiedene Zeitperioden filtern
      const yearSales = salesData.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= yearStartDate && saleDate <= currentDate;
      });
      
      const monthSales = salesData.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= monthStartDate && saleDate <= currentDate;
      });
      
      const weekSales = salesData.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= weekStartDate && saleDate <= currentDate;
      });
      
      // PDF erstellen
      const doc = new jsPDF();
      
      // Titel
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Gesamtübersicht', 14, 15);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Erstellt am: ${format(currentDate, 'dd.MM.yyyy HH:mm')}`, 14, 22);
      
      // Allgemeine Zusammenfassung
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Geschäftskennzahlen auf einen Blick', 14, 35);
      
      // Umsatz und Verkäufe berechnen
      const yearlyRevenue = yearSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
      const monthlyRevenue = monthSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
      const weeklyRevenue = weekSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
      
      // Anzahl der Verkäufe in verschiedenen Zeiträumen
      const yearSalesCount = yearSales.length;
      const monthSalesCount = monthSales.length;
      const weekSalesCount = weekSales.length;
      
      // Inventarwert berechnen
      const inventoryValue = inventoryData.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
      
      // Anzahl der aktiven Getränke
      const activeDrinks = drinksData.filter(drink => drink.isActive !== false).length;
      
      // Anzahl der Mitarbeiter
      const activeStaff = staffData.length;
      
      // Allgemeine Kennzahlen darstellen
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Key Performance Indicators (KPIs)
      const kpiRows = [
        ['Jahresumsatz (bisher)', `${yearlyRevenue.toFixed(2)} €`, `${yearSalesCount} Verkäufe`],
        ['Monatsumsatz (bisher)', `${monthlyRevenue.toFixed(2)} €`, `${monthSalesCount} Verkäufe`],
        ['Wochenumsatz (letzte 7 Tage)', `${weeklyRevenue.toFixed(2)} €`, `${weekSalesCount} Verkäufe`],
        ['Durchsch. Verkaufswert', `${(yearSalesCount > 0 ? yearlyRevenue / yearSalesCount : 0).toFixed(2)} €`, ''],
        ['Lagerbestandswert', `${inventoryValue.toFixed(2)} €`, `${inventoryData.length} Artikel`],
        ['Aktive Getränke', activeDrinks.toString(), ''],
        ['Mitarbeiter', activeStaff.toString(), '']
      ];
      
      doc.autoTable({
        startY: 40,
        head: [['Kennzahl', 'Wert', 'Details']],
        body: kpiRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        }
      });
      
      // Top-Produkte
      const finalY1 = doc.autoTable.previous.finalY || 40;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top-Produkte', 14, finalY1 + 15);
      
      // Produkt-Statistiken berechnen
      const productStats = {};
      yearSales.forEach(sale => {
        sale.items.forEach(item => {
          const key = item.name;
          if (!productStats[key]) {
            productStats[key] = { 
              name: key, 
              quantity: 0, 
              revenue: 0 
            };
          }
          productStats[key].quantity += parseFloat(item.quantity);
          productStats[key].revenue += parseFloat(item.quantity) * parseFloat(item.pricePerUnit);
        });
      });
      
      // Top 5 Produkte nach Umsatz
      const topProducts = Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      const productRows = topProducts.map((product, index) => [
        index + 1,
        product.name,
        product.quantity,
        `${product.revenue.toFixed(2)} €`,
        `${(yearlyRevenue > 0 ? (product.revenue / yearlyRevenue * 100) : 0).toFixed(1)}%`
      ]);
      
      doc.autoTable({
        startY: finalY1 + 20,
        head: [['#', 'Produkt', 'Menge', 'Umsatz', '% vom Gesamtumsatz']],
        body: productRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        }
      });
      
      // Monatliche Entwicklung
      const finalY2 = doc.autoTable.previous.finalY || finalY1 + 20;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Monatliche Umsatzentwicklung', 14, finalY2 + 15);
      
      // Monatliche Umsätze für das aktuelle Jahr berechnen
      const monthlyRevenues = Array(currentMonth + 1).fill(0);
      yearSales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const month = saleDate.getMonth();
        if (month <= currentMonth) {
          monthlyRevenues[month] += parseFloat(sale.total || 0);
        }
      });
      
      const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
      ];
      
      const monthlyRows = monthlyRevenues.map((revenue, index) => {
        // Monatliche Veränderung berechnen (für jeden Monat außer Januar)
        let changePercent = 0;
        if (index > 0 && monthlyRevenues[index - 1] > 0) {
          changePercent = ((revenue - monthlyRevenues[index - 1]) / monthlyRevenues[index - 1] * 100);
        }
        
        return [
          monthNames[index],
          `${revenue.toFixed(2)} €`,
          index > 0 ? `${changePercent.toFixed(1)}%` : '-',
          index > 0 ? (changePercent >= 0 ? '↑' : '↓') : '-'
        ];
      });
      
      doc.autoTable({
        startY: finalY2 + 20,
        head: [['Monat', 'Umsatz', 'Veränderung zum Vormonat', 'Trend']],
        body: monthlyRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'center' }
        }
      });
      
      // Neue Seite für Inventar und Empfehlungen
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Bestand & Handlungsempfehlungen', 14, 15);
      
      // Artikel mit niedrigem Bestand identifizieren
      const lowStockItems = inventoryData
        .filter(item => item.quantity <= item.minQuantity)
        .sort((a, b) => (a.quantity / a.minQuantity) - (b.quantity / b.minQuantity))
        .slice(0, 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Artikel mit niedrigem Bestand', 14, 25);
      
      if (lowStockItems.length > 0) {
        const lowStockRows = lowStockItems.map(item => {
          const unitName = INVENTORY_UNITS.find(u => u.id === item.unit)?.name || item.unit;
          return [
            item.name,
            `${item.quantity} / ${item.minQuantity} ${unitName}`,
            `${item.costPerUnit.toFixed(2)} €`
          ];
        });
        
        doc.autoTable({
          startY: 30,
          head: [['Artikel', 'Bestand/Min', 'Kosten/Einheit']],
          body: lowStockRows,
          theme: 'grid',
          headStyles: {
            fillColor: [255, 76, 76],
            textColor: 255
          }
        });
      } else {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text('Keine Artikel mit niedrigem Bestand gefunden.', 20, 30);
      }
      
      // Top-Kategorien nach Umsatz
      const categoryStats = {};
      yearSales.forEach(sale => {
        sale.items.forEach(item => {
          // Hier müssten wir eigentlich die Kategorien der Getränke ermitteln
          // Als Vereinfachung nutzen wir die Getränkenamen als Kategorien
          const drink = drinksData.find(d => d._id === item.drinkId || d.id === item.drinkId);
          const category = drink?.category || 'other';
          
          if (!categoryStats[category]) {
            categoryStats[category] = { revenue: 0, count: 0 };
          }
          
          categoryStats[category].revenue += parseFloat(item.quantity) * parseFloat(item.pricePerUnit);
          categoryStats[category].count += parseFloat(item.quantity);
        });
      });
      
      const finalY3 = doc.autoTable.previous.finalY || 30;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top-Kategorien nach Umsatz', 14, finalY3 + 15);
      
      const categoryRows = Object.entries(categoryStats)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(([category, stats]) => {
          const categoryName = DRINK_CATEGORIES.find(c => c.id === category)?.name || category;
          return [
            categoryName,
            stats.count,
            `${stats.revenue.toFixed(2)} €`,
            `${(yearlyRevenue > 0 ? (stats.revenue / yearlyRevenue * 100) : 0).toFixed(1)}%`
          ];
        });
      
      doc.autoTable({
        startY: finalY3 + 20,
        head: [['Kategorie', 'Anzahl verkauft', 'Umsatz', '% vom Gesamtumsatz']],
        body: categoryRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      // Handlungsempfehlungen basierend auf Datenanalyse
      const finalY4 = doc.autoTable.previous.finalY || finalY3 + 20;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Handlungsempfehlungen', 14, finalY4 + 15);
      
      // Muster in den Daten erkennen und Empfehlungen ableiten
      const recommendations = [];
      
      // 1. Niedrigen Bestand prüfen
      if (lowStockItems.length > 0) {
        recommendations.push(
          `${lowStockItems.length} Artikel haben niedrigen Bestand und sollten nachbestellt werden.`
        );
      }
      
      // 2. Umsatztrend prüfen
      const lastTwoMonths = monthlyRevenues.slice(-2);
      if (lastTwoMonths.length >= 2) {
        const lastMonth = lastTwoMonths[1];
        const previousMonth = lastTwoMonths[0];
        const change = ((lastMonth - previousMonth) / previousMonth) * 100;
        
        if (change < -10) {
          recommendations.push(
            `Der Umsatz ist im letzten Monat um ${Math.abs(change).toFixed(1)}% gesunken. Eine Überprüfung der Marketingstrategie wird empfohlen.`
          );
        } else if (change > 10) {
          recommendations.push(
            `Der Umsatz ist im letzten Monat um ${change.toFixed(1)}% gestiegen. Analyse der erfolgreichen Maßnahmen wird empfohlen.`
          );
        }
      }
      
      // 3. Top-Produkte Empfehlung
      if (topProducts.length > 0) {
        recommendations.push(
          `"${topProducts[0].name}" ist das meistverkaufte Produkt. Sicherstellen, dass der Bestand ausreichend ist und Sonderaktionen in Betracht ziehen.`
        );
      }
      
      // 4. Prüfen, ob es viele Produkte mit wenig Umsatz gibt
      const lowSellingProducts = Object.values(productStats)
        .filter(product => product.revenue < yearlyRevenue * 0.01) // Weniger als 1% des Jahresumsatzes
        .length;
      
      if (lowSellingProducts > 5) {
        recommendations.push(
          `${lowSellingProducts} Produkte tragen weniger als 1% zum Gesamtumsatz bei. Überprüfung des Sortiments empfohlen.`
        );
      }
      
      // 5. Allgemeine Budget-Empfehlung basierend auf Umsatz
      const avgMonthlyRevenue = monthlyRevenues.reduce((sum, r) => sum + r, 0) / Math.max(1, monthlyRevenues.length);
      recommendations.push(
        `Basierend auf dem durchschnittlichen Monatsumsatz von ${avgMonthlyRevenue.toFixed(2)} € wird ein Marketingbudget von ${(avgMonthlyRevenue * 0.05).toFixed(2)} € empfohlen.`
      );
      
      // Empfehlungen darstellen
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      let recommendationY = finalY4 + 25;
      
      recommendations.forEach((recommendation, index) => {
        doc.text(`${index + 1}. ${recommendation}`, 20, recommendationY);
        recommendationY += 8;
      });
      
      // Fußzeile
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Seite ${i} von ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text('Bartender - Gesamtübersicht', 14, doc.internal.pageSize.getHeight() - 10);
      }
      
      // PDF speichern
      doc.save(`Gesamtübersicht-${format(currentDate, 'yyyy-MM-dd')}.pdf`);
      
      console.log('Overall report generated successfully');
    } catch (err) {
      console.error('Error generating overall report:', err);
      setError('Fehler beim Generieren des Gesamtübersicht-Berichts');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Bestandsübersicht-Bericht generieren
  const generateInventoryOverviewReport = async () => {
    setExportFormat('inventory-overview-report');
    setExportLoading(true);
    
    try {
      // Daten vom Server laden
      const [inventory, suppliers] = await Promise.all([
        inventoryApi.getAll(),
        suppliersApi.getAll()
      ]);
      
      console.log(`Generating inventory overview report with ${inventory.length} items`);
      
      if (inventory.length === 0) {
        setError('Keine Inventareinträge gefunden.');
        setExportLoading(false);
        return;
      }
      
      // PDF erstellen
      const doc = new jsPDF();
      
      // Titel
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Bestandsübersicht', 14, 15);
      
      const currentDate = new Date();
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Erstellt am: ${format(currentDate, 'dd.MM.yyyy HH:mm')}`, 14, 22);
      
      // Zusammenfassung des Lagerbestands
      const totalItems = inventory.length;
      const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
      const lowStockItems = inventory.filter(item => item.quantity <= item.minQuantity).length;
      
      // Übersicht zeichnen
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Bestandsübersicht', 14, 35);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Anzahl Artikel im Lager: ${totalItems}`, 20, 45);
      doc.text(`Gesamtwert des Lagerbestands: ${totalValue.toFixed(2)} €`, 20, 52);
      doc.text(`Artikel mit niedrigem Bestand: ${lowStockItems}`, 20, 59);
      
      // Kategorieweise Zusammenfassung
      const categoryStats = {};
      INVENTORY_CATEGORIES.forEach(category => {
        categoryStats[category.id] = {
          name: category.name,
          count: 0,
          value: 0
        };
      });
      
      inventory.forEach(item => {
        if (categoryStats[item.category]) {
          categoryStats[item.category].count += 1;
          categoryStats[item.category].value += item.quantity * item.costPerUnit;
        }
      });
      
      // Kategorie-Tabelle
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Bestand nach Kategorien', 14, 75);
      
      const categoryRows = Object.values(categoryStats)
        .sort((a, b) => b.value - a.value)
        .map(category => {
          const percentage = totalValue > 0 ? ((category.value / totalValue) * 100).toFixed(1) : '0.0';
          return [
            category.name, 
            category.count, 
            `${category.value.toFixed(2)} €`,
            `${percentage}%`
          ];
        });
      
      doc.autoTable({
        startY: 80,
        head: [['Kategorie', 'Anzahl Artikel', 'Gesamtwert', 'Anteil']],
        body: categoryRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      // Liste der Artikel mit niedrigem Bestand
      const lowStockItemsList = inventory
        .filter(item => item.quantity <= item.minQuantity)
        .sort((a, b) => a.quantity / a.minQuantity - b.quantity / b.minQuantity);
      
      const finalY1 = doc.autoTable.previous.finalY || 80;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Artikel mit niedrigem Bestand', 14, finalY1 + 15);
      
      if (lowStockItemsList.length > 0) {
        const lowStockRows = lowStockItemsList.map(item => {
          const supplier = suppliers.find(s => s._id === item.supplier)?.name || '-';
          const categoryName = INVENTORY_CATEGORIES.find(c => c.id === item.category)?.name || item.category;
          const unitName = INVENTORY_UNITS.find(u => u.id === item.unit)?.name || item.unit;
          
          return [
            item.name,
            categoryName,
            `${item.quantity} / ${item.minQuantity} ${unitName}`,
            `${item.costPerUnit.toFixed(2)} €`,
            supplier,
            item.lastOrderDate ? format(new Date(item.lastOrderDate), 'dd.MM.yyyy') : '-'
          ];
        });
        
        doc.autoTable({
          startY: finalY1 + 20,
          head: [['Artikel', 'Kategorie', 'Bestand/Min', 'Kosten/Einheit', 'Lieferant', 'Letzte Bestellung']],
          body: lowStockRows,
          theme: 'grid',
          headStyles: {
            fillColor: [255, 76, 76],
            textColor: 255
          }
        });
      } else {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text('Keine Artikel mit niedrigem Bestand gefunden.', 20, finalY1 + 25);
      }
      
      // Neue Seite für die vollständige Artikelliste
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Vollständige Artikelliste', 14, 15);
      
      // Gruppiere nach Kategorie für bessere Übersicht
      const inventoryByCategory = {};
      
      inventory.forEach(item => {
        const categoryId = item.category || 'other';
        if (!inventoryByCategory[categoryId]) {
          inventoryByCategory[categoryId] = [];
        }
        inventoryByCategory[categoryId].push(item);
      });
      
      let tableY = 25;
      
      // Für jede Kategorie eine eigene Tabelle
      INVENTORY_CATEGORIES.forEach(category => {
        const items = inventoryByCategory[category.id] || [];
        
        if (items.length === 0) return;
        
        if (tableY > doc.internal.pageSize.getHeight() - 50) {
          doc.addPage();
          tableY = 15;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(category.name, 14, tableY);
        
        const categoryItems = items.map(item => {
          const supplier = suppliers.find(s => s._id === item.supplier)?.name || '-';
          const unitName = INVENTORY_UNITS.find(u => u.id === item.unit)?.name || item.unit;
          
          return [
            item.name,
            `${item.quantity} ${unitName}`,
            `${item.costPerUnit.toFixed(2)} €`,
            `${(item.quantity * item.costPerUnit).toFixed(2)} €`,
            supplier
          ];
        });
        
        doc.autoTable({
          startY: tableY + 5,
          head: [['Artikel', 'Menge', 'Kosten/Einheit', 'Gesamtwert', 'Lieferant']],
          body: categoryItems,
          theme: 'grid',
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: 255
          },
          columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' }
          }
        });
        
        tableY = doc.autoTable.previous.finalY + 15;
      });
      
      // Fußzeile
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Seite ${i} von ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text('Bartender - Bestandsübersicht', 14, doc.internal.pageSize.getHeight() - 10);
      }
      
      // PDF speichern
      doc.save(`Bestandsübersicht-${format(currentDate, 'yyyy-MM-dd')}.pdf`);
      
      console.log('Inventory overview report generated successfully');
    } catch (err) {
      console.error('Error generating inventory overview report:', err);
      setError('Fehler beim Generieren des Bestandsübersicht-Berichts');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Jahresübersicht-Bericht generieren
  const generateYearlyReport = () => {
    setExportFormat('yearly-report');
    setExportLoading(true);
    
    try {
      // Aktuelles Jahr bestimmen
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      
      // Start- und Enddatum für das aktuelle Jahr
      const startDate = new Date(currentYear, 0, 1);
      const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      
      // Verkäufe für das aktuelle Jahr filtern
      const yearlySales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      });
      
      console.log(`Generating yearly report for ${currentYear} with ${yearlySales.length} sales`);
      
      if (yearlySales.length === 0) {
        setError(`Keine Verkäufe im Jahr ${currentYear} gefunden.`);
        setExportLoading(false);
        return;
      }
      
      // PDF erstellen
      const doc = new jsPDF();
      
      // Titel
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`Jahresübersicht ${currentYear}`, 14, 15);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Erstellt am: ${format(currentDate, 'dd.MM.yyyy HH:mm')}`, 14, 22);
      
      // Zusammenfassung des Jahresumsatzes
      const totalYearlyRevenue = yearlySales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
      const totalYearlyItems = yearlySales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);
      
      // Monatliche Umsätze
      const monthlyRevenues = Array(12).fill(0);
      const monthlyCounts = Array(12).fill(0);
      
      yearlySales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const month = saleDate.getMonth();
        
        monthlyRevenues[month] += parseFloat(sale.total || 0);
        monthlyCounts[month] += 1;
      });
      
      // Übersicht zeichnen
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Jahresübersicht', 14, 35);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gesamtumsatz ${currentYear}: ${totalYearlyRevenue.toFixed(2)} €`, 20, 45);
      doc.text(`Anzahl Verkäufe: ${yearlySales.length}`, 20, 52);
      doc.text(`Verkaufte Artikel: ${totalYearlyItems}`, 20, 59);
      doc.text(`Durchschnittlicher Verkaufswert: ${(totalYearlyRevenue / yearlySales.length).toFixed(2)} €`, 20, 66);
      
      // Monatliche Umsätze Tabelle
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Monatliche Umsätze', 14, 80);
      
      const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
      ];
      
      const monthlyData = monthNames.map((month, index) => {
        const revenue = monthlyRevenues[index];
        const count = monthlyCounts[index];
        const percentage = totalYearlyRevenue > 0 ? (revenue / totalYearlyRevenue * 100).toFixed(1) : '0.0';
        
        return [
          month, 
          count, 
          `${revenue.toFixed(2)} €`,
          `${percentage}%`
        ];
      });
      
      doc.autoTable({
        startY: 85,
        head: [['Monat', 'Anzahl Verkäufe', 'Umsatz', 'Anteil am Jahresumsatz']],
        body: monthlyData,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      // Getränkestatistik
      const drinkStats = {};
      yearlySales.forEach(sale => {
        sale.items.forEach(item => {
          if (!drinkStats[item.name]) {
            drinkStats[item.name] = { quantity: 0, revenue: 0 };
          }
          drinkStats[item.name].quantity += item.quantity;
          drinkStats[item.name].revenue += item.quantity * item.pricePerUnit;
        });
      });
      
      // Top-Getränke nach Umsatz
      const topDrinks = Object.entries(drinkStats)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10);
      
      const finalY1 = doc.autoTable.previous.finalY || 85;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 10 Getränke im Jahr', 14, finalY1 + 15);
      
      const topDrinkRows = topDrinks.map(([name, data]) => {
        const percentage = ((data.revenue / totalYearlyRevenue) * 100).toFixed(1);
        return [name, data.quantity, `${data.revenue.toFixed(2)} €`, `${percentage}%`];
      });
      
      doc.autoTable({
        startY: finalY1 + 20,
        head: [['Getränk', 'Menge', 'Umsatz', 'Anteil']],
        body: topDrinkRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      // Zahlungsmethoden
      const paymentMethods = {};
      yearlySales.forEach(sale => {
        const method = sale.paymentMethod || 'cash';
        if (!paymentMethods[method]) {
          paymentMethods[method] = { count: 0, total: 0 };
        }
        paymentMethods[method].count += 1;
        paymentMethods[method].total += parseFloat(sale.total || 0);
      });
      
      // Neue Seite für Quartalsumsätze und Vergleiche
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Quartalsumsätze', 14, 15);
      
      // Quartalsumsätze berechnen
      const quarterlyRevenues = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4
      
      monthlyRevenues.forEach((revenue, index) => {
        const quarter = Math.floor(index / 3);
        quarterlyRevenues[quarter] += revenue;
      });
      
      const quarterData = [
        ['Q1 (Jan-Mär)', quarterlyRevenues[0].toFixed(2) + ' €', ((quarterlyRevenues[0] / totalYearlyRevenue) * 100).toFixed(1) + '%'],
        ['Q2 (Apr-Jun)', quarterlyRevenues[1].toFixed(2) + ' €', ((quarterlyRevenues[1] / totalYearlyRevenue) * 100).toFixed(1) + '%'],
        ['Q3 (Jul-Sep)', quarterlyRevenues[2].toFixed(2) + ' €', ((quarterlyRevenues[2] / totalYearlyRevenue) * 100).toFixed(1) + '%'],
        ['Q4 (Okt-Dez)', quarterlyRevenues[3].toFixed(2) + ' €', ((quarterlyRevenues[3] / totalYearlyRevenue) * 100).toFixed(1) + '%']
      ];
      
      doc.autoTable({
        startY: 25,
        head: [['Quartal', 'Umsatz', 'Anteil']],
        body: quarterData,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' }
        }
      });
      
      // Zahlungsmethoden auf dieser Seite anzeigen
      const finalY2 = doc.autoTable.previous.finalY || 25;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Zahlungsmethoden', 14, finalY2 + 15);
      
      const paymentMethodRows = Object.entries(paymentMethods).map(([method, data]) => {
        const label = PAYMENT_METHODS.find(m => m.id === method)?.name || method;
        const percentage = ((data.total / totalYearlyRevenue) * 100).toFixed(1);
        return [label, data.count, `${data.total.toFixed(2)} €`, `${percentage}%`];
      });
      
      doc.autoTable({
        startY: finalY2 + 20,
        head: [['Zahlungsart', 'Anzahl', 'Umsatz', 'Anteil']],
        body: paymentMethodRows,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      // Fußzeile
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Seite ${i} von ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text(`Bartender - Jahresübersicht ${currentYear}`, 14, doc.internal.pageSize.getHeight() - 10);
      }
      
      // PDF speichern
      doc.save(`Jahresübersicht-${currentYear}.pdf`);
      
      console.log('Yearly report generated successfully');
    } catch (err) {
      console.error('Error generating yearly report:', err);
      setError('Fehler beim Generieren des Jahresübersicht-Berichts');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Daten exportieren
  const handleExportData = (format) => {
    console.log(`Starting export in ${format} format, filtered sales count: ${filteredSales.length}`);
    
    if (filteredSales.length === 0) {
      setError('Keine Verkäufe zum Exportieren gefunden. Bitte passen Sie den Datumsbereich an.');
      return;
    }
    
    setExportFormat(format);
    setExportLoading(true);
    
    try {
      // Exportiere die gefilterten Verkäufe basierend auf dem Format
      switch (format) {
        case 'monthly-report':
          generateMonthlyReport();
          return;
          
        case 'yearly-report':
          generateYearlyReport();
          return;
          
        case 'hourly-daily-report':
          generateHourlyDailyReport();
          return;
          
        case 'drinks-report':
          generateDrinkSalesReport();
          return;
          
        case 'inventory-overview-report':
          generateInventoryOverviewReport();
          return;
          
        case 'inventory-movements-report':
          generateInventoryMovementsReport();
          return;
          
        case 'working-hours-report':
          generateWorkingHoursReport();
          return;
          
        case 'overall-report':
          generateOverallReport();
          return;
          
        case 'pdf':
          handleExportPDF();
          return;
          
        case 'excel':
          handleExportExcel();
          return;
          
        case 'csv':
          // CSV-Header
          let exportContent = 'Datum,Getränk,Menge,Preis,Gesamt,Zahlungsart,Mitarbeiter,Notizen\n';
          
          // CSV-Zeilen
          filteredSales.forEach(sale => {
            const saleDate = formatDate(sale.date);
            const paymentMethod = getPaymentMethodLabel(sale.paymentMethod);
            const staffName = staff.find(s => s.id === sale.staffId || s._id === sale.staffId)?.name || 
                        (typeof sale.staffId === 'string' ? sale.staffId : 'Unbekannt');
            
            // Für jedes Item eine Zeile
            sale.items.forEach(item => {
              const total = (parseFloat(item.quantity) * parseFloat(item.pricePerUnit)).toFixed(2);
              const safeNote = sale.notes ? sale.notes.replace(/,/g, ';').replace(/\n/g, ' ') : '';
              const safeName = item.name ? item.name.replace(/,/g, ';').replace(/\n/g, ' ') : '';
              exportContent += `${saleDate},"${safeName}",${item.quantity},${parseFloat(item.pricePerUnit).toFixed(2)},${total},"${paymentMethod}","${staffName}","${safeNote}"\n`;
            });
          });
          
          // Datei herunterladen
          const blob = new Blob([exportContent], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `verkaufe-csv-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          handleCloseExportMenu();
          setExportLoading(false);
          return;
          
        case 'json':
          // JSON-Format
          let jsonContent = JSON.stringify(filteredSales, null, 2);
          
          // Datei herunterladen
          const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.href = jsonUrl;
          jsonLink.download = `verkaufe-json-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(jsonLink);
          jsonLink.click();
          document.body.removeChild(jsonLink);
          URL.revokeObjectURL(jsonUrl);
          handleCloseExportMenu();
          setExportLoading(false);
          return;
        
        default:
          console.error('Unknown export format:', format);
          setError(`Unbekanntes Exportformat: ${format}`);
          handleCloseExportMenu();
          setExportLoading(false);
          return;
      }
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Fehler beim Exportieren der Daten: ' + (err.message || err));
      handleCloseExportMenu();
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
            startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleOpenExportMenu}
            sx={{ mr: 1 }}
            disabled={filteredSales.length === 0 || exportLoading}
          >
            {exportLoading ? 'Exportiere...' : 'Exportieren'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ReportIcon />}
            onClick={handleOpenReportDialog}
            sx={{ mr: 1 }}
            color="secondary"
          >
            Berichte
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
            <MenuItem onClick={() => handleExportData('monthly-report')} disabled={exportLoading}>
              <ReportIcon fontSize="small" sx={{ mr: 1 }} color="secondary" />
              Monatsabschluss
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleExportData('pdf')} disabled={exportLoading}>
              <PdfIcon fontSize="small" sx={{ mr: 1 }} />
              PDF-Format
            </MenuItem>
            <MenuItem onClick={() => handleExportData('excel')} disabled={exportLoading}>
              <ExcelIcon fontSize="small" sx={{ mr: 1 }} />
              Excel-Format
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleExportData('csv')} disabled={exportLoading}>
              <FilePresentIcon fontSize="small" sx={{ mr: 1 }} />
              CSV-Format
            </MenuItem>
            <MenuItem onClick={() => handleExportData('json')} disabled={exportLoading}>
              <CodeIcon fontSize="small" sx={{ mr: 1 }} />
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
                        {staff.find(s => s.id === sale.staffId || s._id === sale.staffId)?.name || 
                         (typeof sale.staffId === 'string' ? sale.staffId : 
                          (sale.staffId && sale.staffId._id ? sale.staffId._id : 'Kein Mitarbeiter'))}
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
      
      {/* Dialog für Berichte */}
      <Dialog
        open={reportDialogOpen}
        onClose={handleCloseReportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <ReportFileIcon sx={{ mr: 1 }} />
            Bericht erstellen
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={4}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Berichtstyp auswählen
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Berichtstyp</InputLabel>
              <Select
                value={selectedReportType}
                onChange={handleReportTypeChange}
                label="Berichtstyp"
              >
                <MenuItem value="monthly">
                  <Box display="flex" alignItems="center">
                    <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Monatsabschluss-Bericht
                  </Box>
                </MenuItem>
                <MenuItem value="yearly">
                  <Box display="flex" alignItems="center">
                    <DateRangeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Jahresübersicht-Bericht
                  </Box>
                </MenuItem>
                <MenuItem value="hourly-daily">
                  <Box display="flex" alignItems="center">
                    <TimeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Stunden- und Tagesvergleich-Bericht
                  </Box>
                </MenuItem>
                <MenuItem value="drinks">
                  <Box display="flex" alignItems="center">
                    <SaleIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Getränkeverkäufe-Bericht
                  </Box>
                </MenuItem>
                <MenuItem value="inventory-overview">
                  <Box display="flex" alignItems="center">
                    <InventoryIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Bestandsübersicht-Bericht
                  </Box>
                </MenuItem>
                <MenuItem value="inventory-movements">
                  <Box display="flex" alignItems="center">
                    <InsightsIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Bestandsbewegungen-Bericht
                  </Box>
                </MenuItem>
                <MenuItem value="working-hours">
                  <Box display="flex" alignItems="center">
                    <TimeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Arbeitszeitübersicht-Bericht
                  </Box>
                </MenuItem>
                <MenuItem value="overall">
                  <Box display="flex" alignItems="center">
                    <AnalyticsIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Gesamtübersicht-Bericht
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Zeitraum auswählen
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Von"
                    value={reportDateRange.startDate}
                    onChange={(newDate) => setReportDateRange({
                      ...reportDateRange,
                      startDate: newDate
                    })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Bis"
                    value={reportDateRange.endDate}
                    onChange={(newDate) => setReportDateRange({
                      ...reportDateRange,
                      endDate: newDate
                    })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Berichtsdetails
            </Typography>
            <Box mt={2} p={3} sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              {selectedReportType === 'monthly' && (
                <Typography>
                  Der Monatsabschluss-Bericht enthält eine Zusammenfassung aller Verkäufe im ausgewählten Monat, 
                  inklusive Umsatzanalyse, Verkaufsstatistiken, Zahlungsmethoden und Top-Getränke.
                </Typography>
              )}
              {selectedReportType === 'yearly' && (
                <Typography>
                  Der Jahresübersicht-Bericht bietet eine umfassende Analyse der Verkäufe und Umsätze des gesamten Jahres, 
                  aufgeschlüsselt nach Monaten, Kategorien und Trends im Jahresverlauf.
                </Typography>
              )}
              {selectedReportType === 'hourly-daily' && (
                <Typography>
                  Der Stunden- und Tagesvergleich-Bericht analysiert die Verkaufsmuster nach Tageszeit und Wochentagen, 
                  um Stoßzeiten und umsatzstarke Tage zu identifizieren.
                </Typography>
              )}
              {selectedReportType === 'drinks' && (
                <Typography>
                  Der Getränkeverkäufe-Bericht liefert detaillierte Informationen über den Verkauf einzelner Getränke, 
                  Trends und Beliebtheit im Zeitverlauf.
                </Typography>
              )}
              {selectedReportType === 'inventory-overview' && (
                <Typography>
                  Der Bestandsübersicht-Bericht gibt einen Überblick über den aktuellen Lagerbestand aller Getränke 
                  und Materialien sowie Nachbestellungsempfehlungen.
                </Typography>
              )}
              {selectedReportType === 'inventory-movements' && (
                <Typography>
                  Der Bestandsbewegungen-Bericht dokumentiert alle Zu- und Abgänge im Lager, 
                  Bestellungen und Verbrauch im ausgewählten Zeitraum.
                </Typography>
              )}
              {selectedReportType === 'working-hours' && (
                <Typography>
                  Der Arbeitszeitübersicht-Bericht fasst die Arbeitszeiten aller Mitarbeiter zusammen, 
                  inklusive geleisteter Stunden, Schichten und Produktivitätsanalysen.
                </Typography>
              )}
              {selectedReportType === 'overall' && (
                <Typography>
                  Der Gesamtübersicht-Bericht kombiniert die wichtigsten Kennzahlen aus allen Bereichen zu einem 
                  umfassenden Überblick über die Geschäftsentwicklung.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog}>Abbrechen</Button>
          <Button 
            onClick={handleGenerateReport} 
            variant="contained" 
            color="primary"
            disabled={exportLoading}
            startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <ReportIcon />}
          >
            {exportLoading ? 'Wird generiert...' : 'Bericht generieren'}
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