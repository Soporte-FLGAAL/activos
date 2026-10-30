const express = require('express');
const router = express.Router();
const controller = require('./empresas.controller');
const auth = require('../../middlewares/auth');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./empresas.schema');

router.use(auth);

router.get('/', rbac('empresas:ver'), controller.listar);
router.get('/:id', rbac('empresas:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('empresas:crear'), validate({ body: schemas.crearEmpresaSchema }), controller.crear);
router.put('/:id', rbac('empresas:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarEmpresaSchema }), controller.actualizar);
router.delete('/:id', rbac('empresas:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;