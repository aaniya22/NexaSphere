import { withDb } from './db.js';

function mapRow(row) {
  return {
    id: row.id,
    companyName: row.company_name,
    logoUrl: row.logo_url,
    description: row.description,
    websiteUrl: row.website_url,
    contactPerson: row.contact_person,
    contactEmail: row.contact_email,
    tier: row.tier,
    agreementStart: row.agreement_start,
    agreementEnd: row.agreement_end,
    amount: row.amount ? Number(row.amount) : null,
    benefits: Array.isArray(row.benefits) ? row.benefits : (row.benefits ?? []),
    status: row.status,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const sponsorshipsRepository = {
  async list({ page = 1, limit = 20 } = {}) {
    return withDb(async (client) => {
      const offset = (page - 1) * limit;
      const { rows } = await client.query(
        'select * from sponsors order by sort_order asc, created_at desc limit $1 offset $2',
        [limit, offset]
      );
      const countResult = await client.query('select count(*)::int as total from sponsors');
      return { rows: rows.map(mapRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async listActive() {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "select * from sponsors where status = 'active' order by sort_order asc, created_at desc"
      );
      return rows.map(mapRow);
    });
  },

  async getById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query('select * from sponsors where id = $1', [id]);
      if (!rows.length) return null;
      return mapRow(rows[0]);
    });
  },

  async create(sponsor) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into sponsors (company_name, logo_url, description, website_url, contact_person, contact_email, tier, agreement_start, agreement_end, amount, benefits, status, is_featured, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         returning *`,
        [
          sponsor.companyName,
          sponsor.logoUrl || null,
          sponsor.description || null,
          sponsor.websiteUrl || null,
          sponsor.contactPerson || null,
          sponsor.contactEmail || null,
          sponsor.tier,
          sponsor.agreementStart || null,
          sponsor.agreementEnd || null,
          sponsor.amount || null,
          JSON.stringify(sponsor.benefits || []),
          sponsor.status,
          sponsor.isFeatured || false,
          sponsor.sortOrder || 0,
        ]
      );
      return mapRow(rows[0]);
    });
  },

  async update(id, patch) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `update sponsors set
           company_name = coalesce($2, company_name),
           logo_url = coalesce($3, logo_url),
           description = coalesce($4, description),
           website_url = coalesce($5, website_url),
           contact_person = coalesce($6, contact_person),
           contact_email = coalesce($7, contact_email),
           tier = coalesce($8, tier),
           agreement_start = coalesce($9, agreement_start),
           agreement_end = coalesce($10, agreement_end),
           amount = coalesce($11, amount),
           benefits = coalesce($12, benefits),
           status = coalesce($13, status),
           is_featured = coalesce($14, is_featured),
           sort_order = coalesce($15, sort_order),
           updated_at = now()
         where id = $1
         returning *`,
        [
          id,
          patch.companyName ?? null,
          patch.logoUrl ?? null,
          patch.description ?? null,
          patch.websiteUrl ?? null,
          patch.contactPerson ?? null,
          patch.contactEmail ?? null,
          patch.tier ?? null,
          patch.agreementStart ?? null,
          patch.agreementEnd ?? null,
          patch.amount ?? null,
          patch.benefits ? JSON.stringify(patch.benefits) : null,
          patch.status ?? null,
          patch.isFeatured ?? null,
          patch.sortOrder ?? null,
        ]
      );
      if (!rows.length) return null;
      return mapRow(rows[0]);
    });
  },

  async delete(id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query('delete from sponsors where id = $1', [id]);
      return rowCount > 0;
    });
  },
};
