import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminIcon } from './AdminIcon';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { PermissionGuard } from './PermissionGuard';

/* Public website URL */
const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5175';

const links = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: 'Dashboard',
  },
  {
    to: '/dashboard/events',
    label: 'Events',
    icon: 'Calendar',
  },
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
  {
    to: '/dashboard/core-team',
    label: 'Core Team',
    icon: 'Users',
  },
  {
    to: '/dashboard/membership',
    label: 'Membership',
    icon: 'FileText',
  },
  {
    to: '/dashboard/recruitment',
    label: 'Recruitment',
    icon: 'UserPlus',
  },
  {
    to: '/dashboard/certificates',
    label: 'Certificates',
    icon: 'Award',
  },
  {
    to: '/dashboard/announcements',
    label: 'Announcements',
    icon: 'Megaphone',
  },
  { to: '/dashboard/membership', label: 'Membership', icon: 'FileText' },
  { to: '/dashboard/recruitment', label: 'Recruitment', icon: 'UserPlus' },
  { to: '/dashboard/certificates', label: 'Certificates', icon: 'Award' },
  { to: '/dashboard/announcements', label: 'Announcements', icon: 'Megaphone' },
  {
    to: '/dashboard/portfolios',
    label: 'Portfolios',
    icon: 'FileText',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/forum',
    label: 'Forum',
    icon: 'FileText',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/mentorship',
    label: 'Mentorship',
    icon: 'Users',
  },
  {
    to: '/dashboard/streams',
    label: 'Live Streams',
    icon: 'Camera',
  },
  {
    to: '/dashboard/circuit-breaker',
    label: 'Circuit Breaker',
    icon: 'Activity',
  },
  {
    to: '/dashboard/sponsorships',
    label: 'Sponsorships',
    icon: 'Handshake',
    requiredScope: 'events:read',
  },
];

export function Sidebar() {
  const { email, logout } = useAuth();

  const location = useLocation();

  const [open, setOpen] = useState(false);

  const sidebarRef = useRef(null);

  const hamburgerRef = useRef(null);

  const firstNavLinkRef = useRef(null);

  const close = () => {
    setOpen(false);

    // Restore focus to hamburger button
    hamburgerRef.current?.focus();
  };

  // Focus first link when sidebar opens
  useEffect(() => {
    if (open) {
      firstNavLinkRef.current?.focus();
    }
  }, [open]);

  // ESC closes sidebar
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && open) {
        close();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Trap focus inside mobile sidebar
  useEffect(() => {
    if (!open || !sidebarRef.current) return;

    const focusableElements = sidebarRef.current.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];

    const lastElement = focusableElements[focusableElements.length - 1];

    function trapFocus(event) {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();

          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();

          firstElement.focus();
        }
      }
    }

    document.addEventListener('keydown', trapFocus);

    return () => {
      document.removeEventListener('keydown', trapFocus);
    };
  }, [open]);

  return (
    <>
      {/* Mobile Hamburger */}

      <button
        ref={hamburgerRef}
        className="sidebar-hamburger"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        aria-controls="admin-sidebar"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`ham-line${open ? ' open' : ''}`} />

        <span className={`ham-line${open ? ' open' : ''}`} />

        <span className={`ham-line${open ? ' open' : ''}`} />
      </button>

      {/* Mobile Backdrop */}

      {open && <div className="sidebar-backdrop" onClick={close} aria-hidden="true" />}

      <aside
        id="admin-sidebar"
        ref={sidebarRef}
        className={`sidebar${open ? ' sidebar-open' : ''}`}
        role="navigation"
        aria-label="Admin Sidebar Navigation"
      >
        {/* Branding */}

        <div className="sidebar-brand">
          <span className="brand-dot" aria-hidden="true" />

          <span>NexaSphere Admin</span>
        </div>

        {/* Back To Website */}

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

        {/* Navigation */}

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

        {/* Footer */}

        <div className="sidebar-footer">
          <span className="sidebar-email" aria-label={`Logged in as ${email}`}>
            {email}
          </span>

          <button className="btn-logout" onClick={logout} aria-label={`Logout ${email}`}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
