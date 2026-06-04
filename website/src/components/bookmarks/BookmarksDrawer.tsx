import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookmarks } from '../../hooks/useBookmarks';
import { BookmarkType } from '../../utils/bookmarkStorage';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (type: string, key: string) => void;
}

export default function BookmarksDrawer({ isOpen, onClose, onNavigate }: BookmarksDrawerProps) {
  const { bookmarks, removeBookmark } = useBookmarks();

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Group bookmarks by type
  const grouped = bookmarks.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<BookmarkType, typeof bookmarks>
  );

  const categories: BookmarkType[] = ['Event', 'Activity', 'Roadmap'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 9000,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '380px',
              background: 'rgba(15, 15, 15, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderLeft: '1px solid rgba(204, 17, 17, 0.3)',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
              zIndex: 9001,
              display: 'flex',
              flexDirection: 'column',
              color: 'var(--t1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--c1)' }}
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                Saved for Later
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--t2)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                aria-label="Close bookmarks"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {bookmarks.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--t2)', marginTop: '40px' }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginBottom: '16px' }}
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <p>No bookmarks yet.</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    Save events, activities, and roadmaps to access them quickly here.
                  </p>
                </div>
              ) : (
                categories.map((category) => {
                  const items = grouped[category];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={category} style={{ marginBottom: '2rem' }}>
                      <h3
                        style={{
                          fontSize: '1rem',
                          color: 'var(--t2)',
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          paddingBottom: '8px',
                          marginBottom: '12px',
                        }}
                      >
                        {category}s
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '8px',
                              padding: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'background 0.2s',
                              cursor: onNavigate ? 'pointer' : 'default',
                            }}
                            onClick={() => {
                              if (onNavigate && item.link) {
                                onNavigate(item.type, item.link);
                                onClose();
                              }
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: '0.95rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.title}
                              </h4>
                              {item.date && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--t2)' }}>
                                  {item.date}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBookmark(item.id);
                              }}
                              style={{
                                background: 'rgba(204,17,17,0.1)',
                                border: 'none',
                                color: 'var(--c1)',
                                borderRadius: '4px',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Remove"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
