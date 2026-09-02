const { z } = require('zod');

const crearSictSchema = z.object({
  permiso: z.string().max(30),
  unidadId: z.number().int().positive(),
  fechaObtencion: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  fechaVencimiento: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  url: z.string().url(),
});

const actualizarSictSchema = crearSictSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearSictSchema, actualizarSictSchema, paramsIdSchema };