const express = require('express');
const {
  getTokens,
  getToken,
  createToken,
  updateToken,
  deleteToken,
  generateCode,
  generateQRCode
} = require('../controllers/tokens');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Alle Routen schützen
router.use(protect);

router
  .route('/')
  .get(getTokens)
  .post(createToken);

router
  .route('/:id')
  .get(getToken)
  .put(updateToken)
  .delete(deleteToken);

router.get('/:id/code', generateCode);
router.get('/:id/qrcode', generateQRCode);

module.exports = router;
