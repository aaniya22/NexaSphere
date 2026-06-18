import { useState, useEffect, useMemo } from 'react';
import ResourceCard from '../../components/resources/ResourceCard';
import ResourceUploadModal from '../../components/resources/ResourceUploadModal';
import {
  resourcesData as fallbackResources,
  categories,
  difficultyLevels,
} from '../../data/resourcesData';
import apiClient from '../../utils/apiClient';
import { getApiBase } from '../../utils/runtimeConfig';

export default function ResourcesPage({ onBack }) {
  const [resources, setResources] = useState(fallbackResources);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [votedIds, setVotedIds] = useState(() => {
    // Restore voted resource IDs from localStorage so votes survive
    // page interactions and refreshes without requiring a backend read.
    try {
      const stored = localStorage.getItem('ns_resource_voted_ids');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // Ignore malformed or unavailable localStorage
    }
    return new Set();
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const base = getApiBase();
    if (!base) return;

    setLoading(true);
    apiClient(`${base}/api/resources?limit=50`)
      .then((data) => {
        if (data && Array.isArray(data.resources)) {
          const approved = data.resources.filter((r) => r.status === 'approved');
          if (approved.length) setResources(approved);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...resources];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter((r) => r.category === selectedCategory);
    }

    if (selectedDifficulty) {
      result = result.filter((r) => r.difficultyLevel === selectedDifficulty);
    }

    return result;
  }, [resources, searchQuery, selectedCategory, selectedDifficulty]);

  const handleVote = (id) => {
    const hasVoted = votedIds.has(id);

    // Optimistic UI update — reflect vote immediately before API response
    setResources((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const votes = r.votes || [];
        return {
          ...r,
          votes: hasVoted ? votes.slice(0, -1) : [...votes, 'current_user'],
        };
      })
    );
    setVotedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Persist to localStorage so voted state survives page refresh
      try {
        localStorage.setItem('ns_resource_voted_ids', JSON.stringify([...next]));
      } catch {
        // Ignore QuotaExceededError
      }
      return next;
    });

    // Persist vote to backend — consistent with handleDownload which
    // also fires a POST to record the action server-side
    const base = getApiBase();
    if (base) {
      apiClient(`${base}/api/resources/${id}/vote`, { method: 'POST' }).catch(() => {
        // Revert optimistic update on failure
        setResources((prev) =>
          prev.map((r) => {
            if (r.id !== id) return r;
            const votes = r.votes || [];
            return {
              ...r,
              votes: hasVoted ? [...votes, 'current_user'] : votes.slice(0, -1),
            };
          })
        );
        setVotedIds((prev) => {
          const next = new Set(prev);
          if (hasVoted) next.add(id);
          else next.delete(id);
          try {
            localStorage.setItem('ns_resource_voted_ids', JSON.stringify([...next]));
          } catch {
            // Ignore QuotaExceededError
          }
          return next;
        });
      });
    }
  };

  const handleDownload = (id) => {
    const base = getApiBase();
    if (base) {
      apiClient(`${base}/api/resources/${id}/download`, { method: 'POST' }).catch(() => {});
    }
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, downloads: (r.downloads || 0) + 1 } : r))
    );
  };

  const handleSubmitResource = (resource) => {
    const newResource = {
      ...resource,
      id: Date.now().toString(),
      downloads: 0,
      votes: [],
      status: 'pending',
    };
    setResources((prev) => [newResource, ...prev]);
    setShowUploadModal(false);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 60px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--t2)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          padding: '8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '16px',
        }}
      >
        ← Back to Home
      </button>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--t1)' }}>Resource Library</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--t3)', fontSize: '0.9rem' }}>
            Community-curated study materials, templates, notes, and more
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#CC1111',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          + Share Resource
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search resources by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--t1)',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--t1)',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--t1)',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        >
          <option value="">All Levels</option>
          {difficultyLevels.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)' }}>
          Loading resources...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📚</div>
          <p style={{ fontSize: '1rem', margin: '0 0 8px' }}>No resources found</p>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            Try adjusting your search or filters, or share a new resource!
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filtered.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onVote={handleVote}
              onDownload={handleDownload}
              votedByUser={votedIds.has(resource.id)}
            />
          ))}
        </div>
      )}

      <ResourceUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleSubmitResource}
      />
    </div>
  );
}
