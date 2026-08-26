const express = require('express');
const router = express.Router();
const controller = require('./roles.controller');
const auth = require('../../middlewares/auth');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./roles.schema');

router.use(auth);

router.get('/', rbac('roles:ver'), controller.listar);
router.get('/:id', rbac('roles:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('roles:crear'), validate({ body: schemas.crearRolSchema }), controller.crear);
router.put('/:id', rbac('roles:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarRolSchema }), controller.actualizar);
router.delete('/:id', rbac('roles:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;