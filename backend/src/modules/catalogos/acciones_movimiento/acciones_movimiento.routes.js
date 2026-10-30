const express = require('express');
const router = express.Router();
const controller = require('./acciones_movimiento.controller');
const auth = require('../../../middlewares/auth');
const rbac = require('../../../middlewares/rbac');
const validate = require('../../../middlewares/validate');
const schemas = require('./acciones_movimiento.schema');

const setEmpresa = require('../../../middlewares/setEmpresa');

router.use(auth);
router.use(setEmpresa);

router.get('/', rbac('catalogos:ver'), controller.listar);
router.get('/:id', rbac('catalogos:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('catalogos:crear'), validate({ body: schemas.crearAccionMovimientoSchema }), controller.crear);
router.put('/:id', rbac('catalogos:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarAccionMovimientoSchema }), controller.actualizar);
router.delete('/:id', rbac('catalogos:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;