const { z } = require('zod');

const filtrosMovimientosSchema = z.object({
  tabla: z.string().max(30).optional(),
  accionId: z.string().regex(/^\d+$/).transform(Number).optional(),
  usuarioId: z.string().regex(/^\d+$/).transform(Number).optional(),
  fechaInicio: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  fechaFin: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { filtrosMovimientosSchema, paramsIdSchema };