const db = require('../config/database');

/**
 * Ejecuta una serie de operaciones dentro de una transacción.
 * @param {Function} callback - Función que recibe una conexión y realiza las operaciones.
 * @returns {Promise<any>} Resultado del callback.
 */
async function withTransaction(callback) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { withTransaction };