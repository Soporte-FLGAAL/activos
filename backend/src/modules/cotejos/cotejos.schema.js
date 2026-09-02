const { z } = require('zod');

const crearCotejoSchema = z.object({
  tarjetaId: z.number().int().positive(),
  tarjetaCotejo: z.string().max(50),
  fecha: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
});

const actualizarCotejoSchema = crearCotejoSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearCotejoSchema, actualizarCotejoSchema, paramsIdSchema };