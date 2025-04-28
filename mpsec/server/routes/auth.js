const express = require('express');
const jwt = require('jsonwebtoken');
const {register, login, getMe, changePassword} = require('../controllers/auth');
const {protect} = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

// Temporärer Test-Endpunkt
router.get('/test-token', (req, res) => {
    const payload = {
        id: '680cdc88094512d065919ab4',
        username: 'martin',
        jti: 'test123'
    };
    try {
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '30d'});
        res.json({success: true, token});
    } catch (err) {
        console.error('Test-Token Error:', err.name, err.message);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Generieren des Tokens',
            details: err.message
        });
    }
});

module.exports = router;