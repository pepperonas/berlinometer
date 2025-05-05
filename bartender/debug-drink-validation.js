/**
 * Debug-Skript zur Überprüfung der Drink-Validierung
 * 
 * Dieses Skript testet die Validierung eines Getränks, ohne es in die Datenbank zu speichern.
 * Es gibt detaillierte Informationen darüber aus, welche Validierungsfehler auftreten.
 */

const Drink = require('./server/models/Drink');

// Gültige Testdaten für ein Getränk
const validDrink = {
  name: "Test Getränk",
  description: "Beschreibung des Testgetränks",
  price: 5.50,
  category: "beer",
  ingredients: [
    { name: "Zutat 1", amount: "50ml" },
    { name: "Zutat 2", amount: "30ml" }
  ],
  alcohol: 5.0,
  stock: 10,
  popular: true
};

// Ungültige Testdaten für ein Getränk
const invalidDrink = {
  // Name fehlt absichtlich (is required)
  description: "Ungültiges Testgetränk",
  price: "nicht-numerisch",  // Sollte eine Zahl sein
  category: "ungültig",     // Nicht im enum
  ingredients: "keine-array", // Sollte ein Array sein
  alcohol: 150,             // Sollte <= 100 sein
  stock: -5,                // Sollte >= 0 sein
  popular: "nicht-boolean"  // Sollte boolean sein
};

// Testet die Validierung eines Getränks und gibt die Ergebnisse aus
async function testDrinkValidation(drinkData, label) {
  console.log(`\n=== Test für ${label} ===`);
  
  // Mongoose-Model erstellen
  const drink = new Drink(drinkData);
  
  console.log("Erstellte Getränkdaten:");
  console.log(JSON.stringify(drink.toObject(), null, 2));
  
  // Validierung durchführen
  try {
    await drink.validate();
    console.log("✅ Validierung erfolgreich");
  } catch (error) {
    console.log("❌ Validierungsfehler:");
    
    if (error.errors) {
      Object.keys(error.errors).forEach(field => {
        console.log(`  - ${field}: ${error.errors[field].message}`);
      });
    } else {
      console.log("Unerwarteter Fehler:", error);
    }
  }
  
  // Feldtypen überprüfen
  console.log("\nFeldtypen:");
  Object.keys(Drink.schema.paths).forEach(field => {
    const dataField = drink[field];
    console.log(`  - ${field}: ${Drink.schema.paths[field].instance} (Wert: ${typeof dataField === 'object' ? JSON.stringify(dataField) : dataField})`);
  });
}

// Hauptfunktion für die Tests
async function runTests() {
  console.log("=== Mongoose Drink-Schema Validierungstest ===");
  
  console.log("\nSchema Feldüberprüfung:");
  Object.keys(Drink.schema.paths).forEach(path => {
    const schemaField = Drink.schema.paths[path];
    console.log(`- ${path}:`);
    console.log(`  - Typ: ${schemaField.instance}`);
    if (schemaField.isRequired) console.log(`  - Erforderlich: ${schemaField.isRequired}`);
    if (schemaField.enumValues && schemaField.enumValues.length) console.log(`  - Enum Werte: ${schemaField.enumValues.join(', ')}`);
    if (schemaField.defaultValue !== undefined) console.log(`  - Standardwert: ${schemaField.defaultValue}`);
    if (schemaField.validators && schemaField.validators.length) {
      console.log(`  - Hat ${schemaField.validators.length} Validator(en)`);
      schemaField.validators.forEach((validator, i) => {
        if (validator.message) console.log(`    - Validator ${i+1} Message: ${validator.message}`);
      });
    }
  });
  
  // Test gültige Daten
  await testDrinkValidation(validDrink, "gültiges Getränk");
  
  // Test ungültige Daten
  await testDrinkValidation(invalidDrink, "ungültiges Getränk");
  
  // Frontend-Formular-Format testen
  const frontendFormData = {
    name: "Formular Getränk",
    category: "beer",
    price: "4.50",        // String statt Zahl
    cost: "2.00",         // Im Frontend gibt es 'cost', aber nicht im Schema
    ingredients: ["Wasser", "Hopfen", "Malz"],  // Array von Strings statt Objekten
    stock: "20",          // String statt Zahl
    isActive: true,       // Im Frontend 'isActive', aber im Schema nicht vorhanden
    popular: true
  };
  
  await testDrinkValidation(frontendFormData, "Frontend-Formulardaten");
}

// Tests ausführen
runTests().catch(err => {
  console.error("Fehler beim Ausführen der Tests:", err);
});