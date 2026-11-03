const { z } = require('zod');

const crearTarjetaSchema = z.object({
  tarjeta: z.string().trim().min(1).max(50),
  unidadId: z.number().int().positive(),
  costo: z.number().nonnegative(),
  tipoId: z.number().int().positive(),
  status: z.string().trim().min(1).max(20),
  noOriginal: z.string().max(50).optional().nullable(),
  placasId: z.number().int().positive(),
  fechaObtencion: z.string().date(),
  fechaVencimiento: z.string().date().optional().nullable(),
  fechaReposicion: z.string().date().optional().nullable(),
  costoReposicion: z.number().nonnegative().optional().nullable(),
  url: z.string().url(),
  urlReposicion: z.string().url().optional().nullable(),
});
const actualizarTarjetaSchema = crearTarjetaSchema.partial();
const actualizarUrlSchema = z.object({ url: z.string().url() });
const cotejoItemSchema = z.object({ tarjetaCotejo: z.string().max(50), fecha: z.string().date() });
const crearTarjetaConCotejosSchema = z.object({
  tarjeta: crearTarjetaSchema,
  cotejos: z.array(cotejoItemSchema).optional().default([]),
});
const paramsIdSchema = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });
const filtrosTarjetasSchema = z.object({
  empresaId: z.string().regex(/^\d+$/).transform(Number).optional(),
  unidadId: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.string().max(20).optional(),
  vencida: z.enum(['true', 'false']).optional(),
  search: z.string().trim().max(100).optional(),
});
module.exports = { crearTarjetaSchema, actualizarTarjetaSchema, actualizarUrlSchema, crearTarjetaConCotejosSchema, paramsIdSchema, filtrosTarjetasSchema };
