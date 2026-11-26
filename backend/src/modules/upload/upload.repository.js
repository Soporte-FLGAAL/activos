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

  async isReferencedByCompany(uuid, empresaId, connection = null) {
    const dbConn = connection || db;
    const marker = `/upload/${uuid}`;
    const [rows] = await dbConn.query(
      `SELECT 1
       FROM Unidades u
       WHERE (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?)
         AND (
           LOCATE(?, COALESCE(u.Uni_factura_url, '')) > 0 OR
           LOCATE(?, COALESCE(u.Uni_url_verificacion_mecanica, '')) > 0 OR
           LOCATE(?, COALESCE(u.Uni_url_verificacion_contaminantes, '')) > 0
         )
       UNION ALL
       SELECT 1
       FROM Tarjeta_circulacion tc
       INNER JOIN Unidades u ON u.Uni_id = tc.TC_unidad_id
       WHERE (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?)
         AND (
           LOCATE(?, COALESCE(tc.TC_url, '')) > 0 OR
           LOCATE(?, COALESCE(tc.TC_url_reposicion, '')) > 0
         )
       UNION ALL
       SELECT 1
       FROM Polizas p
       INNER JOIN Unidades u ON u.Uni_id = p.Pol_unidad_id
       WHERE (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?) AND LOCATE(?, COALESCE(p.Pol_url, '')) > 0
       UNION ALL
       SELECT 1
       FROM Endoso e
       INNER JOIN Polizas p ON p.Pol_id = e.End_poliza
       INNER JOIN Unidades u ON u.Uni_id = p.Pol_unidad_id
       WHERE (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?) AND LOCATE(?, COALESCE(e.End_url, '')) > 0
       UNION ALL
       SELECT 1
       FROM Inciso i
       INNER JOIN Endoso e ON e.End_id = i.Inc_endoso
       INNER JOIN Polizas p ON p.Pol_id = e.End_poliza
       INNER JOIN Unidades u ON u.Uni_id = p.Pol_unidad_id
       WHERE (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?) AND LOCATE(?, COALESCE(i.Inc_url, '')) > 0
       UNION ALL
       SELECT 1
       FROM Doble_articulado d
       INNER JOIN Unidades u ON u.Uni_id = d.PDA_unidad_id
       WHERE (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?) AND LOCATE(?, COALESCE(d.PDA_url, '')) > 0
       UNION ALL
       SELECT 1
       FROM SICT s
       INNER JOIN Unidades u ON u.Uni_id = s.SICT_unidad_id
       WHERE (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?) AND LOCATE(?, COALESCE(s.SICT_url, '')) > 0
       UNION ALL
       SELECT 1
       FROM Detalle_placas dp
       INNER JOIN Placas p ON p.Pla_id = dp.DP_placas_id
       WHERE (
         p.Pla_empresa_actual = ? OR EXISTS (
           SELECT 1 FROM Tarjeta_circulacion tc
           INNER JOIN Unidades u ON u.Uni_id = tc.TC_unidad_id
           WHERE tc.TC_placas_id = p.Pla_id AND u.Uni_propietario = ?
         )
       ) AND LOCATE(?, COALESCE(dp.DP_url, '')) > 0
       LIMIT 1`,
      [
        empresaId, empresaId, marker, marker, marker,
        empresaId, empresaId, marker, marker,
        empresaId, empresaId, marker,
        empresaId, empresaId, marker,
        empresaId, empresaId, marker,
        empresaId, empresaId, marker,
        empresaId, empresaId, marker,
        empresaId, empresaId, marker,
      ]
    );
    return rows.length > 0;
  }

  async transferUnsharedFilesForUnit(unidadId, empresaDestinoId, connection = null) {
    const dbConn = connection || db;
    const [documents] = await dbConn.query(
      `SELECT Uni_factura_url AS url FROM Unidades WHERE Uni_id = ?
       UNION ALL SELECT Uni_url_verificacion_mecanica FROM Unidades WHERE Uni_id = ?
       UNION ALL SELECT Uni_url_verificacion_contaminantes FROM Unidades WHERE Uni_id = ?
       UNION ALL SELECT tc.TC_url FROM Tarjeta_circulacion tc WHERE tc.TC_unidad_id = ?
       UNION ALL SELECT tc.TC_url_reposicion FROM Tarjeta_circulacion tc WHERE tc.TC_unidad_id = ?
       UNION ALL SELECT p.Pol_url FROM Polizas p WHERE p.Pol_unidad_id = ?
       UNION ALL SELECT e.End_url FROM Endoso e
         INNER JOIN Polizas p ON p.Pol_id = e.End_poliza
         WHERE p.Pol_unidad_id = ?
       UNION ALL SELECT i.Inc_url FROM Inciso i
         INNER JOIN Endoso e ON e.End_id = i.Inc_endoso
         INNER JOIN Polizas p ON p.Pol_id = e.End_poliza
         WHERE p.Pol_unidad_id = ?
       UNION ALL SELECT d.PDA_url FROM Doble_articulado d WHERE d.PDA_unidad_id = ?
       UNION ALL SELECT s.SICT_url FROM SICT s WHERE s.SICT_unidad_id = ?
       UNION ALL SELECT dp.DP_url FROM Detalle_placas dp
         WHERE dp.DP_placas_id IN (
           SELECT DISTINCT tc.TC_placas_id
           FROM Tarjeta_circulacion tc
           WHERE tc.TC_unidad_id = ?
         )`,
      Array(11).fill(unidadId)
    );

    const uuids = new Set();
    for (const document of documents) {
      const matches = String(document.url || '').matchAll(/\/upload\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?:[/?#]|$)/gi);
      for (const match of matches) uuids.add(match[1].toLowerCase());
    }

    const reassigned = [];
    for (const uuid of uuids) {
      const marker = `/upload/${uuid}`;
      const [externalReferences] = await dbConn.query(
        `SELECT 1 FROM Unidades u
         WHERE u.Uni_id <> ?
           AND (
             LOCATE(?, COALESCE(u.Uni_factura_url, '')) > 0 OR
             LOCATE(?, COALESCE(u.Uni_url_verificacion_mecanica, '')) > 0 OR
             LOCATE(?, COALESCE(u.Uni_url_verificacion_contaminantes, '')) > 0
           )
         UNION ALL
         SELECT 1 FROM Tarjeta_circulacion tc
         WHERE tc.TC_unidad_id <> ?
           AND (
             LOCATE(?, COALESCE(tc.TC_url, '')) > 0 OR
             LOCATE(?, COALESCE(tc.TC_url_reposicion, '')) > 0
           )
         UNION ALL
         SELECT 1 FROM Polizas p
         WHERE p.Pol_unidad_id <> ? AND LOCATE(?, COALESCE(p.Pol_url, '')) > 0
         UNION ALL
         SELECT 1 FROM Endoso e
         INNER JOIN Polizas p ON p.Pol_id = e.End_poliza
         WHERE p.Pol_unidad_id <> ? AND LOCATE(?, COALESCE(e.End_url, '')) > 0
         UNION ALL
         SELECT 1 FROM Inciso i
         INNER JOIN Endoso e ON e.End_id = i.Inc_endoso
         INNER JOIN Polizas p ON p.Pol_id = e.End_poliza
         WHERE p.Pol_unidad_id <> ? AND LOCATE(?, COALESCE(i.Inc_url, '')) > 0
         UNION ALL
         SELECT 1 FROM Doble_articulado d
         WHERE d.PDA_unidad_id <> ? AND LOCATE(?, COALESCE(d.PDA_url, '')) > 0
         UNION ALL
         SELECT 1 FROM SICT s
         WHERE s.SICT_unidad_id <> ? AND LOCATE(?, COALESCE(s.SICT_url, '')) > 0
         UNION ALL
         SELECT 1 FROM Detalle_placas dp
         WHERE dp.DP_placas_id NOT IN (
           SELECT DISTINCT tc.TC_placas_id
           FROM Tarjeta_circulacion tc
           WHERE tc.TC_unidad_id = ?
         )
           AND LOCATE(?, COALESCE(dp.DP_url, '')) > 0
         LIMIT 1`,
        [
          unidadId, marker, marker, marker,
          unidadId, marker, marker,
          unidadId, marker,
          unidadId, marker,
          unidadId, marker,
          unidadId, marker,
          unidadId, marker,
          unidadId, marker,
        ]
      );
      if (externalReferences.length > 0) continue;

      const [updateResult] = await dbConn.query(
        'UPDATE Archivos SET Arc_empresa = ? WHERE Arc_uuid = ?',
        [empresaDestinoId, uuid]
      );
      if (updateResult.affectedRows > 0) reassigned.push(uuid);
    }

    return reassigned;
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