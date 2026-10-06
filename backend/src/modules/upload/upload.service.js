const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const uploadRepository = require('./upload.repository');

const UPLOAD_DIR = path.join(__dirname, '../../../uploads');

class UploadService {
  async registrar(file, tipo, empresaId, usuarioId) {
    const uuid = path.basename(file.filename, path.extname(file.filename));
    const rutaRelativa = path.posix.join(tipo, file.filename);

    const dbData = {
      Arc_uuid: uuid,
      Arc_nombre_original: file.originalname,
      Arc_ruta: rutaRelativa,
      Arc_mime: file.mimetype,
      Arc_tamano: file.size,
      Arc_tipo: tipo,
      Arc_empresa: empresaId,
      Arc_subido_por: usuarioId,
    };

    const id = await uploadRepository.create(dbData);
    return uploadRepository.findById(id);
  }

  async obtenerPorUuid(uuid) {
    return uploadRepository.findByUuid(uuid);
  }

  /**
   * Retorna la ruta absoluta del archivo si existe.
   */
  rutaAbsoluta(archivo) {
    const full = path.join(UPLOAD_DIR, archivo.Arc_ruta);
    // Defensa extra: la ruta resuelta debe permanecer dentro de UPLOAD_DIR
    if (!path.resolve(full).startsWith(path.resolve(UPLOAD_DIR))) {
      return null;
    }
    return full;
  }

  async eliminar(id) {
    const archivo = await uploadRepository.findById(id);
    if (!archivo) return false;

    const fullPath = this.rutaAbsoluta(archivo);
    if (fullPath && fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return uploadRepository.delete(id);
  }
}

module.exports = new UploadService();