const db = require('../../config/database');

class ResponsablesAseguradorasRepository {
  async findAll(aseguradoraId = null) {
    let sql = `
      SELECT ra.*, a.Ase_nombre AS aseguradora_nombre, e.Emp_nombre AS empresa_nombre
      FROM Responsables_Aseguradoras ra
      JOIN Aseguradoras a ON ra.RA_aseguradora = a.Ase_id
      LEFT JOIN Empresas e ON ra.RA_empresa_responsable = e.Emp_id
    `;
    const params = [];
    if (aseguradoraId) {
      sql += ' WHERE ra.RA_aseguradora = ?';
      params.push(aseguradoraId);
    }
    sql += ' ORDER BY ra.RA_id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT ra.*, a.Ase_nombre AS aseguradora_nombre, e.Emp_nombre AS empresa_nombre
       FROM Responsables_Aseguradoras ra
       JOIN Aseguradoras a ON ra.RA_aseguradora = a.Ase_id
       LEFT JOIN Empresas e ON ra.RA_empresa_responsable = e.Emp_id
       WHERE ra.RA_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Responsables_Aseguradoras SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Responsables_Aseguradoras SET ? WHERE RA_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Responsables_Aseguradoras WHERE RA_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new ResponsablesAseguradorasRepository();