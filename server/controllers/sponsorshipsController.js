import { sponsorshipsService } from '../services/sponsorshipsService.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      console.error('[wrapAsync error]', e);
      res.status(500).json({ error: 'Internal server error' });
    });
}

export const listSponsors = wrapAsync(async (req, res) => {
  const sponsors = await sponsorshipsService.listActiveSponsors();
  return res.json({ sponsors });
});

export const adminListSponsors = wrapAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const { rows, total } = await sponsorshipsService.listSponsors({ page, limit });
  return res.json({ sponsors: rows, pagination: { page, limit, total } });
});

export const adminCreateSponsor = wrapAsync(async (req, res) => {
  const created = await sponsorshipsService.createSponsor(req.body);
  return res.status(201).json({ ok: true, sponsor: created });
});

export const adminUpdateSponsor = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid sponsor ID' });
  const updated = await sponsorshipsService.updateSponsor(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Sponsor not found' });
  return res.json({ ok: true, sponsor: updated });
});

export const adminDeleteSponsor = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid sponsor ID' });
  const deleted = await sponsorshipsService.deleteSponsor(id);
  if (!deleted) return res.status(404).json({ error: 'Sponsor not found' });
  return res.json({ ok: true });
});
