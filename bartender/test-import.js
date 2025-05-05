const fs = require('fs');
const axios = require('axios');

// Read the test CSV file
const csvData = fs.readFileSync('./test-import.csv', 'utf8');

// Make a request to the import endpoint
async function testImport() {
  try {
    console.log('Starting import test...');
    console.log('CSV data length:', csvData.length, 'bytes');
    console.log('CSV data:', csvData);
    
    const response = await axios.post('http://localhost:5024/api/sales/import', {
      format: 'csv',
      data: csvData
    });
    
    console.log('Import response status:', response.status);
    console.log('Imported sales:', response.data.length);
    console.log('First imported sale:', JSON.stringify(response.data[0], null, 2));
    
    // Now fetch all sales to verify they were properly saved
    const salesResponse = await axios.get('http://localhost:5024/api/sales');
    console.log('Total sales in database:', salesResponse.data.length);
    
  } catch (error) {
    console.error('Import error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testImport();