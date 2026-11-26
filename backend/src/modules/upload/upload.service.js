const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
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

  async puedeAccederPorEmpresa(archivo, empresaId) {
    if (!archivo || !empresaId) return false;

    // Si el archivo sigue ligado a un registro, la empresa autorizada es la
    // empresa actual de ese registro, no necesariamente la que lo subió.
    const tieneReferencias = await uploadRepository.hasDocumentReference(archivo.Arc_uuid);
    if (tieneReferencias) {
      return uploadRepository.isReferencedByCompany(archivo.Arc_uuid, empresaId);
    }

    // Compatibilidad para archivos registrados que aún no tienen referencia
    // directa en las columnas documentales.
    return Number(archivo.Arc_empresa) === Number(empresaId);
  }

  async eliminarSiNoReferenciado(uuid, empresaId, esAdminGlobal, usuarioId) {
    let originalPath = null;
    let quarantinePath = null;

    try {
      const result = await withTransaction(async (connection) => {
        const archivo = await uploadRepository.findByUuid(uuid, connection, true);
        if (!archivo) return { deleted: false, reason: 'not_found' };

        if (!esAdminGlobal) {
          const empresaValida = empresaId != null && (
            Number(archivo.Arc_empresa) === Number(empresaId) ||
            await uploadRepository.isReferencedByCompany(uuid, empresaId, connection)
          );
          if (!empresaValida) return { deleted: false, reason: 'forbidden' };
        }

        const referenced = await uploadRepository.hasDocumentReference(uuid, connection);
        if (referenced) return { deleted: false, reason: 'referenced' };

        const fullPath = this.rutaAbsoluta(archivo);
        if (!fullPath) throw new Error('La ruta del archivo está fuera del almacenamiento permitido.');

        if (fs.existsSync(fullPath)) {
          originalPath = fullPath;
          quarantinePath = path.join(
            path.dirname(fullPath),
            `.${path.basename(fullPath)}.deleting-${crypto.randomUUID()}`
          );
          await fs.promises.rename(fullPath, quarantinePath);
        }

        await uploadRepository.delete(archivo.Arc_id, connection);
        await registrarMovimiento(
          'Archivos',
          archivo.Arc_id,
          'DELETE',
          {
            uuid,
            tipo: archivo.Arc_tipo,
            nombre: archivo.Arc_nombre_original,
            ruta: archivo.Arc_ruta,
          },
          usuarioId,
          connection
        );

        return { deleted: true };
      });

      if (result.deleted && quarantinePath) {
        try {
          await fs.promises.unlink(quarantinePath);
        } catch (cleanupError) {
          // La referencia y el registro ya se eliminaron; dejar constancia para limpieza operativa.
          console.error('No se pudo retirar el archivo en cuarentena:', cleanupError);
          result.cleanupPending = true;
        }
      }
      return result;
    } catch (error) {
      // Si la transacción falla (incluido el COMMIT), devolver el archivo a su ruta original.
      if (quarantinePath && originalPath && fs.existsSync(quarantinePath) && !fs.existsSync(originalPath)) {
        await fs.promises.rename(quarantinePath, originalPath).catch((restoreError) => {
          console.error('No se pudo restaurar el archivo después del rollback:', restoreError);
        });
      }
      throw error;
    }
  }
}

module.exports = new UploadService();