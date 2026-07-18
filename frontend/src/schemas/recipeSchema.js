import { z } from 'zod';

export const recipeSchema = z.object({
  batch_id: z.string().min(1, "Lote requerido"),
  method: z.string().min(1, "Método requerido"),
  ratio: z.string().regex(/^1:\d+(\.\d+)?$/, "Ratio debe tener formato 1:X (ej: 1:15)"),
  grind: z.string().optional(),
  temperature: z.string().optional(),
  brew_time: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  notes: z.string().optional()
});
