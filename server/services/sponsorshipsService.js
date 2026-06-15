import { sponsorshipsRepository } from '../repositories/sponsorshipsRepository.js';
import { sponsorshipSchema } from '../schemas/sponsorshipSchema.js';

export const sponsorshipsService = {
  async listSponsors({ page = 1, limit = 20 } = {}) {
    return sponsorshipsRepository.list({ page, limit });
  },

  async listActiveSponsors() {
    return sponsorshipsRepository.listActive();
  },

  async getSponsor(id) {
    return sponsorshipsRepository.getById(id);
  },

  async createSponsor(input) {
    const sponsor = sponsorshipSchema.parse(input);
    return sponsorshipsRepository.create(sponsor);
  },

  async updateSponsor(id, input) {
    const patch = sponsorshipSchema.partial().parse(input);
    return sponsorshipsRepository.update(id, patch);
  },

  async deleteSponsor(id) {
    return sponsorshipsRepository.delete(id);
  },
};
