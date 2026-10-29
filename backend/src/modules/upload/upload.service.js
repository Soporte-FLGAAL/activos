const path = require('path');
const fs = require('fs');
const env = require('../../config/env');
const uploadRepository = require('./upload.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');

const UPLOAD_DIR = path.join(__dirname, '../../../uploads');

class UploadService {
  async obtenerPorUuid(uuid) {
    return uploadRepository.findByUuid(uuid);
  }

  /**
   * Resuelve la ruta absoluta en la red y verifica que no haya path traversal.
   */
  rutaAbsoluta(archivo) {
    // archivo.Arc_ruta guardará algo como: "Polizas/poliza_123.pdf"
    const full = path.resolve(env.STORAGE_PATH, archivo.Arc_ruta);
    
    // Validar que la ruta final esté dentro de STORAGE_PATH
    const rel = path.relative(env.STORAGE_PATH, full);
    if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
      return null;
    }
    return full;
  }

  async registrarConAuditoria(file, tipo, rutaRelativa, empresaId, usuarioId) {
    const uuid = crypto.randomUUID();

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
        { uuid, tipo, nombre: file.originalname, ruta: rutaRelativa },
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