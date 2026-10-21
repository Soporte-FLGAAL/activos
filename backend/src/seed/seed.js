require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../config/database');

/**
 * Inserta un registro si no existe.
 * @param {object} connection - conexión de la transacción
 * @param {string} table - nombre de la tabla
 * @param {string} whereColumn - columna para verificar existencia
 * @param {any} whereValue - valor a buscar
 * @param {object} insertData - datos a insertar
 * @returns {Promise<{inserted: boolean, insertId?: number}>}
 */
async function insertarSiNoExiste(connection, table, whereColumn, whereValue, insertData) {
  const [existing] = await connection.query(
    `SELECT 1 FROM ${table} WHERE ${whereColumn} = ? LIMIT 1`,
    [whereValue]
  );
  if (existing.length > 0) return { inserted: false };

  const columns = Object.keys(insertData);
  const values = Object.values(insertData);
  const placeholders = columns.map(() => '?').join(', ');

  const [result] = await connection.query(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  );
  return { inserted: true, insertId: result.insertId };
}

async function seed() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    console.log('🌱 Iniciando seed...\n');

    // =========================================================
    // 1. Acciones_movimiento
    // =========================================================
    for (const nombre of ['INSERT', 'UPDATE', 'DELETE']) {
      await insertarSiNoExiste(connection, 'Acciones_movimiento', 'AcM_nombre', nombre, {
        AcM_nombre: nombre,
      });
    }
    console.log('  ✓ Acciones_movimiento');

    // =========================================================
    // 2. Combustible
    // =========================================================
    for (const nombre of ['GASOLINA', 'DIESEL']) {
      await insertarSiNoExiste(connection, 'Combustible', 'Com_nombre', nombre, {
        Com_nombre: nombre,
      });
    }
    console.log('  ✓ Combustible');

    // =========================================================
    // 3. Estado_unidad
    // =========================================================
    for (const estado of ['NUEVA', 'RENTA', 'PRESTADA']) {
      await insertarSiNoExiste(connection, 'Estado_unidad', 'EsU_estado', estado, {
        EsU_estado: estado,
      });
    }
    console.log('  ✓ Estado_unidad');

    // =========================================================
    // 4. Periodos
    // =========================================================
    for (const nombre of ['MENSUAL', 'SEMESTRAL', 'ANUAL']) {
      await insertarSiNoExiste(connection, 'Periodos', 'Per_nombre', nombre, {
        Per_nombre: nombre,
      });
    }
    console.log('  ✓ Periodos');

    // =========================================================
    // 5. Tipo_tarjeta
    // =========================================================
    for (const nombre of ['FEDERAL', 'ESTATAL']) {
      await insertarSiNoExiste(connection, 'Tipo_tarjeta', 'TpT_nombre', nombre, {
        TpT_nombre: nombre,
      });
    }
    console.log('  ✓ Tipo_tarjeta');

    // =========================================================
    // 6. Tipo_unidad
    // =========================================================
    const tiposUnidad = [
      { nombre: 'PORTAS', corto: 'PORTAS' },
      { nombre: 'TANQUES', corto: 'TQS' },
      { nombre: 'DOLLYS', corto: 'DOLLYS' },
      { nombre: 'CAJAS', corto: 'CAJAS' },
    ];
    for (const tu of tiposUnidad) {
      await insertarSiNoExiste(connection, 'Tipo_unidad', 'TpU_nombre', tu.nombre, {
        TpU_nombre: tu.nombre,
        TpU_nombre_corto: tu.corto,
      });
    }
    console.log('  ✓ Tipo_unidad');

    // =========================================================
    // 7. Empresas
    // =========================================================
    const empresas = [
      {
        nombre: 'Fletera de Liquidos GAAL SA de CV',
        direccion: 'CARR SALAMANCA JUVENTINO ROSAS KM 0.5 C, SALAMANCA GTO',
        corto: 'GAAL',
        rfc: 'FLG071219JR6',
      },
      {
        nombre: 'Beaver Trailers de México S.A. de C.V.',
        direccion: 'CARR SALAMANCA JUVENTINO ROSAS KM 0.5 D, SALAMANCA GTO',
        corto: 'BEAVER',
        rfc: 'BTM091204340',
      },
      {
        nombre: 'Eurotrack SA de CV',
        direccion: 'CARR SALAMANCA JUVENTINO ROSAS KM 0.5 E, SALAMANCA GTO',
        corto: 'EUROTRACK',
        rfc: 'EUR991011GC7',
      },
      {
        nombre: 'Alonso Solares Transportes Logísticos SA de CV',
        direccion: 'PANUCO 1001, COL BELLAVISTA, SALAMANCA GTO',
        corto: 'ASTRAL',
        rfc: 'AST200529MUA',
      },
      {
        nombre: 'Alonso Solares Transportes SA de CV',
        direccion: 'JOSE VASCONCELOS NO. 316 INT B SALAMANCA GTO',
        corto: 'ASTRA',
        rfc: 'AST200511LX0',
      },
      {
        nombre: 'Combustibles Líquidos de Mexico SA de CV',
        direccion: 'JOSE VASCONCELOS NO. 30',
        corto: 'COMLI',
        rfc: 'CLI970116C93',
      },
      {
        nombre: 'Transportes San Patricio SA de CV',
        direccion: 'PENDIENTE',
        corto: 'TSP',
        rfc: 'TSP171129EH8',
      },
      {
        nombre: 'Energreen MX SA de CV',
        direccion: 'JOSE VASONCELOS 306',
        corto: 'ENERGREEN',
        rfc: 'EMX260325DD9',
      },
      {
        nombre: 'Arrendadora de Recursos Mexicanos SA de CV',
        direccion: 'JOSE VASCONCELOS 314',
        corto: 'ARM',
        rfc: 'ARM231006RL3',
      },
    ];
    for (const e of empresas) {
      await insertarSiNoExiste(connection, 'Empresas', 'Emp_rfc', e.rfc, {
        Emp_nombre: e.nombre,
        Emp_direccion: e.direccion,
        Emp_nombre_corto: e.corto,
        Emp_rfc: e.rfc,
      });
    }
    console.log('  ✓ Empresas');

    // =========================================================
    // 8. Roles (prerrequisito para asignar ADMIN_GLOBAL a usuarios)
    // =========================================================
    for (const nombre of ['ADMIN_GLOBAL', 'ADMIN', 'GESTOR', 'CONSULTA']) {
      await insertarSiNoExiste(connection, 'Roles', 'Rol_nombre', nombre, {
        Rol_nombre: nombre,
      });
    }
    console.log('  ✓ Roles');

    // Obtener el rol ADMIN_GLOBAL
    const [rolRows] = await connection.query(
      'SELECT Rol_id FROM Roles WHERE Rol_nombre = ?',
      ['ADMIN_GLOBAL']
    );
    const adminGlobalRolId = rolRows[0].Rol_id;

    // Obtener la primera empresa (para la asignación por defecto de los admin_global)
    const [empresaRows] = await connection.query(
      'SELECT Emp_id FROM Empresas ORDER BY Emp_id LIMIT 1'
    );
    const primeraEmpresaId = empresaRows[0].Emp_id;

    // =========================================================
    // 9. Usuarios ADMIN_GLOBAL
    // =========================================================
    const usuarios = [
      {
        nombres: 'Angelina',
        paterno: 'Meza',
        materno: 'Muñoz',
        telefono: '4646517069',
        correo: 'ameza@flgaal.com',
        password: 'Az.8246#@',
      },
      {
        nombres: 'Juan Antonio',
        paterno: 'Luna',
        materno: 'Bravo',
        telefono: '5541892700',
        correo: 'garce@flgaal.com',
        password: 'Jl.8246#@',
      },
      {
        nombres: 'Soporte',
        paterno: 'FLGAAL',
        materno: null,
        telefono: '3351942371',
        correo: 'soporte-ti@flgaal.com',
        password: 'T1.8246#@',
      },
    ];

    const usuariosCreados = [];

    for (const u of usuarios) {
      const [exist] = await connection.query(
        'SELECT Usu_id FROM Usuario WHERE Usu_correo = ?',
        [u.correo]
      );

      let usuarioId;
      if (exist.length === 0) {
        const hash = await bcrypt.hash(u.password, 10);
        const [result] = await connection.query(
          `INSERT INTO Usuario
            (Usu_nombres, Usu_ap_paterno, Usu_ap_materno, Usu_telefono, Usu_correo, Usu_password)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [u.nombres, u.paterno, u.materno, u.telefono, u.correo, hash]
        );
        usuarioId = result.insertId;
        usuariosCreados.push(u.correo);
      } else {
        usuarioId = exist[0].Usu_id;
      }

      // Asignar a la primera empresa como ADMIN_GLOBAL si no existe la asignación
      const [existAsig] = await connection.query(
        'SELECT 1 FROM Usuario_Empresas WHERE UE_usuario = ? AND UE_empresa = ?',
        [usuarioId, primeraEmpresaId]
      );
      if (existAsig.length === 0) {
        await connection.query(
          'INSERT INTO Usuario_Empresas (UE_usuario, UE_empresa, UE_rol) VALUES (?, ?, ?)',
          [usuarioId, primeraEmpresaId, adminGlobalRolId]
        );
      }
    }
    console.log('  ✓ Usuarios ADMIN_GLOBAL (3)');

    // =========================================================
    // Commit
    // =========================================================
    await connection.commit();

    console.log('\n✅ Seed completado correctamente.\n');
    console.log('─'.repeat(60));
    console.log('Usuarios ADMIN_GLOBAL:');
    for (const u of usuarios) {
      console.log(`  • ${u.nombres} ${u.paterno} <${u.correo}>`);
      console.log(`    Contraseña: ${u.password}`);
      console.log(`    Teléfono:  ${u.telefono}`);
    }
    console.log('─'.repeat(60));
    if (usuariosCreados.length > 0) {
      console.log(`\nNuevos usuarios creados: ${usuariosCreados.length}`);
    } else {
      console.log('\nLos usuarios ya existían. No se crearon duplicados.');
    }
    console.log('');

  } catch (err) {
    await connection.rollback();
    console.error('\n❌ Error en seed:', err.message);
    console.error(err);
    throw err;
  } finally {
    connection.release();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));