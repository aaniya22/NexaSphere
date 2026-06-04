// hooks/usePaginationParams.js
// Drop-in replacement for useState-based pagination.
// Syncs page number to the URL (?page=3) so browser Back/Forward
// and page reloads all restore the correct page.

import { useSearchParams } from 'react-router-dom';

/**
 * @param {number} defaultPage - Page to use when the param is absent (default: 1).
 * @returns {{ page, setPage, resetPage }}
 *
 * Usage:
 *   const { page, setPage } = usePaginationParams();
 *   // replaces: const [page, setPage] = useState(1);
 */
export function usePaginationParams(defaultPage = 1) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || String(defaultPage), 10);

  /**
   * Navigate to a new page — updates the URL without adding a new history entry
   * for every keystroke, but DOES add one for each page change so Back works.
   */
  function setPage(newPage) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(newPage));
        return next;
      },
      { replace: false } // keep history entry → Back button restores page
    );
  }

  /** Jump back to page 1 and replace the current history entry. */
  function resetPage() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(defaultPage));
        return next;
      },
      { replace: true }
    );
  }

  return { page, setPage, resetPage };
}
