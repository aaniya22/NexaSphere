import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';

const CATEGORIES = [
  { key: 'events', label: 'Event Updates', desc: 'New events, registration openings' },
  { key: 'team', label: 'Team Invitations', desc: 'Core team & club invitations' },
  { key: 'activities', label: 'Activity Updates', desc: 'Club activity announcements' },
  { key: 'announcements', label: 'Admin Announcements', desc: 'Platform-wide announcements' },
  { key: 'deadlines', label: 'Deadline Reminders', desc: 'Registration closing reminders' },
  { key: 'attendance', label: 'Attendance & Points', desc: 'Attendance confirmations & points' },
  { key: 'promotions', label: 'Waitlist & Promotions', desc: 'Waitlist promotion updates' },
];

const CHANNELS = [
  { key: 'in_app', label: 'In-App', desc: 'Bell icon notifications' },
  { key: 'push', label: 'Push', desc: 'Browser push notifications' },
  { key: 'email', label: 'Email', desc: 'Email notifications' },
];

export default function NotificationPreferencesPanel({ userId = 'global', onClose }) {
  const [prefs, setPrefs] = useState({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient(`/api/notifications/preferences?userId=${userId}`);
        const map = {};
        for (const p of data.preferences || []) {
          map[p.category] = { email: p.email, push: p.push, in_app: p.in_app };
        }
        setPrefs(map);
      } catch {
        // defaults
      }
      setLoaded(true);
    })();
  }, [userId]);

  const toggle = useCallback((category, channel) => {
    setPrefs((prev) => {
      const current = prev[category] || { email: true, push: true, in_app: true };
      return { ...prev, [category]: { ...current, [channel]: !current[channel] } };
    });
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const bulk = Object.entries(prefs).map(([category, channels]) => ({
        category,
        ...channels,
      }));
      await apiClient('/api/notifications/preferences/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences: bulk }),
      });
    } catch {
      // ignore
    }
    setSaving(false);
  }, [prefs, userId]);

  if (!loaded)
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--t2)' }}>
        Loading preferences...
      </div>
    );

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '700px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ margin: 0, color: 'var(--t1)' }}>Notification Preferences</h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--t2)',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th
              style={{
                textAlign: 'left',
                padding: '0.75rem 0.5rem',
                color: 'var(--t1)',
                fontSize: '0.85rem',
              }}
            >
              Category
            </th>
            {CHANNELS.map((ch) => (
              <th
                key={ch.key}
                style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  color: 'var(--t1)',
                  fontSize: '0.8rem',
                }}
              >
                {ch.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((cat) => {
            const channels = prefs[cat.key] || { email: true, push: true, in_app: true };
            return (
              <tr key={cat.key} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.85rem 0.5rem' }}>
                  <div style={{ color: 'var(--t1)', fontSize: '0.9rem' }}>{cat.label}</div>
                  <div style={{ color: 'var(--t2)', fontSize: '0.75rem' }}>{cat.desc}</div>
                </td>
                {CHANNELS.map((ch) => (
                  <td key={ch.key} style={{ textAlign: 'center', padding: '0.85rem 0.5rem' }}>
                    <button
                      onClick={() => toggle(cat.key, ch.key)}
                      style={{
                        width: '36px',
                        height: '22px',
                        borderRadius: '11px',
                        border: 'none',
                        background: channels[ch.key]
                          ? 'var(--c1, #cc1111)'
                          : 'rgba(255,255,255,0.15)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '2px',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.2s',
                          left: channels[ch.key] ? '16px' : '2px',
                        }}
                      />
                    </button>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '0.6rem 2rem',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--c1, #cc1111)',
            color: '#fff',
            fontSize: '0.9rem',
            cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
