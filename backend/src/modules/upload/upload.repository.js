const db = require('../../config/database');

class UploadRepository {
  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Archivos SET ?', data);
    return result.insertId;
  }

  async findByUuid(uuid, connection = null, forUpdate = false) {
    const dbConn = connection || db;
    const lockClause = forUpdate ? ' FOR UPDATE' : '';
    const [rows] = await dbConn.query(
      `SELECT * FROM Archivos WHERE Arc_uuid = ?${lockClause}`,
      [uuid]
    );
    return rows[0] || null;
  }

  async hasDocumentReference(uuid, connection = null) {
    const dbConn = connection || db;
    const marker = `/upload/${uuid}`;
    const references = [
      ['Unidades', 'Uni_factura_url'],
      ['Unidades', 'Uni_url_verificacion_mecanica'],
      ['Unidades', 'Uni_url_verificacion_contaminantes'],
      ['Detalle_placas', 'DP_url'],
      ['Tarjeta_circulacion', 'TC_url'],
      ['Tarjeta_circulacion', 'TC_url_reposicion'],
      ['Polizas', 'Pol_url'],
      ['Endoso', 'End_url'],
      ['Inciso', 'Inc_url'],
      ['Doble_articulado', 'PDA_url'],
      ['SICT', 'SICT_url'],
    ];

    for (const [table, column] of references) {
      const [rows] = await dbConn.query(
        `SELECT 1 FROM \`${table}\`
         WHERE LOCATE(?, COALESCE(\`${column}\`, '')) > 0
         LIMIT 1`,
        [marker]
      );
      if (rows.length > 0) return true;
    }
    return false;
  }

  async findById(id, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query(
      'SELECT * FROM Archivos WHERE Arc_id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async delete(id, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('DELETE FROM Archivos WHERE Arc_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new UploadRepository();