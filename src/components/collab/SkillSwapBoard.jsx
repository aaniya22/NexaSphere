import React, { useState } from 'react';

export default function SkillSwapBoard() {
  // Mock data for initial UI
  const [swaps, setSwaps] = useState([
    { id: 1, user: 'Alex', teach: 'React & Tailwind', learn: 'Figma Prototyping', tags: ['Frontend', 'Design'] },
    { id: 2, user: 'Sam', teach: 'Python FastAPI', learn: 'Docker & DevOps', tags: ['Backend', 'DevOps'] },
    { id: 3, user: 'Jordan', teach: 'UI/UX Principles', learn: 'Next.js Basics', tags: ['Design', 'Frontend'] }
  ]);

  const [search, setSearch] = useState('');

  const filteredSwaps = swaps.filter(swap => 
    swap.teach.toLowerCase().includes(search.toLowerCase()) || 
    swap.learn.toLowerCase().includes(search.toLowerCase()) ||
    swap.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
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
              width: '100%', padding: '12px 16px 12px 40px',
              background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px', color: 'var(--t1)', fontSize: '0.95rem'
            }}
          />
          <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t2)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <button style={{
          padding: '12px 24px', background: 'transparent', color: 'var(--c1)',
          border: '1px solid var(--c1)', borderRadius: '24px', cursor: 'pointer',
          fontWeight: 600, transition: 'background 0.2s, color 0.2s'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--c1)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c1)'; }}>
          Post a Swap
        </button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'
      }}>
        {filteredSwaps.map(swap => (
          <div key={swap.id} className="glass-panel pop-in" style={{
            padding: '20px', borderRadius: '16px', background: 'var(--surface)',
            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column',
            gap: '12px', transition: 'transform 0.3s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--t1)', fontSize: '1.1rem' }}>{swap.user}</h4>
              <div style={{ display: 'flex', gap: '4px' }}>
                {swap.tags.map(t => (
                  <span key={t} style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--t2)' }}>{t}</span>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--t2)', marginBottom: '4px' }}>I can teach:</div>
              <div style={{ color: '#4CAF50', fontWeight: 600 }}>{swap.teach}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2">
                <path d="M7 10l5 5 5-5" />
              </svg>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--t2)', marginBottom: '4px' }}>I want to learn:</div>
              <div style={{ color: 'var(--c1)', fontWeight: 600 }}>{swap.learn}</div>
            </div>

            <button style={{
              marginTop: '8px', padding: '10px', width: '100%', background: 'rgba(204,17,17,0.1)',
              color: 'var(--c1)', border: '1px solid rgba(204,17,17,0.2)', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(204,17,17,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(204,17,17,0.1)'}>
              Connect
            </button>
          </div>
        ))}
        {filteredSwaps.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--t2)' }}>
            No skill swaps found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
