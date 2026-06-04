// components/Pagination.jsx
// Reusable pagination bar that reads/writes ?page= in the URL.
// Works with usePaginationParams hook out of the box.

import React from 'react';
import { usePaginationParams } from '../hooks/usePaginationParams';

/**
 * @param {number}   totalItems   - Total number of records.
 * @param {number}   itemsPerPage - Records per page (default: 10).
 * @param {number}   [siblingCount=1] - Pages shown on each side of current page.
 */
export default function Pagination({ totalItems, itemsPerPage = 10, siblingCount = 1 }) {
  const { page, setPage } = usePaginationParams();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  // Build page number array with ellipsis markers
  function getPageRange() {
    const delta = siblingCount + 2;
    const range = [];
    const left = Math.max(2, page - siblingCount);
    const right = Math.min(totalPages - 1, page + siblingCount);

    range.push(1);
    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push('...');
    if (totalPages > 1) range.push(totalPages);

    return range;
  }

  return (
    <nav
      aria-label="Pagination"
      style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}
    >
      {/* Previous */}
      <button
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        style={btnStyle(false, page <= 1)}
      >
        ← Prev
      </button>

      {/* Page numbers */}
      {getPageRange().map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', color: '#888' }}>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(p)}
            aria-current={p === page ? 'page' : undefined}
            style={btnStyle(p === page, false)}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => setPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        style={btnStyle(false, page >= totalPages)}
      >
        Next →
      </button>
    </nav>
  );
}

function btnStyle(active, disabled) {
  return {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: active ? '#4f46e5' : '#d1d5db',
    backgroundColor: active ? '#4f46e5' : disabled ? '#f9fafb' : '#ffffff',
    color: active ? '#ffffff' : disabled ? '#9ca3af' : '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: active ? 600 : 400,
    fontSize: '0.875rem',
    transition: 'all 0.15s',
  };
}
