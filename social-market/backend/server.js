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

// File-based persistent storage
const DATA_DIR = path.join(__dirname, 'data');
const KEYS_FILE = path.join(DATA_DIR, 'keys.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const PRODUCT_LINKS_FILE = path.join(DATA_DIR, 'product-links.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Load data from files
function loadData() {
  try {
    const keysData = fs.existsSync(KEYS_FILE) ? JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')) : {};
    const productsData = fs.existsSync(PRODUCTS_FILE) ? JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8')) : [];
    const productLinksData = fs.existsSync(PRODUCT_LINKS_FILE) ? JSON.parse(fs.readFileSync(PRODUCT_LINKS_FILE, 'utf8')) : {};
    
    return {
      keys: new Map(Object.entries(keysData)),
      products: productsData,
      productLinks: new Map(Object.entries(productLinksData))
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      keys: new Map(),
      products: [],
      productLinks: new Map()
    };
  }
}

// Save data to files
function saveData() {
  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(Object.fromEntries(keys), null, 2));
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    fs.writeFileSync(PRODUCT_LINKS_FILE, JSON.stringify(Object.fromEntries(productLinks), null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Initialize data
const { keys, products, productLinks } = loadData();
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
      saveData(); // Save changes to file
      return res.json({ 
        valid: true, 
        isMaster: false,
        products 
      });
    }
  }
  
  res.json({ valid: false });
});

app.post('/api/validate-product-key', (req, res) => {
  const { key } = req.body;
  
  // Check if it's a valid product link key
  if (productLinks.has(key)) {
    const linkData = productLinks.get(key);
    if (!linkData.used && linkData.isProduct) {
      // Mark as used
      productLinks.set(key, { ...linkData, used: true, usedAt: new Date() });
      saveData(); // Save changes to file
      
      // Find the product
      const product = products.find(p => p.id === linkData.productId);
      if (product) {
        return res.json({ 
          valid: true, 
          product: product
        });
      }
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
  saveData(); // Save changes to file
  
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
  saveData(); // Save changes to file
  
  const link = `${req.protocol}://${req.get('host')}/social-market?key=${linkKey}`;
  res.json({ link });
});

app.post('/api/share-product', (req, res) => {
  const { password, productId } = req.body;
  
  if (password !== MASTER_PASSWORD) {
    return res.status(401).json({ error: 'Invalid master password' });
  }
  
  // Find the product
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const linkKey = uuidv4();
  productLinks.set(linkKey, {
    productId: productId,
    created: new Date(),
    used: false,
    isProduct: true
  });
  saveData(); // Save changes to file
  
  const link = `${req.protocol}://${req.get('host')}/social-market?productKey=${linkKey}`;
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
  saveData(); // Save changes to file
  res.json({ success: true, product });
});

app.get('/api/products', (req, res) => {
  res.json({ products });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});