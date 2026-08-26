const { z } = require('zod');

const crearPolizaSchema = z.object({
  poliza: z.string().max(15),
  aseguradoraId: z.number().int().positive(),
  unidadId: z.number().int().positive(),
  tipoPolizaId: z.number().int().positive(),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  costo: z.number().nonnegative(),
  url: z.string().url(),
});

const actualizarPolizaSchema = crearPolizaSchema.partial();

const filtrosPolizaSchema = z.object({
  unidadId: z.string().regex(/^\d+$/).transform(Number).optional(),
  aseguradoraId: z.string().regex(/^\d+$/).transform(Number).optional(),
  vigente: z.string().optional(), // 'true' o 'false'
});

const actualizarUrlSchema = z.object({
  url: z.string().url(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = {
  crearPolizaSchema,
  actualizarPolizaSchema,
  filtrosPolizaSchema,
  actualizarUrlSchema,
  paramsIdSchema,
};