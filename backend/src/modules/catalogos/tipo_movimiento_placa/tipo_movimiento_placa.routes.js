const express = require('express');
const router = express.Router();
const controller = require('./tipo_movimiento_placa.controller');
const auth = require('../../../middlewares/auth');
const rbac = require('../../../middlewares/rbac');
const validate = require('../../../middlewares/validate');
const schemas = require('./tipo_movimiento_placa.schema');

router.use(auth);

router.get('/', rbac(['catalogos:ver', 'unidades:ver']), controller.listar);
router.get('/:id', rbac(['catalogos:ver', 'unidades:ver']), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('catalogos:crear'), validate({ body: schemas.crearTipoMovimientoPlacaSchema }), controller.crear);
router.put('/:id', rbac('catalogos:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarTipoMovimientoPlacaSchema }), controller.actualizar);
router.delete('/:id', rbac('catalogos:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;