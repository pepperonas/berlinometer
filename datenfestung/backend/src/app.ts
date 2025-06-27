import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler } from '@/middleware/error.middleware';
import { notFoundHandler } from '@/middleware/notFound.middleware';
import { requestLogger } from '@/middleware/logger.middleware';

// Import routes
import authRoutes from '@/routes/auth.routes';
import dashboardRoutes from '@/routes/dashboard.routes';
import processingActivitiesRoutes from '@/routes/processing-activities.routes';
import tomsRoutes from '@/routes/toms.routes';
import contractsRoutes from '@/routes/contracts.routes';
import tasksRoutes from '@/routes/tasks.routes';
import elearningRoutes from '@/routes/elearning.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
  app.use(requestLogger);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Datenfestung API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/processing-activities', processingActivitiesRoutes);
app.use('/api/toms', tomsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/elearning', elearningRoutes);

// Serve uploaded files (in production, use a CDN or object storage)
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Datenfestung API server running on port ${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌍 CORS Origin: ${process.env.CORS_ORIGIN}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;