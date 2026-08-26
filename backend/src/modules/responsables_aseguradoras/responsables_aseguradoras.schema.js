const { z } = require('zod');

const crearResponsableSchema = z.object({
  aseguradoraId: z.number().int().positive(),
  responsable: z.string().max(100),
  puestoResponsable: z.string().max(50).optional().nullable(),
  telefono: z.string().max(13),
  empresaResponsableId: z.number().int().positive().optional().nullable(),
});

const actualizarResponsableSchema = crearResponsableSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearResponsableSchema, actualizarResponsableSchema, paramsIdSchema };