const express = require('express');
const router = express.Router();
const controller = require('./placas.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./placas.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/', rbac('placas:ver'), validate({ query: schemas.filtrosPlacasSchema }), controller.listar);
router.get('/:id', rbac('placas:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('placas:crear'), validate({ body: schemas.crearPlacaSchema }), controller.crear);
router.post('/:id/actualizar-con-movimiento', rbac('placas:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarPlacaConMovimientoSchema }), controller.actualizarConMovimiento);
router.put('/:id', rbac('placas:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarPlacaSchema }), controller.actualizar);
router.delete('/:id', rbac('placas:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;
