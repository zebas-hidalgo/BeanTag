import { z } from 'zod';

export const batchSchema = z.object({
  id: z.string().min(1, "ID requerido"),
  name: z.string().min(1, "Nombre requerido"),
  producer: z.string().min(1, "Productor requerido"),
  altitude: z.string().optional(),
  variety: z.string().optional(),
  process: z.string().optional(),
  roaster: z.string().optional(),
  roaster_notes: z.string().optional(),
  dose_weight: z.preprocess((val) => parseFloat(val), z.number().positive("Peso dosis debe ser positivo")),
  total_doses: z.preprocess((val) => parseInt(val, 10), z.number().int().positive("Dosis totales debe ser entero")),
  origin: z.string().optional(),
  roast_level: z.string().optional(),
  roast_date: z.string().optional(),
  freeze_date: z.string().optional()
});
