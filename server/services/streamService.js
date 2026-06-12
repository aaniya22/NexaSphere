import { streamRepository } from '../repositories/streamRepository.js';
import { emitToRoom, getIO } from '../config/socket.js';

export const streamService = {
  async listStreams(params) {
    return streamRepository.listStreams(params);
  },

  async getStream(id) {
    return streamRepository.getStreamById(id);
  },

  async getStreamByEventId(eventId) {
    return streamRepository.getStreamByEventId(eventId);
  },

  async createStream(input) {
    return streamRepository.createStream(input);
  },

  async updateStream(id, input) {
    return streamRepository.updateStream(id, input);
  },

  async setStreamStatus(id, status) {
    const stream = await streamRepository.setStreamStatus(id, status);
    if (stream) {
      const io = getIO();
      if (io) {
        io.to('events-room').emit('stream:status-change', { streamId: id, status, eventId: stream.eventId });
      }
    }
    return stream;
  },

  async incrementViewerCount(id) {
    return streamRepository.incrementViewerCount(id);
  },

  async deleteStream(id) {
    return streamRepository.deleteStream(id);
  },

  async addChatMessage(streamId, input) {
    const message = await streamRepository.addChatMessage(streamId, input);
    if (message) {
      const io = getIO();
      if (io) {
        io.to('events-room').emit('stream:chat-message', message);
      }
    }
    return message;
  },

  async listChatMessages(streamId, params) {
    return streamRepository.listChatMessages(streamId, params);
  },

  async moderateChatMessage(messageId) {
    return streamRepository.moderateChatMessage(messageId);
  },

  async createPoll(streamId, input) {
    const poll = await streamRepository.createPoll(streamId, input);
    if (poll) {
      const io = getIO();
      if (io) {
        io.to('events-room').emit('stream:poll-created', poll);
      }
    }
    return poll;
  },

  async listPolls(streamId) {
    return streamRepository.listPolls(streamId);
  },

  async votePoll(pollId, optionIndex) {
    const poll = await streamRepository.votePoll(pollId, optionIndex);
    if (poll) {
      const io = getIO();
      if (io) {
        io.to('events-room').emit('stream:poll-updated', poll);
      }
    }
    return poll;
  },

  async closePoll(pollId) {
    const poll = await streamRepository.closePoll(pollId);
    if (poll) {
      const io = getIO();
      if (io) {
        io.to('events-room').emit('stream:poll-closed', poll);
      }
    }
    return poll;
  },

  async adminListAll(params) {
    return streamRepository.adminListAll(params);
  },
};
