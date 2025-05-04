# Bartender App - Authentifizierungssystem

Diese Dokumentation erklärt, wie das Authentifizierungssystem der Bartender-App funktioniert und wie man es verwendet.

## Übersicht

Das Authentifizierungssystem der Bartender-App besteht aus folgenden Komponenten:

1. **Backend (Node.js/Express)**
   - Benutzermodell (MongoDB)
   - Authentifizierungs-Routen (Login, Registrierung, etc.)
   - JWT-basierte Authentifizierung
   - Middleware zum Schutz von Routen

2. **Frontend (React)**
   - AuthContext für globalen Zugriff auf Authentifizierungsdaten
   - Login-Komponente
   - Registrierungs-Komponente
   - Geschützte Routen

## Benutzermodell

Das Benutzermodell (`User.js`) enthält folgende Felder:

- **name**: Name des Benutzers
- **email**: E-Mail-Adresse (eindeutig)
- **password**: Passwort (gehashed)
- **role**: Rolle (user, admin, manager)
- **active**: Aktivierungsstatus (manuell durch Admin)
- **avatar**: Profilbild-URL (optional)
- **createdAt/updatedAt**: Zeitstempel

## Authentifizierungs-Workflow

### Registrierung

1. Benutzer gibt Name, E-Mail und Passwort ein
2. Daten werden an `/api/auth/register` gesendet
3. Server erstellt neuen Benutzer mit `active: false`
4. Administrator muss Benutzer aktivieren

### Aktivierung

Die Aktivierung erfolgt durch den Administrator:

1. Admin meldet sich an und geht zu einer Benutzerübersicht
2. Admin wählt Benutzer aus und aktiviert ihn
3. Der Benutzer kann sich dann anmelden

Um einen Admin-Benutzer zu erstellen, verwende das bereitgestellte Skript:

```bash
node server/scripts/create-admin.js
```

### Anmeldung

1. Benutzer gibt E-Mail und Passwort ein
2. Daten werden an `/api/auth/login` gesendet
3. Server validiert Daten und prüft, ob Benutzer aktiviert ist
4. Bei Erfolg: JWT-Token wird generiert und zurückgegeben
5. Frontend speichert Token im LocalStorage
6. Benutzer wird eingeloggt und zur Hauptseite weitergeleitet

### Authentifizierte API-Anfragen

1. Das Token wird im LocalStorage gespeichert
2. Bei API-Anfragen wird das Token als Bearer-Token im Header gesendet
3. Server validiert Token und erlaubt/verweigert Zugriff

## API-Endpunkte

### Authentifizierung

- **POST /api/auth/register** - Benutzer registrieren
- **POST /api/auth/login** - Benutzer anmelden
- **GET /api/auth/me** - Aktuellen Benutzer abrufen
- **POST /api/auth/logout** - Benutzer abmelden

### Benutzerverwaltung (nur für Admins)

- **GET /api/users** - Alle Benutzer abrufen
- **GET /api/users/:id** - Einzelnen Benutzer abrufen
- **PUT /api/users/:id** - Benutzer aktualisieren (inkl. Aktivierung)
- **DELETE /api/users/:id** - Benutzer löschen

## Berechtigungen

Das System unterstützt drei Benutzerrollen:

1. **user**: Basisberechtigungen
2. **manager**: Erweiterte Berechtigungen
3. **admin**: Volle Berechtigungen inkl. Benutzerverwaltung

Die Berechtigungsprüfung erfolgt über die `authorize`-Middleware.

## Frontend-Komponenten

1. **AuthContext.jsx**: Verwaltung des Authentifizierungsstatus
2. **Login.jsx**: Anmeldeformular
3. **Register.jsx**: Registrierungsformular
4. **ProtectedRoute**: Schützt Routen vor unautorisierten Zugriffen

## JWT-Sicherheit

Die JWT-Tokens:
- Werden verschlüsselt mit dem SECRET aus der .env-Datei
- Enthalten die Benutzer-ID und Rolle
- Laufen nach 24 Stunden ab
- Werden im LocalStorage gespeichert

## Anleitungen

### Admin-Benutzer erstellen

```bash
node server/scripts/create-admin.js
```

Dies erstellt einen Admin-Benutzer mit folgenden Zugangsdaten:
- Email: admin@bartender.app
- Passwort: admin123

**WICHTIG**: Ändere das Passwort nach der ersten Anmeldung!

### Benutzer aktivieren

1. Melde dich als Administrator an
2. Gehe zur Benutzerverwaltung
3. Finde den gewünschten Benutzer
4. Aktiviere das Konto durch Umschalten des "Aktiv"-Status