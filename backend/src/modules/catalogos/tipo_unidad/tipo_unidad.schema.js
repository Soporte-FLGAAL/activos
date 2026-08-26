const { z } = require('zod');

const crearTipoUnidadSchema = z.object({
  nombre: z.string().max(30),
  nombreCorto: z.string().max(15).optional().nullable(),
});

const actualizarTipoUnidadSchema = z.object({
  nombre: z.string().max(30).optional(),
  nombreCorto: z.string().max(15).optional().nullable(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearTipoUnidadSchema, actualizarTipoUnidadSchema, paramsIdSchema };