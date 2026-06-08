import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  NODE_ENV: z.string().default('development'),
  CORS_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
