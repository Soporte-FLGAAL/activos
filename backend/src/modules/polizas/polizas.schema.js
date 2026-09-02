const { z } = require('zod');

const crearPolizaSchema = z.object({
  poliza: z.string().max(15),
  aseguradoraId: z.number().int().positive(),
  unidadId: z.number().int().positive(),
  tipoPolizaId: z.number().int().positive(),
  fechaInicio: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  fechaFin: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
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

const incisoSchema = z.object({
  inciso: z.string().max(6),
  url: z.string().url(),
});

const endosoConIncisosSchema = z.object({
  endoso: z.string().max(6),
  url: z.string().url(),
  incisos: z.array(incisoSchema).optional().default([]),
});

const crearPolizaConEndososSchema = z.object({
  poliza: crearPolizaSchema,
  endosos: z.array(endosoConIncisosSchema).min(1, 'Debe incluir al menos un endoso'),
});


module.exports = {
  crearPolizaSchema,
  actualizarPolizaSchema,
  filtrosPolizaSchema,
  actualizarUrlSchema,
  crearPolizaConEndososSchema,
  paramsIdSchema,
};