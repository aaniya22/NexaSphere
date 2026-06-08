import { usersRepository } from '../repositories/usersRepository.js';
import { toPublicUserDTO, toAdminUserDTO } from '../utils/userSerializer.js';

const MAX_LIMIT = 100;
const ALLOWED_ROLES = ['admin', 'user', 'moderator', 'member'];

function parsePaginationAndFilters(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || 20));
  const role = query.role && ALLOWED_ROLES.includes(query.role) ? query.role : undefined;
  return { page, limit, role };
}

export async function getPublicUsers(req, res) {
  try {
    const { page, limit, role } = parsePaginationAndFilters(req.query);
    
    const rawUsers = await usersRepository.getAllPublicUsers({ page, limit, role });
    const safeUsers = rawUsers.map(toPublicUserDTO);
    return res.json({ users: safeUsers, page, limit });
  } catch (error) {
    console.error('[Security] Error in public users endpoint serialization:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAdminUsers(req, res) {
  try {
    const { page, limit, role } = parsePaginationAndFilters(req.query);
    
    const rawUsers = await usersRepository.getAllUsersAdmin({ page, limit, role });
    const safeUsers = rawUsers.map(toAdminUserDTO);
    return res.json({ users: safeUsers, page, limit });
  } catch (error) {
    console.error('[Security] Error in admin users endpoint serialization:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
