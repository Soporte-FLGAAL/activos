const { z } = require('zod');

const crearCotejoSchema = z.object({
  tarjetaId: z.number().int().positive(),
  tarjetaCotejo: z.string().max(50),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const actualizarCotejoSchema = crearCotejoSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearCotejoSchema, actualizarCotejoSchema, paramsIdSchema };