import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { AdminIcon } from './AdminIcon';
import { useFocusTrap } from '../hooks/useFocusTrap';

const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

const CATEGORIES = [
  { value: '', label: 'Select category...' },
  { value: 'kss', label: 'Knowledge Sharing Session' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'debate', label: 'Tech Debate' },
  { value: 'opensource', label: 'Open Source Day' },
  { value: 'codathon', label: 'Codathon' },
  { value: 'ideathon', label: 'Ideathon' },
  { value: 'promptathon', label: 'Promptathon' },
  { value: 'insight-session', label: 'Insight Session' },
];

const ICON_OPTIONS = [
  'Brain',
  'Wrench',
  'Code',
  'MessageSquare',
  'Terminal',
  'GitBranch',
  'Rocket',
  'Sparkles',
  'Calendar',
  'Target',
  'Lightbulb',
  'Globe',
];

function toDisplayDate(isoVal) {
  if (!isoVal) return '';
  const d = new Date(isoVal + 'T00:00:00');
  if (isNaN(d)) return isoVal;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toISODate(displayVal) {
  if (!displayVal) return '';
  const d = new Date(displayVal);
  if (isNaN(d)) return '';
  return d.toISOString().split('T')[0];
}

const empty = {
  name: '',
  shortName: '',
  dateText: '',
  dateISO: '',
  description: '',
  icon: 'Calendar',
  status: 'upcoming',
  category: '',
  location: '',
  capacity: '',
  hasDetailPage: true,
  tagsInput: '',
  gradientColors: [],
};

export function EventForm({ event, onClose }) {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const modalRef = useFocusTrap(true, handleClose);
  const [form, setForm] = useState(
    event
      ? {
          ...event,
          tagsInput: Array.isArray(event.tags) ? event.tags.join(', ') : event.tags || '',
          dateISO: toISODate(event.dateText ?? event.date ?? ''),
          gradientColors: Array.isArray(event.gradientColors) ? [...event.gradientColors] : [],
          capacity: event.capacity ?? '',
          hasDetailPage: event.hasDetailPage !== false,
        }
      : { ...empty }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleDateChange = (isoVal) => {
    setForm((f) => ({
      ...f,
      dateISO: isoVal,
      dateText: toDisplayDate(isoVal),
    }));
  };

  const addGradientColor = () => {
    setForm((f) => ({ ...f, gradientColors: [...f.gradientColors, '#6b21a8'] }));
  };

  const updateGradientColor = (index, value) => {
    setForm((f) => {
      const updated = [...f.gradientColors];
      updated[index] = value;
      return { ...f, gradientColors: updated };
    });
  };

  const removeGradientColor = (index) => {
    setForm((f) => ({
      ...f,
      gradientColors: f.gradientColors.filter((_, i) => i !== index),
    }));
  };

  const gradientPreview =
    form.gradientColors.length > 1
      ? `linear-gradient(135deg, ${form.gradientColors.join(', ')})`
      : form.gradientColors.length === 1
        ? `linear-gradient(135deg, ${form.gradientColors[0]}, ${form.gradientColors[0]}88)`
        : 'linear-gradient(135deg, #6b21a8, #7c3aed)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tags = form.tagsInput
        ? form.tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const payload = {
        ...form,
        tags,
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      delete payload.tagsInput;
      delete payload.dateISO;

      if (event?.id) {
        await api.events.update(event.id, payload);
      } else {
        await api.events.create(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      ref={modalRef}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>{event?.id ? 'Edit Event' : 'New Event'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <AdminIcon name="X" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label>Event Name *</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. KSS #153 — Knowledge Sharing Session"
              required
            />
          </div>
          <div className="form-row">
            <label>Short Name</label>
            <input
              value={form.shortName || ''}
              onChange={(e) => set('shortName', e.target.value)}
              placeholder="e.g. KSS #153"
            />
          </div>

          <div className="form-row">
            <label>Activity Category</label>
            <select value={form.category || ''} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Event Date</label>
            <input
              type="date"
              value={form.dateISO || ''}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
            {form.dateText && (
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>
                Will display as: <strong style={{ color: 'var(--text)' }}>{form.dateText}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-row">
              <label>Start Date & Time</label>
              <input
                type="datetime-local"
                value={form.startDate || ''}
                onChange={(e) => set('startDate', e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="form-row">
              <label>End Date & Time</label>
              <input
                type="datetime-local"
                value={form.endDate || ''}
                onChange={(e) => set('endDate', e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-row">
              <label>Location</label>
              <input
                value={form.location || ''}
                onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. Conference Hall"
              />
            </div>
            <div className="form-row">
              <label>Capacity</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                placeholder="e.g. 50"
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <label>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {ICON_OPTIONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => set('icon', iconName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: form.icon === iconName ? '2px solid var(--c1)' : '1px solid var(--bdr)',
                    background: form.icon === iconName ? 'var(--c1a)' : 'var(--card)',
                    color: form.icon === iconName ? 'var(--c1)' : 'var(--t2)',
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                >
                  <AdminIcon name={iconName} size={14} />
                  {iconName}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label>Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>
              Tags <span style={{ fontWeight: 400, textTransform: 'none' }}>(comma separated)</span>
            </label>
            <input
              value={form.tagsInput || ''}
              onChange={(e) => set('tagsInput', e.target.value)}
              placeholder="AI, Learning, Community"
            />
          </div>

          <div className="form-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <label style={{ marginBottom: 0 }}>Has Detail Page</label>
            <button
              type="button"
              onClick={() => set('hasDetailPage', !form.hasDetailPage)}
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: form.hasDetailPage ? 'var(--c1)' : 'var(--bdr)',
                position: 'relative',
                transition: 'background 0.2s',
              }}
              aria-label="Toggle detail page"
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: form.hasDetailPage ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>

          <div className="form-row">
            <label>Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <label>Dynamic Gradient Colors</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {form.gradientColors.map((color, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateGradientColor(i, e.target.value)}
                    style={{
                      width: 36,
                      height: 32,
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => updateGradientColor(i, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--bdr)',
                      background: 'var(--card)',
                      color: 'var(--text)',
                      fontSize: 13,
                      fontFamily: 'monospace',
                    }}
                    placeholder="#hex"
                  />
                  <button
                    type="button"
                    onClick={() => removeGradientColor(i)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--danger, #ef4444)',
                      cursor: 'pointer',
                    }}
                    aria-label="Remove color"
                  >
                    <AdminIcon name="Trash" size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addGradientColor}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px dashed var(--bdr)',
                  background: 'transparent',
                  color: 'var(--t2)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                + Add Color
              </button>
            </div>
            {form.gradientColors.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Preview</div>
                <div
                  style={{
                    height: 48,
                    borderRadius: 10,
                    background: gradientPreview,
                    border: '1px solid var(--bdr)',
                    boxShadow: `0 4px 20px ${form.gradientColors[0] || '#6b21a8'}33`,
                    transition: 'all 0.3s',
                  }}
                />
              </div>
            )}
          </div>

          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
