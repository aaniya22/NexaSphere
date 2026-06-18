import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiBase } from '../utils/runtimeConfig';

function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function matchesText(value, query) {
  return typeof value === 'string' && value.toLowerCase().includes(query);
}

export function getEventDisplayTitle(event) {
  return event?.title || event?.name || event?.shortName || '';
}

export function eventMatchesQuery(event, query) {
  return (
    matchesText(event?.title, query) ||
    matchesText(event?.name, query) ||
    matchesText(event?.shortName, query) ||
    matchesText(event?.description, query) ||
    matchesText(event?.category, query) ||
    matchesText(event?.location, query) ||
    event?.tags?.some?.((tag) => matchesText(tag, query))
  );
}

export function useSearch(activities, events) {
  const apiBase = getApiBase();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const debouncedQuery = useDebounce(query, 300);
  const abortRef = useRef(null);

  const searchApi = useCallback(
    async (q, type) => {
      if (!apiBase) return null;
      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const params = new URLSearchParams({ q, type, limit: '50' });
        const res = await fetch(`${apiBase}/api/search?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) return null;
        return res.json();
      } catch (err) {
        if (err.name === 'AbortError') return null;
        return null;
      }
    },
    [apiBase]
  );

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      setApiError(null);
      return;
    }

    const q = debouncedQuery.toLowerCase();
    setLoading(true);

    const doSearch = async () => {
      const apiResults = await searchApi(debouncedQuery, filter === 'all' ? 'all' : filter);
      if (apiResults && apiResults.results) {
        setResults(apiResults.results);
        setLoading(false);
        return;
      }

      let all = [];

      if (filter === 'all' || filter === 'activities') {
        const actRes = Object.entries(activities || {})
          .filter(
            ([key, a]) =>
              matchesText(key, q) ||
              matchesText(a?.title, q) ||
              matchesText(a?.description, q) ||
              matchesText(a?.subtitle, q) ||
              matchesText(a?.tagline, q)
          )
          .map(([key, a]) => ({
            id: key,
            type: 'activity',
            title: a?.title || key,
            description: a?.description || a?.subtitle || a?.tagline || '',
            key,
          }));
        all = [...all, ...actRes];
      }

      if (filter === 'all' || filter === 'events') {
        const evRes = (events || [])
          .filter((ev) => eventMatchesQuery(ev, q))
          .map((ev) => {
            const title = getEventDisplayTitle(ev);
            return {
              id: ev.id || title,
              type: 'event',
              title,
              description: ev.description || ev.location || '',
              date: ev.date,
              tags: ev.tags,
              event: ev,
            };
          });
        all = [...all, ...evRes];
      }

      if (filter === 'all' || filter === 'members') {
        const base = getApiBase();
        try {
          const res = await fetch(`${base}/api/content/team`);
          if (!res.ok) {
            setApiError(`Team member search unavailable (${res.status})`);
          } else {
            const data = await res.json();
            const members = data?.members || [];
            const matched = members
              .filter(
                (m) =>
                  matchesText(m.name, q) ||
                  matchesText(m.role, q) ||
                  matchesText(m.bio, q) ||
                  m.skills?.some((s) => matchesText(s, q))
              )
              .map((m) => ({
                id: m.id,
                type: 'member',
                title: m.name,
                description: m.role || m.bio || '',
                image: m.avatar || m.image,
              }));
            all = [...all, ...matched];
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('[useSearch] Team member fetch failed:', err.message);
            setApiError('Failed to search team members. Please try again.');
          }
        }
      }

      setResults(all);
      setLoading(false);
    };

    doSearch();
  }, [debouncedQuery, filter, activities, events, searchApi]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setFilter('all');
    setResults([]);
    setApiError(null);
  }, []);

  return { query, setQuery, filter, setFilter, results, loading, clearSearch };
}
