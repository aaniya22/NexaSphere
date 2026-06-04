import React from 'react';
import { motion } from 'framer-motion';
import { useBookmarks } from '../../hooks/useBookmarks';
import { BookmarkItem } from '../../utils/bookmarkStorage';

interface BookmarkButtonProps {
  item: BookmarkItem;
  className?: string;
  style?: React.CSSProperties;
}

export default function BookmarkButton({ item, className = '', style = {} }: BookmarkButtonProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const saved = isBookmarked(item.id);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (saved) {
      removeBookmark(item.id);
    } else {
      addBookmark(item);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleBookmark}
      className={`bookmark-btn ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(4px)',
        border: `1px solid ${saved ? 'var(--c1)' : 'rgba(255,255,255,0.2)'}`,
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: saved ? '0 0 10px rgba(204,17,17,0.5)' : 'none',
        color: saved ? 'var(--c1)' : 'var(--t2)',
        transition: 'all 0.2s ease',
        zIndex: 10,
        ...style,
      }}
      aria-label={saved ? 'Remove bookmark' : 'Save for later'}
      title={saved ? 'Remove bookmark' : 'Save for later'}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
    </motion.button>
  );
}
