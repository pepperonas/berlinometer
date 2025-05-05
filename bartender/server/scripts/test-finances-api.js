/**
 * Test-Skript für Finanzen-API-Endpunkte
 * 
 * Dieses Skript testet, ob die Finanzen-API-Endpunkte korrekt funktionieren,
 * indem es Anfragen an den laufenden Server sendet und die Antworten überprüft.
 */

const axios = require('axios');

// Konfiguration
const API_URL = process.env.API_URL || 'http://localhost:5024/api';
console.log(`Testing API endpoints at: ${API_URL}`);

// Helper-Funktion zum Testen eines API-Endpunkts
const testEndpoint = async (endpoint, method = 'GET', data = null, expectedStatus = 200) => {
  console.log(`\nTesting ${method} ${endpoint}`);
  
  try {
    let response;
    
    if (method === 'GET') {
      response = await axios.get(`${API_URL}${endpoint}`);
    } else if (method === 'POST') {
      response = await axios.post(`${API_URL}${endpoint}`, data);
    } else if (method === 'PUT') {
      response = await axios.put(`${API_URL}${endpoint}`, data);
    } else if (method === 'DELETE') {
      response = await axios.delete(`${API_URL}${endpoint}`);
    }
    
    // Prüfe, ob der Status wie erwartet ist
    if (response.status === expectedStatus) {
      console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
      
      // Zeige Daten an, wenn vorhanden
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log(`   Received ${response.data.length} items`);
          if (response.data.length > 0) {
            console.log(`   First item sample: ${JSON.stringify(response.data[0]).substring(0, 100)}...`);
          }
        } else {
          console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
      }
      
      return { success: true, data: response.data };
    } else {
      console.log(`❌ ${method} ${endpoint} - Expected status ${expectedStatus}, got ${response.status}`);
      return { success: false, error: `Unexpected status: ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    
    return { success: false, error: error.message, details: error.response?.data };
  }
};

// Hauptfunktion zum Testen aller Finanzen-Endpunkte
const testFinancesAPI = async () => {
  console.log('=== Testing Finances API Endpoints ===');
  
  // Test health endpoint first to make sure server is running
  const healthResult = await testEndpoint('/health');
  if (!healthResult.success) {
    console.error('\n❌ Server nicht erreichbar! Bitte starten Sie den Server und versuchen Sie es erneut.');
    return;
  }
  
  // Test debug endpoint for finances
  await testEndpoint('/finances/test');
  
  // Test Expenses Endpoints
  console.log('\n--- Testing Expenses Endpoints ---');
  
  // GET all expenses
  const expensesResult = await testEndpoint('/finances/expenses');
  let expenseId = null;
  
  if (expensesResult.success && Array.isArray(expensesResult.data) && expensesResult.data.length > 0) {
    expenseId = expensesResult.data[0].id;
    console.log(`Using expense ID for further tests: ${expenseId}`);
  }
  
  // Test create expense
  const newExpense = {
    category: 'other',
    amount: 123.45,
    date: new Date().toISOString(),
    description: 'Test-Ausgabe via API',
    recurring: false
  };
  
  const createExpenseResult = await testEndpoint('/finances/expenses', 'POST', newExpense);
  
  if (createExpenseResult.success) {
    expenseId = createExpenseResult.data.id;
    console.log(`Created new expense with ID: ${expenseId}`);
    
    // Test get single expense
    await testEndpoint(`/finances/expenses/${expenseId}`);
    
    // Test update expense
    const updateExpense = {
      ...newExpense,
      amount: 150.75,
      description: 'Aktualisierte Test-Ausgabe'
    };
    
    await testEndpoint(`/finances/expenses/${expenseId}`, 'PUT', updateExpense);
    
    // Test delete expense
    await testEndpoint(`/finances/expenses/${expenseId}`, 'DELETE');
  }
  
  // Test Income Endpoints
  console.log('\n--- Testing Income Endpoints ---');
  
  // GET all income
  const incomeResult = await testEndpoint('/finances/income');
  let incomeId = null;
  
  if (incomeResult.success && Array.isArray(incomeResult.data) && incomeResult.data.length > 0) {
    incomeId = incomeResult.data[0].id;
    console.log(`Using income ID for further tests: ${incomeId}`);
  }
  
  // Test create income
  const newIncome = {
    category: 'other',
    amount: 543.21,
    date: new Date().toISOString(),
    description: 'Test-Einnahme via API'
  };
  
  const createIncomeResult = await testEndpoint('/finances/income', 'POST', newIncome);
  
  if (createIncomeResult.success) {
    incomeId = createIncomeResult.data.id;
    console.log(`Created new income with ID: ${incomeId}`);
    
    // Test get single income
    await testEndpoint(`/finances/income/${incomeId}`);
    
    // Test update income
    const updateIncome = {
      ...newIncome,
      amount: 600.00,
      description: 'Aktualisierte Test-Einnahme'
    };
    
    await testEndpoint(`/finances/income/${incomeId}`, 'PUT', updateIncome);
    
    // Test delete income
    await testEndpoint(`/finances/income/${incomeId}`, 'DELETE');
  }
  
  console.log('\n=== Finances API Test Complete ===');
};

// Führe die Tests aus
testFinancesAPI().catch(error => {
  console.error('Unerwarteter Fehler beim Testen der API:', error);
});