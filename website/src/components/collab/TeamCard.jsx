import React from 'react';

export default function TeamCard({ team, onJoin }) {
  return (
    <div
      className="glass-panel pop-in"
      role="article"
      aria-label={`${team.name} — ${team.hackathonName}`}
      style={{
        padding: '24px',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'var(--surface)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(204,17,17,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--t1)', fontWeight: 600 }}>
            {team.name}
          </h3>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '0.85rem',
              color: 'var(--c1)',
              fontWeight: 500,
            }}
          >
            {team.hackathonName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {team.vacantRoles?.map((role) => (
            <span
              key={role}
              style={{
                background: 'rgba(204,17,17,0.1)',
                color: 'var(--c1)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid rgba(204,17,17,0.2)',
              }}
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--t2)', lineHeight: 1.5 }}>
        {team.description}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto' }}>
        {team.techStack?.map((tech) => (
          <span
            key={tech}
            style={{
              background: 'var(--surface-hover)',
              color: 'var(--t2)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {tech}
          </span>
        ))}
      </div>

      <button
        onClick={() => onJoin(team)}
        aria-label={`Request to join ${team.name}`}
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '10px',
          background: 'linear-gradient(135deg, #CC1111, #880000)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.9)}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
      >
        Request to Join
      </button>
    </div>
  );
}
