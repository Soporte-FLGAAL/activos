const express = require('express');
const router = express.Router();
const controller = require('./incisos.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./incisos.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/', rbac('incisos:ver'), controller.listar);
router.get('/:id', rbac('incisos:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('incisos:crear'), validate({ body: schemas.crearIncisoSchema }), controller.crear);
router.put('/:id', rbac('incisos:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarIncisoSchema }), controller.actualizar);
router.delete('/:id', rbac('incisos:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;