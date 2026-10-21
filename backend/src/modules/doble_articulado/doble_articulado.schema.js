const { z } = require('zod');

const crearPermisoSchema = z.object({
  permiso: z.string().max(30),
  unidadId: z.number().int().positive(),
  fechaObtencion: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  fechaVencimiento: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  url: z.string().url(),
});

const actualizarPermisoSchema = crearPermisoSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

const filtrosDobleArticuladoSchema = z.object({
  empresaId: z.string().regex(/^\d+$/).transform(Number).optional(),
  unidadId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

module.exports = { crearPermisoSchema, actualizarPermisoSchema, paramsIdSchema, filtrosDobleArticuladoSchema };