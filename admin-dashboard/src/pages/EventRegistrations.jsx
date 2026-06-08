import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AdminIcon } from '../components/AdminIcon';
import { Skeleton } from '../components/Skeleton';

const STATUS_COLORS = {
  confirmed: '#22c55e',
  waitlisted: '#f59e0b',
  cancelled: '#ef4444',
};

export function EventRegistrations() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.events
      .getAll()
      .then((data) => {
        if (data?.events) setEvents(data.events);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    setError('');
    api.eventRegistrations
      .list(selectedEventId)
      .then((data) => setRegistrations(data?.registrations || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  const handleAttendance = async (reg) => {
    try {
      await api.eventRegistrations.markAttendance(selectedEventId, { email: reg.email });
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === reg.id ? { ...r, attended: true, attended_at: new Date().toISOString() } : r
        )
      );
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Event Registrations</h2>
      </div>

      <div style={{ marginBottom: 20 }}>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--admin-border, #333)',
            background: 'var(--admin-bg-card, #1a1a2e)',
            color: 'var(--admin-text, #eee)',
            width: 300,
          }}
        >
          <option value="">Select an event…</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} ({ev.status})
            </option>
          ))}
        </select>
      </div>

      {loading && <Skeleton height={48} count={5} />}
      {error && <div className="page-error">{error}</div>}

      {!loading && !error && selectedEventId && registrations.length === 0 && (
        <div className="empty-state">No registrations for this event yet.</div>
      )}

      {registrations.length > 0 && (
        <div className="list">
          {registrations.map((reg) => (
            <div key={reg.id} className="list-item">
              <div className="list-item-left">
                <div>
                  <div className="item-name">{reg.full_name}</div>
                  <div className="item-meta">
                    {reg.email}
                    {reg.department && ` · ${reg.department}`}
                    {reg.year && ` · ${reg.year}`}
                    {reg.team_name && ` · Team: ${reg.team_name}`}
                  </div>
                </div>
              </div>
              <div className="list-item-right">
                <span
                  className="status-badge"
                  style={{ background: STATUS_COLORS[reg.status] || '#6b7280' }}
                >
                  {reg.attended ? 'Attended' : reg.status}
                </span>
                {!reg.attended && reg.status === 'confirmed' && (
                  <button
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    onClick={() => handleAttendance(reg)}
                  >
                    Mark Present
                  </button>
                )}
                <AdminIcon
                  name={reg.attended ? 'CheckCircle' : 'Circle'}
                  size={16}
                  style={{ color: reg.attended ? '#22c55e' : 'var(--admin-text-muted, #666)' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
