const { z } = require('zod');

const crearAseguradoraSchema = z.object({
  nombre: z.string().max(100),
  direccion: z.string().max(150),
  telefono: z.string().max(13),
  rfc: z.string().max(13).min(12, 'RFC inválido'),
});

const actualizarAseguradoraSchema = crearAseguradoraSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearAseguradoraSchema, actualizarAseguradoraSchema, paramsIdSchema };