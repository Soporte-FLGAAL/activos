const express = require('express');
const router = express.Router();
const controller = require('./upload.controller');
const auth = require('../../middlewares/auth');
const setEmpresa = require('../../middlewares/setEmpresa');
const upload = require('../../config/multer');
const uploadErrorHandler = require('../../middlewares/uploadErrorHandler');

router.use(auth);
router.use(setEmpresa);

router.post('/', upload.single('archivo'), uploadErrorHandler, controller.subir);
router.get('/unit/:unidadId/:tipo', controller.descargarDeUnidad);
router.get('/:uuid', controller.descargar);

module.exports = router;