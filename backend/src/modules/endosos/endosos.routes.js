const express = require('express');
const router = express.Router();
const controller = require('./endosos.controller');
const auth = require('../../middlewares/auth');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./endosos.schema');

router.use(auth);

router.get('/', rbac('endosos:ver'), controller.listar);
router.get('/:id', rbac('endosos:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('endosos:crear'), validate({ body: schemas.crearEndosoSchema }), controller.crear);
router.put('/:id', rbac('endosos:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarEndosoSchema }), controller.actualizar);
router.delete('/:id', rbac('endosos:eliminar'), validate({ params: schemas.paramsIdSchema }), controller.eliminar);

module.exports = router;