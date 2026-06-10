import { forumService } from '../services/forumService.js';
import {
  createThreadSchema,
  updateThreadSchema,
  createReplySchema,
  updateReplySchema,
  forumPaginationSchema,
  voteSchema,
} from '../schemas/forumSchema.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      console.error('[forumController]', e);
      return res.status(500).json({ error: e.message || 'Internal server error' });
    });
}

export const listCategories = wrapAsync(async (req, res) => {
  const categories = await forumService.getCategories();
  return res.json({ categories });
});

export const listThreads = wrapAsync(async (req, res) => {
  const { page, limit, category, q, sort } = forumPaginationSchema.parse(req.query);
  const result = await forumService.listThreads({ page, limit, category, q, sort });
  return res.json({
    threads: result.rows,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit) || 1,
    },
  });
});

export const getThread = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid thread ID' });
  const thread = await forumService.getThread(id);
  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  const repliesResult = await forumService.listReplies(id, req.query);
  return res.json({ thread, replies: repliesResult.rows, pagination: repliesResult });
});

export const createThread = wrapAsync(async (req, res) => {
  const input = createThreadSchema.parse(req.body);
  const thread = await forumService.createThread(input);
  if (!thread) return res.status(503).json({ error: 'Forum is in offline mode' });
  return res.status(201).json({ thread });
});

export const updateThread = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid thread ID' });
  const input = updateThreadSchema.parse(req.body);
  const thread = await forumService.updateThread(id, input);
  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  return res.json({ thread });
});

export const deleteThread = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid thread ID' });
  const deleted = await forumService.deleteThread(id);
  if (!deleted) return res.status(404).json({ error: 'Thread not found' });
  return res.status(204).send();
});

export const listReplies = wrapAsync(async (req, res) => {
  const threadId = parseInt(req.params.id, 10);
  if (isNaN(threadId)) return res.status(400).json({ error: 'Invalid thread ID' });
  const result = await forumService.listReplies(threadId, req.query);
  return res.json({ replies: result.rows, pagination: result });
});

export const createReply = wrapAsync(async (req, res) => {
  const threadId = parseInt(req.params.id, 10);
  if (isNaN(threadId)) return res.status(400).json({ error: 'Invalid thread ID' });
  const input = createReplySchema.parse(req.body);
  const reply = await forumService.createReply(threadId, input);
  if (!reply) return res.status(503).json({ error: 'Forum is in offline mode' });
  return res.status(201).json({ reply });
});

export const updateReply = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.replyId, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid reply ID' });
  const { content } = updateReplySchema.parse(req.body);
  const reply = await forumService.updateReply(id, content);
  if (!reply) return res.status(404).json({ error: 'Reply not found' });
  return res.json({ reply });
});

export const deleteReply = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.replyId, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid reply ID' });
  const deleted = await forumService.deleteReply(id);
  if (!deleted) return res.status(404).json({ error: 'Reply not found' });
  return res.status(204).send();
});

export const voteThread = wrapAsync(async (req, res) => {
  const threadId = parseInt(req.params.id, 10);
  if (isNaN(threadId)) return res.status(400).json({ error: 'Invalid thread ID' });
  const { voter_email, vote_type } = req.body;
  if (!voter_email) return res.status(400).json({ error: 'voter_email is required' });
  const result = await forumService.voteThread(threadId, voter_email, vote_type || 'upvote');
  return res.json({ result });
});

export const voteReply = wrapAsync(async (req, res) => {
  const replyId = parseInt(req.params.replyId, 10);
  if (isNaN(replyId)) return res.status(400).json({ error: 'Invalid reply ID' });
  const { voter_email, vote_type } = req.body;
  if (!voter_email) return res.status(400).json({ error: 'voter_email is required' });
  const result = await forumService.voteReply(replyId, voter_email, vote_type || 'upvote');
  return res.json({ result });
});

export const acceptReply = wrapAsync(async (req, res) => {
  const threadId = parseInt(req.params.id, 10);
  const replyId = parseInt(req.params.replyId, 10);
  if (isNaN(threadId) || isNaN(replyId)) return res.status(400).json({ error: 'Invalid IDs' });
  await forumService.acceptReply(threadId, replyId);
  return res.json({ success: true });
});

export const moderateThread = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid thread ID' });
  const { status } = req.body;
  if (!['approved', 'rejected', 'flagged'].includes(status)) {
    return res
      .status(400)
      .json({ error: 'Invalid status. Must be approved, rejected, or flagged' });
  }
  const thread = await forumService.moderateThread(id, status);
  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  return res.json({ thread });
});

export const moderateReply = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.replyId, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid reply ID' });
  const { status } = req.body;
  if (!['approved', 'rejected', 'flagged'].includes(status)) {
    return res
      .status(400)
      .json({ error: 'Invalid status. Must be approved, rejected, or flagged' });
  }
  const reply = await forumService.moderateReply(id, status);
  if (!reply) return res.status(404).json({ error: 'Reply not found' });
  return res.json({ reply });
});

export const adminListThreads = wrapAsync(async (req, res) => {
  const { page, limit, status, q } = req.query;
  const result = await forumService.adminListThreads({
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
    status,
    q,
  });
  return res.json({ threads: result.rows, total: result.total });
});
