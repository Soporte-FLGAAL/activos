const express = require('express');
const router = express.Router();
const controller = require('./usuarios.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const rbac = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const schemas = require('./usuarios.schema');

router.use(auth);
router.use(setEmpresa);

router.get('/', rbac('usuarios:ver'), controller.listar);
router.get('/:id', rbac('usuarios:ver'), validate({ params: schemas.paramsIdSchema }), controller.obtener);
router.post('/', rbac('usuarios:crear'), validate({ body: schemas.crearUsuarioSchema }), controller.crear);
router.put('/:id', rbac('usuarios:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.actualizarUsuarioSchema }), controller.actualizar);

//Reactivar
router.patch('/:id/reactivar', rbac('usuarios:editar'), validate({ params: schemas.paramsIdSchema }), controller.reactivar);

//Contraseñas
router.post('/cambiar-password', validate({ body: schemas.cambiarPasswordSchema }), controller.cambiarPasswordPropio);
router.post('/:id/cambiar-password-admin', rbac('usuarios:editar'), validate({ params: schemas.paramsIdSchema, body: schemas.adminCambiarPasswordSchema }), controller.adminCambiarPassword);

// Desactivar (soft delete) — normal
router.patch('/:id/desactivar', rbac('usuarios:editar'), validate({ params: schemas.paramsIdSchema }), controller.desactivar);
// Eliminar definitivamente — solo ADMIN_GLOBAL
router.delete('/:id', validate({ params: schemas.paramsIdSchema }), controller.eliminarDefinitivo);

module.exports = router;