const express = require('express');
const router = express.Router();
const controller = require('./responsables_aseguradoras.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./responsables_aseguradoras.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/', rbac('responsables_aseguradoras:ver'), controller.listar);
router.get('/:id', rbac('responsables_aseguradoras:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('responsables_aseguradoras:crear'), validate({ body: schemas.crearResponsableSchema }), controller.crear);
router.put('/:id', rbac('responsables_aseguradoras:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarResponsableSchema }), controller.actualizar);
router.delete('/:id', rbac('responsables_aseguradoras:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;