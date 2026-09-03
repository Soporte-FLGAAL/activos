const express = require('express');
const router = express.Router();
const controller = require('./usuario_empresas.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./usuario_empresas.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/usuario/:usuarioId', rbac('usuario_empresas:ver'), controller.listarPorUsuario);
router.get('/empresa/:empresaId', rbac('usuario_empresas:ver'), controller.listarPorEmpresa);
router.post('/', rbac('usuario_empresas:crear'), validate({ body: schemas.asignarUsuarioEmpresaSchema }), controller.asignar);
router.put('/:usuarioId/:empresaId', rbac('usuario_empresas:editar'), validate({ params: schemas.paramsSchema, body: schemas.actualizarRolSchema }), controller.actualizarRol);
router.delete('/:usuarioId/:empresaId', rbac('usuario_empresas:eliminar'), controller.eliminar);

module.exports = router;