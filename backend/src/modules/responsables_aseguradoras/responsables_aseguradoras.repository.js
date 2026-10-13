const db = require('../../config/database');

class ResponsablesAseguradorasRepository {
  async findAll(filters = {}) {
    const { aseguradoraId, limit, offset } = filters;
    let sql = `
      SELECT ra.*, a.Ase_nombre AS aseguradora_nombre, e.Emp_nombre AS empresa_nombre
      FROM Responsables_Aseguradoras ra
      JOIN Aseguradoras a ON ra.RA_aseguradora = a.Ase_id
      LEFT JOIN Empresas e ON ra.RA_empresa_responsable = e.Emp_id
      WHERE 1=1
    `;
    const params = [];
    if (aseguradoraId) {
      sql += ' AND ra.RA_aseguradora = ?';
      params.push(aseguradoraId);
    }
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { aseguradoraId } = filters;
    let sql = 'SELECT COUNT(*) AS total FROM Responsables_Aseguradoras ra WHERE 1=1';
    const params = [];
    if (aseguradoraId) {
      sql += ' AND ra.RA_aseguradora = ?';
      params.push(aseguradoraId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query(
      `SELECT ra.*, a.Ase_nombre AS aseguradora_nombre, e.Emp_nombre AS empresa_nombre
       FROM Responsables_Aseguradoras ra
       JOIN Aseguradoras a ON ra.RA_aseguradora = a.Ase_id
       LEFT JOIN Empresas e ON ra.RA_empresa_responsable = e.Emp_id
       WHERE ra.RA_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Responsables_Aseguradoras SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data, connection = null) {
    const dbConn = connection || db;
    await dbConn.query('UPDATE Responsables_Aseguradoras SET ? WHERE RA_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('DELETE FROM Responsables_Aseguradoras WHERE RA_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new ResponsablesAseguradorasRepository();