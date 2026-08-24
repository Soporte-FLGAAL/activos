const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const validate = require('../../middlewares/validate');
const { loginSchema, refreshSchema } = require('./auth.schema');

router.post('/login', validate({ body: loginSchema }), controller.login);
router.post('/refresh', validate({ body: refreshSchema }), controller.refreshToken);

module.exports = router;