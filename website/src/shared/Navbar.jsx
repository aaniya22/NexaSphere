import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND_LOGO_FULL, BRAND_LOGO_ICON } from './brandAssets';
import NotificationBell from '../components/NotificationBell';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useStudentAuth } from '../context/StudentAuthContext';

const TABS = [
  'Home',
  'Activities',
  'Events',
  'Projects',
  'Roadmaps',
  'Portfolio',
  'Resources',
  'Gamification',
  'Forum',
  'Mentorship',
  'Sponsors',
  'About',
  'Core Team',
  'Contact',
];

function BookmarkToggle({ onToggle }) {
  return (
    <button
      className="ns-bookmark-toggle"
      onClick={onToggle}
      aria-label="Open Bookmarks"
      title="Saved Bookmarks"
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--t1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        borderRadius: '50%',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>
  );
}

export default function Navbar({ activeTab, onTabChange, onApply, onJoin, onToggleBookmarks }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(window.innerWidth <= 1200);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20);
    const r = () => {
      const isCompact = window.innerWidth <= 1200;
      setCompact(isCompact);
      if (!isCompact) setMenuOpen(false);
    };
    window.addEventListener('scroll', s, { passive: true });
    window.addEventListener('resize', r, { passive: true });
    return () => {
      window.removeEventListener('scroll', s);
      window.removeEventListener('resize', r);
    };
  }, []);

  const { user, isAuthenticated, login } = useStudentAuth();

  const handleTab = (tab) => {
    setMenuOpen(false);
    onTabChange(tab);
  };

  const goHome = () => {
    setMenuOpen(false);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (compact)
    return (
      <nav className="ns-navbar-mobile">
        <div
          className="ns-mobile-top"
          onClick={goHome}
          style={{ cursor: 'pointer' }}
          aria-label="Go to homepage"
        >
          <img
            src={BRAND_LOGO_ICON}
            alt="NexaSphere"
            className="ns-mobile-logo-ns"
            loading="lazy"
            width="28"
            height="28"
          />

          <span className="ns-mobile-brand">
            <span>NexaSphere</span>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationBell />
            <button
              onClick={() => navigate('/notifications')}
              aria-label="Notification history"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t2)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                padding: '2px 6px',
              }}
              title="View all notifications"
            >
              📋
            </button>
            <BookmarkToggle onToggle={onToggleBookmarks} />
            <ThemeToggle />
            {isAuthenticated ? (
              <span
                className="ns-nav-user-badge"
                onClick={() => navigate('/dashboard')}
                style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--t1)' }}
                title={user?.name || user?.email}
              >
                👤
              </span>
            ) : (
              <button
                className="ns-nav-login-btn"
                onClick={() => login('google')}
                aria-label="Sign in"
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  color: 'var(--t1)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>

        <div className="ns-mobile-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`ns-mobile-tab${
                activeTab === t ? ' active' : ''
              }${t === 'Contact' ? ' contact-tab' : ''}`}
              onClick={() => handleTab(t)}
              aria-current={activeTab === t ? 'page' : undefined}
            >
              {t}
            </button>
          ))}

          <button
            className="ns-mobile-tab ns-mobile-cta"
            onClick={onJoin}
            aria-label="Join as Member"
          >
            Join
          </button>

          <button
            className="ns-mobile-tab ns-mobile-cta ns-mobile-cta-apply"
            onClick={onApply}
            aria-label="Apply for Core Team"
          >
            Apply
          </button>
        </div>
      </nav>
    );

  return (
    <nav className={`ns-navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <div className="ns-nav-top">
          <div
            className="ns-nav-logos"
            onClick={goHome}
            style={{ cursor: 'pointer' }}
            aria-label="Go to homepage"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && goHome()}
          >
            <img
              src={BRAND_LOGO_FULL}
              alt="NexaSphere"
              className="ns-nav-logo-ns ns-nav-logo-icon"
            />
            <div className="ns-nav-divider" />
            <span className="ns-nav-brand">NexaSphere</span>
          </div>

          <div className="ns-nav-actions">
            <NotificationBell />
            <button
              onClick={() => navigate('/notifications')}
              aria-label="Notification history"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t2)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '4px',
              }}
              title="View all notifications"
            >
              📋
            </button>
            <BookmarkToggle onToggle={onToggleBookmarks} />
            <div className="ns-nav-ctas">
              <button
                className="btn btn-sm btn-outline ns-nav-cta-btn"
                onClick={onJoin}
                aria-label="Join as Member"
              >
                Join
              </button>

              <button
                className="btn btn-sm btn-primary ns-nav-cta-btn"
                onClick={onApply}
                aria-label="Apply for Core Team"
              >
                Apply
              </button>
            </div>

            <ThemeToggle />

            {isAuthenticated ? (
              <span
                className="ns-nav-user-badge"
                onClick={() => navigate('/dashboard')}
                style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--t1)' }}
                title={user?.name || user?.email}
              >
                👤
              </span>
            ) : (
              <button
                className="btn btn-sm btn-outline"
                onClick={() => login('google')}
                aria-label="Sign in"
                style={{ marginLeft: '4px' }}
              >
                Login
              </button>
            )}

            <button
              className={`ns-nav-menu-toggle${menuOpen ? ' open' : ''}`}
              onClick={() => compact && setMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <div className="ns-nav-menu">
          <ul className="ns-nav-tabs">
            {TABS.map((t) => (
              <li key={t}>
                <button
                  className={`ns-nav-tab${activeTab === t ? ' active' : ''}${
                    t === 'Contact' ? ' contact-tab contact-nav-tab' : ''
                  }`}
                  onClick={() => handleTab(t)}
                  aria-current={activeTab === t ? 'page' : undefined}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
