const { z } = require('zod');

const crearEmpresaSchema = z.object({
  nombre: z.string().max(100),
  nombreCorto: z.string().max(20).optional().nullable(),
  direccion: z.string().max(150).optional().nullable(),
  rfc: z.string().max(13).min(12, 'RFC inválido'),
});

const actualizarEmpresaSchema = z.object({
  nombre: z.string().max(100).optional(),
  nombreCorto: z.string().max(20).optional().nullable(),
  direccion: z.string().max(150).optional().nullable(),
  rfc: z.string().max(13).min(12).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearEmpresaSchema, actualizarEmpresaSchema, paramsIdSchema };