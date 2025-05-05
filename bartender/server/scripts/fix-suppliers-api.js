/**
 * Fix Script für Suppliers API
 * Diagnostiziert und behebt Probleme mit der Lieferanten-API
 */

const axios = require('axios');

// Konfiguration
const API_URL = process.env.API_URL || 'http://localhost:5024/api';
console.log(`\nTesten der Suppliers API auf: ${API_URL}\n`);

// Hauptfunktion
const main = async () => {
  try {
    console.log("=== Diagnostics for Suppliers API ===\n");
    
    // 1. Test GET /suppliers Endpunkt
    console.log("1. Testing GET /suppliers endpoint");
    try {
      const suppliers = await axios.get(`${API_URL}/suppliers`);
      console.log(`   ✅ GET /suppliers - Status: ${suppliers.status}`);
      console.log(`   ✅ Received ${suppliers.data.length} suppliers`);
    } catch (error) {
      console.log(`   ❌ GET /suppliers - Error: ${error.message}`);
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
        console.log(`     Data: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    // 2. Test POST /suppliers Endpunkt
    console.log("\n2. Testing POST /suppliers endpoint");
    console.log("   Creating test supplier with minimal data...");
    
    const testSupplier = {
      name: "Test Supplier " + new Date().toISOString(),
      contactPerson: "Test Contact", // Richtiger Feldname für das Backend
      email: "test@example.com",
      phone: "123456789",
      notes: "Test supplier created by diagnostic script"
    };
    
    try {
      const createResult = await axios.post(`${API_URL}/suppliers`, testSupplier);
      console.log(`   ✅ POST /suppliers - Status: ${createResult.status}`);
      console.log(`   ✅ Created supplier with ID: ${createResult.data._id}`);
      
      // 3. Test DELETE /suppliers/:id Endpunkt
      console.log("\n3. Testing DELETE /suppliers/:id endpoint");
      console.log(`   Deleting test supplier with ID: ${createResult.data._id}`);
      
      try {
        const deleteResult = await axios.delete(`${API_URL}/suppliers/${createResult.data._id}`);
        console.log(`   ✅ DELETE /suppliers/:id - Status: ${deleteResult.status}`);
        console.log(`   ✅ Supplier deleted successfully`);
      } catch (error) {
        console.log(`   ❌ DELETE /suppliers/:id - Error: ${error.message}`);
        if (error.response) {
          console.log(`     Status: ${error.response.status}`);
          console.log(`     Data: ${JSON.stringify(error.response.data)}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ POST /suppliers - Error: ${error.message}`);
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
        console.log(`     Data: ${JSON.stringify(error.response.data)}`);
      }
      
      console.log("\n=== DIAGNOSIS ===");
      console.log("Das Problem scheint bei der Erstellung von Lieferanten zu liegen.");
      console.log("Wahrscheinliche Ursache: Feldnamen-Mismatch zwischen Frontend und Backend");
      console.log("\nLösung:");
      console.log("1. Im Frontend werden folgende Felder verwendet:");
      console.log("   - name, contact, email, phone, address, notes");
      console.log("\n2. Im Backend werden folgende Felder erwartet:");
      console.log("   - name, contactPerson, email, phone, address (Objekt), notes");
      console.log("\n3. Folgende Änderungen müssen vorgenommen werden:");
      console.log("   - 'contact' in 'contactPerson' umbenennen");
      console.log("   - 'address' als String zu Objekt umwandeln falls nötig");
    }
    
    console.log("\n=== Diagnostics completed ===");
    
  } catch (error) {
    console.error("Unerwarteter Fehler:", error);
  }
};

main();