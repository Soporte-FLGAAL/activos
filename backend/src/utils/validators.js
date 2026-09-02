const db = require('../config/database');

/**
 * Verifica si un registro existe en una tabla y campo específico.
 * @param {string} tabla - Nombre de la tabla.
 * @param {string} campoId - Nombre del campo ID (ej: 'Emp_id').
 * @param {number} id - Valor a buscar.
 * @returns {boolean} true si existe.
 */
async function existeRegistro(tabla, campoId, id) {
  const query = `SELECT 1 FROM ${tabla} WHERE ${campoId} = ? LIMIT 1`;
  const [rows] = await db.query(query, [id]);
  return rows.length > 0;
}

module.exports = { existeRegistro };