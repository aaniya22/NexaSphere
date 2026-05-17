import { eventEmitter, EVENTS } from './eventEmitter';
import { auth } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function fetchWithAuth(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.getToken()}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    eventEmitter.emit(EVENTS.AUTH_TOKEN_EXPIRED);
    throw new Error('Session expired');
  }
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  events: {
    getAll: () => fetchWithAuth('/api/admin/events'),
    create: async (event) => {
      const result = await fetchWithAuth('/api/admin/events', { method: 'POST', body: JSON.stringify(event) });
      eventEmitter.emit(EVENTS.EVENT_CREATED, result);
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Event created' });
      return result;
    },
    update: async (id, event) => {
      const result = await fetchWithAuth(`/api/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(event) });
      eventEmitter.emit(EVENTS.EVENT_UPDATED, result);
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Event updated' });
      return result;
    },
    delete: async (id) => {
      await fetchWithAuth(`/api/admin/events/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.EVENT_DELETED, { id });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Event deleted' });
    },
  },

  activityEvents: {
    getAll: (activityKey) => fetchWithAuth(`/api/admin/activity-events/${activityKey}`),
    create: async (activityKey, event) => {
      const result = await fetchWithAuth(`/api/admin/activity-events/${activityKey}`, { method: 'POST', body: JSON.stringify(event) });
      eventEmitter.emit(EVENTS.ACTIVITY_EVENT_CREATED, { activityKey, event: result });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Activity event added' });
      return result;
    },
    delete: async (activityKey, eventId) => {
      await fetchWithAuth(`/api/admin/activity-events/${activityKey}/${eventId}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.ACTIVITY_EVENT_DELETED, { activityKey, eventId });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Activity event deleted' });
    },
  },

  coreTeam: {
    getAll: async () => {
      const result = await fetchWithAuth('/api/admin/core-team');
      return { members: result?.members ?? [] };
    },
    add: async (member) => {
      const result = await fetchWithAuth('/api/admin/core-team', { method: 'POST', body: JSON.stringify(member) });
      eventEmitter.emit(EVENTS.CORE_TEAM_MEMBER_ADDED, result);
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Member added' });
      return result;
    },
    remove: async (id) => {
      await fetchWithAuth(`/api/admin/core-team/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.CORE_TEAM_MEMBER_REMOVED, { id });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Member removed' });
    },
  },

  submissions: {
    getMembership: () => fetchWithAuth('/api/admin/submissions/membership'),
    getRecruitment: () => fetchWithAuth('/api/admin/submissions/recruitment'),
    updateMembershipStatus: (id, status) => fetchWithAuth(`/api/admin/submissions/membership/${id}/status`, { 
      method: 'PATCH', 
      body: JSON.stringify({ status }) 
    }),
    updateRecruitmentStatus: (id, status) => fetchWithAuth(`/api/admin/submissions/recruitment/${id}/status`, { 
      method: 'PATCH', 
      body: JSON.stringify({ status }) 
    }),
  }
};
