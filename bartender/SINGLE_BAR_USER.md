# Single-Bar pro Nutzer für Bartender App

Diese Dokumentation beschreibt die Implementierung der Benutzer-Bar-Struktur, bei der jeder Benutzer (User) genau eine Bar repräsentiert.

## Überblick

Im Gegensatz zur Multi-Tenant-Architektur mit Bar-Wechsel hat jeder Benutzer in diesem Modell genau eine fest zugeordnete Bar. Das bedeutet:

1. Beim Registrieren eines neuen Benutzers wird automatisch eine zugehörige Bar erstellt
2. Der "Name" des Benutzers repräsentiert den Namen der Bar
3. Es gibt keine Möglichkeit, zwischen Bars zu wechseln

### Vorteile dieses Ansatzes

- Einfachere Implementierung und Datenverwaltung
- Klarere Zuordnung und Benutzererfahrung
- Keine komplexe Rollenverwaltung pro Bar notwendig

## Datenbankmodelle

### Bar-Modell (`server/models/Bar.js`)

```javascript
const BarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bitte geben Sie einen Namen für die Bar an'],
    trim: true,
    maxlength: [100, 'Name darf nicht länger als 100 Zeichen sein']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, default: 'Deutschland', trim: true }
  },
  contact: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    website: { type: String, trim: true }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Jede Bar muss einen Besitzer haben']
  },
  // Weitere Bar-spezifische Felder...
  isActive: {
    type: Boolean,
    default: true
  },
  logo: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

### Aktualisiertes User-Modell (`server/models/User.js`)

```javascript
// Einfache 1:1-Beziehung zur Bar
bar: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Bar'
}
```

### Bar-Referenz in allen Modellen

Jedes relevante Modell (Drink, Sale, Staff, Inventory, Supplier, Expense, Income) enthält weiterhin ein `bar`-Feld:

```javascript
bar: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Bar',
  required: [true, 'Jedes Element muss einer Bar zugeordnet sein']
}
```

## Authentication und Authorization

### Aktualisierte Auth-Middleware (`server/middleware/auth.js`)

Die Auth-Middleware wurde vereinfacht, um nur die eine Bar des Benutzers zu laden:

```javascript
exports.protect = async (req, res, next) => {
  // ... Bestehender Token-Validierungscode ...

  // Bar des Benutzers abrufen
  let barId = decoded.bar || user.bar;
  
  // Bar-Objekt laden, wenn eine Bar-ID vorhanden ist
  let bar = null;
  if (barId) {
    bar = await Bar.findById(barId);
  }
  
  // Benutzer und Bar an den Request anfügen
  req.user = user;
  req.bar = bar;
  req.barId = barId;
  
  next();
};
```

### Aktualisierter JWT-Token

Der JWT-Token enthält jetzt die Bar-ID des Benutzers:

```javascript
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      bar: this.bar 
    },
    process.env.JWT_SECRET || 'defaultsecretkey',
    { expiresIn: '1d' }
  );
};
```

## API-Endpunkte

### Registrierung mit Bar-Erstellung

```javascript
router.post('/register', async (req, res) => {
  // ... Validierung und Prüfung, ob Benutzer bereits existiert ...
  
  // Zunächst eine Bar für den Benutzer erstellen
  const bar = new Bar({
    name: name, // Name des Benutzers als Name der Bar
    address: {},
    contact: {
      email: email
    },
    isActive: true
  });
  
  await bar.save();
  
  // Neuen Benutzer erstellen und mit der Bar verknüpfen
  user = new User({
    name, // Name des Benutzers (entspricht Namen der Bar)
    email,
    password,
    bar: bar._id,
    active: false // Standardmäßig inaktiv, bis Admin aktiviert
  });
  
  await user.save();
  
  // Bar aktualisieren, um den Benutzer als Besitzer festzulegen
  bar.owner = user._id;
  await bar.save();
  
  // ... Antwort senden ...
});
```

### Bar-Informationen in API-Antworten

Login und `/me` Endpunkte geben die Bar-Informationen zurück:

```javascript
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Meine Bar",
    "email": "bar@example.com",
    "role": "user",
    "active": true,
    "bar": {
      "id": "456",
      "name": "Meine Bar",
      "address": { ... },
      "contact": { ... },
      "logo": "..." 
    }
  }
}
```

### Bar-Informationen aktualisieren

```javascript
router.put('/bar', protect, async (req, res) => {
  const { name, address, contact, logo } = req.body;
  
  if (!req.barId) {
    return res.status(404).json({
      success: false,
      error: 'Keine Bar gefunden'
    });
  }
  
  // Aktualisiere die Bar-Informationen
  const bar = await Bar.findById(req.barId);
  
  // ... Nur Felder aktualisieren, die angegeben wurden ...
  
  await bar.save();
  
  // ... Antwort senden ...
});
```

## Datenfilterung nach Bar

Die Middleware und Hilfsfunktionen für die Datenfilterung nach Bar wurden aktualisiert, um mit dem einfacheren Modell zu funktionieren:

```javascript
// Fügt Bar-ID zu einer Mongoose-Abfrage hinzu
const addBarFilter = (req, query) => {
  if (req.barId) {
    query.bar = req.barId;
  }
  return query;
};

// Fügt Bar-ID zu einem Request Body hinzu
const addBarToBody = (req, res, next) => {
  if (req.barId) {
    req.body.bar = req.barId;
  }
  next();
};
```

## Migration von bestehenden Daten

Für die Migration bestehender Daten (falls notwendig) sollten folgende Schritte durchgeführt werden:

1. Für jeden bestehenden Benutzer eine Bar erstellen
2. Die Bar-ID in das Benutzer-Objekt eintragen
3. Die Bar als Besitzer für den Benutzer festlegen
4. Alle vorhandenen Datensätze aktualisieren, um sie dieser Bar zuzuordnen

```javascript
async function migrateData() {
  try {
    // Alle Benutzer abrufen
    const users = await User.find();
    
    for (const user of users) {
      // Bar erstellen
      const bar = new Bar({
        name: user.name,
        owner: user._id,
        isActive: true
      });
      
      await bar.save();
      
      // Benutzer aktualisieren
      user.bar = bar._id;
      await user.save();
      
      // Daten migrieren
      await Drink.updateMany({ createdBy: user._id }, { $set: { bar: bar._id } });
      await Sale.updateMany({ createdBy: user._id }, { $set: { bar: bar._id } });
      // ... Weitere Modelle aktualisieren ...
    }
    
    console.log("Migration erfolgreich abgeschlossen");
  } catch (error) {
    console.error("Fehler bei der Migration:", error);
  }
}
```

## Frontend-Anpassungen

Das Frontend sollte aktualisiert werden, um dieses neue Modell zu unterstützen:

1. Registrierungsformular aktualisieren - "Name" zu "Name der Bar" ändern
2. Keine Bar-Auswahl mehr anzeigen
3. Bar-Einstellungen in das Profil/Einstellungen integrieren
4. Alle Datenabruf-Anfragen aktualisieren, um mit dem neuen Modell zu funktionieren