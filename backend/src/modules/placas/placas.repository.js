const db = require('../../config/database');

class PlacasRepository {
  async findAll(empresaId = null) {
    let sql = `
      SELECT p.*, e1.Emp_nombre AS propietario_nombre, e2.Emp_nombre AS empresa_nombre
      FROM Placas p
      LEFT JOIN Empresas e1 ON p.Pla_propietario = e1.Emp_id
      JOIN Empresas e2 ON p.Pla_empresa_actual = e2.Emp_id
    `;
    const params = [];
    if (empresaId) {
      sql += ' WHERE p.Pla_empresa_actual = ?';
      params.push(empresaId);
    }
    sql += ' ORDER BY p.Pla_id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, e1.Emp_nombre AS propietario_nombre, e2.Emp_nombre AS empresa_nombre
       FROM Placas p
       LEFT JOIN Empresas e1 ON p.Pla_propietario = e1.Emp_id
       JOIN Empresas e2 ON p.Pla_empresa_actual = e2.Emp_id
       WHERE p.Pla_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Placas SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Placas SET ? WHERE Pla_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Placas WHERE Pla_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new PlacasRepository();