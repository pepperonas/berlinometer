const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['https://kiezform.de', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Product Schema
const productSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  serialNumber: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  category: { type: String, required: true }, // rings, chains
  manufacturingDate: { type: Date, default: Date.now },
  owner: {
    name: { type: String },
    email: { type: String },
    registrationDate: { type: Date }
  },
  metadata: {
    material: { type: String },
    size: { type: String },
    color: { type: String },
    price: { type: Number },
    notes: { type: String }
  },
  isValid: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastVerified: { type: Date }
});

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Admin = mongoose.model('Admin', adminSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware für Admin-Authentifizierung
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'KiezForm Verification API'
  });
});

// Admin Routes
app.post('/api/admin/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = new Admin({ 
      username, 
      password: hashedPassword,
      email 
    });
    
    await admin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    
    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: admin._id, username: admin.username }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Product Routes (Admin)
app.post('/api/products', authenticateAdmin, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      _id: uuidv4()
    };
    
    const product = new Product(productData);
    await product.save();
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Serial number already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

app.get('/api/products', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, isValid } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (isValid !== undefined) filter.isValid = isValid === 'true';
    
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Public Verification Routes
app.get('/api/verify/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (!product.isValid) {
      return res.status(403).json({ 
        error: 'Product is not valid',
        product: {
          id: product._id,
          serialNumber: product.serialNumber,
          productName: product.productName,
          isValid: product.isValid
        }
      });
    }
    
    // Update last verified timestamp
    await Product.findByIdAndUpdate(req.params.id, { 
      lastVerified: new Date() 
    });
    
    res.json({
      id: product._id,
      serialNumber: product.serialNumber,
      productName: product.productName,
      category: product.category,
      manufacturingDate: product.manufacturingDate,
      owner: product.owner,
      metadata: product.metadata,
      isValid: product.isValid,
      verifiedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(400).json({ error: 'Invalid product ID' });
  }
});

// QR Code Generation
app.get('/api/qrcode/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const verificationUrl = `${process.env.BASE_URL}/verify/${product._id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    res.json({ 
      qrCode: qrCodeDataUrl, 
      verificationUrl,
      productInfo: {
        serialNumber: product.serialNumber,
        productName: product.productName
      }
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Statistics
app.get('/api/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const validProducts = await Product.countDocuments({ isValid: true });
    const registeredProducts = await Product.countDocuments({ 
      'owner.name': { $exists: true, $ne: '' } 
    });
    const ringProducts = await Product.countDocuments({ category: 'rings' });
    const chainProducts = await Product.countDocuments({ category: 'chains' });
    
    const recentVerifications = await Product.countDocuments({
      lastVerified: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    });
    
    res.json({
      totalProducts,
      validProducts,
      registeredProducts,
      invalidProducts: totalProducts - validProducts,
      ringProducts,
      chainProducts,
      recentVerifications
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5090;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`KiezForm Verification API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Base URL: ${process.env.BASE_URL}`);
});