const express = require('express');
const router = express.Router();
const controller = require('./polizas.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./polizas.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/', rbac(['polizas:ver', 'unidades:ver']), validate({ query: schemas.filtrosPolizaSchema }), controller.listar);
router.get('/:id', rbac(['polizas:ver', 'unidades:ver']), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('polizas:crear'), validate({ body: schemas.crearPolizaSchema }), controller.crear);
router.post('/crear-con-endosos', rbac('polizas:crear'), validate({ body: schemas.crearPolizaConEndososSchema }), controller.crearConEndosos);
router.put('/:id', rbac('polizas:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarPolizaSchema }), controller.actualizar);
router.patch('/:id/url', rbac('polizas:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarUrlSchema }), controller.actualizarUrl);
router.delete('/:id', rbac('polizas:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;