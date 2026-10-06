const db = require('../../config/database');

class UploadRepository {
  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Archivos SET ?', data);
    return result.insertId;
  }

  async findByUuid(uuid, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query(
      'SELECT * FROM Archivos WHERE Arc_uuid = ?',
      [uuid]
    );
    return rows[0] || null;
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