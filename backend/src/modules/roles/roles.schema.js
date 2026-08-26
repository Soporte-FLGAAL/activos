const { z } = require('zod');

const crearRolSchema = z.object({
  nombre: z.string().max(20).min(1, 'El nombre es requerido'),
});

const actualizarRolSchema = z.object({
  nombre: z.string().max(20).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearRolSchema, actualizarRolSchema, paramsIdSchema };