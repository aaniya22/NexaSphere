import { streamService } from '../services/streamService.js';
import {
  createStreamSchema,
  updateStreamSchema,
  streamStatusSchema,
  chatMessageSchema,
  createPollSchema,
  votePollSchema,
  streamPaginationSchema,
} from '../schemas/streamSchema.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      console.error('[streamController]', e);
      return res.status(500).json({ error: e.message || 'Internal server error' });
    });
}

export const listStreams = wrapAsync(async (req, res) => {
  const { page, limit, status, event_id } = streamPaginationSchema.parse(req.query);
  const result = await streamService.listStreams({ page, limit, status, event_id });
  return res.json({
    streams: result.rows,
    pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) || 1 },
  });
});

export const getStream = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid stream ID' });
  const stream = await streamService.getStream(id);
  if (!stream) return res.status(404).json({ error: 'Stream not found' });
  return res.json({ stream });
});

export const getStreamByEvent = wrapAsync(async (req, res) => {
  const eventId = req.params.eventId;
  if (!eventId) return res.status(400).json({ error: 'Event ID is required' });
  const stream = await streamService.getStreamByEventId(eventId);
  if (!stream) return res.status(404).json({ error: 'No stream found for this event' });
  return res.json({ stream });
});

export const createStream = wrapAsync(async (req, res) => {
  const input = createStreamSchema.parse(req.body);
  const stream = await streamService.createStream(input);
  if (!stream) return res.status(503).json({ error: 'Stream system is offline' });
  return res.status(201).json({ stream });
});

export const updateStream = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid stream ID' });
  const input = updateStreamSchema.parse(req.body);
  const stream = await streamService.updateStream(id, input);
  if (!stream) return res.status(404).json({ error: 'Stream not found' });
  return res.json({ stream });
});

export const setStreamStatus = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid stream ID' });
  const { status } = streamStatusSchema.parse(req.body);
  const stream = await streamService.setStreamStatus(id, status);
  if (!stream) return res.status(404).json({ error: 'Stream not found' });
  return res.json({ stream });
});

export const deleteStream = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid stream ID' });
  const ok = await streamService.deleteStream(id);
  if (!ok) return res.status(404).json({ error: 'Stream not found' });
  return res.json({ success: true });
});

export const addChatMessage = wrapAsync(async (req, res) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId)) return res.status(400).json({ error: 'Invalid stream ID' });
  const input = chatMessageSchema.parse(req.body);
  const message = await streamService.addChatMessage(streamId, input);
  if (!message) return res.status(404).json({ error: 'Stream not found' });
  return res.status(201).json({ message });
});

export const listChatMessages = wrapAsync(async (req, res) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId)) return res.status(400).json({ error: 'Invalid stream ID' });
  const { page, limit } = req.query;
  const result = await streamService.listChatMessages(streamId, {
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(200, Math.max(1, parseInt(limit, 10) || 100)),
  });
  return res.json({ messages: result.rows, total: result.total });
});

export const moderateChatMessage = wrapAsync(async (req, res) => {
  const messageId = parseInt(req.params.messageId, 10);
  if (isNaN(messageId)) return res.status(400).json({ error: 'Invalid message ID' });
  const message = await streamService.moderateChatMessage(messageId);
  if (!message) return res.status(404).json({ error: 'Message not found' });
  return res.json({ message });
});

export const createPoll = wrapAsync(async (req, res) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId)) return res.status(400).json({ error: 'Invalid stream ID' });
  const input = createPollSchema.parse(req.body);
  const poll = await streamService.createPoll(streamId, input);
  if (!poll) return res.status(404).json({ error: 'Stream not found' });
  return res.status(201).json({ poll });
});

export const listPolls = wrapAsync(async (req, res) => {
  const streamId = parseInt(req.params.id, 10);
  if (isNaN(streamId)) return res.status(400).json({ error: 'Invalid stream ID' });
  const polls = await streamService.listPolls(streamId);
  return res.json({ polls });
});

export const votePoll = wrapAsync(async (req, res) => {
  const pollId = parseInt(req.params.pollId, 10);
  if (isNaN(pollId)) return res.status(400).json({ error: 'Invalid poll ID' });
  const { option_index } = votePollSchema.parse(req.body);
  const poll = await streamService.votePoll(pollId, option_index);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  return res.json({ poll });
});

export const closePoll = wrapAsync(async (req, res) => {
  const pollId = parseInt(req.params.pollId, 10);
  if (isNaN(pollId)) return res.status(400).json({ error: 'Invalid poll ID' });
  const poll = await streamService.closePoll(pollId);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  return res.json({ poll });
});

export const adminListAll = wrapAsync(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await streamService.adminListAll({
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
    status,
  });
  return res.json({ streams: result.rows, total: result.total });
});
