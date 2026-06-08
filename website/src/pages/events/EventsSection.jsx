import { useEffect } from 'react';
import { DynamicIcon } from '../../shared/Icons';
import EventCountdown from '../../components/events/EventCountdown.jsx';
import { getEventCountdownStatus } from '../../hooks/useCountdown.js';
import './EventsSection.css';

export default function EventsSection({ onEventClick, events = [] }) {
  const buildGradient = (ev) => {
    if (ev.gradientColors?.length > 1) {
      return `linear-gradient(135deg, ${ev.gradientColors.join(', ')})`;
    }
    if (ev.gradientColors?.length === 1) {
      return `linear-gradient(135deg, ${ev.gradientColors[0]}, ${ev.gradientColors[0]}88)`;
    }
    return null;
  };

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !e.target.classList.contains('fired')) {
            e.target.classList.add('fired');
            e.target.addEventListener(
              'animationend',
              () => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'none';
              },
              { once: true }
            );
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document
      .querySelectorAll(
        '#section-events .pop-in,#section-events .pop-left,#section-events .pop-right,#section-events .pop-word'
      )
      .forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const getEffectiveStatus = (ev) => {
    if (ev.status === 'completed') return 'completed';
    const startDate = ev.startDate ?? ev.date;
    const endDate = ev.endDate ?? ev.date;
    return getEventCountdownStatus({ startDate, endDate });
  };

  // Sort: upcoming first (earliest date first), then completed (most recent first)
  const sortedEvents = [...events]
    .map((ev) => ({ ...ev, _effectiveStatus: getEffectiveStatus(ev) }))
    .sort((a, b) => {
      const aIsUpcoming = a._effectiveStatus !== 'completed';
      const bIsUpcoming = b._effectiveStatus !== 'completed';
      if (aIsUpcoming !== bIsUpcoming) return bIsUpcoming ? 1 : -1;
      const da = parseDate(a)?.getTime() ?? 0;
      const db = parseDate(b)?.getTime() ?? 0;
      return aIsUpcoming ? da - db : db - da;
    });

  return (
    <section className="section" id="section-events">
      <div className="container">
        <div className="section-heading">
          <h2 className="section-title pop-word">Our Events</h2>
          <p className="section-subtitle pop-in" style={{ animationDelay: '.1s' }}>
            Where Ideas Come to Life
          </p>
        </div>
        <div className="events-timeline">
          {sortedEvents.map((ev, i) => {
            const hasDetailPage = !!ev.hasDetailPage;
            const dynamicGradient = buildGradient(ev);
            const glowColor = ev.gradientColors?.[0] || null;
            return (
              <div className="timeline-item" key={ev.id}>
                <div
                  className={`timeline-dot${ev._effectiveStatus !== 'completed' ? ' upcoming' : ''}`}
                />
                <div
                  className={`timeline-card shimmer ${i % 2 === 0 ? 'pop-left' : 'pop-right'}`}
                  style={{
                    animationDelay: `${i * 0.11}s`,
                    cursor: hasDetailPage ? 'pointer' : 'default',
                    transition: 'all .28s ease',
                    ...(dynamicGradient
                      ? {
                          position: 'relative',
                          overflow: 'hidden',
                          borderColor: 'transparent',
                        }
                      : {}),
                  }}
                  onClick={hasDetailPage ? () => onEventClick?.(ev) : undefined}
                  onMouseEnter={
                    hasDetailPage
                      ? (e) => {
                          e.currentTarget.style.borderColor = glowColor || 'var(--c1b)';
                          e.currentTarget.style.boxShadow = `0 6px 24px ${glowColor ? glowColor + '44' : 'var(--c1g)'}`;
                          e.currentTarget.style.transform = 'translateY(-3px)';
                        }
                      : undefined
                  }
                  onMouseLeave={
                    hasDetailPage
                      ? (e) => {
                          e.currentTarget.style.borderColor = dynamicGradient ? 'transparent' : '';
                          e.currentTarget.style.boxShadow = '';
                          e.currentTarget.style.transform = '';
                        }
                      : undefined
                  }
                >
                  {dynamicGradient && (
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        padding: '1px',
                        background: dynamicGradient,
                        WebkitMask:
                          'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                        opacity: 0.6,
                        pointerEvents: 'none',
                        transition: 'opacity 0.3s',
                      }}
                    />
                  )}
                  {dynamicGradient && (
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: -8,
                        background: dynamicGradient,
                        filter: 'blur(16px)',
                        opacity: 0.12,
                        pointerEvents: 'none',
                        transition: 'opacity 0.3s',
                      }}
                    />
                  )}
                  <div
                    className="timeline-event-name"
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: 'var(--c1)',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <span>{ev.name}</span>
                    {hasDetailPage && (
                      <span
                        style={{
                          color: 'var(--c1)',
                          opacity: 0.8,
                          fontSize: '0.9rem',
                        }}
                      >
                        →
                      </span>
                    )}
                  </div>
                  <div
                    className="timeline-event-date"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '.74rem',
                      color: 'var(--t3)',
                      marginBottom: '8px',
                    }}
                  >
                    <DynamicIcon
                      name={ev.icon || 'Calendar'}
                      size={13}
                      style={{ color: 'var(--c1)' }}
                    />
                    {ev.dateText ?? ev.date}
                  </div>
                  <p
                    className="timeline-event-desc"
                    style={{
                      fontSize: '.84rem',
                      lineHeight: '1.55',
                      marginBottom: '12px',
                    }}
                  >
                    {ev.description}
                  </p>
                  <EventCountdown event={ev} />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      className={`timeline-badge ${ev._effectiveStatus}`}
                      style={{ fontSize: '.64rem', padding: '1px 8px' }}
                    >
                      {ev._effectiveStatus === 'completed' ? (
                        <>
                          <DynamicIcon
                            name="CheckCircle"
                            size={11}
                            style={{ marginRight: '4px' }}
                          />{' '}
                          Completed
                        </>
                      ) : ev._effectiveStatus === 'live' ? (
                        <>
                          <DynamicIcon
                            name="PlayCircle"
                            size={11}
                            style={{ marginRight: '4px' }}
                          />{' '}
                          Live Now
                        </>
                      ) : ev._effectiveStatus === 'starting-soon' ? (
                        <>
                          <DynamicIcon
                            name="Clock"
                            size={11}
                            style={{ marginRight: '4px' }}
                          />{' '}
                          Starting Soon
                        </>
                      ) : (
                        <>
                          <DynamicIcon name="Calendar" size={11} style={{ marginRight: '4px' }} />{' '}
                          Upcoming
                        </>
                      )}
                    </span>
                    {ev.tags?.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '.64rem',
                          padding: '1px 8px',
                          borderRadius: '10px',
                          background: 'var(--c2a)',
                          color: 'var(--c2)',
                          border: '1px solid var(--c2b)',
                          fontWeight: 600,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {events.length > 0 && (
            <div className="timeline-item">
              <div className="timeline-dot upcoming" />
              <div
                className="timeline-card pop-in"
                style={{ textAlign: 'center', color: 'var(--t3)' }}
              >
                <DynamicIcon
                  name="Rocket"
                  size={24}
                  style={{ color: 'var(--c1)', marginBottom: '8px' }}
                />
                <p style={{ marginTop: '6px', fontSize: '.84rem' }}>
                  More events are being planned. Watch this space!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
