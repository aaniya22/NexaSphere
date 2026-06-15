import { z } from 'zod';

export const sponsorshipSchema = z
  .object({
    companyName: z.string().trim().min(1).max(255),
    logoUrl: z.string().trim().max(2048).optional(),
    description: z.string().trim().max(2000).optional(),
    websiteUrl: z.string().trim().max(2048).optional(),
    contactPerson: z.string().trim().max(255).optional(),
    contactEmail: z.string().trim().max(255).optional(),
    tier: z.enum(['platinum', 'gold', 'silver', 'bronze', 'custom']).optional().default('bronze'),
    agreementStart: z.string().trim().optional(),
    agreementEnd: z.string().trim().optional(),
    amount: z.number().positive().optional(),
    benefits: z.array(z.string()).optional().default([]),
    status: z.enum(['active', 'expired', 'pending']).optional().default('active'),
    isFeatured: z.boolean().optional().default(false),
    sortOrder: z.number().int().min(0).optional().default(0),
  })
  .transform((data) => ({
    ...data,
    companyName: String(data.companyName),
    tier: data.tier || 'bronze',
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
    status: data.status || 'active',
  }));
