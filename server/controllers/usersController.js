import { usersRepository } from '../repositories/usersRepository.js';
import { toPublicUserDTO, toAdminUserDTO } from '../utils/userSerializer.js';

export async function getPublicUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role || null;
    
    // Pass pagination to repo (assuming repo supports it or will be updated)
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role || null;
    
    const rawUsers = await usersRepository.getAllUsersAdmin({ page, limit, role });
    const safeUsers = rawUsers.map(toAdminUserDTO);
    return res.json({ users: safeUsers, page, limit });
  } catch (error) {
    console.error('[Security] Error in admin users endpoint serialization:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
