import { z } from 'zod';
import { sanitizeText } from '../utils/sanitize.js';

const creatorSchema = z
  .object({
    name: z.string().trim().max(120).optional().default(''),
    email: z.string().trim().max(140).optional().default(''),
    phone: z.string().trim().max(30).optional().default(''),
  })
  .optional()
  .default(undefined);

export const activityEventSchema = z
  .object({
    id: z.string().trim().min(1).max(120).optional(),
    name: z.string().trim().min(1, 'name is required').max(120),
    date: z.string().trim().min(1, 'date is required').max(80),
    tagline: z.string().trim().max(240).optional().default(''),
    description: z.string().trim().min(1, 'description is required').max(1200),
    status: z.enum(['upcoming', 'completed']).optional().default('completed'),
    createdBy: creatorSchema,
  })
  .transform((data) => ({
    ...data,
    id: data.id || `manual-${Date.now()}`,
    name: sanitizeText(data.name, 120),
    date: sanitizeText(data.date, 80),
    tagline: sanitizeText(data.tagline || '', 240),
    description: sanitizeText(data.description, 1200),
    status: data.status === 'upcoming' ? 'upcoming' : 'completed',
    createdBy: data.createdBy
      ? {
          name: sanitizeText(data.createdBy.name, 120),
          email: sanitizeText(data.createdBy.email, 140),
          phone: sanitizeText(data.createdBy.phone, 30),
        }
      : undefined,
  }));
