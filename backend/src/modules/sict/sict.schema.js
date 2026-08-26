const { z } = require('zod');

const crearSictSchema = z.object({
  permiso: z.string().max(30),
  unidadId: z.number().int().positive(),
  fechaObtencion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaVencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  url: z.string().url(),
});

const actualizarSictSchema = crearSictSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearSictSchema, actualizarSictSchema, paramsIdSchema };