import { z } from 'zod';

export const createStreamSchema = z.object({
  event_id: z.string().trim().min(1, 'Event ID is required'),
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().max(2000).optional().default(''),
  stream_url: z.string().trim().url('Invalid stream URL').optional().or(z.literal('')),
  hls_url: z.string().trim().url('Invalid HLS URL').optional().or(z.literal('')),
  scheduled_start: z.string().optional(),
  max_viewers: z.number().int().positive().optional(),
  chat_enabled: z.boolean().optional().default(true),
  polls_enabled: z.boolean().optional().default(true),
});

export const updateStreamSchema = z.object({
  title: z.string().trim().max(255).optional(),
  description: z.string().trim().max(2000).optional(),
  stream_url: z.string().trim().url().optional().or(z.literal('')),
  hls_url: z.string().trim().url().optional().or(z.literal('')),
  recording_url: z.string().trim().url().optional().or(z.literal('')),
  recording_duration: z.number().int().positive().optional(),
  chat_enabled: z.boolean().optional(),
  polls_enabled: z.boolean().optional(),
  max_viewers: z.number().int().positive().optional(),
}).passthrough();

export const streamStatusSchema = z.object({
  status: z.enum(['scheduled', 'live', 'ended', 'archived']),
});

export const chatMessageSchema = z.object({
  user_name: z.string().trim().min(1, 'Name is required').max(255),
  user_email: z.string().trim().email().optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

export const createPollSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(500),
  options: z.array(z.string().trim().min(1)).min(2, 'At least 2 options required').max(10),
});

export const votePollSchema = z.object({
  option_index: z.number().int().min(0),
});

export const streamPaginationSchema = z.object({
  page: z.string().optional().transform(v => Math.max(1, parseInt(v, 10) || 1)),
  limit: z.string().optional().transform(v => Math.min(100, Math.max(1, parseInt(v, 10) || 20))),
  status: z.string().optional(),
  event_id: z.string().optional(),
}).passthrough();
