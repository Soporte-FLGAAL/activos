const db = require('../../config/database');
const { hashPassword } = require('../../utils/password');

class UsuariosRepository {
  async findAll(filters = {}) {
    const { limit, offset } = filters;
    let sql = `SELECT Usu_id, Usu_nombres, Usu_ap_paterno, Usu_ap_materno, Usu_telefono, Usu_correo, Usu_status, Usu_fecha_creacion, Usu_ultimo_acceso
               FROM Usuario`;
    const params = [];

    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM Usuario');
    return rows[0].total;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT Usu_id, Usu_nombres, Usu_ap_paterno, Usu_ap_materno, Usu_telefono, Usu_correo, Usu_status, Usu_fecha_creacion, Usu_ultimo_acceso
       FROM Usuario WHERE Usu_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM Usuario WHERE Usu_correo = ?', [email]);
    return rows[0] || null;
  }

  async create(data) {
    const hashedPassword = await hashPassword(data.Usu_password);
    const [result] = await db.query('INSERT INTO Usuario SET ?', { ...data, Usu_password: hashedPassword });
    return this.findById(result.insertId);
  }

  async update(id, data) {
    if (data.Usu_password) {
      data.Usu_password = await hashPassword(data.Usu_password);
    }
    await db.query('UPDATE Usuario SET ? WHERE Usu_id = ?', [data, id]);
    return this.findById(id);
  }

  async updatePassword(id, newPassword) {
    const hashed = await hashPassword(newPassword);
    await db.query('UPDATE Usuario SET Usu_password = ? WHERE Usu_id = ?', [hashed, id]);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Usuario WHERE Usu_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new UsuariosRepository();