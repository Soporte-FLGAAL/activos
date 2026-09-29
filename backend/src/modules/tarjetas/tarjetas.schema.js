const { z } = require('zod');

// Esquema principal para crear una tarjeta
const crearTarjetaSchema = z.object({
  tarjeta: z.string().max(50),
  unidadId: z.number().int().positive(),
  costo: z.number().nonnegative(),
  tipoId: z.number().int().positive(),
  status: z.string().max(20),
  noOriginal: z.string().max(50).optional().nullable(),
  placasId: z.number().int().positive(),
  fechaObtencion: z.string().date(),
  fechaVencimiento: z.string().date().optional().nullable(),
  fechaReposicion: z.string().date().optional().nullable(),
  costoReposicion: z.number().nonnegative().optional().nullable(),
  url: z.string().url(),
  urlReposicion: z.string().url().optional().nullable(),
});

const actualizarTarjetaSchema = crearTarjetaSchema.partial();

const actualizarUrlSchema = z.object({
  url: z.string().url(),
});

// Esquema para crear tarjeta + cotejos (transaccional)
const cotejoItemSchema = z.object({
  tarjetaCotejo: z.string().max(50),
  fecha: z.string().date(),
});

const crearTarjetaConCotejosSchema = z.object({
  tarjeta: crearTarjetaSchema,
  cotejos: z.array(cotejoItemSchema).optional().default([]),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = {
  crearTarjetaSchema,
  actualizarTarjetaSchema,
  actualizarUrlSchema,
  crearTarjetaConCotejosSchema,
  paramsIdSchema,
};