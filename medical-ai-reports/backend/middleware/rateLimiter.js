const rateLimit = require('express-rate-limit');

// Allgemeines Rate Limit
exports.general = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // max 100 Requests
  message: 'Zu viele Anfragen, bitte später erneut versuchen'
});

// Strengeres Limit für Auth-Endpoints
exports.auth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // max 5 Login-Versuche
  skipSuccessfulRequests: true,
  message: 'Zu viele Login-Versuche, bitte später erneut versuchen'
});

// Limit für KI-Anfragen
exports.ai = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 20, // max 20 KI-Berichte pro Stunde
  message: 'KI-Limit erreicht, bitte später erneut versuchen'
});
