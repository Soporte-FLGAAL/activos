const { z } = require('zod');

const asignarUsuarioEmpresaSchema = z.object({
  usuarioId: z.number().int().positive(),
  empresaId: z.number().int().positive(),
  rolId: z.number().int().positive(),
});

const actualizarRolSchema = z.object({
  usuarioId: z.number().int().positive(),
  empresaId: z.number().int().positive(),
  rolId: z.number().int().positive(),
});

const paramsSchema = z.object({
  usuarioId: z.string().regex(/^\d+$/).transform(Number),
  empresaId: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { asignarUsuarioEmpresaSchema, actualizarRolSchema, paramsSchema };