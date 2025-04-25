#!/bin/bash

# MPSec Setup-Skript
# Dieses Skript füllt die Projektstruktur mit allen benötigten Dateien

set -e  # Skript beenden, wenn ein Befehl fehlschlägt

# Farben für die Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}MPSec Projekteinrichtung wird gestartet...${NC}"

# Aktuelles Verzeichnis prüfen (sollte im mpsec-Root sein)
if [ ! -d "client" ] || [ ! -d "server" ]; then
  echo "Fehler: Bitte führe das Skript im mpsec-Hauptverzeichnis aus."
  exit 1
fi

# Server-Struktur erstellen
echo -e "${BLUE}Server-Struktur wird erstellt...${NC}"

# Verzeichnisse erstellen
mkdir -p server/models
mkdir -p server/controllers
mkdir -p server/routes
mkdir -p server/middleware

# Server-Dateien erstellen
echo -e "${GREEN}Server-Dateien werden angelegt...${NC}"

# .env
cat > server/.env << 'EOF'
MONGO_URI=mongodb://localhost:27017/mpsec
PORT=5000
JWT_SECRET=dein_sehr_sicherer_und_langer_zufaelliger_schluessel_hier
JWT_EXPIRE=1d
ENCRYPTION_KEY=dein_32_zeichen_langer_verschluesselungsschluessel
EOF

# app.js
cat > server/app.js << 'EOF'
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Routes
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/tokens');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ein interner Server-Fehler ist aufgetreten' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));

module.exports = app;
EOF

# models/User.js
cat > server/models/User.js << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Bitte gib einen Benutzernamen ein'],
    unique: true,
    trim: true,
    minlength: [3, 'Benutzername muss mindestens 3 Zeichen haben'],
    maxlength: [20, 'Benutzername darf maximal 20 Zeichen haben']
  },
  password: {
    type: String,
    required: [true, 'Bitte gib ein Passwort ein'],
    minlength: [8, 'Passwort muss mindestens 8 Zeichen haben'],
    select: false // Passwort nicht in Abfrageergebnissen zurückgeben
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Passwort vor dem Speichern hashen
UserSchema.pre('save', async function(next) {
  // Nur wenn Passwort geändert wurde
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Methode zum Passwort-Vergleich
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// JWT Token für den Benutzer generieren
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, username: this.username },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};

module.exports = mongoose.model('User', UserSchema);
EOF

# models/Token.js
cat > server/models/Token.js << 'EOF'
const mongoose = require('mongoose');
const crypto = require('crypto');

// Hilfsfunktionen für Ver- und Entschlüsselung
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decrypt = (text) => {
  const [ivHex, encryptedText] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const TokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bitte gib einen Namen für den Token ein'],
    trim: true
  },
  secret: {
    type: String,
    required: [true, 'Bitte gib ein Token-Secret ein'],
    set: encrypt,
    get: decrypt
  },
  issuer: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['totp', 'hotp'],
    default: 'totp'
  },
  algorithm: {
    type: String,
    enum: ['SHA1', 'SHA256', 'SHA512'],
    default: 'SHA1'
  },
  digits: {
    type: Number,
    enum: [6, 8],
    default: 6
  },
  period: {
    type: Number,
    default: 30
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Sicherstellen, dass das Secret nicht in der JSON-Ausgabe enthalten ist
TokenSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.secret;
  return obj;
};

module.exports = mongoose.model('Token', TokenSchema);
EOF

# middleware/auth.js
cat > server/middleware/auth.js << 'EOF'
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Schützt Routen - nur authentifizierte Benutzer haben Zugriff
exports.protect = async (req, res, next) => {
  let token;

  // Token aus Header extrahieren
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Prüfen, ob Token vorhanden ist
  if (!token) {
    return res.status(401).json({
      message: 'Nicht autorisiert, bitte melde dich an'
    });
  }

  try {
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Benutzer zum Request hinzufügen
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        message: 'Benutzer nicht gefunden'
      });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Nicht autorisiert, Token ungültig'
    });
  }
};
EOF

# controllers/auth.js
cat > server/controllers/auth.js << 'EOF'
const User = require('../models/User');

// @desc    Benutzer registrieren
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Prüfen, ob Benutzer bereits existiert
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        message: 'Benutzer existiert bereits'
      });
    }

    // Benutzer erstellen
    const user = await User.create({
      username,
      password
    });

    // Token erstellen und zurückgeben
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Benutzer anmelden
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Prüfen, ob Benutzername und Passwort vorhanden sind
    if (!username || !password) {
      return res.status(400).json({
        message: 'Bitte gib Benutzername und Passwort ein'
      });
    }

    // Benutzer in DB suchen (mit Passwort)
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Passwort überprüfen
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Token erstellen und zurückgeben
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Aktuelle Benutzerinfo abrufen
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// Hilfsfunktion zum Erstellen und Senden des JWT-Tokens
const sendTokenResponse = (user, statusCode, res) => {
  // Token erstellen
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username
    }
  });
};
EOF

# controllers/tokens.js
cat > server/controllers/tokens.js << 'EOF'
const Token = require('../models/Token');
const { totp, authenticator } = require('otplib');

// @desc    Alle Tokens eines Benutzers abrufen
// @route   GET /api/tokens
// @access  Private
exports.getTokens = async (req, res, next) => {
  try {
    const tokens = await Token.find({ user: req.user.id });
    
    res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Einzelnen Token abrufen
// @route   GET /api/tokens/:id
// @access  Private
exports.getToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);
    
    if (!token) {
      return res.status(404).json({
        message: 'Token nicht gefunden'
      });
    }
    
    // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
    if (token.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Nicht berechtigt, auf diesen Token zuzugreifen'
      });
    }
    
    res.status(200).json({
      success: true,
      data: token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Neuen Token erstellen
// @route   POST /api/tokens
// @access  Private
exports.createToken = async (req, res, next) => {
  try {
    // Token zum Benutzer hinzufügen
    req.body.user = req.user.id;
    
    const token = await Token.create(req.body);
    
    res.status(201).json({
      success: true,
      data: token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Token aktualisieren
// @route   PUT /api/tokens/:id
// @access  Private
exports.updateToken = async (req, res, next) => {
  try {
    let token = await Token.findById(req.params.id);
    
    if (!token) {
      return res.status(404).json({
        message: 'Token nicht gefunden'
      });
    }
    
    // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
    if (token.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Nicht berechtigt, diesen Token zu bearbeiten'
      });
    }
    
    // Secret nicht aktualisieren, wenn nicht explizit angegeben
    if (!req.body.secret) {
      delete req.body.secret;
    }
    
    token = await Token.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Token löschen
// @route   DELETE /api/tokens/:id
// @access  Private
exports.deleteToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);
    
    if (!token) {
      return res.status(404).json({
        message: 'Token nicht gefunden'
      });
    }
    
    // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
    if (token.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Nicht berechtigt, diesen Token zu löschen'
      });
    }
    
    await token.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Aktuellen Code für einen Token generieren
// @route   GET /api/tokens/:id/code
// @access  Private
exports.generateCode = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);
    
    if (!token) {
      return res.status(404).json({
        message: 'Token nicht gefunden'
      });
    }
    
    // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
    if (token.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Nicht berechtigt, auf diesen Token zuzugreifen'
      });
    }
    
    // TOTP-Konfiguration basierend auf Token-Einstellungen
    totp.options = {
      digits: token.digits,
      algorithm: token.algorithm,
      period: token.period
    };
    
    // Code generieren
    const code = totp.generate(token.secret);
    
    // Zeit bis zum Ablauf des Codes berechnen
    const remainingTime = totp.timeRemaining();
    
    res.status(200).json({
      success: true,
      data: {
        code,
        remainingTime
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    QR-Code für Token generieren
// @route   GET /api/tokens/:id/qrcode
// @access  Private
exports.generateQRCode = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);
    
    if (!token) {
      return res.status(404).json({
        message: 'Token nicht gefunden'
      });
    }
    
    // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
    if (token.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Nicht berechtigt, auf diesen Token zuzugreifen'
      });
    }
    
    // otpauth URL für QR-Code generieren
    const otpauthUrl = authenticator.keyuri(
      token.name, 
      token.issuer || 'MPSec', 
      token.secret
    );
    
    res.status(200).json({
      success: true,
      data: {
        otpauthUrl
      }
    });
  } catch (err) {
    next(err);
  }
};
EOF

# routes/auth.js
cat > server/routes/auth.js << 'EOF'
const express = require('express');
const { register, login, getMe } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
EOF

# routes/tokens.js
cat > server/routes/tokens.js << 'EOF'
const express = require('express');
const {
  getTokens,
  getToken,
  createToken,
  updateToken,
  deleteToken,
  generateCode,
  generateQRCode
} = require('../controllers/tokens');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Alle Routen schützen
router.use(protect);

router
  .route('/')
  .get(getTokens)
  .post(createToken);

router
  .route('/:id')
  .get(getToken)
  .put(updateToken)
  .delete(deleteToken);

router.get('/:id/code', generateCode);
router.get('/:id/qrcode', generateQRCode);

module.exports = router;
EOF

# package.json aktualisieren
cat > server/package.json << 'EOF'
{
  "name": "mpsec-server",
  "version": "1.0.0",
  "description": "Backend-Server für die MPSec 2FA Token-Manager-App",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "2fa",
    "totp",
    "security",
    "authentication"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.0.3",
    "otplib": "^12.0.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
EOF

# Client-Struktur erstellen
echo -e "${BLUE}Client-Struktur wird erstellt...${NC}"

# Verzeichnisse erstellen
mkdir -p client/src/components
mkdir -p client/src/components/styled
mkdir -p client/src/contexts
mkdir -p client/src/pages
mkdir -p client/src/services
mkdir -p client/src/styles

# Vorhandene Dateien, die wir nicht benötigen, entfernen
rm -f client/src/App.css client/src/logo.svg

# Client-Dateien erstellen
echo -e "${GREEN}Client-Dateien werden angelegt...${NC}"

# App.js
cat > client/src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Importiere Seiten
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TokenDetail from './pages/TokenDetail';
import AddToken from './pages/AddToken';
import EditToken from './pages/EditToken';

// Importiere Komponenten
import Layout from './components/Layout';
import GlobalStyle from './styles/GlobalStyle';
import { theme } from './styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tokens/add" element={<AddToken />} />
                <Route path="/tokens/:id" element={<TokenDetail />} />
                <Route path="/tokens/:id/edit" element={<EditToken />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
EOF

# index.js updaten
cat > client/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
EOF

# styles/theme.js
cat > client/src/styles/theme.js << 'EOF'
export const theme = {
  colors: {
    backgroundDark: '#2B2E3B',
    backgroundDarker: '#252830',
    cardBackground: '#343845',
    accentBlue: '#688db1',
    accentGreen: '#9cb68f',
    accentRed: '#e16162',
    textPrimary: '#d1d5db',
    textSecondary: '#9ca3af'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  transitions: {
    default: '0.3s ease'
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
      xxxl: '2rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700
    }
  }
};
EOF

# styles/GlobalStyle.js
cat > client/src/styles/GlobalStyle.js << 'EOF'
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    background-color: ${({ theme }) => theme.colors.backgroundDark};
    color: ${({ theme }) => theme.colors.textPrimary};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    margin-bottom: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  h1 {
    font-size: ${({ theme }) => theme.typography.fontSize.xxxl};
  }

  h2 {
    font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  }

  h3 {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }

  h4 {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }

  a {
    color: ${({ theme }) => theme.colors.accentBlue};
    text-decoration: none;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
      text-decoration: underline;
    }
  }

  button, input, textarea, select {
    font-family: inherit;
  }

  button {
    cursor: pointer;
  }
`;

export default GlobalStyle;
EOF

# components/styled/index.js
cat > client/src/components/styled/index.js << 'EOF'
import styled from 'styled-components';

// Container-Komponenten
export const Container = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.md};
`;

export const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const CardTitle = styled.h3`
  margin-bottom: 0;
`;

export const CardContent = styled.div``;

export const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

// Formular-Komponenten
export const Form = styled.form`
  width: 100%;
`;

export const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  border: 1px solid ${({ theme, error }) => error ? theme.colors.accentRed : 'transparent'};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  transition: ${({ theme }) => theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${({ theme, error }) => error ? theme.colors.accentRed : theme.colors.accentBlue};
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  transition: ${({ theme }) => theme.transitions.default};
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right ${({ theme }) => theme.spacing.md} center;
  background-size: 16px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accentBlue};
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  transition: ${({ theme }) => theme.transitions.default};
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accentBlue};
  }
`;

export const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.accentRed};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

// Button-Komponenten
export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme, size }) => 
    size === 'sm' ? `${theme.spacing.xs} ${theme.spacing.md}` : 
    size === 'lg' ? `${theme.spacing.md} ${theme.spacing.xl}` : 
    `${theme.spacing.sm} ${theme.spacing.lg}`
  };
  background-color: ${({ theme, variant }) => 
    variant === 'primary' ? theme.colors.accentBlue :
    variant === 'success' ? theme.colors.accentGreen :
    variant === 'danger' ? theme.colors.accentRed :
    'transparent'
  };
  color: ${({ theme, variant }) => 
    variant === 'outline' ? theme.colors.textPrimary : '#fff'
  };
  border: ${({ theme, variant }) => 
    variant === 'outline' ? `1px solid ${theme.colors.textSecondary}` : 'none'
  };
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme, size }) => 
    size === 'sm' ? theme.typography.fontSize.sm :
    size === 'lg' ? theme.typography.fontSize.lg :
    theme.typography.fontSize.md
  };
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background-color: ${({ theme, variant }) => 
      variant === 'primary' ? '#597ba0' :
      variant === 'success' ? '#8aa580' :
      variant === 'danger' ? '#d04e4f' :
      'rgba(156, 163, 175, 0.1)'
    };
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme, variant }) => 
      variant === 'primary' ? 'rgba(104, 141, 177, 0.5)' :
      variant === 'success' ? 'rgba(156, 182, 143, 0.5)' :
      variant === 'danger' ? 'rgba(225, 97, 98, 0.5)' :
      'rgba(156, 163, 175, 0.5)'
    };
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  & > svg {
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

// Token spezifische Komponenten
export const TokenCode = styled.div`
  font-family: monospace;
  font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  letter-spacing: 0.25em;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin: ${({ theme }) => `${theme.spacing.lg} 0`};
`;

export const TimeRemaining = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  overflow: hidden;
`;

export const ProgressBar = styled.div`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.accentBlue};
  width: ${({ progress }) => `${progress}%`};
  transition: width 1s linear;
`;

// Layout-Komponenten
export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

export const PageTitle = styled.h1`
  margin-bottom: 0;
`;

export const PageContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} 0;
`;

// Benachrichtigungen
export const Alert = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme, type }) => 
    type === 'success' ? 'rgba(156, 182, 143, 0.2)' :
    type === 'error' ? 'rgba(225, 97, 98, 0.2)' :
    type === 'info' ? 'rgba(104, 141, 177, 0.2)' :
    'rgba(156, 163, 175, 0.2)'
  };
  border-left: 4px solid ${({ theme, type }) => 
    type === 'success' ? theme.colors.accentGreen :
    type === 'error' ? theme.colors.accentRed :
    type === 'info' ? theme.colors.accentBlue :
    theme.colors.textSecondary
  };
  color: ${({ theme }) => theme.colors.textPrimary};
`;

// Loader
export const Loader = styled.div`
  display: inline-block;
  border: 3px solid ${({ theme }) => theme.colors.backgroundDarker};
  border-top: 3px solid ${({ theme }) => theme.colors.accentBlue};
  border-radius: 50%;
  width: ${({ size }) => size || '24px'};
  height: ${({ size }) => size || '24px'};
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${({ fullHeight }) => fullHeight ? '100vh' : '200px'};
`;

// Avatar
export const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.accentBlue};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-transform: uppercase;
`;

// Badge
export const Badge = styled.span`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background-color: ${({ theme, type }) => 
    type === 'primary' ? 'rgba(104, 141, 177, 0.2)' :
    type === 'success' ? 'rgba(156, 182, 143, 0.2)' :
    type === 'danger' ? 'rgba(225, 97, 98, 0.2)' :
    'rgba(156, 163, 175, 0.2)'
  };
  color: ${({ theme, type }) => 
    type === 'primary' ? theme.colors.accentBlue :
    type === 'success' ? theme.colors.accentGreen :
    type === 'danger' ? theme.colors.accentRed :
    theme.colors.textSecondary
  };
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
EOF

# components/Layout.jsx
cat > client/src/components/Layout.jsx << 'EOF'
import React from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Header from './Header';
import { Container } from './styled';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg} 0;
`;

const Layout = () => {
  return (
    <LayoutContainer>
      <Header />
      <Main>
        <Container>
          <Outlet />
        </Container>
      </Main>
    </LayoutContainer>
  );
};

export default Layout;
EOF

# components/Header.jsx
cat > client/src/components/Header.jsx << 'EOF'
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Button, Container, Avatar } from './styled';

const HeaderContainer = styled.header`
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  padding: ${({ theme }) => theme.spacing.md} 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;
  
  span {
    color: ${({ theme }) => theme.colors.accentBlue};
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Username = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <HeaderContainer>
      <Container>
        <HeaderContent>
          <Logo to="/dashboard">
            <span>MP</span>Sec
          </Logo>
          
          {user && (
            <UserSection>
              <UserInfo>
                <Avatar>{user.username[0]}</Avatar>
                <Username>{user.username}</Username>
              </UserInfo>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
              >
                Abmelden
              </Button>
            </UserSection>
          )}
        </HeaderContent>
      </Container>
    </HeaderContainer>
  );
};

export default Header;
EOF

# components/PrivateRoute.jsx
cat > client/src/components/PrivateRoute.jsx << 'EOF'
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoaderContainer, Loader } from './styled';

const PrivateRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <LoaderContainer fullHeight>
        <Loader size="40px" />
      </LoaderContainer>
    );
  }
  
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
EOF

# contexts/AuthContext.jsx
cat > client/src/contexts/AuthContext.jsx << 'EOF'
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Token im localStorage speichern/entfernen
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    // Überprüfen des Token beim Laden der App
    const checkToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        setUser(response.data.data);
      } catch (err) {
        console.error('Token-Verifizierungsfehler:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  const register = async (username, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        password
      });
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Bei der Registrierung ist ein Fehler aufgetreten'
      );
      throw err;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Bei der Anmeldung ist ein Fehler aufgetreten'
      );
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
EOF

# services/api.js
cat > client/src/services/api.js << 'EOF'
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token aus localStorage hinzufügen, falls vorhanden
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Interceptor für API-Fehler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Wenn der Fehler ein 401 (Unauthorized) ist, dann Benutzer ausloggen
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      // Optional: Hier könntest du zu /login weiterleiten
    }
    return Promise.reject(error);
  }
);

export default api;
EOF

# pages/Login.jsx
cat > client/src/pages/Login.jsx << 'EOF'
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Button, 
  ErrorMessage, 
  Alert,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LoaderContainer,
  Loader
} from '../components/styled';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 450px;
`;

const LoginFooter = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Einfache Validierung
    if (!username.trim() || !password.trim()) {
      setError('Bitte gib Benutzername und Passwort ein');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login-Fehler:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <CardHeader>
          <CardTitle>Bei MPSec anmelden</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <Alert type="error">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </FormGroup>
            
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              {isLoading ? <Loader size="20px" /> : 'Anmelden'}
            </Button>
          </Form>
          
          <LoginFooter>
            Noch kein Konto? <Link to="/register">Registrieren</Link>
          </LoginFooter>
        </CardContent>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
EOF

# pages/Register.jsx
cat > client/src/pages/Register.jsx << 'EOF'
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Button, 
  ErrorMessage, 
  Alert,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LoaderContainer,
  Loader
} from '../components/styled';

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const RegisterCard = styled(Card)`
  width: 100%;
  max-width: 450px;
`;

const RegisterFooter = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    
    if (!username.trim()) {
      errors.username = 'Benutzername ist erforderlich';
    } else if (username.length < 3) {
      errors.username = 'Benutzername muss mindestens 3 Zeichen lang sein';
    }
    
    if (!password) {
      errors.password = 'Passwort ist erforderlich';
    } else if (password.length < 8) {
      errors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwörter stimmen nicht überein';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validieren
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      await register(username, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registrierungsfehler:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <CardHeader>
          <CardTitle>Bei MPSec registrieren</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <Alert type="error">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                error={validationErrors.username}
              />
              {validationErrors.username && (
                <ErrorMessage>{validationErrors.username}</ErrorMessage>
              )}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                error={validationErrors.password}
              />
              {validationErrors.password && (
                <ErrorMessage>{validationErrors.password}</ErrorMessage>
              )}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                error={validationErrors.confirmPassword}
              />
              {validationErrors.confirmPassword && (
                <ErrorMessage>{validationErrors.confirmPassword}</ErrorMessage>
              )}
            </FormGroup>
            
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              {isLoading ? <Loader size="20px" /> : 'Registrieren'}
            </Button>
          </Form>
          
          <RegisterFooter>
            Bereits ein Konto? <Link to="/login">Anmelden</Link>
          </RegisterFooter>
        </CardContent>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;
EOF

# pages/Dashboard.jsx
cat > client/src/pages/Dashboard.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import { 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  PageHeader, 
  PageTitle, 
  Alert,
  LoaderContainer,
  Loader,
  Badge
} from '../components/styled';

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TokenCard = styled(Card)`
  transition: ${({ theme }) => theme.transitions.default};
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const TokenName = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  word-break: break-word;
`;

const TokenIssuer = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  word-break: break-word;
`;

const TokenInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const TokenActions = styled.div``;

const TokenType = styled(Badge)`
  margin-right: ${({ theme }) => theme.spacing.xs};
`;

const Dashboard = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await api.get('/tokens');
        setTokens(response.data.data);
      } catch (err) {
        console.error('Fehler beim Laden der Tokens:', err);
        setError('Tokens konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  if (loading) {
    return (
      <LoaderContainer>
        <Loader size="40px" />
      </LoaderContainer>
    );
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Deine 2FA-Tokens</PageTitle>
        <Button 
          as={Link} 
          to="/tokens/add" 
          variant="primary"
        >
          Neuen Token hinzufügen
        </Button>
      </PageHeader>

      {error && <Alert type="error">{error}</Alert>}

      {tokens.length === 0 ? (
        <EmptyState>
          <h3>Keine Tokens vorhanden</h3>
          <p>Füge deinen ersten 2FA-Token hinzu, um zu beginnen</p>
          <Button 
            as={Link} 
            to="/tokens/add" 
            variant="primary"
            style={{ marginTop: '1rem' }}
          >
            Token hinzufügen
          </Button>
        </EmptyState>
      ) : (
        <Grid>
          {tokens.map((token) => (
            <TokenCard 
              key={token._id} 
              as={Link} 
              to={`/tokens/${token._id}`}
              style={{ textDecoration: 'none' }}
            >
              <CardContent>
                <TokenName>{token.name}</TokenName>
                {token.issuer && <TokenIssuer>{token.issuer}</TokenIssuer>}
                
                <TokenInfo>
                  <TokenActions>
                    <TokenType type="primary">{token.type}</TokenType>
                    <TokenType>{token.digits} Ziffern</TokenType>
                  </TokenActions>
                </TokenInfo>
              </CardContent>
            </TokenCard>
          ))}
        </Grid>
      )}
    </>
  );
};

export default Dashboard;
EOF

# pages/TokenDetail.jsx
cat > client/src/pages/TokenDetail.jsx << 'EOF'
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import { 
  Button, 
  ButtonGroup,
  Card, 
  PageHeader, 
  PageTitle, 
  Alert,
  LoaderContainer,
  Loader,
  TokenCode,
  TimeRemaining,
  ProgressBar,
  Badge
} from '../components/styled';

const TokenDetailCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const TokenHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const TokenInfo = styled.div`
  flex: 1;
`;

const TokenName = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const TokenIssuer = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TokenMetadata = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const TokenMetaItem = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const QRCodeContainer = styled.div`
  max-width: 300px;
  margin: ${({ theme }) => theme.spacing.xl} auto;
  text-align: center;
`;

const QRCodeLink = styled.a`
  color: ${({ theme }) => theme.colors.accentBlue};
  text-decoration: underline;
  cursor: pointer;
`;

const DeleteConfirmation = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: rgba(225, 97, 98, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border-left: 4px solid ${({ theme }) => theme.colors.accentRed};
`;

const ActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const TokenDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [code, setCode] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [progress, setProgress] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQRCodeUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const intervalRef = useRef(null);

  // Token-Daten laden
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await api.get(`/tokens/${id}`);
        setToken(response.data.data);
      } catch (err) {
        console.error('Fehler beim Laden des Tokens:', err);
        setError('Token konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();

    // Beim Verlassen der Seite den Timer bereinigen
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  // Code generieren und Timer aktualisieren
  useEffect(() => {
    if (!token) return;

    const generateCode = async () => {
      try {
        const response = await api.get(`/tokens/${id}/code`);
        setCode(response.data.data.code);
        setRemainingTime(response.data.data.remainingTime);
        setProgress((response.data.data.remainingTime / token.period) * 100);
      } catch (err) {
        console.error('Fehler beim Generieren des Codes:', err);
        setError('Code konnte nicht generiert werden');
      }
    };

    // Initial Code generieren
    generateCode();

    // Timer für regelmäßige Aktualisierungen
    intervalRef.current = setInterval(() => {
      // Prüfen, ob Zeit abgelaufen ist
      if (remainingTime <= 1) {
        generateCode();
      } else {
        setRemainingTime(prevTime => prevTime - 1);
        setProgress(prevProgress => prevProgress - (100 / token.period));
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, id, remainingTime]);

  // QR-Code generieren
  const generateQRCode = async () => {
    try {
      const response = await api.get(`/tokens/${id}/qrcode`);
      setQRCodeUrl(response.data.data.otpauthUrl);
      setShowQRCode(true);
    } catch (err) {
      console.error('Fehler beim Generieren des QR-Codes:', err);
      setError('QR-Code konnte nicht generiert werden');
    }
  };

  // Token löschen
  const handleDelete = async () => {
    try {
      await api.delete(`/tokens/${id}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Fehler beim Löschen des Tokens:', err);
      setError('Token konnte nicht gelöscht werden');
    }
  };

  if (loading) {
    return (
      <LoaderContainer>
        <Loader size="40px" />
      </LoaderContainer>
    );
  }

  if (!token) {
    return <Alert type="error">Token nicht gefunden</Alert>;
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Token Details</PageTitle>
        <ButtonGroup>
          <Button 
            as={Link} 
            to={`/tokens/${id}/edit`} 
            variant="primary"
          >
            Bearbeiten
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
          >
            Zurück
          </Button>
        </ButtonGroup>
      </PageHeader>

      {error && <Alert type="error">{error}</Alert>}

      <TokenDetailCard>
        <TokenHeader>
          <TokenInfo>
            <TokenName>{token.name}</TokenName>
            {token.issuer && <TokenIssuer>{token.issuer}</TokenIssuer>}
          </TokenInfo>
          <Badge type="primary">{token.type.toUpperCase()}</Badge>
        </TokenHeader>

        <TokenMetadata>
          <TokenMetaItem>Algorithmus: {token.algorithm}</TokenMetaItem>
          <TokenMetaItem>Stellen: {token.digits}</TokenMetaItem>
          <TokenMetaItem>Periode: {token.period}s</TokenMetaItem>
        </TokenMetadata>

        <TimeRemaining>
          <ProgressBar progress={progress} />
        </TimeRemaining>

        <TokenCode>{code}</TokenCode>

        {!showQRCode ? (
          <QRCodeContainer>
            <QRCodeLink onClick={generateQRCode}>
              QR-Code anzeigen
            </QRCodeLink>
          </QRCodeContainer>
        ) : (
          <QRCodeContainer>
            <p>Scanne diesen QR-Code mit deiner Authenticator-App:</p>
            <p style={{ wordBreak: 'break-all', marginTop: '10px' }}>
              {qrCodeUrl}
            </p>
          </QRCodeContainer>
        )}

        {showDeleteConfirm ? (
          <DeleteConfirmation>
            <h4>Token wirklich löschen?</h4>
            <p>Dies kann nicht rückgängig gemacht werden.</p>
            <ButtonGroup style={{ marginTop: '1rem' }}>
              <Button 
                variant="danger" 
                onClick={handleDelete}
              >
                Ja, löschen
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Abbrechen
              </Button>
            </ButtonGroup>
          </DeleteConfirmation>
        ) : (
          <ActionsContainer>
            <Button 
              variant="danger" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              Token löschen
            </Button>
          </ActionsContainer>
        )}
      </TokenDetailCard>
    </>
  );
};

export default TokenDetail;
EOF

# pages/AddToken.jsx
cat > client/src/pages/AddToken.jsx << 'EOF'
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Select,
  Button, 
  ButtonGroup,
  Card, 
  PageHeader, 
  PageTitle, 
  Alert,
  ErrorMessage
} from '../components/styled';

const AddToken = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    secret: '',
    issuer: '',
    type: 'totp',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Für numerische Felder Werte als Zahlen umwandeln
    const convertedValue = name === 'digits' || name === 'period' 
      ? parseInt(value, 10) 
      : value;
      
    setFormData((prev) => ({
      ...prev,
      [name]: convertedValue
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    if (!formData.secret.trim()) {
      newErrors.secret = 'Secret ist erforderlich';
    } else if (!/^[A-Z2-7]+=*$/i.test(formData.secret)) {
      newErrors.secret = 'Secret muss ein gültiger Base32-String sein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post('/tokens', formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Fehler beim Erstellen des Tokens:', err);
      setError(
        err.response?.data?.message || 
        'Token konnte nicht erstellt werden'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader>
        <PageTitle>Token hinzufügen</PageTitle>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
        >
          Abbrechen
        </Button>
      </PageHeader>

      {error && <Alert type="error">{error}</Alert>}

      <Card>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Name (erforderlich)</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              disabled={isLoading}
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="secret">Secret (erforderlich)</Label>
            <Input
              id="secret"
              name="secret"
              value={formData.secret}
              onChange={handleChange}
              error={errors.secret}
              disabled={isLoading}
              placeholder="z.B. JBSWY3DPEHPK3PXP"
            />
            {errors.secret && <ErrorMessage>{errors.secret}</ErrorMessage>}
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              Das Token-Secret ist der Schlüssel, der von der Website oder App bereitgestellt wird.
            </p>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="issuer">Aussteller</Label>
            <Input
              id="issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="z.B. Google, GitHub, Amazon"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="type">Token-Typ</Label>
            <Select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="totp">TOTP (zeitbasiert)</option>
              <option value="hotp">HOTP (zählerbasiert)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="algorithm">Algorithmus</Label>
            <Select
              id="algorithm"
              name="algorithm"
              value={formData.algorithm}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="SHA1">SHA1</option>
              <option value="SHA256">SHA256</option>
              <option value="SHA512">SHA512</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="digits">Anzahl der Ziffern</Label>
            <Select
              id="digits"
              name="digits"
              value={formData.digits}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value={6}>6 Ziffern</option>
              <option value={8}>8 Ziffern</option>
            </Select>
          </FormGroup>

          {formData.type === 'totp' && (
            <FormGroup>
              <Label htmlFor="period">Gültigkeitsdauer (Sekunden)</Label>
              <Select
                id="period"
                name="period"
                value={formData.period}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value={30}>30 Sekunden</option>
                <option value={60}>60 Sekunden</option>
                <option value={90}>90 Sekunden</option>
              </Select>
            </FormGroup>
          )}

          <ButtonGroup>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading}
            >
              {isLoading ? 'Wird erstellt...' : 'Token erstellen'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
          </ButtonGroup>
        </Form>
      </Card>
    </>
  );
};

export default AddToken;
EOF

# pages/EditToken.jsx
cat > client/src/pages/EditToken.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Select,
  Button, 
  ButtonGroup,
  Card, 
  PageHeader, 
  PageTitle, 
  Alert,
  ErrorMessage,
  LoaderContainer,
  Loader
} from '../components/styled';

const EditToken = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    type: 'totp',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await api.get(`/tokens/${id}`);
        const token = response.data.data;
        
        setFormData({
          name: token.name,
          issuer: token.issuer || '',
          type: token.type,
          algorithm: token.algorithm,
          digits: token.digits,
          period: token.period
        });
      } catch (err) {
        console.error('Fehler beim Laden des Tokens:', err);
        setError('Token konnte nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Für numerische Felder Werte als Zahlen umwandeln
    const convertedValue = name === 'digits' || name === 'period' 
      ? parseInt(value, 10) 
      : value;
      
    setFormData((prev) => ({
      ...prev,
      [name]: convertedValue
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await api.put(`/tokens/${id}`, formData);
      navigate(`/tokens/${id}`);
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Tokens:', err);
      setError(
        err.response?.data?.message || 
        'Token konnte nicht aktualisiert werden'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <LoaderContainer>
        <Loader size="40px" />
      </LoaderContainer>
    );
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Token bearbeiten</PageTitle>
        <ButtonGroup>
          <Button 
            variant="outline" 
            as={Link}
            to={`/tokens/${id}`}
          >
            Abbrechen
          </Button>
        </ButtonGroup>
      </PageHeader>

      {error && <Alert type="error">{error}</Alert>}

      <Card>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Name (erforderlich)</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              disabled={isSaving}
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="issuer">Aussteller</Label>
            <Input
              id="issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="z.B. Google, GitHub, Amazon"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="type">Token-Typ</Label>
            <Select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={isSaving}
            >
              <option value="totp">TOTP (zeitbasiert)</option>
              <option value="hotp">HOTP (zählerbasiert)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="algorithm">Algorithmus</Label>
            <Select
              id="algorithm"
              name="algorithm"
              value={formData.algorithm}
              onChange={handleChange}
              disabled={isSaving}
            >
              <option value="SHA1">SHA1</option>
              <option value="SHA256">SHA256</option>
              <option value="SHA512">SHA512</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="digits">Anzahl der Ziffern</Label>
            <Select
              id="digits"
              name="digits"
              value={formData.digits}
              onChange={handleChange}
              disabled={isSaving}
            >
              <option value={6}>6 Ziffern</option>
              <option value={8}>8 Ziffern</option>
            </Select>
          </FormGroup>

          {formData.type === 'totp' && (
            <FormGroup>
              <Label htmlFor="period">Gültigkeitsdauer (Sekunden)</Label>
              <Select
                id="period"
                name="period"
                value={formData.period}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value={30}>30 Sekunden</option>
                <option value={60}>60 Sekunden</option>
                <option value={90}>90 Sekunden</option>
              </Select>
            </FormGroup>
          )}

          <ButtonGroup>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isSaving}
            >
              {isSaving ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              as={Link}
              to={`/tokens/${id}`}
              disabled={isSaving}
            >
              Abbrechen
            </Button>
          </ButtonGroup>
        </Form>
      </Card>
    </>
  );
};

export default EditToken;
EOF

# package.json aktualisieren
cat > client/package.json << 'EOF'
{
  "name": "mpsec-client",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.3.4",
    "jwt-decode": "^3.1.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "react-scripts": "5.0.1",
    "styled-components": "^5.3.9",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

# Root-Dateien erstellen
echo -e "${BLUE}Root-Dateien werden erstellt...${NC}"

# README.md
cat > README.md << 'EOF'
# MPSec 2FA Token Manager

MPSec ist eine sichere Anwendung zur Verwaltung von Two-Factor-Authentication (2FA) Tokens. Die Anwendung ermöglicht es dir, deine 2FA-Tokens sicher zu speichern und zu verwalten.

## Features

- Benutzerauthentifizierung mit Benutzername und Passwort
- Sichere Speicherung von 2FA-Tokens
- Unterstützung für TOTP (zeitbasierte Einmalkennwörter)
- Moderne, benutzerfreundliche Oberfläche mit Dark Mode
- Echtzeit-Generierung von Authentifizierungscodes
- QR-Code-Unterstützung für einfache Migration
- Sichere Verschlüsselung aller sensiblen Daten

## Technologie-Stack

### Frontend
- React.js
- React Router für Navigation
- Styled Components für das Styling
- Axios für API-Anfragen
- JWT für die Authentifizierung

### Backend
- Node.js mit Express
- MongoDB für die Datenspeicherung
- Mongoose als ODM
- bcryptjs für Passwort-Hashing
- jsonwebtoken für JWT-Generierung
- otplib für TOTP-Implementierung
- Crypto für Verschlüsselung der Token-Secrets

## Voraussetzungen

- Node.js (v14 oder höher)
- MongoDB (v4.4 oder höher)
- npm oder yarn

## Installation

### Lokale Entwicklung

1. Repository klonen
   ```bash
   git clone https://github.com/deinbenutzername/mpsec.git
   cd mpsec
   ```

2. Backend-Abhängigkeiten installieren
   ```bash
   cd server
   npm install
   ```

3. Frontend-Abhängigkeiten installieren
   ```bash
   cd ../client
   npm install
   ```

4. MongoDB einrichten
   - Stelle sicher, dass MongoDB läuft
   - Erstelle eine Datenbank mit dem Namen "mpsec"

5. Umgebungsvariablen konfigurieren
   - Kopiere die Datei `.env.example` zu `.env` im `server`-Verzeichnis
   - Passe die Umgebungsvariablen an deine Bedürfnisse an

6. Backend starten
   ```bash
   cd ../server
   npm run dev
   ```

7. Frontend starten
   ```bash
   cd ../client
   npm start
   ```

8. Öffne http://localhost:3000 in deinem Browser

### Produktion

1. Frontend bauen
   ```bash
   cd client
   npm run build
   ```

2. App auf VPS deployen
   ```bash
   ./deploy.sh BENUTZER SERVER_IP PORT ZIELVERZEICHNIS
   ```

## Sicherheitsmaßnahmen

- Alle Passwörter werden mit bcrypt gehasht und gesalzen
- Token-Secrets werden mit AES-256-CBC verschlüsselt in der Datenbank gespeichert
- JWT für sichere Authentifizierung mit begrenzter Gültigkeitsdauer
- Alle API-Routen sind mit Authentifizierung geschützt
- CORS-Schutz für die API-Endpunkte
- XSS- und CSRF-Schutzmaßnahmen

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## Hinweis zur Sicherheit

Diese Anwendung speichert sensible 2FA-Tokens. Stelle sicher, dass:
- Dein Server sicher konfiguriert ist
- HTTPS für die Produktionsumgebung aktiviert ist
- Die MongoDB-Instanz nicht öffentlich zugänglich ist
- Alle Sicherheitsupdates regelmäßig installiert werden
- Starke Passwörter für die Benutzerkonten verwendet werden
EOF

# deploy.sh
cat > deploy.sh << 'EOF'
#!/bin/bash

# MPSec Deployment-Skript für VPS
# Nutzung: ./deploy.sh [vps_benutzer] [vps_adresse] [vps_port] [vps_zielverzeichnis]

# Beispiel: ./deploy.sh user 123.456.789.0 22 /var/www/mpsec

set -e  # Script beenden, wenn ein Befehl fehlschlägt

# Parameter überprüfen
if [ "$#" -ne 4 ]; then
    echo "Fehler: Falsche Anzahl an Parametern."
    echo "Nutzung: ./deploy.sh [vps_benutzer] [vps_adresse] [vps_port] [vps_zielverzeichnis]"
    exit 1
fi

VPS_USER=$1
VPS_HOST=$2
VPS_PORT=$3
VPS_DIR=$4

# Farben für Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starte Deployment von MPSec auf VPS...${NC}"

# 1. Frontend bauen
echo -e "${GREEN}1. Frontend wird gebaut...${NC}"
cd client
npm ci
npm run build
cd ..

# 2. Backend-Abhängigkeiten installieren
echo -e "${GREEN}2. Backend-Abhängigkeiten werden installiert...${NC}"
cd server
npm ci --production
cd ..

# 3. Env-Datei für Produktion vorbereiten
echo -e "${GREEN}3. Umgebungsvariablen werden für Produktion angepasst...${NC}"
# Hier können zusätzliche Einstellungen für die Produktionsumgebung vorgenommen werden

# 4. Alles in ein Verzeichnis für den Upload packen
echo -e "${GREEN}4. Dateien werden für Upload vorbereitet...${NC}"
mkdir -p deploy
cp -r server deploy/
cp -r client/build deploy/public

# 5. Auf VPS hochladen
echo -e "${GREEN}5. Dateien werden auf VPS hochgeladen...${NC}"
scp -P $VPS_PORT -r deploy/* $VPS_USER@$VPS_HOST:$VPS_DIR

# 6. Aufräumen
echo -e "${GREEN}6. Temporäre Dateien werden gelöscht...${NC}"
rm -rf deploy

echo -e "${GREEN}Deployment abgeschlossen!${NC}"
echo -e "${YELLOW}Hinweis: Stelle sicher, dass auf dem VPS der Node.js-Server konfiguriert ist und läuft.${NC}"
echo -e "${YELLOW}Du kannst PM2 verwenden, um den Node.js-Server zu verwalten:${NC}"
echo -e "   ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $VPS_DIR && pm2 restart app.js || pm2 start app.js --name=\"mpsec\"'"
EOF

# Ausführbar machen
chmod +x deploy.sh

# Fertig
echo -e "${GREEN}MPSec Projekteinrichtung abgeschlossen!${NC}"
echo -e "Installiere die Abhängigkeiten mit den folgenden Befehlen:"
echo -e "${BLUE}cd server && npm install${NC}"
echo -e "${BLUE}cd ../client && npm install${NC}"
echo -e "\nStarte den Server mit: ${BLUE}cd server && npm run dev${NC}"
echo -e "Starte den Client mit: ${BLUE}cd client && npm start${NC}"
EOF
