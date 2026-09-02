const express = require('express');
const router = express.Router();
const upload = require('../../config/multer');
const uploadErrorHandler = require('../../middlewares/uploadErrorHandler');
const auth = require('../../middlewares/auth');
const { success } = require('../../utils/response');

router.post('/', auth, upload.single('archivo'), uploadErrorHandler, (req, res) => {
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.body.tipo || 'general'}/${req.file.filename}`;
  return success(res, { url }, 'Archivo subido correctamente', 201);
});

module.exports = router;