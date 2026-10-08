const express = require('express');
const router = express.Router();
const controller = require('./usuario_empresas.controller');
const auth = require('../../middlewares/auth');
const rbac = require('../../middlewares/rbac');
const setEmpresa = require('../../middlewares/setEmpresa');
const validate = require('../../middlewares/validate');
const schemas = require('./usuario_empresas.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/', rbac('usuario_empresas:ver'), controller.listar);
router.post('/', rbac('usuario_empresas:crear'), validate({ body: schemas.asignarUsuarioEmpresaSchema }), controller.asignar);
router.put('/', rbac('usuario_empresas:editar'), validate({ body: schemas.actualizarRolSchema }), controller.actualizarRol);
router.delete('/:usuarioId/:empresaId', rbac('usuario_empresas:eliminar'), validate({ params: schemas.paramsSchema }), controller.eliminar);

module.exports = router;