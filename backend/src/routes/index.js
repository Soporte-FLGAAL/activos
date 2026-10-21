const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('../modules/auth/auth.routes');
const usuariosRoutes = require('../modules/usuarios/usuarios.routes');
const usuariosEmpresasRoutes = require('../modules/usuario_empresas/usuario_empresas.routes')
const rolesRoutes = require('../modules/roles/roles.routes');
const permisosRoutes = require('../modules/permisos/permisos.routes');
const rolPermisosRoutes = require('../modules/rol_permisos/rol_permisos.routes');
const empresasRoutes = require('../modules/empresas/empresas.routes');
const unidadesRoutes = require('../modules/unidades/unidades.routes');
const aseguradorasRoutes = require('../modules/aseguradoras/aseguradoras.routes');
const polizasRoutes = require('../modules/polizas/polizas.routes');
const endososRoutes = require('../modules/endosos/endosos.routes');
const incisosRoutes = require('../modules/incisos/incisos.routes');
const placasRoutes = require('../modules/placas/placas.routes');
const detallePlacasRoutes = require('../modules/detalle_placas/detalle_placas.routes');
const tarjetasRoutes = require('../modules/tarjetas/tarjetas.routes');
const cotejosRoutes = require('../modules/cotejos/cotejos.routes');
const dobleArticuladoRoutes = require('../modules/doble_articulado/doble_articulado.routes');
const sictRoutes = require('../modules/sict/sict.routes');
const catalogoTipoUnidadRoutes = require('../modules/catalogos/tipo_unidad/tipo_unidad.routes');
const auditoriaRoutes = require('../modules/auditoria/auditoria.routes');
const responsablesAseguradorasRoutes = require('../modules/responsables_aseguradoras/responsables_aseguradoras.routes');
const catalogoEstadoUnidadRoutes = require('../modules/catalogos/estado_unidad/estado_unidad.routes');
const catalogoCombustibleRoutes = require('../modules/catalogos/combustible/combustible.routes');
const catalogoPeriodosRoutes = require('../modules/catalogos/periodos/periodos.routes');
const catalogoTipoPolizaRoutes = require('../modules/catalogos/tipo_poliza/tipo_poliza.routes');
const catalogoTipoTarjetaRoutes = require('../modules/catalogos/tipo_tarjeta/tipo_tarjeta.routes');
const catalogoTipoMovimientoPlacaRoutes = require('../modules/catalogos/tipo_movimiento_placa/tipo_movimiento_placa.routes');
const catalogoAccionesMovimientoRoutes = require('../modules/catalogos/acciones_movimiento/acciones_movimiento.routes');

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/usuarios-empresas', usuariosEmpresasRoutes)
router.use('/roles', rolesRoutes);
router.use('/permisos', permisosRoutes);
router.use('/rol-permisos', rolPermisosRoutes);
router.use('/empresas', empresasRoutes);
router.use('/unidades', unidadesRoutes);
router.use('/aseguradoras', aseguradorasRoutes);
router.use('/polizas', polizasRoutes);
router.use('/endosos', endososRoutes);
router.use('/incisos', incisosRoutes);
router.use('/placas', placasRoutes);
router.use('/detalle-placas', detallePlacasRoutes);
router.use('/tarjetas', tarjetasRoutes);
router.use('/cotejos', cotejosRoutes);
router.use('/doble-articulado', dobleArticuladoRoutes);
router.use('/sict', sictRoutes);
router.use('/catalogos/tipo-unidad', catalogoTipoUnidadRoutes);
router.use('/responsables-aseguradoras', responsablesAseguradorasRoutes);
router.use('/catalogos/estado-unidad', catalogoEstadoUnidadRoutes);
router.use('/catalogos/combustible', catalogoCombustibleRoutes);
router.use('/catalogos/periodos', catalogoPeriodosRoutes);
router.use('/catalogos/tipo-poliza', catalogoTipoPolizaRoutes);
router.use('/catalogos/tipo-tarjeta', catalogoTipoTarjetaRoutes);
router.use('/catalogos/tipo-movimiento-placa', catalogoTipoMovimientoPlacaRoutes);
router.use('/upload', require('../modules/upload/upload.routes'));

module.exports = router;