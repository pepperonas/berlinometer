const express = require('express');
const {
    getTokens,
    getToken,
    createToken,
    updateToken,
    deleteToken,
    generateCode,
    generateQRCode,
    importTokens,
    deleteAllTokens,
    generateSimpleCode,
    generateOTPManagerCode
} = require('../controllers/tokens');
const {protect} = require('../middleware/auth');

const router = express.Router();

// Alle Routen schützen
router.use(protect);

router
    .route('/')
    .get(getTokens)
    .post(createToken)
    .delete(deleteAllTokens);

router
    .route('/:id')
    .get(getToken)
    .put(updateToken)
    .delete(deleteToken);

router.get('/:id/code', generateCode);
router.get('/:id/simple-code', generateSimpleCode);
router.get('/:id/otpmanager-code', generateOTPManagerCode);
router.get('/:id/qrcode', generateQRCode);
router.post('/import', importTokens);

module.exports = router;