const rateLimit = require('express-rate-limit');

// Limitador para login: máximo 5 intentos por IP cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { success: false, message: 'Demasiados intentos de inicio de sesión. Intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador general para API: 100 peticiones por IP cada 15 minutos
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Demasiadas peticiones. Intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, apiLimiter };