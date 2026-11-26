const express = require('express');
const router = express.Router();
const controller = require('./doble_articulado.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./doble_articulado.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/',rbac(['permisos_especiales:ver', 'unidades:ver']),validate({ query: schemas.filtrosDobleArticuladoSchema }),controller.listar);
router.get('/:id', rbac(['permisos_especiales:ver', 'unidades:ver']), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('permisos_especiales:crear'), validate({ body: schemas.crearPermisoSchema }), controller.crear);
router.put('/:id', rbac('permisos_especiales:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarPermisoSchema }), controller.actualizar);
router.delete('/:id', rbac('permisos_especiales:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;