const { z } = require('zod');

const asignarPermisoSchema = z.object({
  rolId: z.number().int().positive(),
  permisoId: z.number().int().positive(),
});

const paramsSchema = z.object({
  rolId: z.string().regex(/^\d+$/).transform(Number),
  permisoId: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { asignarPermisoSchema, paramsSchema };