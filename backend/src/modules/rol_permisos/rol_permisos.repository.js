const db = require('../../config/database');

class RolPermisosRepository {
  async findPermisosByRol(rolId) {
    const [rows] = await db.query(
      `SELECT p.PerM_id, p.PerM_nombre 
       FROM Permisos p
       JOIN Rol_Permisos rp ON p.PerM_id = rp.RP_permiso
       WHERE rp.RP_rol = ?`,
      [rolId]
    );
    return rows;
  }

  async asignar(rolId, permisoId) {
    await db.query('INSERT INTO Rol_Permisos (RP_rol, RP_permiso) VALUES (?, ?)', [rolId, permisoId]);
  }

  async quitar(rolId, permisoId) {
    await db.query('DELETE FROM Rol_Permisos WHERE RP_rol = ? AND RP_permiso = ?', [rolId, permisoId]);
  }

  async existe(rolId, permisoId) {
    const [rows] = await db.query('SELECT 1 FROM Rol_Permisos WHERE RP_rol = ? AND RP_permiso = ?', [rolId, permisoId]);
    return rows.length > 0;
  }
}

module.exports = new RolPermisosRepository();