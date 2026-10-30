const express = require('express');
const router = express.Router();
const controller = require('./aseguradoras.controller');
const auth = require('../../middlewares/auth');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./aseguradoras.schema');

const setEmpresa = require('../../middlewares/setEmpresa');

router.use(auth);
router.use(setEmpresa);

router.get('/', rbac('aseguradoras:ver'), controller.listar);
router.get('/:id', rbac('aseguradoras:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('aseguradoras:crear'), validate({ body: schemas.crearAseguradoraSchema }), controller.crear);
router.put('/:id', rbac('aseguradoras:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarAseguradoraSchema }), controller.actualizar);
router.delete('/:id', rbac('aseguradoras:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;