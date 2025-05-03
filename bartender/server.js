/**
 * Simple Express server for Bartender App
 * 
 * This is a placeholder server that can be used in the future to implement
 * real API endpoints and database connections.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5024;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bartender API is running' });
});

// Sample API route 
app.get('/api/info', (req, res) => {
  res.json({
    appName: 'Bartender',
    version: '1.0.0',
    apiStatus: 'active'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Bartender API server running on port ${PORT}`);
});