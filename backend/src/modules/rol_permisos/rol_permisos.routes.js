const express = require('express');
const router = express.Router();
const controller = require('./rol_permisos.controller');
const auth = require('../../middlewares/auth');
const requireAdminGlobal = require('../../middlewares/requireAdminGlobal');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const { asignarPermisoSchema, paramsSchema } = require('./rol_permisos.schema');

router.use(auth);
router.use(requireAdminGlobal);
router.use(setEmpresa);

router.get('/rol/:rolId', rbac('roles:ver'), controller.listarPermisosDeRol);
router.post('/', rbac('roles:editar'), validate({ body: asignarPermisoSchema }), controller.asignarPermiso);
router.delete('/:rolId/:permisoId', rbac('roles:editar'), validate({ params: paramsSchema }), controller.quitarPermiso);

module.exports = router;