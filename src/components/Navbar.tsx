'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

/**
 * Localized Navbar component.
 * Extracts all UI text dynamically using next-intl useTranslations.
 */
export const Navbar: React.FC = () => {
  const t = useTranslations('General');

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        backgroundColor: 'rgba(20, 20, 25, 0.75)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand Logo / Title */}
      <div style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '0.05em', color: '#ef4444' }}>
        {t('title')}
      </div>

      {/* Tabs / Links */}
      <div style={{ display: 'flex', gap: '28px', fontSize: '14px', fontWeight: 500 }}>
        <a
          href="#home"
          style={{ color: '#f3f4f6', textDecoration: 'none', transition: 'color 0.2s' }}
        >
          {t('home')}
        </a>
        <a
          href="#about"
          style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
        >
          {t('about')}
        </a>
        <a
          href="#events"
          style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
        >
          {t('events')}
        </a>
        <a
          href="#projects"
          style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
        >
          {t('projects')}
        </a>
        <a
          href="#contact"
          style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
        >
          {t('contact')}
        </a>
      </div>

      {/* Action Button */}
      <div>
        <button
          style={{
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            color: '#f3f4f6',
            fontSize: '13px',
            fontWeight: 600,
            padding: '8px 16px',
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
          {t('join')}
        </button>
      </div>
    </nav>
  );
};
