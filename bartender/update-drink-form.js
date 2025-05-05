/**
 * Verbesserter Code für die Komponente DrinkForm und das Speichern von Getränken
 * 
 * Dieses Skript enthält Anpassungen, die vorgenommen werden sollten, um das DrinkForm
 * mit dem Mongoose-Schema kompatibel zu machen.
 */

/**
 * Problem:
 * Die Hauptprobleme beim Speichern von Getränken:
 * 
 * 1. Zutaten (ingredients) werden im Frontend als String-Array, aber im Backend als 
 *    Array von Objekten mit name und amount erwartet
 * 
 * 2. Das Frontend sendet ein "cost" Feld, das im Mongoose-Schema nicht existiert
 * 
 * 3. Fehlende Konvertierung von String-Werten zu numerischen Werten
 */

// LÖSUNG TEIL 1: Anpassung der onSubmit-Funktion im DrinkForm

/**
 * Modifiziere die handleSubmit-Funktion in DrinkForm.jsx (um Zeile 131):
 * 
 * Ändere:
 */
const handleSubmit = (e) => {
  e.preventDefault();
  
  if (validateForm()) {
    // Numerische Werte konvertieren
    const formattedValues = {
      ...values,
      price: parseFloat(values.price),
      cost: parseFloat(values.cost),
      stock: parseInt(values.stock, 10),
    };
    
    onSubmit(formattedValues);
  }
};

/**
 * In:
 */
const handleSubmit = (e) => {
  e.preventDefault();
  
  if (validateForm()) {
    // Korrekte Formatierung der Daten für die API
    const formattedValues = {
      ...values,
      // Numerische Werte konvertieren
      price: parseFloat(values.price),
      stock: parseInt(values.stock, 10),
      
      // Zutaten richtig formatieren: von String-Array zu Objekt-Array
      ingredients: values.ingredients.map(ingredient => {
        // Falls ingredient bereits ein Objekt ist, nicht ändern
        if (typeof ingredient === 'object' && ingredient.name) {
          return ingredient;
        }
        // Sonst als Objekt mit name-Eigenschaft formatieren
        return { name: ingredient };
      }),
      
      // Optional: cost in eine eigene Variable extrahieren, wenn es für andere Zwecke benötigt wird
      // aber nicht an die API senden, da es nicht im Schema existiert
    };
    
    // cost-Feld entfernen, da es nicht im Mongoose-Schema existiert
    delete formattedValues.cost;
    
    onSubmit(formattedValues);
  }
};


// LÖSUNG TEIL 2: Anpassung im API-Service

/**
 * In der Datei src/services/api.js sollte die createDrink und updateDrink Funktionen 
 * angepasst werden, um sicherzustellen, dass die Daten korrekt formatiert sind:
 */

// Beispiel für die createDrink-Funktion
export const createDrink = async (drinkData) => {
  try {
    // Sicherstellen, dass die Zutaten das richtige Format haben
    if (drinkData.ingredients && Array.isArray(drinkData.ingredients)) {
      drinkData.ingredients = drinkData.ingredients.map(ingredient => {
        if (typeof ingredient === 'object' && ingredient.name) {
          return ingredient;
        }
        return { name: ingredient };
      });
    }
    
    // Entferne Felder, die nicht im Schema existieren
    const { cost, ...validDrinkData } = drinkData;
    
    const response = await api.post('/api/drinks', validDrinkData);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen des Getränks:', error);
    throw error;
  }
};

/**
 * ZUSAMMENFASSUNG DER ÄNDERUNGEN:
 * 
 * 1. Formatiere die Zutaten (ingredients) als Array von Objekten mit name-Eigenschaft
 * 
 * 2. Entferne das cost-Feld vor dem Senden an die API
 * 
 * 3. Stelle sicher, dass numerische Werte korrekt umgewandelt werden
 * 
 * 4. Verwende die verbesserte Middleware im Backend (siehe fix-drinks-middleware.js)
 */