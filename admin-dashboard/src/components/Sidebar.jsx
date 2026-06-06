import { useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminIcon } from './AdminIcon';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { PermissionGuard } from './PermissionGuard';

/* URL of the public website — configurable via .env */
const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5175';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'Dashboard' },
  { to: '/dashboard/events', label: 'Events', icon: 'Calendar', requiredScope: 'events:read' },
  {
    to: '/dashboard/event-registrations',
    label: 'Registrations',
    icon: 'FileText',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/event-scanner',
    label: 'Scanner',
    icon: 'Camera',
    requiredScope: 'events:write',
  },
  {
    to: '/dashboard/event-analytics',
    label: 'Analytics',
    icon: 'BarChart',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/activity-events',
    label: 'Activity Events',
    icon: 'Target',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/core-team',
    label: 'Core Team',
    icon: 'Users',
    requiredScope: 'settings:admin',
  },
  { to: '/dashboard/membership', label: 'Membership', icon: 'FileText' },
  { to: '/dashboard/recruitment', label: 'Recruitment', icon: 'UserPlus' },
  { to: '/dashboard/certificates', label: 'Certificates', icon: 'Award' },
  { to: '/dashboard/announcements', label: 'Announcements', icon: 'Megaphone' },
];

export function Sidebar() {
  const { email, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const sidebarRef = useFocusTrap(open, close);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <button
        className="sidebar-hamburger"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="admin-sidebar"
        onClick={toggle}
      >
        <span className={`ham-line${open ? ' open' : ''}`} />
        <span className={`ham-line${open ? ' open' : ''}`} />
        <span className={`ham-line${open ? ' open' : ''}`} />
      </button>

      {open && <div className="sidebar-backdrop" onClick={close} aria-hidden="true" />}

      <aside
        id="admin-sidebar"
        ref={sidebarRef}
        className={`sidebar${open ? ' sidebar-open' : ''}`}
        aria-label="Admin navigation"
      >
        <div className="sidebar-brand">
          <span className="brand-dot" />
          <span>NexaSphere Admin</span>
        </div>

        {/* Back to website link */}
        <a
          href={WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-back-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            fontSize: '0.75rem',
            color: 'var(--admin-text-muted, #888)',
            textDecoration: 'none',
            borderBottom: '1px solid var(--admin-border, rgba(255,255,255,0.06))',
            marginBottom: '8px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--admin-accent, #CC1111)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--admin-text-muted, #888)')}
        >
          <AdminIcon name="ArrowLeft" size={12} aria-hidden="true" />
          Back to Website
        </a>

        <nav className="sidebar-nav">
          {links.map(({ to, label, icon, requiredScope }) => {
            const LinkElement = (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={close}
              >
                <AdminIcon name={icon} size={16} aria-hidden="true" />
                {label}
              </NavLink>
            );

            if (requiredScope) {
              return (
                <PermissionGuard key={to} requiredScope={requiredScope}>
                  {LinkElement}
                </PermissionGuard>
              );
            }
            return LinkElement;
          })}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-email">{email}</span>
          <button className="btn-logout" onClick={logout} aria-label={`Logout ${email}`}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
