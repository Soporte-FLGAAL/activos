const { z } = require('zod');

const crearTipoTarjetaSchema = z.object({
  nombre: z.string().max(20),
});

const actualizarTipoTarjetaSchema = z.object({
  nombre: z.string().max(20).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearTipoTarjetaSchema, actualizarTipoTarjetaSchema, paramsIdSchema };