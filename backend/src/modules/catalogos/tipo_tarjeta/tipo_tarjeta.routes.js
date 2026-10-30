const express = require('express');
const router = express.Router();
const controller = require('./tipo_tarjeta.controller');
const auth = require('../../../middlewares/auth');
const rbac = require('../../../middlewares/rbac');
const validate = require('../../../middlewares/validate');
const schemas = require('./tipo_tarjeta.schema');

const setEmpresa = require('../../../middlewares/setEmpresa');

router.use(auth);
router.use(setEmpresa);

router.get('/', rbac('catalogos:ver'), controller.listar);
router.get('/:id', rbac('catalogos:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('catalogos:crear'), validate({ body: schemas.crearTipoTarjetaSchema }), controller.crear);
router.put('/:id', rbac('catalogos:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarTipoTarjetaSchema }), controller.actualizar);
router.delete('/:id', rbac('catalogos:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;