const db = require('../../config/database');

class EmpresasRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Empresas');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Empresas WHERE Emp_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Empresas SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Empresas SET ? WHERE Emp_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Empresas WHERE Emp_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new EmpresasRepository();