import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number | string;
  loading?: boolean;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  children,
  height = 300,
  loading = false,
}) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(204,17,17,0.25)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '14px',
        padding: '1.4rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 0.25s, transform 0.25s',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <h3
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '1rem',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.05em',
            margin: '0 0 0.25rem',
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ width: '100%', position: 'relative', height: height }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10,10,10,0.8)',
              zIndex: 10,
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.08)',
                borderTop: '3px solid #CC1111',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          fontFamily: "'Rajdhani', sans-serif",
        }}
      >
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
            marginBottom: '0.5rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            margin: '0 0 0.5rem',
          }}
        >
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div
            key={`item-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: entry.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>
              {entry.name}:
            </span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
