const express = require('express');
const router = express.Router();
const controller = require('./permisos.controller');
const auth = require('../../middlewares/auth');
const requireAdminGlobal = require('../../middlewares/requireAdminGlobal');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./permisos.schema');

router.use(auth);
router.use(requireAdminGlobal);

router.get('/', rbac('permisos:ver'), controller.listar);
router.get('/:id', rbac('permisos:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('permisos:crear'), validate({ body: schemas.crearPermisoSchema }), controller.crear);
router.put('/:id', rbac('permisos:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarPermisoSchema }), controller.actualizar);
router.delete('/:id', rbac('permisos:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;