/**
 * Finances API Test Tool
 * Testet, ob die Finanzen-API-Endpunkte korrekt funktionieren
 */

const axios = require('axios');

// Konfiguration
const API_URL = process.env.API_URL || 'http://localhost:5024/api';
console.log(`\nTesting Finance API endpoints at: ${API_URL}\n`);

// Einfache Test-Funktion
const testEndpoint = async (endpoint) => {
  console.log(`Testing: ${endpoint}`);
  try {
    const response = await axios.get(`${API_URL}${endpoint}`);
    console.log(`  ✅ Status: ${response.status}`);
    
    if (Array.isArray(response.data)) {
      console.log(`  ✅ Received ${response.data.length} items`);
    } else {
      console.log(`  ✅ Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
    }
    return true;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`     Status: ${error.response.status}`);
      console.log(`     Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
};

// Hauptfunktion
const main = async () => {
  try {
    // API-Routen testen
    console.log("=== Testing Finances API ===\n");
    
    // Test-Endpunkt
    const testResult = await testEndpoint('/finances/test');
    
    if (!testResult) {
      console.log("\n❌ Der Finances-Test-Endpunkt ist nicht erreichbar.");
      console.log("Bitte stelle sicher, dass:");
      console.log("1. Der Server läuft");
      console.log("2. In server.js die Zeile 'app.use('/api/finances', require('./server/routes/finances'))' enthalten ist");
      console.log("3. server/routes/finances.js existiert");
      process.exit(1);
    }
    
    // Ausgaben abrufen
    const expensesResult = await testEndpoint('/finances/expenses');
    
    if (!expensesResult) {
      console.log("\n❌ Der Ausgaben-Endpunkt ist nicht erreichbar.");
      console.log("Bitte stelle sicher, dass die Finanzen-Collections in MongoDB erstellt wurden.");
      console.log("Führe die Abfragen in server/scripts/finance-queries.txt in der MongoDB-Konsole aus.");
    }
    
    // Einnahmen abrufen
    const incomeResult = await testEndpoint('/finances/income');
    
    if (!incomeResult) {
      console.log("\n❌ Der Einnahmen-Endpunkt ist nicht erreichbar.");
      console.log("Bitte stelle sicher, dass die Finanzen-Collections in MongoDB erstellt wurden.");
      console.log("Führe die Abfragen in server/scripts/finance-queries.txt in der MongoDB-Konsole aus.");
    }
    
    console.log("\n=== Check completed ===");
    
    if (testResult && expensesResult && incomeResult) {
      console.log("\n✅ Alle Finanzen-API-Endpunkte funktionieren korrekt!");
      console.log("Du kannst nun die Finanzen-Seite im Frontend unter http://localhost:3000/finances aufrufen.");
    } else {
      console.log("\n⚠️ Nicht alle Finanzen-API-Endpunkte sind erreichbar.");
      console.log("Bitte folge den Anweisungen oben, um die Probleme zu beheben.");
    }
    
  } catch (error) {
    console.log(`Unerwarteter Fehler beim Testen der API:`, error);
  }
};

main();