const { z } = require('zod');

const crearUsuarioSchema = z.object({
  nombres: z.string().max(50),
  apPaterno: z.string().max(25),
  apMaterno: z.string().max(25).optional().nullable(),
  telefono: z.string().max(13).optional().nullable(),
  correo: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const actualizarUsuarioSchema = z.object({
  nombres: z.string().max(50).optional(),
  apPaterno: z.string().max(25).optional(),
  apMaterno: z.string().max(25).optional().nullable(),
  telefono: z.string().max(13).optional().nullable(),
  correo: z.string().email().optional(),
  status: z.enum(['ACTIVO', 'INACTIVO']).optional(),
});

const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Password actual requerido'),
  nuevaPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

const adminCambiarPasswordSchema = z.object({
  nuevaPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  cambiarPasswordSchema,
  adminCambiarPasswordSchema,
  paramsIdSchema,
};