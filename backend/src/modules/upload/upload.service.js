const path = require('path');
const fs = require('fs');
const uploadRepository = require('./upload.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');

const UPLOAD_DIR = path.join(__dirname, '../../../uploads');

class UploadService {
  async obtenerPorUuid(uuid) {
    return uploadRepository.findByUuid(uuid);
  }

  rutaAbsoluta(archivo) {
    const full = path.join(UPLOAD_DIR, archivo.Arc_ruta);
    // path.relative() devuelve '' si son iguales, una ruta relativa si está dentro,
    // y una ruta con '..' si está fuera.
    const rel = path.relative(UPLOAD_DIR, full);
    if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
      return null;
    }
    return full;
  }

  /**
   * Registra el archivo en BD + auditoría dentro de una transacción.
   * Si algo falla, el llamador (controller) debe eliminar el archivo físico.
   */
  async registrarConAuditoria(file, tipo, empresaId, usuarioId) {
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

    const nuevoId = await withTransaction(async (connection) => {
      const id = await uploadRepository.create(dbData, connection);
      await registrarMovimiento(
        'Archivos',
        id,
        'INSERT',
        { uuid, tipo, nombre: file.originalname },
        usuarioId,
        connection
      );
      return id;
    });

    return uploadRepository.findById(nuevoId);
  }

  async eliminar(id) {
    const archivo = await uploadRepository.findById(id);
    if (!archivo) return false;

    return withTransaction(async (connection) => {
      await uploadRepository.delete(id, connection);

      const fullPath = this.rutaAbsoluta(archivo);
      if (fullPath && fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          // Si falla la eliminación física, hacemos rollback de la BD
          console.error('No se pudo eliminar el archivo físico:', err);
          throw new Error('No se pudo eliminar el archivo físico');
        }
      }
      return true;
    });
  }
}

module.exports = new UploadService();