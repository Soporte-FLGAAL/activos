const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');  
const { loginSchema, refreshSchema } = require('./auth.schema');
const { loginLimiter } = require('../../middlewares/ratelimiter');

router.post('/login', loginLimiter, validate({ body: loginSchema }), controller.login);
router.post('/refresh', validate({ body: refreshSchema }), controller.refreshToken);
router.get('/me', auth, controller.me);
router.post('/logout', validate({ body: refreshSchema }), controller.logout);

module.exports = router;