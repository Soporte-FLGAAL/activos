const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const unidadesRoutes = require('../modules/unidades/unidades.routes');
// ... otros módulos

router.use('/auth', authRoutes);
router.use('/unidades', unidadesRoutes);
// ... más rutas

module.exports = router;