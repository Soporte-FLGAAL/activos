const express = require('express');
const router = express.Router();
const controller = require('./cotejos.controller');
const auth = require('../../middlewares/auth');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./cotejos.schema');

router.use(auth);

router.get('/', rbac('cotejos:ver'), controller.listar);
router.get('/:id', rbac('cotejos:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('cotejos:crear'), validate({ body: schemas.crearCotejoSchema }), controller.crear);
router.put('/:id', rbac('cotejos:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarCotejoSchema }), controller.actualizar);
router.delete('/:id', rbac('cotejos:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;