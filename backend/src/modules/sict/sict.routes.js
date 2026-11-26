const express = require('express');
const router = express.Router();
const controller = require('./sict.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./sict.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/',rbac(['sict:ver', 'unidades:ver']),validate({ query: schemas.filtrosSictSchema }),controller.listar);
router.get('/:id', rbac(['sict:ver', 'unidades:ver']), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('sict:crear'), validate({ body: schemas.crearSictSchema }), controller.crear);
router.put('/:id', rbac('sict:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarSictSchema }), controller.actualizar);
router.delete('/:id', rbac('sict:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;