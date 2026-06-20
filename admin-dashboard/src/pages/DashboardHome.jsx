import { CopyButton } from '../components/CopyButton';
import { DashboardCardSkeleton } from '../components/DashboardCardSkeleton';
import { useState, useEffect } from 'react';
import { api, auth } from '../services/api';
import { Skeleton } from '../components/Skeleton';
import { AdminIcon } from '../components/AdminIcon';
import { PermissionGuard } from '../components/PermissionGuard';

export function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isOffline = auth.isOfflineMode();

  useEffect(() => {
    Promise.all([
      api.events.getAll().catch(() => ({ events: [] })),
      api.coreTeam.getAll().catch(() => ({ members: [] })),
      api.membership.getAll().catch(() => ({ responses: [] })),
    ]).then(([eventsData, teamData, membershipData]) => {
      const events = eventsData?.events ?? [];
      const team = teamData?.members ?? teamData ?? [];
      const applications = membershipData?.responses ?? [];
      setStats({
        totalEvents: events.length,
        upcomingEvents: events.filter((e) => e.status === 'upcoming').length,
        teamMembers: team.length,
        totalApplications: applications.length,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>

      {/* ── Offline mode banner ── */}
      {isOffline && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '24px',
            fontSize: '0.82rem',
            color: 'rgba(234,179,8,0.9)',
          }}
        >
          <AdminIcon name="WifiOff" size={16} aria-hidden="true" />
          <span>
            <strong>Offline Mode</strong> — Changes are stored in browser localStorage only. Set{' '}
            <code>VITE_API_BASE</code> and <code>VITE_MEMBERSHIP_SCRIPT_URL</code> to connect live
            data sources.
          </span>
        </div>
      )}

      {loading ? (
        <div className="stats-grid">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">
              <AdminIcon name="Calendar" size={28} aria-hidden="true" />
            </span>
            <div>
              <div className="stat-value">{stats.totalEvents}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <AdminIcon name="Clock" size={28} aria-hidden="true" />
            </span>
            <div>
              <div className="stat-value">{stats.upcomingEvents}</div>
              <div className="stat-label">Upcoming Events</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <AdminIcon name="Users" size={28} aria-hidden="true" />
            </span>
            <div>
              <div className="stat-value">{stats.teamMembers}</div>
              <div className="stat-label">Core Team</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <AdminIcon name="FileText" size={28} aria-hidden="true" />
            </span>
            <div>
              <div className="stat-value">{stats.totalApplications}</div>
              <div className="stat-label">
                Applications
                {isOffline && (
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '0.65rem',
                      opacity: 0.6,
                    }}
                  >
                    (offline)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="quick-links">
        <h3>Quick Actions</h3>
        <div className="quick-grid">
          <PermissionGuard requiredScope="events:read">
            <a href="/dashboard/events" className="quick-card" aria-label="Manage events">
              <AdminIcon name="Calendar" size={18} aria-hidden="true" /> Events
            </a>
          </PermissionGuard>
          <PermissionGuard requiredScope="events:read">
            <a
              href="/dashboard/activity-events"
              className="quick-card"
              aria-label="Manage activities"
            >
              <AdminIcon name="Target" size={18} aria-hidden="true" /> Activities
            </a>
          </PermissionGuard>
          <PermissionGuard requiredScope="settings:admin">
            <a href="/dashboard/core-team" className="quick-card" aria-label="Manage core team">
              <AdminIcon name="Users" size={18} aria-hidden="true" /> Team
            </a>
          </PermissionGuard>
          <a
            href="/dashboard/membership"
            className="quick-card"
            aria-label="View membership applications"
          >
            <AdminIcon name="FileText" size={18} aria-hidden="true" /> Membership
          </a>
        </div>
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <CopyButton text={window.location.origin + '/dashboard'} label="Copy Dashboard Link" />
        </div>
      </div>
    </div>
  );
}
