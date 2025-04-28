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
    getServerTime,
    generateAdjustedCode
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

// Wichtig: Serverzeit-Route vor den ID-Routen definieren
router.get('/servertime', getServerTime);

router
    .route('/:id')
    .get(getToken)
    .put(updateToken)
    .delete(deleteToken);

router.get('/:id/code', generateCode);
router.get('/:id/qrcode', generateQRCode);
router.get('/:id/adjusted-code', generateAdjustedCode);
router.post('/import', importTokens);

module.exports = router;