import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Skeleton } from '../components/Skeleton';
import { AdminIcon } from '../components/AdminIcon';

export function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.events.getAll().catch(() => ({ events: [] })),
      api.coreTeam.getAll().catch(() => ({ members: [] })),
      api.submissions.getMembership().catch(() => ({ submissions: [] })),
      api.submissions.getRecruitment().catch(() => ({ submissions: [] })),
    ]).then(([eventsData, teamData, membershipData, recruitmentData]) => {
      const events = eventsData?.events ?? [];
      const team = teamData?.members ?? [];
      const mSubmissions = membershipData?.submissions ?? [];
      const rSubmissions = recruitmentData?.submissions ?? [];
      
      setStats({
        totalEvents: events.length,
        upcomingEvents: events.filter(e => e.status === 'upcoming').length,
        teamMembers: team.length,
        totalApplications: mSubmissions.length + rSubmissions.length
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>
      {loading ? (
        <div className="stats-grid">
          <Skeleton height={100} count={3} />
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon"><AdminIcon name="Calendar" size={28} /></span>
            <div>
              <div className="stat-value">{stats.totalEvents}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><AdminIcon name="Users" size={28} /></span>
            <div>
              <div className="stat-value">{stats.teamMembers}</div>
              <div className="stat-label">Core Team</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><AdminIcon name="FileText" size={28} /></span>
            <div>
              <div className="stat-value">{stats.totalApplications}</div>
              <div className="stat-label">Applications</div>
            </div>
          </div>
        </div>
      )}
      <div className="quick-links">
        <h3>Quick Actions</h3>
        <div className="quick-grid">
          <a href="/dashboard/events" className="quick-card"><AdminIcon name="Calendar" size={18} /> Events</a>
          <a href="/dashboard/activity-events" className="quick-card"><AdminIcon name="Target" size={18} /> Activities</a>
          <a href="/dashboard/core-team" className="quick-card"><AdminIcon name="Users" size={18} /> Team</a>
          <a href="/dashboard/membership" className="quick-card"><AdminIcon name="FileText" size={18} /> Membership</a>
        </div>
      </div>
    </div>
  );
}
