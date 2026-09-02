const { z } = require('zod');

const crearTarjetaSchema = z.object({
  tarjeta: z.string().max(50),
  unidadId: z.number().int().positive(),
  costo: z.number().nonnegative(),
  tipoId: z.number().int().positive(),
  status: z.string().max(20),
  noOriginal: z.string().max(50).optional().nullable(),
  placasId: z.number().int().positive(),
  fechaObtencion: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  fechaVencimiento: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  fechaReposicion: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  costoReposicion: z.number().nonnegative().optional().nullable(),
  url: z.string().url(),
  urlReposicion: z.string().url().optional().nullable(),
});

const actualizarTarjetaSchema = crearTarjetaSchema.partial();

const actualizarUrlSchema = z.object({
  url: z.string().url(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = {
  crearTarjetaSchema,
  actualizarTarjetaSchema,
  actualizarUrlSchema,
  crearTarjetaConCotejosSchema,
  paramsIdSchema,
};