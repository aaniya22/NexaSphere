import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';

const TYPE_ICONS = {
  message: '💬',
  connection: '🔗',
  mention: '@',
  system: '🔔',
};

export default function NotificationHistoryPage({ userId = 'global' }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const limit = 50;

  const fetchNotifications = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const currentOffset = reset ? 0 : offset;
        const data = await apiClient(
          `/api/notifications?userId=${userId}&offset=${currentOffset}&limit=${limit}`
        );
        const list = data.notifications || [];
        if (reset) {
          setNotifications(list);
        } else {
          setNotifications((prev) => [...prev, ...list]);
        }
        setHasMore(list.length >= limit);
        if (!reset) setOffset((prev) => prev + list.length);
      } catch {
        // ignore
      }
      setLoading(false);
    },
    [userId, offset]
  );

  useEffect(() => {
    setOffset(0);
    fetchNotifications(true);
  }, [userId]);

  const markRead = useCallback(
    async (id) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      try {
        await apiClient('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, userId }),
        });
      } catch {
        /* ignore */
      }
    },
    [userId]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await apiClient('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch {
      /* ignore */
    }
  }, [userId]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setHasMore(false);
    try {
      await apiClient(`/api/notifications?userId=${userId}`, { method: 'DELETE' });
    } catch {
      /* ignore */
    }
  }, [userId]);

  const filteredList = filter === 'all' ? notifications : notifications.filter((n) => !n.isRead);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ margin: 0, color: 'var(--t1)', fontSize: '1.5rem' }}>Notifications</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--t1)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {filter === 'all' ? 'All' : 'Unread'}
          </button>
          <button
            onClick={markAllRead}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--t1)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Mark All Read
          </button>
          <button
            onClick={clearAll}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--c1, #cc1111)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {filteredList.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--t2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <p>No notifications yet</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filteredList.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              if (!n.isRead) markRead(n.id);
              if (n.link) navigate(n.link);
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              cursor: 'pointer',
              background: n.isRead ? 'transparent' : 'rgba(204,17,17,0.06)',
              border: '1px solid',
              borderColor: n.isRead ? 'var(--border)' : 'rgba(204,17,17,0.15)',
              transition: 'background 0.15s',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>{TYPE_ICONS[n.type] || '🔔'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.isRead ? 400 : 600, color: 'var(--t1)' }}>{n.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--t2)', marginTop: '2px' }}>
                {n.message}
              </div>
              <div
                style={{ fontSize: '0.75rem', color: 'var(--t2)', marginTop: '4px', opacity: 0.6 }}
              >
                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
              </div>
            </div>
            {!n.isRead && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--c1)',
                  flexShrink: 0,
                  marginTop: '6px',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => fetchNotifications(false)}
            disabled={loading}
            style={{
              padding: '0.6rem 2rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--t1)',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
