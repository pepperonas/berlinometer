const express = require('express');
const {
    getTokens,
    getToken,
    createToken,
    updateToken,
    deleteToken,
    generateCode,
    generateTimeAdjustedCode,
    generateQRCode,
    generateExtendedCode,
    importTokens,
    deleteAllTokens,
    generateSimpleCode,
    generateOTPManagerCode,
    getServerTime
} = require('../controllers/tokens');
const {protect} = require('../middleware/auth');

const router = express.Router();

// Alle Routen schützen
router.use(protect);

// WICHTIG: Generische Routen VOR spezifischen mit IDs definieren!
router.get('/servertime', getServerTime);  // Muss VOR den ID-Routen stehen!

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
router.get('/:id/adjusted-code', generateTimeAdjustedCode);
router.get('/:id/extended-code', require('../controllers/tokens').generateExtendedCode);


module.exports = router;