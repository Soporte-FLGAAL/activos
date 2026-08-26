const db = require('../../config/database');

class AuthRepository {
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM Usuario WHERE Usu_correo = ? AND Usu_status = "ACTIVO"', [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Usuario WHERE Usu_id = ? AND Usu_status = "ACTIVO"', [id]);
    return rows[0] || null;
  }

  async updateLastAccess(id) {
    await db.query('UPDATE Usuario SET Usu_ultimo_acceso = NOW() WHERE Usu_id = ?', [id]);
  }
}

module.exports = new AuthRepository();