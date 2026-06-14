import { useEffect, useState, useRef } from 'react';
import { DynamicIcon } from '../../shared/Icons';
import { API_BASE } from '../../data/config';
import apiClient from '../../utils/apiClient';

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '0,212,255';
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}

function Typewriter({ text, speed = 10 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  const started = useRef(false);
  const intervalRef = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          let i = 0;
          intervalRef.current = setInterval(() => {
            setDisplayed(text.slice(0, i + 1));
            i++;
            if (i >= text.length) {
              setDone(true);
              clearInterval(intervalRef.current);
            }
          }, speed);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => {
      obs.disconnect();
      clearInterval(intervalRef.current);
    };
  }, [text, speed]);
  return (
    <span ref={ref}>
      {displayed}
      {!done && <span style={{ animation: 'blink 0.7s step-end infinite' }}>|</span>}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </span>
  );
}

function StatCard({ label, value, color }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const num = parseInt(value);
          if (isNaN(num)) {
            setCount(value);
            return;
          }
          let cur = 0;
          const t = setInterval(() => {
            cur += Math.ceil(num / 40);
            if (cur >= num) {
              setCount(num);
              clearInterval(t);
            } else setCount(cur);
          }, 25);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);
  const rgb = hexToRgb(color);
  return (
    <div
      ref={ref}
      style={{
        background: `rgba(${rgb},0.07)`,
        border: `1px solid rgba(${rgb},0.25)`,
        borderRadius: '12px',
        padding: '16px 22px',
        textAlign: 'center',
        minWidth: '85px',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(${rgb},0.2)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div
        style={{
          fontFamily: 'Orbitron,monospace',
          fontSize: '1.7rem',
          fontWeight: 900,
          color,
          textShadow: `0 0 16px rgba(${rgb},0.5)`,
        }}
      >
        {count}
      </div>
      <div
        style={{
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginTop: '3px',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, color }) {
  return (
    <h2
      style={{
        fontFamily: 'Orbitron,monospace',
        fontSize: '0.9rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color,
      }}
    >
      <span
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          flexShrink: 0,
          background: `rgba(${hexToRgb(color)},0.15)`,
          border: `1px solid rgba(${hexToRgb(color)},0.3)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
        }}
      >
        <DynamicIcon name={icon} size={15} />
      </span>
      {title}
    </h2>
  );
}

function PersonChip({ name, role, color, icon = 'Zap' }) {
  const [hovered, setHovered] = useState(false);
  const rgb = hexToRgb(color);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: hovered ? `rgba(${rgb},0.15)` : `rgba(${rgb},0.07)`,
        border: `1px solid ${hovered ? color : `rgba(${rgb},0.25)`}`,
        borderRadius: '50px',
        padding: '8px 16px',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateY(-3px) scale(1.03)' : '',
        boxShadow: hovered ? `0 8px 20px rgba(${rgb},0.2)` : '',
        cursor: 'default',
      }}
    >
      <span style={{ display: 'flex' }}>
        <DynamicIcon name={icon} size={14} style={{ color }} />
      </span>
      <div>
        <div
          style={{
            fontFamily: 'Rajdhani,sans-serif',
            fontWeight: 700,
            color: hovered ? color : 'var(--text-primary)',
            fontSize: '0.9rem',
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        {role && (
          <div
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {role}
          </div>
        )}
      </div>
    </div>
  );
}

function TopicCard({ topic, index, color }) {
  const [hovered, setHovered] = useState(false);
  const rgb = hexToRgb(color);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg,rgba(${rgb},0.1),var(--bg-card))`
          : 'var(--bg-card)',
        border: `1px solid ${hovered ? color + '60' : 'var(--border-subtle)'}`,
        borderLeft: `3px solid ${hovered ? color : `rgba(${rgb},0.4)`}`,
        borderRadius: '0 12px 12px 0',
        padding: '20px 24px',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateX(6px)' : '',
        boxShadow: hovered ? `0 8px 28px rgba(${rgb},0.15)` : '',
      }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            flexShrink: 0,
            background: `linear-gradient(135deg,${color},rgba(${rgb},0.5))`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Orbitron,monospace',
            fontWeight: 900,
            fontSize: '0.78rem',
            color: '#fff',
            boxShadow: `0 0 14px rgba(${rgb},0.4)`,
            transition: 'transform 0.3s ease',
            transform: hovered ? 'scale(1.15) rotate(8deg)' : '',
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'Orbitron,monospace',
              fontSize: '0.88rem',
              fontWeight: 700,
              color,
              marginBottom: '6px',
            }}
          >
            {topic.title}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '14px',
              marginBottom: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <DynamicIcon name="Mic2" size={12} /> {topic.speaker}
            </span>
            {topic.role && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                · {topic.role}
              </span>
            )}
            {topic.duration !== '—' && (
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <DynamicIcon name="Timer" size={12} /> {topic.duration}
              </span>
            )}
          </div>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.88rem',
              margin: 0,
              lineHeight: 1.65,
            }}
          >
            {topic.summary}
          </p>
        </div>
      </div>
    </div>
  );
}

function AckCard({ ack, color }) {
  const [hovered, setHovered] = useState(false);
  const rgb = hexToRgb(color);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `rgba(${rgb},0.06)` : 'var(--bg-card)',
        border: `1px solid ${hovered ? `rgba(${rgb},0.3)` : 'var(--border-subtle)'}`,
        borderRadius: '12px',
        padding: '18px 20px',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-3px)' : '',
        boxShadow: hovered ? `0 8px 24px rgba(${rgb},0.12)` : '',
      }}
    >
      <div
        style={{
          fontFamily: 'Orbitron,monospace',
          fontSize: '0.82rem',
          fontWeight: 700,
          color,
          marginBottom: '3px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <DynamicIcon name="Heart" size={12} /> {ack.name}
      </div>
      <div
        style={{
          fontSize: '0.72rem',
          color,
          opacity: 0.7,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '6px',
        }}
      >
        {ack.title}
      </div>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.84rem',
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {ack.note}
      </p>
    </div>
  );
}

function MediaBtn({ href, icon, label, color }) {
  const [hovered, setHovered] = useState(false);
  const rgb = hexToRgb(color);
  if (!href) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: '12px',
          padding: '20px 28px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          flex: 1,
          minWidth: '140px',
        }}
      >
        <div
          style={{
            marginBottom: '6px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <DynamicIcon name={icon} size={32} />
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '3px' }}>{label}</div>
        <div style={{ fontSize: '0.72rem' }}>Coming soon</div>
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        minWidth: '140px',
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '20px 28px',
        borderRadius: '12px',
        background: hovered ? `rgba(${rgb},0.12)` : 'var(--bg-card)',
        border: `1px solid ${hovered ? color : 'var(--border-subtle)'}`,
        color: hovered ? color : 'var(--text-primary)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateY(-6px) scale(1.03)' : '',
        boxShadow: hovered ? `0 16px 40px rgba(${rgb},0.25)` : '',
      }}
    >
      <div
        style={{
          transition: 'transform 0.3s',
          transform: hovered ? 'scale(1.2) rotate(-5deg)' : '',
          display: 'flex',
        }}
      >
        <DynamicIcon name={icon} size={32} />
      </div>
      <div
        style={{
          fontFamily: 'Rajdhani,sans-serif',
          fontWeight: 700,
          fontSize: '0.9rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </a>
  );
}

export default function EventDetailPage({ event, activityColor, activityIcon, onBack }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    department: '',
    year: '',
    teamName: '',
    teamSize: '',
  });
  const [regStatus, setRegStatus] = useState('idle');
  const [regError, setRegError] = useState('');
  const [regTicket, setRegTicket] = useState(null);
  const [regSubmitting, setRegSubmitting] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const mountTimer = setTimeout(() => setMounted(true), 60);

    // Local scroll-reveal observer — sub-pages mount after the global observer ran
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !e.target.classList.contains('fired')) {
            e.target.classList.add('fired');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    document
      .querySelectorAll(
        '#event-detail-page .pop-in, #event-detail-page .pop-left, #event-detail-page .pop-right, #event-detail-page .pop-scale'
      )
      .forEach((el) => obs.observe(el));
    return () => {
      clearTimeout(mountTimer);
      obs.disconnect();
    };
  }, []);

  const isUpcoming = event.status === 'upcoming';
  const eventEnd = event.endDate ?? event.startDate ?? event.date;
  const isInFuture = eventEnd ? new Date(eventEnd) > new Date() : isUpcoming;
  const canRegister = isUpcoming && isInFuture && event.capacity > 0;

  const handleRegField = (field) => (e) => setRegForm((f) => ({ ...f, [field]: e.target.value }));
  const handleRegistration = async (e) => {
    e.preventDefault();
    if (regSubmitting) return;
    setRegError('');
    setRegSubmitting(true);
    try {
      const base = API_BASE || '';
      const url = `${base}/api/content/events/${event.id}/register`;
      const data = await apiClient(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      if (data.ticket) {
        setRegTicket(data.ticket);
        setRegStatus('confirmed');
      }
    } catch (err) {
      if (err.message?.includes('waitlist')) {
        setRegStatus('waitlisted');
      } else {
        setRegError(err.message || 'Registration failed');
      }
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleCalendarDownload = () => {
    const base = API_BASE || '';
    const url = `${base}/api/content/events/${event.id}/calendar`;
    window.open(url, '_blank');
  };

  const color = activityColor || '#a855f7';
  const rgb = hexToRgb(color);
  const status = event.status === 'upcoming' ? 'upcoming' : 'completed';
  const overview =
    event.overview || event.description || 'More details for this event will be shared soon.';
  const location = event.location || 'GL Bajaj Group of Institutions, Mathura';
  const hasTopics = Array.isArray(event.topics) && event.topics.length > 0;
  const hasPeople = hasTopics || event.videoPresenter?.length > 0 || event.anchor;
  const hasVolunteers = event.volunteers?.length > 0;
  const hasAcknowledgements = event.acknowledgements?.length > 0 || event.closingNote;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(hasTopics ? [{ id: 'topics', label: 'Topics' }] : []),
    ...(hasPeople ? [{ id: 'speakers', label: 'Speakers' }] : []),
    ...(hasVolunteers ? [{ id: 'volunteers', label: 'Volunteers' }] : []),
    ...(hasAcknowledgements ? [{ id: 'acknowledgements', label: 'Acknowledgements' }] : []),
    { id: 'media', label: 'Media' },
    ...(canRegister ? [{ id: 'register', label: 'Register' }] : []),
  ];

  return (
    <div id="event-detail-page" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(160deg, rgba(${rgb},0.12) 0%, rgba(${rgb},0.03) 50%, transparent 100%)`,
          borderBottom: `1px solid rgba(${rgb},0.2)`,
          padding: '60px 0 52px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: `linear-gradient(rgba(${rgb},0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(${rgb},0.05) 1px, transparent 1px)`,
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${rgb},0.1) 0%, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: `1px solid rgba(${rgb},0.3)`,
              color,
              borderRadius: '20px',
              padding: '6px 18px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginBottom: '36px',
              transition: 'all 0.2s',
              fontFamily: 'Rajdhani,sans-serif',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.target.style.background = `rgba(${rgb},0.12)`;
              e.target.style.transform = 'translateX(-4px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.transform = '';
            }}
          >
            ← Back
          </button>

          <div
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(36px)',
              transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: `rgba(${rgb},0.1)`,
                border: `1px solid rgba(${rgb},0.3)`,
                borderRadius: '20px',
                padding: '4px 14px',
                marginBottom: '18px',
                fontSize: '0.78rem',
                color,
                fontFamily: 'Rajdhani,sans-serif',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {activityIcon} {event.shortName || event.name}
            </div>

            <h1
              style={{
                fontFamily: 'Orbitron,monospace',
                fontSize: 'clamp(1.5rem, 4.5vw, 2.8rem)',
                fontWeight: 900,
                marginBottom: '8px',
                lineHeight: 1.15,
                background: `linear-gradient(135deg, ${color}, #ffffff90)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {event.name || 'Event Details'}
            </h1>

            {event.tagline && (
              <p
                style={{
                  fontFamily: 'Rajdhani,sans-serif',
                  fontSize: '1.05rem',
                  color: `rgba(${rgb},0.8)`,
                  fontStyle: 'italic',
                  marginBottom: '6px',
                  opacity: mounted ? 1 : 0,
                  transition: 'opacity 0.7s 0.2s',
                }}
              >
                "{event.tagline}"
              </p>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '28px',
                marginTop: '12px',
              }}
            >
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <DynamicIcon name="Calendar" size={14} /> {event.dateText ?? event.date}
              </span>
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <DynamicIcon name="MapPin" size={14} /> {location}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 12px',
                  borderRadius: '20px',
                  background:
                    status === 'completed' ? 'rgba(34,197,94,0.12)' : 'rgba(0,212,255,0.12)',
                  color: status === 'completed' ? '#22c55e' : 'var(--c1)',
                  border:
                    status === 'completed'
                      ? '1px solid rgba(34,197,94,0.3)'
                      : '1px solid rgba(0,212,255,0.3)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <DynamicIcon name={status === 'completed' ? 'CheckCircle' : 'Calendar'} size={12} />{' '}
                {status === 'completed' ? 'Completed' : 'Upcoming'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {event.stats?.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} color={color} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px' }}>
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '48px',
          }}
        >
          <div
            className="pop-in"
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '-16px',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border:
                    activeTab === tab.id ? `1px solid ${color}` : '1px solid var(--border-subtle)',
                  background: activeTab === tab.id ? `rgba(${rgb},0.12)` : 'var(--bg-card)',
                  color: activeTab === tab.id ? color : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'Rajdhani,sans-serif',
                  fontWeight: 700,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <section>
              <SectionHeader icon="ClipboardList" title="Session Overview" color={color} />
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: '0 12px 12px 0',
                  padding: '28px 32px',
                  border: `1px solid rgba(${rgb},0.15)`,
                  borderLeftWidth: '3px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '150px',
                    height: '150px',
                    background: `radial-gradient(circle, rgba(${rgb},0.07), transparent)`,
                    pointerEvents: 'none',
                  }}
                />
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    lineHeight: 1.85,
                    fontSize: '0.98rem',
                    margin: 0,
                    whiteSpace: 'pre-line',
                  }}
                >
                  <Typewriter text={overview} speed={6} />
                </p>
              </div>
            </section>
          )}

          {activeTab === 'speakers' && hasTopics && (
            <section>
              <SectionHeader icon="Mic2" title="Presenters" color={color} />
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {event.topics?.map((t) => (
                  <PersonChip
                    key={t.speaker}
                    name={t.speaker}
                    role="Presenter"
                    color={color}
                    icon="Code2"
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'topics' && hasTopics && (
            <section>
              <SectionHeader icon="Target" title="Topics Covered" color={color} />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {event.topics?.map((t, i) => (
                  <TopicCard key={t.title || t.speaker} topic={t} index={i} color={color} />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'speakers' && (event.videoPresenter?.length > 0 || event.anchor) && (
            <section>
              <SectionHeader icon="Clapperboard" title="Video Presentors & Anchor" color={color} />
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {event.videoPresenter?.map((p) => (
                  <PersonChip key={p.name} name={p.name} role={p.role} color={color} icon="Video" />
                ))}
                {event.anchor && (
                  <PersonChip
                    name={event.anchor.name}
                    role={event.anchor.role}
                    color={color}
                    icon="Mic2"
                  />
                )}
              </div>
            </section>
          )}

          {activeTab === 'volunteers' && event.volunteers?.length > 0 && (
            <section>
              <SectionHeader icon="Zap" title="Volunteers — The Unsung Heroes" color={color} />
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {event.volunteers.map((v) => (
                  <PersonChip
                    key={v.name}
                    name={v.name}
                    role="Volunteer"
                    color={color}
                    icon="Zap"
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'acknowledgements' && event.acknowledgements?.length > 0 && (
            <section>
              <SectionHeader icon="Heart" title="Special Thanks" color={color} />
              <div
                style={{
                  display: 'grid',
                  gap: '14px',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                }}
              >
                {event.acknowledgements.map((a, i) => (
                  <AckCard key={a.name || a.title} ack={a} color={color} />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'media' && (
            <section>
              <SectionHeader icon="Camera" title="Photos & Videos" color={color} />
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <MediaBtn href={event.photoLink} icon="Camera" label="View Photos" color={color} />
                <MediaBtn
                  href={event.videoLink}
                  icon="Video"
                  label="Watch Recording"
                  color={color}
                />
                {isUpcoming && (
                  <button
                    onClick={handleCalendarDownload}
                    style={{
                      flex: 1,
                      minWidth: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: '20px 28px',
                      borderRadius: 12,
                      background: 'var(--bg-card)',
                      border: `1px solid var(--border-subtle)`,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontFamily: 'Rajdhani,sans-serif',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <DynamicIcon name="Calendar" size={32} />
                    Add to Calendar
                  </button>
                )}
              </div>
              {!event.photoLink && !event.videoLink && (
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    marginTop: '12px',
                    fontStyle: 'italic',
                  }}
                >
                  Photos and recordings are not available for this event yet.
                </p>
              )}
            </section>
          )}

          {activeTab === 'acknowledgements' && event.closingNote && (
            <section>
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(${rgb},0.08), rgba(${rgb},0.03))`,
                  border: `1px solid rgba(${rgb},0.25)`,
                  borderRadius: '16px',
                  padding: '28px 32px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `radial-gradient(rgba(${rgb},0.08) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <DynamicIcon name="Rocket" size={32} />
                </div>
                <p
                  style={{
                    fontFamily: 'Rajdhani,sans-serif',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.7,
                    margin: '0 0 16px',
                    position: 'relative',
                  }}
                >
                  {event.closingNote}
                </p>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  Stay tuned. Stay curious. The best is yet to come.{' '}
                  <DynamicIcon name="Star" size={12} style={{ verticalAlign: 'middle' }} />
                </p>
              </div>
            </section>
          )}

          {activeTab === 'register' && canRegister && (
            <section>
              <SectionHeader icon="UserPlus" title="Register for this Event" color={color} />
              {regStatus === 'confirmed' && regTicket ? (
                <div
                  style={{
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    border: `1px solid rgba(${rgb},0.25)`,
                    borderRadius: 16,
                    padding: 32,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Orbitron,monospace',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#22c55e',
                      marginBottom: 8,
                    }}
                  >
                    ✓ Registered!
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                    {regTicket.ticketData.fullName} · {regTicket.ticketData.email}
                  </p>
                  {regTicket.qrDataUrl && (
                    <img
                      src={regTicket.qrDataUrl}
                      alt="Entry QR Code"
                      style={{
                        width: 180,
                        height: 180,
                        borderRadius: 12,
                        border: `2px solid rgba(${rgb},0.3)`,
                        marginBottom: 16,
                      }}
                    />
                  )}
                  <div
                    style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}
                  >
                    Show this QR code at the event entrance.
                  </div>
                  <button
                    onClick={handleCalendarDownload}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 999,
                      border: `1px solid ${color}`,
                      background: `rgba(${rgb},0.12)`,
                      color,
                      cursor: 'pointer',
                      fontFamily: 'Rajdhani,sans-serif',
                      fontWeight: 700,
                    }}
                  >
                    <DynamicIcon name="Calendar" size={12} style={{ marginRight: 6 }} />
                    Add to Calendar
                  </button>
                </div>
              ) : regStatus === 'waitlisted' ? (
                <div
                  style={{
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    border: `1px solid rgba(${rgb},0.25)`,
                    borderRadius: 16,
                    padding: 32,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Orbitron,monospace',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#f59e0b',
                      marginBottom: 8,
                    }}
                  >
                    Waitlisted
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    The event is full. You have been added to the waitlist. We'll notify you if a
                    spot opens up.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleRegistration}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid rgba(${rgb},0.15)`,
                    borderRadius: 12,
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={regForm.fullName}
                    onChange={handleRegField('fullName')}
                    required
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'Rajdhani,sans-serif',
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={regForm.email}
                    onChange={handleRegField('email')}
                    required
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'Rajdhani,sans-serif',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <select
                      value={regForm.department}
                      onChange={handleRegField('department')}
                      style={{
                        flex: 1,
                        minWidth: 140,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Rajdhani,sans-serif',
                      }}
                    >
                      <option value="">Department</option>
                      <option value="CSE">CSE</option>
                      <option value="CSE (AI & ML)">CSE (AI & ML)</option>
                      <option value="CS">CS</option>
                      <option value="CST">CST</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                      <option value="CE">CE</option>
                      <option value="Other">Other</option>
                    </select>
                    <select
                      value={regForm.year}
                      onChange={handleRegField('year')}
                      style={{
                        flex: 1,
                        minWidth: 100,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Rajdhani,sans-serif',
                      }}
                    >
                      <option value="">Year</option>
                      <option value="1st">1st</option>
                      <option value="2nd">2nd</option>
                      <option value="3rd">3rd</option>
                      <option value="4th">4th</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Team Name (optional)"
                      value={regForm.teamName}
                      onChange={handleRegField('teamName')}
                      style={{
                        flex: 1,
                        minWidth: 140,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Rajdhani,sans-serif',
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Team Size"
                      value={regForm.teamSize}
                      onChange={handleRegField('teamSize')}
                      min="1"
                      max="20"
                      style={{
                        flex: 0,
                        width: 100,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Rajdhani,sans-serif',
                      }}
                    />
                  </div>
                  {regError && (
                    <div
                      style={{
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        padding: '8px 12px',
                        background: 'rgba(239,68,68,0.1)',
                        borderRadius: 8,
                      }}
                    >
                      {regError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={regSubmitting}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 999,
                      border: 'none',
                      background: `linear-gradient(135deg, ${color}, rgba(${rgb},0.7))`,
                      color: '#fff',
                      cursor: regSubmitting ? 'not-allowed' : 'pointer',
                      fontFamily: 'Rajdhani,sans-serif',
                      fontWeight: 700,
                      fontSize: '1rem',
                      opacity: regSubmitting ? 0.6 : 1,
                    }}
                  >
                    {regSubmitting ? 'Registering…' : 'Register Now'}
                  </button>
                </form>
              )}
            </section>
          )}

          {event.hashtags?.length > 0 && (
            <section>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {event.hashtags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.78rem',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: `rgba(${rgb},0.08)`,
                      color,
                      border: `1px solid rgba(${rgb},0.2)`,
                      fontFamily: 'Rajdhani,sans-serif',
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                      cursor: 'default',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = `rgba(${rgb},0.18)`;
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = `rgba(${rgb},0.08)`;
                      e.target.style.transform = '';
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
