const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5015;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// In-memory storage for keys and products
const keys = new Map();
const products = [];
const MASTER_PASSWORD = 'cx6fEwxbA3K-';

// Generate key format: XXXX-XXXX-XXXX-XXXX
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 4; i++) {
    if (i > 0) key += '-';
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return key;
}

// Routes
app.post('/api/validate-key', (req, res) => {
  const { key } = req.body;
  
  // Check if it's the master password
  if (key === MASTER_PASSWORD) {
    return res.json({ 
      valid: true, 
      isMaster: true,
      products 
    });
  }
  
  // Check if it's a valid key
  if (keys.has(key)) {
    const keyData = keys.get(key);
    if (!keyData.used) {
      keys.set(key, { ...keyData, used: true, usedAt: new Date() });
      return res.json({ 
        valid: true, 
        isMaster: false,
        products 
      });
    }
  }
  
  res.json({ valid: false });
});

app.post('/api/generate-key', (req, res) => {
  const { password } = req.body;
  
  if (password !== MASTER_PASSWORD) {
    return res.status(401).json({ error: 'Invalid master password' });
  }
  
  const newKey = generateKey();
  keys.set(newKey, {
    created: new Date(),
    used: false
  });
  
  res.json({ key: newKey });
});

app.post('/api/generate-link', (req, res) => {
  const { password } = req.body;
  
  if (password !== MASTER_PASSWORD) {
    return res.status(401).json({ error: 'Invalid master password' });
  }
  
  const linkKey = uuidv4();
  keys.set(linkKey, {
    created: new Date(),
    used: false,
    isLink: true
  });
  
  const link = `${req.protocol}://${req.get('host')}?key=${linkKey}`;
  res.json({ link });
});

app.post('/api/upload-product', upload.single('image'), (req, res) => {
  const { password, text, price } = req.body;
  
  if (password !== MASTER_PASSWORD) {
    return res.status(401).json({ error: 'Invalid master password' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }
  
  const product = {
    id: uuidv4(),
    image: `/uploads/${req.file.filename}`,
    text,
    price: parseFloat(price),
    created: new Date()
  };
  
  products.push(product);
  res.json({ success: true, product });
});

app.get('/api/products', (req, res) => {
  res.json({ products });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});