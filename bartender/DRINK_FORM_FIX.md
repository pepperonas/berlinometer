# Anleitung zur Anpassung des DrinkForm

Das momentane Drink-Formular und das Backend-Modell haben einige Unterschiede, die zu Fehlern beim Speichern führen. Hier sind die Probleme und Lösungsvorschläge:

## Problem 1: Zutaten-Format (ingredients)

**Problem:** 
Das Frontend sendet Zutaten als einfaches String-Array, aber das Backend erwartet ein Array von Objekten.

**Frontend sendet:**
```javascript
ingredients: ["Wasser", "Hopfen", "Malz"]
```

**Backend erwartet:**
```javascript
ingredients: [
  { name: "Wasser" },
  { name: "Hopfen" },
  { name: "Malz" }
]
```

**Lösungen:**

1. **Backend-Lösung (bereits implementiert):**
   Die Route wurde angepasst, um String-Arrays automatisch in das erwartete Format umzuwandeln.

2. **Alternative Frontend-Lösung:**

```jsx
// In DrinkForm.jsx ändern:

// Aktueller Code für das Hinzufügen von Zutaten
handleAddIngredient = () => {
  setValues(prev => ({
    ...prev,
    ingredients: [...prev.ingredients, newIngredient.trim()]
  }));
};

// Geänderter Code für das Hinzufügen von Zutaten
handleAddIngredient = () => {
  setValues(prev => ({
    ...prev,
    ingredients: [...prev.ingredients, { name: newIngredient.trim() }]
  }));
};
```

## Problem 2: cost vs. price

**Problem:** 
Das Frontend sendet ein `cost`-Feld, aber das Backend-Modell hat nur ein `price`-Feld.

**Lösungen:**

1. **Backend-Lösung (bereits implementiert):**
   Das `cost`-Feld wird ignoriert, wenn es vom Frontend gesendet wird.

2. **Frontend-Lösung:**
   Ändern Sie das Formular, um das korrekte Feldname zu verwenden:

```jsx
// In DrinkForm.jsx bei der Initialisierung ändern:
const [values, setValues] = useState({
  name: '',
  category: '',
  price: '',  // Dies kann bleiben
  // cost: '', // Dies entfernen
  ingredients: [],
  isActive: true,
  popular: false,
  stock: 0,
  ...initialValues,
});

// Entfernen oder anpassen: 
// <TextField label="Kosten" name="cost" ... />
```

## Problem 3: isActive vs. active

**Problem:**
Das Frontend verwendet `isActive`, aber das Backend-Modell hat kein entsprechendes Feld.

**Lösungen:**

1. **Backend-Lösung (bereits implementiert):**
   Das `isActive`-Feld wird ignoriert, wenn es vom Frontend gesendet wird.

2. **Frontend-Lösung:**
   Entfernen Sie das Feld aus dem Formular oder ändern Sie es zu einem Feld, das das Backend versteht.

## Wie man die Änderungen testet

1. Einen Getränke-API-Endpunkt mit Postman oder einer ähnlichen Software testen:

```json
POST /api/drinks
{
  "name": "Testgetränk",
  "price": 5.99,
  "category": "beer",
  "ingredients": ["Wasser", "Hopfen", "Malz"],
  "alcohol": 4.5,
  "stock": 10,
  "popular": true
}
```

2. Überprüfen Sie die Serverausgabe, um sicherzustellen, dass die Konvertierung korrekt erfolgt

3. Testen Sie das Formular in der Benutzeroberfläche, indem Sie ein Getränk hinzufügen und die Konsole auf Fehler überprüfen