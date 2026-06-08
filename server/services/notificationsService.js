import { generateUUID } from '../utils/uuid.js';
import { notificationsRepository } from '../repositories/notificationsRepository.js';

const MAX_PER_USER = 10000;

export async function getNotifications(userId = 'global', offset = 0, limit = 100) {
  return notificationsRepository.list({ userId, limit, offset });
}

export async function addNotification(userId = 'global', payload = {}) {
  return notificationsRepository.create({
    id: generateUUID(),
    userId,
    type: payload.type || 'system',
    title: payload.title || 'Notification',
    message: payload.message || '',
    link: payload.link || null,
    isRead: !!(payload.isRead ?? payload.is_read),
  });
}

export async function markAsRead(userId = 'global', id) {
  return notificationsRepository.markAsRead(userId, id);
}

export async function markAllAsRead(userId = 'global') {
  return notificationsRepository.markAllAsRead(userId);
}

export async function clearAll(userId = 'global') {
  return notificationsRepository.clearAll(userId);
}

export async function removeNotification(userId = 'global', id) {
  return notificationsRepository.remove(userId, id);
}

export default {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearAll,
  removeNotification,
};
