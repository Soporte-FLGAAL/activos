const { z } = require('zod');

const crearPermisoSchema = z.object({
  nombre: z.string().max(50).min(1, 'El nombre es requerido'),
});

const actualizarPermisoSchema = z.object({
  nombre: z.string().max(50).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearPermisoSchema, actualizarPermisoSchema, paramsIdSchema };