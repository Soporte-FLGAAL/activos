const { Router } = require('express');
const router = Router();

router.use('/unidades', require('../modules/unidades/unidades.routes'));
// router.use('/usuarios', require('../modules/usuarios/usuarios.routes'));
// router.use('/empresas', require('../modules/empresas/empresas.routes'));

module.exports = router;