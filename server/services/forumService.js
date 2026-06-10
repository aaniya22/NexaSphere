import { forumRepository } from '../repositories/forumRepository.js';

export const forumService = {
  async getCategories() {
    return forumRepository.getCategories();
  },

  async listThreads({ page, limit, category, q, sort } = {}) {
    return forumRepository.listThreads({ page, limit, category, q, sort });
  },

  async getThread(id) {
    return forumRepository.getThreadById(id);
  },

  async createThread(input) {
    return forumRepository.createThread(input);
  },

  async updateThread(id, input) {
    return forumRepository.updateThread(id, input);
  },

  async deleteThread(id) {
    return forumRepository.deleteThread(id);
  },

  async listReplies(threadId, { page, limit } = {}) {
    return forumRepository.listReplies(threadId, { page, limit });
  },

  async createReply(threadId, input) {
    return forumRepository.createReply(threadId, input);
  },

  async updateReply(id, content) {
    return forumRepository.updateReply(id, content);
  },

  async deleteReply(id) {
    return forumRepository.deleteReply(id);
  },

  async voteThread(threadId, voterEmail, voteType) {
    return forumRepository.voteThread(threadId, voterEmail, voteType);
  },

  async voteReply(replyId, voterEmail, voteType) {
    return forumRepository.voteReply(replyId, voterEmail, voteType);
  },

  async acceptReply(threadId, replyId) {
    return forumRepository.acceptReply(threadId, replyId);
  },

  async moderateThread(id, status) {
    return forumRepository.moderateThread(id, status);
  },

  async moderateReply(id, status) {
    return forumRepository.moderateReply(id, status);
  },

  async adminListThreads({ page, limit, status, q } = {}) {
    return forumRepository.adminListThreads({ page, limit, status, q });
  },
};
