const express = require('express');
const router = express.Router();
const controller = require('./estado_unidad.controller');
const auth = require('../../../middlewares/auth');
const rbac = require('../../../middlewares/rbac');
const validate = require('../../../middlewares/validate');
const schemas = require('./estado_unidad.schema');

router.use(auth);

router.get('/', rbac('catalogos:ver'), controller.listar);
router.get('/:id', rbac('catalogos:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('catalogos:crear'), validate({ body: schemas.crearEstadoUnidadSchema }), controller.crear);
router.put('/:id', rbac('catalogos:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarEstadoUnidadSchema }), controller.actualizar);
router.delete('/:id', rbac('catalogos:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;