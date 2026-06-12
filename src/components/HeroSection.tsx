'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

/**
 * Localized HeroSection component.
 * Utilizes next-intl translations for the main headers, descriptions, CTAs, and stats.
 */
export const HeroSection: React.FC = () => {
  const t = useTranslations('General');
  const tStats = useTranslations('Dashboard.stats');

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 20px',
        textAlign: 'center',
        color: '#ffffff',
        flex: 1,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
          fontWeight: 900,
          margin: '0 0 16px 0',
          backgroundImage: 'linear-gradient(135deg, #ef4444, #990000)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {t('title')}
      </h1>

      {/* Description */}
      <p
        style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: '#9ca3af',
          maxWidth: '600px',
          margin: '0 auto 36px auto',
          lineHeight: 1.6,
        }}
      >
        {t('description')}
      </p>

      {/* Call to Actions */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '56px',
        }}
      >
        <button
          style={{
            padding: '12px 28px',
            borderRadius: '12px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
        >
          {t('join')}
        </button>

        <button
          style={{
            padding: '12px 28px',
            borderRadius: '12px',
            backgroundColor: 'transparent',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          {t('apply')}
        </button>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          maxWidth: '540px',
          width: '100%',
          backgroundColor: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.12)',
          borderRadius: '16px',
          padding: '20px 24px',
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginBottom: '4px' }}>
            12
          </div>
          <div
            style={{
              fontSize: '10px',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {tStats('members')}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            borderLeft: '1px solid rgba(239, 68, 68, 0.12)',
            borderRight: '1px solid rgba(239, 68, 68, 0.12)',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginBottom: '4px' }}>
            8
          </div>
          <div
            style={{
              fontSize: '10px',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {tStats('activities')}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginBottom: '4px' }}>
            1
          </div>
          <div
            style={{
              fontSize: '10px',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {tStats('eventsDone')}
          </div>
        </div>
      </div>
    </section>
  );
};
