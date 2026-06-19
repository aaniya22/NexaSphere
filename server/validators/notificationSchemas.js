import { z } from 'zod';

const pushSubscriptionKeys = z.object({
  p256dh: z.string().min(1, 'p256dh key is required'),
  auth: z.string().min(1, 'auth key is required'),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url('endpoint must be a valid URL').max(500),
  expirationTime: z.union([z.null(), z.number()]).optional(),
  keys: pushSubscriptionKeys,
});

export function normalizeSubscription(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid subscription payload');
  }
  const { subscription } = body;
  if (!subscription) {
    throw new Error('Missing subscription field');
  }
  return pushSubscriptionSchema.parse(subscription);
}

export const notificationSchema = z.object({
  userId: z.string().max(255).optional().nullable(),
  title: z.string().min(1, 'title is required').max(200, 'title must be at most 200 characters'),
  message: z
    .string()
    .min(1, 'message is required')
    .max(2000, 'message must be at most 2000 characters'),
  type: z.string().max(100).optional().nullable(),
  link: z.string().url().max(500).optional().nullable().or(z.literal('')),
});
