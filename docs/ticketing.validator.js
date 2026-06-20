import { z } from 'zod';

export const ticketTypeSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  base_price: z.number().min(0),
  quantity_available: z.number().int().positive(),
  max_per_order: z.number().int().default(10),
  is_transferable: z.boolean().default(true),
  requires_verification: z.boolean().default(false),
  start_sale_date: z.string().datetime().optional(),
  end_sale_date: z.string().datetime().optional(),
});

export const purchaseTicketSchema = z.object({
  eventId: z.string().uuid(),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  discountCode: z.string().optional(),
  seatIds: z.array(z.string().uuid()).optional(),
});

export const checkInSchema = z.object({
  qrCodeData: z.string().min(10),
  eventId: z.string().uuid(),
});

export const discountCodeSchema = z.object({
  code: z.string().min(3).max(50),
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.number().positive(),
  usage_limit: z.number().int().optional(),
  expires_at: z.string().datetime().optional(),
  is_referral: z.boolean().default(false),
});
