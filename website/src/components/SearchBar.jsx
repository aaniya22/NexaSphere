import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Calendar, Zap, Users, BookOpen } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';

function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${safe})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            style={{
              background: 'rgba(204,17,17,0.85)',
              color: '#fff',
              borderRadius: '3px',
              padding: '0 2px',
              fontWeight: 700,
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

const TYPE_CONFIG = {
  activity: {
    bg: 'rgba(204,17,17,0.15)',
    color: 'var(--c1)',
    icon: <Zap size={16} color="var(--c1)" />,
    label: 'Activity',
  },
  event: {
    bg: 'rgba(90,90,255,0.15)',
    color: '#9999ff',
    icon: <Calendar size={16} color="#9999ff" />,
    label: 'Event',
  },
  member: {
    bg: 'rgba(0,200,100,0.15)',
    color: '#00c864',
    icon: <Users size={16} color="#00c864" />,
    label: 'Member',
  },
};

export default function SearchBar({ open, onClose, activities, events, onNavigate, onEventClick }) {
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [focusIdx, setFocusIdx] = useState(-1);
  const apiBase = import.meta?.env?.VITE_API_BASE || '';
  const { query, setQuery, filter, setFilter, results, loading, clearSearch } = useSearch(
    activities,
    events,
    apiBase
  );

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      clearSearch();
      return () => clearTimeout(t);
    }
    setFocusIdx(-1);
  }, [open]);

  useEffect(() => {
    setFocusIdx(-1);
  }, [results]);

  const handleClick = useCallback(
    (result) => {
      if (result.type === 'activity') onNavigate('activity', result.key || result.id);
      else if (result.type === 'event')
        onEventClick(result.event || { id: result.id, name: result.title });
      else if (result.type === 'member') window.location.href = result.url || '/team';
      onClose();
      clearSearch();
    },
    [onNavigate, onEventClick, onClose, clearSearch]
  );

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose();
      if (!results.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      }
      if (e.key === 'Enter' && focusIdx >= 0 && focusIdx < results.length) {
        e.preventDefault();
        handleClick(results[focusIdx]);
      }
    };
    if (open) window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, results, focusIdx]);

  useEffect(() => {
    if (focusIdx >= 0 && listRef.current) {
      const el = listRef.current.children[focusIdx];
      if (el) el.scrollIntoView?.({ block: 'nearest' });
    }
  }, [focusIdx]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '72px 16px 32px',
            overflowY: 'auto',
          }}
        >
          <motion.div
            initial={{ y: -28, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: '100%',
              maxWidth: '680px',
              background: 'var(--bg)',
              border: '1px solid rgba(204,17,17,0.22)',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(204,17,17,0.08)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Search size={20} color="var(--c1)" style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, members, activities…"
                aria-label="Search"
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--t1)',
                  fontSize: '1.05rem',
                  fontFamily: 'inherit',
                }}
              />
              {query && (
                <button
                  onClick={clearSearch}
                  aria-label="Clear search"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--t2)',
                    display: 'flex',
                    padding: '4px',
                  }}
                >
                  <X size={17} />
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--t2)',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  fontSize: '0.74rem',
                  fontFamily: 'inherit',
                  letterSpacing: '0.05em',
                }}
              >
                ESC
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                flexWrap: 'wrap',
              }}
            >
              {[
                { key: 'all', label: 'All' },
                { key: 'events', label: 'Events' },
                { key: 'activities', label: 'Activities' },
                { key: 'members', label: 'Members' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setFilter(f.key);
                    setFocusIdx(-1);
                  }}
                  style={{
                    background: filter === f.key ? 'var(--c1)' : 'rgba(255,255,255,0.07)',
                    color: filter === f.key ? '#fff' : 'var(--t2)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '5px 15px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 0.18s, color 0.18s',
                  }}
                >
                  {f.label}
                </button>
              ))}
              {query && (
                <span style={{ marginLeft: 'auto', color: 'var(--t2)', fontSize: '0.78rem' }}>
                  {loading
                    ? 'Searching…'
                    : `${results.length} result${results.length !== 1 ? 's' : ''}`}
                </span>
              )}
            </div>

            <div ref={listRef} style={{ maxHeight: '420px', overflowY: 'auto' }} role="listbox">
              {!query && (
                <div style={{ padding: '44px 20px', textAlign: 'center', color: 'var(--t2)' }}>
                  <Search size={34} color="rgba(204,17,17,0.35)" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
                    Type to search events, members &amp; activities
                  </div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.6 }}>
                    Press{' '}
                    <kbd
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Ctrl+K
                    </kbd>{' '}
                    anytime — ↑↓ to navigate, Enter to select
                  </div>
                </div>
              )}

              {loading && query && (
                <div
                  style={{
                    padding: '24px 20px',
                    textAlign: 'center',
                    color: 'var(--t2)',
                    fontSize: '0.9rem',
                  }}
                >
                  Searching across events, members, and activities…
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div style={{ padding: '44px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>🔍</div>
                  <div
                    style={{
                      color: 'var(--t1)',
                      fontWeight: 600,
                      fontSize: '1rem',
                      marginBottom: '6px',
                    }}
                  >
                    No results for &ldquo;{query}&rdquo;
                  </div>
                  <div style={{ color: 'var(--t2)', fontSize: '0.88rem' }}>
                    Try different keywords or change the filter
                  </div>
                </div>
              )}

              {results.map((result, idx) => {
                const tc = TYPE_CONFIG[result.type] || TYPE_CONFIG.event;
                return (
                  <button
                    key={`${result.id}-${result.type}`}
                    onClick={() => handleClick(result)}
                    role="option"
                    aria-selected={focusIdx === idx}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: focusIdx === idx ? 'rgba(204,17,17,0.12)' : 'none',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      padding: '14px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'background 0.15s',
                      color: 'var(--t1)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(204,17,17,0.07)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        focusIdx === idx ? 'rgba(204,17,17,0.12)' : 'none')
                    }
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '11px',
                        flexShrink: 0,
                        background: tc.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {tc.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '3px' }}>
                        <Highlight text={result.title} query={query} />
                      </div>
                      {result.description && (
                        <div
                          style={{
                            color: 'var(--t2)',
                            fontSize: '0.82rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Highlight text={result.description.slice(0, 90)} query={query} />
                          {result.description.length > 90 && '…'}
                        </div>
                      )}
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '5px',
                          fontSize: '0.7rem',
                          padding: '1px 9px',
                          borderRadius: '10px',
                          background: tc.bg,
                          color: tc.color,
                          textTransform: 'capitalize',
                        }}
                      >
                        {tc.label}
                      </span>
                    </div>
                    <ArrowRight size={15} color="var(--t2)" style={{ flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
