const { z } = require('zod');

const crearEstadoUnidadSchema = z.object({
  estado: z.string().max(20, 'Máximo 20 caracteres'),
});

const actualizarEstadoUnidadSchema = z.object({
  estado: z.string().max(20).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearEstadoUnidadSchema, actualizarEstadoUnidadSchema, paramsIdSchema };