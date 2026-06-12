'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Calendar, Users, Settings, BarChart, Activity } from 'lucide-react';

/**
 * Localized Sidebar component for the admin panel / dashboard context.
 * Utilizes next-intl useTranslations for all labels.
 */
export const Sidebar: React.FC = () => {
  const t = useTranslations('Dashboard.sidebar');

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#0f0f11',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        color: '#ffffff',
        height: '100%',
        minHeight: 'calc(100vh - 70px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Dashboard Link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            cursor: 'pointer',
          }}
        >
          <LayoutDashboard size={18} color="#ef4444" />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('dashboard')}</span>
        </div>

        {/* Events Link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Calendar size={18} color="#9ca3af" />
          <span style={{ fontSize: '14px', color: '#9ca3af' }}>{t('events')}</span>
        </div>

        {/* Analytics Link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <BarChart size={18} color="#9ca3af" />
          <span style={{ fontSize: '14px', color: '#9ca3af' }}>{t('analytics')}</span>
        </div>

        {/* Membership Link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Users size={18} color="#9ca3af" />
          <span style={{ fontSize: '14px', color: '#9ca3af' }}>{t('membership')}</span>
        </div>

        {/* Activity Events Link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Activity size={18} color="#9ca3af" />
          <span style={{ fontSize: '14px', color: '#9ca3af' }}>{t('activityEvents')}</span>
        </div>

        {/* Settings Link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Settings size={18} color="#9ca3af" />
          <span style={{ fontSize: '14px', color: '#9ca3af' }}>{t('settings')}</span>
        </div>
      </div>
    </aside>
  );
};
