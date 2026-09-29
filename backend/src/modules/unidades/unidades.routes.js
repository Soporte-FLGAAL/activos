const express = require('express');
const router = express.Router();
const controller = require('./unidades.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./unidades.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/', rbac('unidades:ver'), validate({ query: schemas.filtrosUnidadesSchema }), controller.listar);
router.get('/empresa/:empresaId/total', rbac('unidades:ver'), controller.totalPorEmpresa);
router.get('/empresa/:empresaId/resumen', rbac('unidades:ver'), controller.resumenPorEmpresa);
router.get('/:id', rbac('unidades:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('unidades:crear'), validate({ body: schemas.crearUnidadSchema }), controller.crear);
router.put('/:id', rbac('unidades:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarUnidadSchema }), controller.actualizar);
router.patch('/:id/campo', rbac('unidades:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarCampoSchema }), controller.actualizarCampo);
router.patch('/:id/cambiar-empresa', rbac('unidades:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.cambiarEmpresaSchema }), controller.cambiarEmpresa);
router.delete('/:id', rbac('unidades:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;