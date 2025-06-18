const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Temporäre Routes zum Testen
router.post('/register', async (req, res) => {
  res.json({ message: 'Register endpoint - noch zu implementieren' });
});

router.post('/login', async (req, res) => {
  res.json({ message: 'Login endpoint - noch zu implementieren' });
});

module.exports = router;
