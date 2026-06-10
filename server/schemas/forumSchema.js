import { z } from 'zod';

const tagsSchema = z.union([z.array(z.string().max(40)), z.string()]).transform((val) => {
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  return val.slice(0, 12);
});

export const createThreadSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  content: z.string().trim().min(1, 'Content is required').max(10000),
  category_id: z.number().int().positive('Category is required'),
  author_name: z.string().trim().min(1, 'Name is required').max(255),
  author_email: z.string().trim().email().optional().or(z.literal('')),
  tags: tagsSchema.optional().default([]),
});

export const updateThreadSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    content: z.string().trim().min(1).max(10000).optional(),
    category_id: z.number().int().positive().optional(),
    tags: tagsSchema.optional(),
  })
  .passthrough();

export const createReplySchema = z.object({
  content: z.string().trim().min(1, 'Reply content is required').max(10000),
  author_name: z.string().trim().min(1, 'Name is required').max(255),
  author_email: z.string().trim().email().optional().or(z.literal('')),
});

export const updateReplySchema = z.object({
  content: z.string().trim().min(1).max(10000),
});

export const forumPaginationSchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((v) => Math.max(1, parseInt(v, 10) || 1)),
    limit: z
      .string()
      .optional()
      .transform((v) => Math.min(100, Math.max(1, parseInt(v, 10) || 20))),
    category: z.string().optional(),
    q: z.string().optional(),
    sort: z.enum(['latest', 'top', 'unanswered']).optional().default('latest'),
  })
  .passthrough();

export const voteSchema = z.object({
  vote_type: z.enum(['upvote', 'downvote']).optional().default('upvote'),
});
