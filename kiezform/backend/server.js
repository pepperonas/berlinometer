const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const crypto = require('crypto');
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
  imageUrl: { type: String }, // Product thumbnail image URL
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
  blockchainInfo: {
    currentOwner: { type: String }, // Current pseudonym
    mintBlock: { type: String }, // Initial block ID
    lastBlock: { type: String }, // Latest block ID
    transferCount: { type: Number, default: 0 }
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

// Blockchain Block Schema
const blockSchema = new mongoose.Schema({
  blockId: { type: String, required: true, unique: true },
  blockNumber: { type: Number, required: true },
  previousHash: { type: String, required: true },
  currentHash: { type: String, required: true },
  productId: { type: String, required: true },
  transactionType: { 
    type: String, 
    enum: ['MINT', 'TRANSFER'], 
    required: true 
  },
  fromOwner: { type: String }, // Pseudonym or null for MINT
  toOwner: { type: String, required: true }, // Pseudonym
  timestamp: { type: Date, default: Date.now },
  metadata: {
    productName: { type: String },
    serialNumber: { type: String },
    transferMethod: { type: String } // 'QR_CODE', 'ADMIN', etc.
  },
  isValid: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Transfer Request Schema (for pending transfers)
const transferRequestSchema = new mongoose.Schema({
  transferId: { type: String, required: true, unique: true },
  productId: { type: String, required: true },
  fromOwner: { type: String, required: true },
  toOwner: { type: String }, // Will be set when transfer is accepted
  transferToken: { type: String, required: true }, // For QR code
  status: { 
    type: String, 
    enum: ['PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED'], 
    default: 'PENDING' 
  },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const Product = mongoose.model('Product', productSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Block = mongoose.model('Block', blockSchema);
const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Blockchain Helper Functions
function generateHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function generatePseudonym() {
  // Generate anonymous but consistent pseudonym
  return 'USR-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function getLastBlock() {
  return await Block.findOne().sort({ blockNumber: -1 });
}

async function createGenesisBlock() {
  const genesisBlock = new Block({
    blockId: 'BLK-000',
    blockNumber: 0,
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    currentHash: generateHash({
      blockNumber: 0,
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      data: 'GENESIS_BLOCK'
    }),
    productId: 'GENESIS',
    transactionType: 'MINT',
    fromOwner: null,
    toOwner: 'KIEZFORM-GENESIS',
    metadata: {
      productName: 'Genesis Block',
      serialNumber: 'GENESIS-000',
      transferMethod: 'SYSTEM'
    }
  });
  
  return await genesisBlock.save();
}

async function createMintBlock(productId, productData, ownerPseudonym) {
  const lastBlock = await getLastBlock();
  
  if (!lastBlock) {
    await createGenesisBlock();
    return await createMintBlock(productId, productData, ownerPseudonym);
  }
  
  const blockNumber = lastBlock.blockNumber + 1;
  const blockId = `BLK-${blockNumber.toString().padStart(3, '0')}`;
  
  const blockData = {
    blockNumber,
    previousHash: lastBlock.currentHash,
    productId,
    transactionType: 'MINT',
    toOwner: ownerPseudonym,
    timestamp: new Date(),
    metadata: productData
  };
  
  const currentHash = generateHash(blockData);
  
  const newBlock = new Block({
    blockId,
    ...blockData,
    currentHash
  });
  
  return await newBlock.save();
}

async function createTransferBlock(productId, fromOwner, toOwner, transferMethod = 'QR_CODE') {
  const lastBlock = await getLastBlock();
  const blockNumber = lastBlock.blockNumber + 1;
  const blockId = `BLK-${blockNumber.toString().padStart(3, '0')}`;
  
  // Get product details
  const product = await Product.findById(productId);
  
  const blockData = {
    blockNumber,
    previousHash: lastBlock.currentHash,
    productId,
    transactionType: 'TRANSFER',
    fromOwner,
    toOwner,
    timestamp: new Date(),
    metadata: {
      productName: product?.productName || 'Unknown Product',
      serialNumber: product?.serialNumber || 'Unknown',
      transferMethod
    }
  };
  
  const currentHash = generateHash(blockData);
  
  const newBlock = new Block({
    blockId,
    ...blockData,
    currentHash
  });
  
  return await newBlock.save();
}

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
    
    // Create initial blockchain MINT block
    const ownerPseudonym = generatePseudonym();
    const blockData = {
      productName: product.productName,
      serialNumber: product.serialNumber,
      transferMethod: 'ADMIN_MINT'
    };
    
    const mintBlock = await createMintBlock(product._id, blockData, ownerPseudonym);
    
    // Update product with blockchain info
    product.blockchainInfo = {
      currentOwner: ownerPseudonym,
      mintBlock: mintBlock.blockId,
      lastBlock: mintBlock.blockId
    };
    await product.save();
    
    res.status(201).json({
      ...product.toObject(),
      blockchainInfo: {
        mintBlock: mintBlock.blockId,
        currentOwner: ownerPseudonym
      }
    });
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
      imageUrl: product.imageUrl,
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

// Blockchain API Routes (Public)
app.get('/api/blockchain', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const blocks = await Block.find({ isValid: true })
      .sort({ blockNumber: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');
      
    const totalBlocks = await Block.countDocuments({ isValid: true });
    
    res.json({
      blocks,
      totalPages: Math.ceil(totalBlocks / limit),
      currentPage: parseInt(page),
      totalBlocks,
      chainInfo: {
        name: 'KiezForm Chain',
        symbol: 'KZF',
        description: 'Blockchain for KiezForm jewelry authenticity and ownership verification'
      }
    });
  } catch (error) {
    console.error('Blockchain fetch error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/blockchain/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const blocks = await Block.find({ 
      productId: productId,
      isValid: true 
    }).sort({ blockNumber: 1 }).select('-__v');
    
    if (blocks.length === 0) {
      return res.status(404).json({ error: 'No blockchain history found for this product' });
    }
    
    const currentOwner = blocks[blocks.length - 1].toOwner;
    
    res.json({
      productId,
      currentOwner,
      totalTransactions: blocks.length,
      history: blocks
    });
  } catch (error) {
    console.error('Product blockchain history error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/blockchain/search/:query', async (req, res) => {
  try {
    const query = req.params.query.toUpperCase();
    
    // Search by product ID, block ID, or pseudonym
    const blocks = await Block.find({
      $or: [
        { productId: { $regex: query, $options: 'i' } },
        { blockId: { $regex: query, $options: 'i' } },
        { toOwner: { $regex: query, $options: 'i' } },
        { fromOwner: { $regex: query, $options: 'i' } },
        { 'metadata.serialNumber': { $regex: query, $options: 'i' } }
      ],
      isValid: true
    }).sort({ blockNumber: -1 }).select('-__v');
    
    res.json({
      query,
      matches: blocks.length,
      blocks
    });
  } catch (error) {
    console.error('Blockchain search error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Transfer API Routes
app.post('/api/transfer/initiate', async (req, res) => {
  try {
    const { productId, fromPseudonym } = req.body;
    
    // Verify current ownership
    const latestBlock = await Block.findOne({ 
      productId, 
      isValid: true 
    }).sort({ blockNumber: -1 });
    
    if (!latestBlock || latestBlock.toOwner !== fromPseudonym) {
      return res.status(403).json({ error: 'Not the current owner of this product' });
    }
    
    // Check for existing pending transfers
    const existingTransfer = await TransferRequest.findOne({
      productId,
      status: 'PENDING'
    });
    
    if (existingTransfer) {
      return res.status(400).json({ error: 'Transfer already pending for this product' });
    }
    
    const transferId = uuidv4();
    const transferToken = crypto.randomBytes(32).toString('hex');
    
    const transferRequest = new TransferRequest({
      transferId,
      productId,
      fromOwner: fromPseudonym,
      transferToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    
    await transferRequest.save();
    
    // Generate transfer QR code
    const transferUrl = `${process.env.BASE_URL}/transfer/${transferToken}`;
    const transferQR = await QRCode.toDataURL(transferUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#ff0000', // Red QR code for transfers
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    res.json({
      transferId,
      transferToken,
      transferUrl,
      transferQR,
      expiresAt: transferRequest.expiresAt,
      message: 'Transfer initiated. Share the red QR code with the new owner.'
    });
  } catch (error) {
    console.error('Transfer initiation error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/transfer/complete', async (req, res) => {
  try {
    const { transferToken, newOwnerName } = req.body;
    
    const transferRequest = await TransferRequest.findOne({
      transferToken,
      status: 'PENDING',
      expiresAt: { $gt: new Date() }
    });
    
    if (!transferRequest) {
      return res.status(404).json({ error: 'Transfer not found or expired' });
    }
    
    // Generate pseudonym for new owner
    const newOwnerPseudonym = generatePseudonym();
    
    // Create transfer block
    const transferBlock = await createTransferBlock(
      transferRequest.productId,
      transferRequest.fromOwner,
      newOwnerPseudonym,
      'QR_CODE'
    );
    
    // Update transfer request
    transferRequest.status = 'COMPLETED';
    transferRequest.toOwner = newOwnerPseudonym;
    transferRequest.completedAt = new Date();
    await transferRequest.save();
    
    res.json({
      success: true,
      newOwner: newOwnerPseudonym,
      blockId: transferBlock.blockId,
      message: 'Ownership transferred successfully!'
    });
  } catch (error) {
    console.error('Transfer completion error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/transfer/:token', async (req, res) => {
  try {
    const transferRequest = await TransferRequest.findOne({
      transferToken: req.params.token,
      status: 'PENDING'
    });
    
    if (!transferRequest) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    
    if (transferRequest.expiresAt < new Date()) {
      transferRequest.status = 'EXPIRED';
      await transferRequest.save();
      return res.status(410).json({ error: 'Transfer expired' });
    }
    
    // Get product details
    const product = await Product.findById(transferRequest.productId);
    
    res.json({
      transferId: transferRequest.transferId,
      productId: transferRequest.productId,
      productName: product?.productName || 'Unknown Product',
      fromOwner: transferRequest.fromOwner,
      expiresAt: transferRequest.expiresAt,
      message: 'Ready to complete transfer'
    });
  } catch (error) {
    console.error('Transfer info error:', error);
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
    
    // Blockchain stats
    const totalBlocks = await Block.countDocuments();
    const totalTransfers = await Block.countDocuments({ transactionType: 'TRANSFER' });
    const pendingTransfers = await TransferRequest.countDocuments({ status: 'PENDING' });
    
    res.json({
      totalProducts,
      validProducts,
      registeredProducts,
      invalidProducts: totalProducts - validProducts,
      ringProducts,
      chainProducts,
      recentVerifications,
      blockchain: {
        totalBlocks,
        totalTransfers,
        pendingTransfers
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Transfer QR Code Management Endpoints

// Schema for Transfer QR Codes
const transferQRSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  qrToken: { type: String, required: true, unique: true },
  qrCodeData: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'used', 'expired', 'invalidated'], 
    default: 'active' 
  },
  generatedAt: { type: Date, default: Date.now },
  usedAt: { type: Date },
  expiresAt: { type: Date },
  createdBy: { type: String, default: 'admin' },
  metadata: {
    productName: String,
    serialNumber: String,
    qrImageUrl: String
  }
});

const TransferQR = mongoose.model('TransferQR', transferQRSchema);

// Generate Transfer QR Code for specific product
app.post('/api/admin/generate-transfer-qr/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if transfer QR already exists and is active
    const existingQR = await TransferQR.findOne({ 
      productId, 
      status: { $in: ['active', 'used'] } 
    });
    
    if (existingQR && existingQR.status === 'active') {
      return res.status(400).json({ 
        error: 'Active transfer QR code already exists for this product',
        qrToken: existingQR.qrToken
      });
    }
    
    // Generate unique QR token
    const qrToken = 'TQR-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    
    // Create transfer URL
    const transferUrl = `${process.env.BASE_URL || 'https://kiezform.de'}/transfer?token=${qrToken}&product=${productId}`;
    
    // QR Code data includes product info for verification
    const qrCodeData = JSON.stringify({
      type: 'TRANSFER',
      token: qrToken,
      productId: productId,
      serial: product.serialNumber,
      name: product.productName,
      url: transferUrl,
      generated: new Date().toISOString()
    });
    
    // Create transfer QR record
    const transferQR = new TransferQR({
      productId,
      qrToken,
      qrCodeData,
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      metadata: {
        productName: product.productName,
        serialNumber: product.serialNumber,
        qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&bgcolor=dc2c3f&color=ffffff&data=${encodeURIComponent(transferUrl)}`
      }
    });
    
    await transferQR.save();
    
    res.json({
      success: true,
      qrToken,
      qrCodeData,
      transferUrl,
      qrImageUrl: transferQR.metadata.qrImageUrl,
      expiresAt: transferQR.expiresAt
    });
    
  } catch (error) {
    console.error('Generate transfer QR error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all transfer QR codes with status
app.get('/api/admin/transfer-codes', async (req, res) => {
  try {
    const { status } = req.query;
    
    // Get all products
    const products = await Product.find({}).sort({ createdAt: -1 });
    
    // Get transfer QR codes
    const transferQRs = await TransferQR.find({}).sort({ generatedAt: -1 });
    
    // Create map for quick lookup
    const qrMap = {};
    transferQRs.forEach(qr => {
      qrMap[qr.productId] = qr;
    });
    
    // Combine product data with QR status
    const results = products.map(product => {
      const qr = qrMap[product._id];
      const productData = {
        productId: product._id,
        productName: product.productName,
        serialNumber: product.serialNumber,
        category: product.category,
        createdAt: product.createdAt,
        transferQR: qr ? {
          qrToken: qr.qrToken,
          status: qr.status,
          generatedAt: qr.generatedAt,
          usedAt: qr.usedAt,
          expiresAt: qr.expiresAt,
          qrImageUrl: qr.metadata?.qrImageUrl
        } : null
      };
      
      // Determine overall status
      if (!qr) {
        productData.overallStatus = 'missing';
      } else if (qr.expiresAt && qr.expiresAt < new Date()) {
        productData.overallStatus = 'expired';
      } else {
        productData.overallStatus = qr.status;
      }
      
      return productData;
    });
    
    // Filter by status if requested
    let filteredResults = results;
    if (status && status !== 'all') {
      filteredResults = results.filter(item => item.overallStatus === status);
    }
    
    res.json({
      success: true,
      total: filteredResults.length,
      totalProducts: products.length,
      transferCodes: filteredResults
    });
    
  } catch (error) {
    console.error('Get transfer codes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download QR Code image
app.get('/api/transfer-qr/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const transferQR = await TransferQR.findOne({ 
      productId, 
      status: { $in: ['active', 'used'] } 
    });
    
    if (!transferQR) {
      return res.status(404).json({ error: 'Transfer QR code not found' });
    }
    
    // Redirect to QR image URL
    res.redirect(transferQR.metadata.qrImageUrl);
    
  } catch (error) {
    console.error('Download QR error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Invalidate Transfer QR Code
app.delete('/api/admin/transfer-code/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const transferQR = await TransferQR.findOneAndUpdate(
      { productId },
      { 
        status: 'invalidated',
        usedAt: new Date()
      },
      { new: true }
    );
    
    if (!transferQR) {
      return res.status(404).json({ error: 'Transfer QR code not found' });
    }
    
    res.json({
      success: true,
      message: 'Transfer QR code invalidated',
      qrToken: transferQR.qrToken
    });
    
  } catch (error) {
    console.error('Invalidate transfer QR error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk generate missing QR codes
app.post('/api/admin/generate-all-missing-qr', async (req, res) => {
  try {
    // Get all products
    const products = await Product.find({});
    
    // Get existing QR codes
    const existingQRs = await TransferQR.find({ 
      status: { $in: ['active', 'used'] } 
    });
    
    const existingProductIds = new Set(existingQRs.map(qr => qr.productId));
    
    // Find products without QR codes
    const missingProducts = products.filter(product => 
      !existingProductIds.has(product._id.toString())
    );
    
    const results = [];
    
    for (const product of missingProducts) {
      try {
        // Generate unique QR token
        const qrToken = 'TQR-' + crypto.randomBytes(6).toString('hex').toUpperCase();
        
        // Create transfer URL
        const transferUrl = `${process.env.BASE_URL || 'https://kiezform.de'}/transfer?token=${qrToken}&product=${product._id}`;
        
        // QR Code data
        const qrCodeData = JSON.stringify({
          type: 'TRANSFER',
          token: qrToken,
          productId: product._id,
          serial: product.serialNumber,
          name: product.productName,
          url: transferUrl,
          generated: new Date().toISOString()
        });
        
        // Create transfer QR record
        const transferQR = new TransferQR({
          productId: product._id,
          qrToken,
          qrCodeData,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          metadata: {
            productName: product.productName,
            serialNumber: product.serialNumber,
            qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&bgcolor=dc2c3f&color=ffffff&data=${encodeURIComponent(transferUrl)}`
          }
        });
        
        await transferQR.save();
        
        results.push({
          productId: product._id,
          productName: product.productName,
          qrToken,
          success: true
        });
        
      } catch (error) {
        results.push({
          productId: product._id,
          productName: product.productName,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Generated ${results.filter(r => r.success).length} QR codes`,
      totalProcessed: results.length,
      results
    });
    
  } catch (error) {
    console.error('Bulk generate QR error:', error);
    res.status(500).json({ error: error.message });
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