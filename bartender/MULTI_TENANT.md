# Multi-Tenant Implementierung für Bartender App

Diese Dokumentation beschreibt die Implementierung der Multi-Tenant-Funktionalität, die es ermöglicht, dass Benutzer mehrere Bars in der Anwendung verwalten können.

## Überblick

Die Multi-Tenant-Architektur erlaubt es, dass ein Benutzer mehrere Bars besitzen oder Zugriff auf mehrere Bars haben kann. Jede Bar hat ihre eigenen Daten (Getränke, Verkäufe, Mitarbeiter, Inventar, Finanzen usw.), die voneinander isoliert sind.

### Wichtige Konzepte

1. **Bar-Modell**: Ein neues Datenbankmodell, das die Daten einer Bar enthält.
2. **User-Bar-Beziehung**: Ein Benutzer kann mehrere Bars haben, mit unterschiedlichen Rollen für jede Bar.
3. **Aktuelle Bar**: Jeder Benutzer hat eine "aktuelle Bar", auf die er gerade zugreift.
4. **Bar-Kontext in API-Anfragen**: Jede API-Anfrage enthält den Kontext der aktuellen Bar.
5. **Datenfilterung nach Bar**: Alle Datenbank-Operationen werden nach der aktuellen Bar gefiltert.

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
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  settings: {
    // Bar-spezifische Einstellungen
  },
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
// Neue Felder im User-Schema
bars: [{
  barId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bar'
  },
  role: {
    type: String,
    enum: ['owner', 'manager', 'staff', 'viewer'],
    default: 'staff'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}],
currentBar: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Bar'
}
```

### Bar-Referenz in allen Modellen

Jedes relevante Modell (Drink, Sale, Staff, Inventory, Supplier, Expense, Income) wurde um ein `bar`-Feld erweitert:

```javascript
bar: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Bar',
  required: [true, 'Jedes Element muss einer Bar zugeordnet sein']
}
```

## Authentication und Authorization

### Aktualisierte Auth-Middleware (`server/middleware/auth.js`)

Die Auth-Middleware wurde aktualisiert, um die aktuelle Bar des Benutzers zu laden und an den Request-Kontext anzuhängen:

```javascript
exports.protect = async (req, res, next) => {
  // ... Bestehender Token-Validierungscode ...

  // Aktuelle Bar aus dem Token oder Benutzer laden
  let currentBarId = decoded.currentBar || user.currentBar;
  
  // Bar-Objekt laden, wenn eine Bar-ID vorhanden ist
  let currentBar = null;
  if (currentBarId) {
    currentBar = await Bar.findById(currentBarId);
    
    // Überprüfe, ob der Benutzer Zugriff auf diese Bar hat
    const hasAccess = user.bars.some(bar => 
      bar.barId.toString() === currentBarId.toString() && bar.isActive
    );
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Keine Berechtigung für diese Bar'
      });
    }
  }

  // Benutzer und aktuelle Bar an den Request anfügen
  req.user = user;
  req.currentBar = currentBar;
  req.currentBarId = currentBarId;
  
  next();
};

// Neue Middleware für Bar-Rollenprüfung
exports.authorizeBar = (...barRoles) => {
  return (req, res, next) => {
    // Prüft, ob der Benutzer eine bestimmte Rolle in der aktuellen Bar hat
    // ...
  };
};
```

### Aktualisierter JWT-Token

Der JWT-Token enthält jetzt auch die aktuelle Bar des Benutzers:

```javascript
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      currentBar: this.currentBar 
    },
    process.env.JWT_SECRET || 'defaultsecretkey',
    { expiresIn: '1d' }
  );
};
```

## API-Endpunkte für Bar-Verwaltung

### Neue Endpunkte in `server/routes/auth.js`

1. **Bar erstellen**: `POST /api/auth/bars`
2. **Bars auflisten**: `GET /api/auth/bars`
3. **Bar auswählen**: `PUT /api/auth/select-bar/:barId`

### Aktualisierte Benutzer-Informationen

Der `/api/auth/me` Endpunkt gibt jetzt auch Informationen über die Bars des Benutzers zurück:

```javascript
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Max Mustermann",
    "email": "max@example.com",
    "role": "user",
    "active": true,
    "bars": [
      {
        "id": "456",
        "name": "Meine Bar",
        "role": "owner",
        "isActive": true
      }
    ],
    "currentBar": {
      "id": "456",
      "name": "Meine Bar",
      "address": { ... },
      "contact": { ... }
    }
  }
}
```

## Datenfilterung nach Bar

### Bar-Filter-Middleware (`server/middleware/barFilter.js`)

Wir haben verschiedene Hilfsfunktionen implementiert, um die Datenfilterung nach Bar zu vereinfachen:

1. **addBarFilter**: Fügt einen Bar-Filter zu einer Mongoose-Abfrage hinzu
2. **addBarToBody**: Fügt die Bar-ID zu einem Request-Body hinzu (für neue Dokumente)
3. **applyBarScope**: Mongoose-Middleware zur Beschränkung von Abfragen auf die aktuelle Bar
4. **CRUD-Helfer**: Fertige Funktionen für typische CRUD-Operationen mit Bar-Filter

### Beispiel für einen API-Endpunkt mit Bar-Filter

```javascript
// @route   GET /api/drinks
// @desc    Alle Getränke erhalten (mit Bar-Filter)
// @access  Private
router.get('/', protect, getList(Drink, { sort: { name: 1 } }));

// @route   POST /api/drinks
// @desc    Getränk erstellen (mit Bar-Filter)
// @access  Private
router.post('/', protect, prepareDrinkData, createOne(Drink));
```

## Migrationsplan für bestehende Daten

Für die Migration bestehender Daten sollten folgende Schritte durchgeführt werden:

1. **System-Bar erstellen**: Erstelle eine Standard-Bar für bestehende Daten.
2. **Daten aktualisieren**: Aktualisiere alle vorhandenen Datensätze, um sie dieser Bar zuzuordnen.
3. **Admin-Benutzer aktualisieren**: Aktualisiere Admin-Benutzer, um Zugriff auf diese Bar zu haben.

```javascript
async function migrateData() {
  try {
    // Erstelle eine Standard-Bar
    const defaultBar = new Bar({
      name: "Standard Bar",
      owner: adminUserId, // ID des Admin-Benutzers
      isActive: true
    });
    await defaultBar.save();
    
    // Aktualisiere alle Modelle, um auf diese Bar zu verweisen
    const barId = defaultBar._id;
    
    await Drink.updateMany({}, { $set: { bar: barId } });
    await Sale.updateMany({}, { $set: { bar: barId } });
    await Staff.updateMany({}, { $set: { bar: barId } });
    await Inventory.updateMany({}, { $set: { bar: barId } });
    await Supplier.updateMany({}, { $set: { bar: barId } });
    await Expense.updateMany({}, { $set: { bar: barId } });
    await Income.updateMany({}, { $set: { bar: barId } });
    
    // Aktualisiere Admin-Benutzer
    await User.findByIdAndUpdate(adminUserId, {
      $push: { bars: { barId: barId, role: 'owner', isActive: true } },
      currentBar: barId
    });
    
    console.log("Migration erfolgreich abgeschlossen");
  } catch (error) {
    console.error("Fehler bei der Migration:", error);
  }
}
```

## Frontend-Anpassungen

Das Frontend muss aktualisiert werden, um die Multi-Tenant-Funktionalität zu unterstützen:

1. **Bar-Auswahl**: UI-Element zum Auswählen der aktuellen Bar
2. **Bar-Erstellung**: Formular zum Erstellen neuer Bars
3. **Bar-Verwaltung**: Interface für die Verwaltung von Bars und deren Benutzern
4. **Context-Aktualisierung**: React-Context für die aktuelle Bar aktualisieren

## Sicherheitskonzepte

1. **Datenfilterung**: Strenge Filterung aller Anfragen nach der aktuellen Bar
2. **Rollenbasierte Zugriffsrechte**: Unterschiedliche Rollen für Benutzer innerhalb einer Bar
3. **Token-basierte Autorisierung**: Die aktuelle Bar wird im JWT-Token gespeichert
4. **Validierung auf Serverseite**: Zusätzliche Validierung der Berechtigung für jeden API-Endpunkt