const express = require('express');
const router = express.Router();
const controller = require('./tarjetas.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./tarjetas.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/',rbac('tarjetas:ver'),validate({ query: schemas.filtrosTarjetasSchema }),controller.listar);
router.get('/:id', rbac('tarjetas:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('tarjetas:crear'), validate({ body: schemas.crearTarjetaSchema }), controller.crear);
router.post('/crear-con-cotejos', rbac('tarjetas:crear'), validate({ body: schemas.crearTarjetaConCotejosSchema }), controller.crearConCotejos);
router.put('/:id', rbac('tarjetas:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarTarjetaSchema }), controller.actualizar);
router.patch('/:id/url', rbac('tarjetas:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarUrlSchema }), controller.actualizarUrl);
router.delete('/:id', rbac('tarjetas:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;