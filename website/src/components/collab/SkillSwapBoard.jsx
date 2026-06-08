import React, { useState } from 'react';

const AVAILABLE_TAGS = [
  'Frontend',
  'Backend',
  'DevOps',
  'Design',
  'Mobile',
  'AI/ML',
  'Cloud',
  'Open Source',
];

function PostSwapModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ teach: '', learn: '', tags: [] });
  const [error, setError] = useState('');

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const handleSubmit = () => {
    if (!form.teach.trim() || !form.learn.trim()) {
      setError('Please fill in both "I can teach" and "I want to learn" fields.');
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            style={{
              margin: 0,
              color: 'var(--t1)',
              fontFamily: "'Orbitron', monospace",
              fontSize: '1rem',
            }}
          >
            Post a Skill Swap
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--t2)',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>I can teach *</label>
          <input
            value={form.teach}
            onChange={(e) => setForm((prev) => ({ ...prev, teach: e.target.value }))}
            placeholder="e.g. React, Python, UI/UX..."
            style={{
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'var(--t1)',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>I want to learn *</label>
          <input
            value={form.learn}
            onChange={(e) => setForm((prev) => ({ ...prev, learn: e.target.value }))}
            placeholder="e.g. Docker, Figma, Next.js..."
            style={{
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'var(--t1)',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: form.tags.includes(tag) ? 'var(--c1)' : 'rgba(255,255,255,0.08)',
                  color: form.tags.includes(tag) ? '#fff' : 'var(--t2)',
                  border: form.tags.includes(tag)
                    ? '1px solid var(--c1)'
                    : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'var(--t2)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              background: 'var(--c1)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Post Swap
          </button>
        </div>
      </div>
    </div>
  );
}

function ConnectModal({ swap, onClose }) {
  const [sent, setSent] = useState(false);

  const handleSend = () => setSent(true);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            style={{
              margin: 0,
              color: 'var(--t1)',
              fontFamily: "'Orbitron', monospace",
              fontSize: '1rem',
            }}
          >
            Connect with {swap.user}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--t2)',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            ×
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✅</div>
            <p style={{ color: 'var(--t1)', fontWeight: 600 }}>Interest sent!</p>
            <p style={{ color: 'var(--t2)', fontSize: '0.9rem' }}>
              {swap.user} will be notified of your interest in this skill swap.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: '16px',
                padding: '10px 24px',
                background: 'var(--c1)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px' }}>
              <p style={{ color: 'var(--t2)', fontSize: '0.85rem', margin: '0 0 4px 0' }}>
                They teach:
              </p>
              <p style={{ color: '#4CAF50', fontWeight: 600, margin: 0 }}>{swap.teach}</p>
              <p style={{ color: 'var(--t2)', fontSize: '0.85rem', margin: '10px 0 4px 0' }}>
                They want to learn:
              </p>
              <p style={{ color: 'var(--c1)', fontWeight: 600, margin: 0 }}>{swap.learn}</p>
            </div>

            <p style={{ color: 'var(--t2)', fontSize: '0.9rem', margin: 0 }}>
              Clicking "Send Interest" will notify {swap.user} that you'd like to connect for this
              skill swap.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'var(--t2)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                style={{
                  padding: '10px 20px',
                  background: 'var(--c1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Send Interest
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SkillSwapBoard() {
  const [swaps, setSwaps] = useState([
    {
      id: 1,
      user: 'Alex',
      teach: 'React & Tailwind',
      learn: 'Figma Prototyping',
      tags: ['Frontend', 'Design'],
    },
    {
      id: 2,
      user: 'Sam',
      teach: 'Python FastAPI',
      learn: 'Docker & DevOps',
      tags: ['Backend', 'DevOps'],
    },
    {
      id: 3,
      user: 'Jordan',
      teach: 'UI/UX Principles',
      learn: 'Next.js Basics',
      tags: ['Design', 'Frontend'],
    },
  ]);

  const [search, setSearch] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [connectSwap, setConnectSwap] = useState(null);

  const handlePostSwap = (form) => {
    setSwaps((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: 'You',
        teach: form.teach,
        learn: form.learn,
        tags: form.tags,
      },
    ]);
  };

  const filteredSwaps = swaps.filter(
    (swap) =>
      swap.teach.toLowerCase().includes(search.toLowerCase()) ||
      swap.learn.toLowerCase().includes(search.toLowerCase()) ||
      swap.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="skill-swap-board">
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search skills to teach or learn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              background: 'var(--surface)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              color: 'var(--t1)',
              fontSize: '0.95rem',
            }}
          />
          <svg
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--t2)',
            }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <button
          onClick={() => setShowPostModal(true)}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: 'var(--c1)',
            border: '1px solid var(--c1)',
            borderRadius: '24px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--c1)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--c1)';
          }}
        >
          Post a Swap
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredSwaps.map((swap) => (
          <div
            key={swap.id}
            className="glass-panel pop-in"
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'var(--surface)',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'transform 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--t1)', fontSize: '1.1rem' }}>{swap.user}</h4>
              <div style={{ display: 'flex', gap: '4px' }}>
                {swap.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: 'var(--t2)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--t2)', marginBottom: '4px' }}>
                I can teach:
              </div>
              <div style={{ color: '#4CAF50', fontWeight: 600 }}>{swap.teach}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--t2)"
                strokeWidth="2"
              >
                <path d="M7 10l5 5 5-5" />
              </svg>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--t2)', marginBottom: '4px' }}>
                I want to learn:
              </div>
              <div style={{ color: 'var(--c1)', fontWeight: 600 }}>{swap.learn}</div>
            </div>

            <button
              onClick={() => setConnectSwap(swap)}
              style={{
                marginTop: '8px',
                padding: '10px',
                width: '100%',
                background: 'rgba(204,17,17,0.1)',
                color: 'var(--c1)',
                border: '1px solid rgba(204,17,17,0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(204,17,17,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(204,17,17,0.1)')}
            >
              Connect
            </button>
          </div>
        ))}
        {filteredSwaps.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px',
              color: 'var(--t2)',
            }}
          >
            No skill swaps found matching "{search}"
          </div>
        )}
      </div>

      {showPostModal && (
        <PostSwapModal onClose={() => setShowPostModal(false)} onSubmit={handlePostSwap} />
      )}

      {connectSwap && <ConnectModal swap={connectSwap} onClose={() => setConnectSwap(null)} />}
    </div>
  );
}
