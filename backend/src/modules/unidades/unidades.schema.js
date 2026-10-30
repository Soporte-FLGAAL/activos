const { z } = require('zod');

const crearUnidadSchema = z.object({
  noEconomico: z.string().max(15),
  status: z.enum(['ALTA', 'BAJA']),
  tipoId: z.number().int().positive(),
  estadoId: z.number().int().positive(),
  combustibleId: z.number().int().positive(),
  noSerie: z.string().max(25).optional().nullable(),
  noMotor: z.string().max(20).optional().nullable(),
  anioModelo: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  modelo: z.string().max(25),
  marca: z.string().max(25),
  ejes: z.number().int().optional().nullable(),
  llantas: z.number().int().positive(),
  viapass: z.string().max(15).optional().nullable(),
  propietarioId: z.number().int().positive(),
  empresaActualId: z.number().int().positive().optional(),
  fechaAltaSCT: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'), // Formato YYYY-MM-DD
  valorFactura: z.number().nonnegative().optional().nullable(),
  facturaUrl: z.string().url().optional().nullable(),
  fechaVerificacionMecanica: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  costoVerificacionMecanica: z.number().nonnegative(),
  periodoVerificacionMecanicaId: z.number().int().positive(),
  fechaVerificacionContaminantes: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  costoVerificacionContaminantes: z.number().nonnegative(),
  periodoVerificacionContaminantesId: z.number().int().positive(),
  urlVerificacionContaminantes: z.string().url().optional().nullable(),
  urlVerificacionMecanica: z.string().url().optional().nullable(),
});

const actualizarUnidadSchema = z.object({
  noEconomico: z.string().max(15).optional(),
  status: z.enum(['ALTA', 'BAJA']).optional(),
  tipoId: z.number().int().positive().optional(),
  estadoId: z.number().int().positive().optional(),
  combustibleId: z.number().int().positive().optional(),
  noSerie: z.string().max(25).optional().nullable(),
  noMotor: z.string().max(20).optional().nullable(),
  anioModelo: z.number().int().min(1980).max(new Date().getFullYear() + 1).optional(),
  modelo: z.string().max(25).optional(),
  marca: z.string().max(25).optional(),
  ejes: z.number().int().optional().nullable(),
  llantas: z.number().int().positive().optional(),
  viapass: z.string().max(15).optional().nullable(),
  // propietarioId: NO
  // empresaActualId: NO
  fechaAltaSCT: z.string().date().optional(),
  valorFactura: z.number().nonnegative().optional().nullable(),
  facturaUrl: z.string().url().optional().nullable(),
  fechaVerificacionMecanica: z.string().date().optional(),
  costoVerificacionMecanica: z.number().nonnegative().optional(),
  periodoVerificacionMecanicaId: z.number().int().positive().optional(),
  fechaVerificacionContaminantes: z.string().date().optional(),
  costoVerificacionContaminantes: z.number().nonnegative().optional(),
  periodoVerificacionContaminantesId: z.number().int().positive().optional(),
  urlVerificacionContaminantes: z.string().url().optional().nullable(),
  urlVerificacionMecanica: z.string().url().optional().nullable(),
});

const filtrosUnidadesSchema = z.object({
  empresaId: z.string().regex(/^\d+$/).transform(Number).optional(),
  tipoId: z.string().regex(/^\d+$/).transform(Number).optional(),
  combustibleId: z.string().regex(/^\d+$/).transform(Number).optional(),
  ejes: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['ALTA', 'BAJA']).optional(),
  search: z.string().optional(),
});

const actualizarCampoSchema = z.object({
  campo: z.enum([
    'Uni_factura_url',
    'Uni_url_verificacion_contaminantes',
    'Uni_url_verificacion_mecanica',
    'Uni_no_economico',
    'Uni_status',
    // NOTA: Uni_empresa_actual se elimina de aquí a propósito
  ]),
  valor: z.union([z.string(), z.number()]),
});

// Operación explícita de cambio de empresa (solo ADMIN_GLOBAL)
const cambiarEmpresaSchema = z.object({
  empresaDestinoId: z.number().int().positive(),
  estadoId: z.number().int().positive().optional(), // ej. RENTADA, PRESTADA
});

const cambiarPropietarioSchema = z.object({
  propietarioId: z.number().int().positive(),
  motivo: z.string().max(200).optional(), // opcional, para auditoría
});


const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = {
  crearUnidadSchema,
  actualizarUnidadSchema,
  filtrosUnidadesSchema,
  actualizarCampoSchema,
  cambiarEmpresaSchema,
  cambiarPropietarioSchema,   
  paramsIdSchema,
};