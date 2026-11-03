const express = require('express');
const router = express.Router();
const controller = require('./detalle_placas.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./detalle_placas.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/',rbac(['detalle_placas:ver', 'unidades:ver']),validate({ query: schemas.filtrosDetallePlacasSchema }),controller.listar);
router.get('/:id', rbac(['detalle_placas:ver', 'unidades:ver']), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac(['detalle_placas:crear', 'unidades:editar']), validate({ body: schemas.crearDetallePlacaSchema }), controller.crear);
router.put('/:id', rbac(['detalle_placas:editar', 'unidades:editar']), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarDetallePlacaSchema }), controller.actualizar);
router.delete('/:id', rbac(['detalle_placas:eliminar', 'unidades:eliminar']), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;