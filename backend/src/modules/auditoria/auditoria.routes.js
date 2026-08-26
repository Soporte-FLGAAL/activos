const express = require('express');
const router = express.Router();
const controller = require('./auditoria.controller');
const auth = require('../../middlewares/auth');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./auditoria.schema');

router.use(auth);

router.get('/', rbac('auditoria:ver'), validate({ query: schemas.filtrosMovimientosSchema }), controller.listar);
router.get('/:id', rbac('auditoria:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);

module.exports = router;