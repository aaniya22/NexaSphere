import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  lazy,
  Suspense,
  memo,
} from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
  Navigate,
} from 'react-router-dom';

import './styles/themes.css';
import './styles/globals.css';
import './styles/animations.css';
import './styles/chatbot.css';
import './styles/components.css';
import './styles/portfolio.css';
import './styles/pwa.css';
import './styles/aurora.css';
import './styles/motion.css';

import SearchBar from './components/SearchBar';
import FloatingDock from './components/common/FloatingDock';
import ParticleBackground from './shared/ParticleBackground';
import GeometricGridBackground from './shared/GeometricGridBackground';
import ScrollProgress from './shared/ScrollProgress';
import Navbar from './shared/Navbar';
import { DynamicIcon } from './shared/Icons';
import HeroSection from './pages/home/HeroSection';
import ActivitiesSection from './pages/activities/ActivitiesSection';
import EventsSection from './pages/events/EventsSection';
import AboutSection from './pages/about/AboutSection';
import TeamSection from './pages/team/TeamSection';
import Footer from './shared/Footer';
import CinematicOpening from './shared/CinematicOpening';
import Chatbot from './shared/Chatbot';
import {
  AmbientOrbs,
  SectionDivider,
  PageFlash,
  useNsReveal,
  useHeroParallax,
  useNavScrollTint,
  useGlobalMouseParallax,
  useMagneticCards,
} from './shared/MotionLayer';
import apiClient from './utils/apiClient.js';
import {
  getLocalEvents,
  mergeEvents,
  subscribePublicContent,
  initStorageSyncBridge,
} from './utils/publicContentStore.js';
import { initializeSocket, on, off, joinRoom } from './utils/socketClient.js';
import NotFoundPage from './pages/NotFoundPage';

import { activityPages } from './data/activities/index';
import { events as fallbackEvents } from './data/eventsData';
import nexasphereLogo from './assets/images/logos/nexasphere-logo.png';

import Terminal from './components/developer/Terminal';
import { useDeveloperMode } from './hooks/useDeveloperMode';

import { BookmarkProvider } from './context/BookmarkContext';
import { StudentAuthProvider, useStudentAuth } from './context/StudentAuthContext';
import BookmarksDrawer from './components/bookmarks/BookmarksDrawer';
import { useTheme } from './hooks/useTheme';
import { useInteractionEffects } from './hooks/useInteractionEffects';
import { useBackToTop } from './hooks/useScrollLogic';

import MoveToTop from './shared/MoveToTop';
import OfflineBanner from './components/pwa/OfflineBanner.jsx';
import InstallPrompt from './components/pwa/InstallPrompt.jsx';
import UpdatePrompt from './components/pwa/UpdatePrompt.jsx';

// Lazy-loaded heavy pages
const RecruitmentPage = lazy(() => import('./pages/recruitment/RecruitmentPage'));
const MembershipPage = lazy(() => import('./pages/membership/MembershipPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const ActivitiesPage = lazy(() => import('./pages/activities/ActivitiesPage'));
const ActivityDetailPage = lazy(() => import('./pages/activities/ActivityDetailPage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage'));
const AboutPage = lazy(() => import('./pages/about/AboutPage'));
const TeamPage = lazy(() => import('./pages/team/TeamPage'));
const ContactPage = lazy(() => import('./pages/contact/ContactPage'));
const RoadmapsPage = lazy(() => import('./pages/roadmaps/RoadmapsPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const CertificateVerifyPage = lazy(() => import('./pages/certificates/CertificateVerifyPage'));
const CollabPage = lazy(() => import('./pages/collab/CollabPage'));
const PortfolioBuilder = lazy(() => import('./components/portfolio/PortfolioBuilder'));
const PublicPortfolio = lazy(() => import('./pages/portfolio/PublicPortfolio'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const WorkspacePage = lazy(() => import('./pages/workspace/WorkspacePage'));
const GamificationDashboard = lazy(() => import('./components/gamification/GamificationDashboard'));
const ForumPage = lazy(() => import('./pages/forum/ForumPage'));
const ForumThreadPage = lazy(() => import('./pages/forum/ForumThreadPage'));
const LoginPage = lazy(() => import('./pages/login/LoginPage'));
const MentorsPage = lazy(() => import('./pages/mentorship/MentorsPage'));
const MentorshipDashboard = lazy(() => import('./pages/mentorship/MentorshipDashboard'));
const LiveStreamPage = lazy(() => import('./pages/streaming/LiveStreamPage'));

const MNH = 88,
  DNH = 64;

/* ── Page wipe transition ── */
const Wipe = memo(function Wipe({ on: wipeOn, ph }) {
  if (!wipeOn) return null;
  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8000,
          background: 'var(--bg)',
          animation: `${ph === 'out' ? 'wipeDown .27s' : 'wipeUp .30s'} cubic-bezier(.77,0,.18,1) forwards`,
          pointerEvents: 'all',
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8001,
          background: 'linear-gradient(90deg,#CC1111,#880000,#EE2222)',
          opacity: 0.09,
          animation: `${ph === 'out' ? 'wipeDown .20s .04s' : 'wipeUp .24s .04s'} cubic-bezier(.77,0,.18,1) forwards`,
          pointerEvents: 'none',
        }}
      />
      {ph === 'out' && <div className="wipe-shimmer" aria-hidden="true" />}
      {ph === 'in' && <PageFlash />}
      {ph === 'out' && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 8002,
            pointerEvents: 'none',
            opacity: 0,
            animation: 'splashIn .16s .1s ease forwards',
          }}
        >
          <img
            src={nexasphereLogo}
            style={{
              height: '46px',
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 0 12px var(--c1))',
              opacity: 0.6,
            }}
            alt=""
          />
        </div>
      )}
    </>
  );
});

/* ── Page enter animation ── */
const PageIn = memo(function PageIn({ children, k }) {
  const [r, setR] = useState(false);
  useLayoutEffect(() => {
    let rafOne = 0;
    let rafTwo = 0;
    setR(false);
    rafOne = requestAnimationFrame(() => {
      rafTwo = requestAnimationFrame(() => setR(true));
    });
    return () => {
      cancelAnimationFrame(rafOne);
      cancelAnimationFrame(rafTwo);
    };
  }, [k]);
  return (
    <div
      style={{
        opacity: r ? 1 : 0,
        transform: r ? 'none' : 'translateY(16px) scale(.99)',
        transition:
          'opacity .42s cubic-bezier(.22,1,.36,1),transform .42s cubic-bezier(.22,1,.36,1)',
        willChange: 'opacity,transform',
      }}
    >
      {children}
    </div>
  );
});

/* ── Anti-gravity orb cursor ── */
function Cursor() {
  const orbRef = useRef(null);
  const trailRef = useRef(null);
  const glowRef = useRef(null);
  const stateRef = useRef({
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
    raf: null,
  });

  useEffect(() => {
    if (window.matchMedia('(hover:none)').matches) return;
    document.body.style.cursor = 'none';
    const s = stateRef.current;
    const onMove = (e) => {
      s.mx = e.clientX;
      s.my = e.clientY;
    };
    const onDown = () => {
      s.clicking = true;
    };
    const onUp = () => {
      s.clicking = false;
    };
    const onOver = (e) => {
      s.hovering = !!e.target.closest('button,a,[role="button"],[tabindex]');
    };
    const onMouseLeave = () => {
      s.visible = false;
      if (orbRef.current) orbRef.current.style.display = 'none';
      if (trailRef.current) trailRef.current.style.display = 'none';
      if (glowRef.current) glowRef.current.style.display = 'none';
    };
    const onMouseEnter = () => {
      s.visible = true;
      if (orbRef.current) orbRef.current.style.display = 'block';
      if (trailRef.current) trailRef.current.style.display = 'block';
      if (glowRef.current) glowRef.current.style.display = 'block';
    };
    const tick = () => {
      s.ox += (s.mx - s.ox) * 1.0;
      s.oy += (s.my - s.oy) * 1.0;
      s.floatPhase += 0.022;
      s.floatY =
        Math.sin(s.floatPhase) * 2 +
        Math.sin(s.floatPhase * 1.7) * 1 +
        Math.sin(s.floatPhase * 0.5) * 1;
      const fy = s.oy + s.floatY;
      const scale = s.clicking ? 0.7 : s.hovering ? 1.55 : 1;
      const opacity = s.visible ? (s.hovering ? 0.95 : 0.82) : 0;
      if (orbRef.current) {
        orbRef.current.style.left = s.ox + 'px';
        orbRef.current.style.top = fy + 'px';
        orbRef.current.style.transform = `translate(-50%,-50%) scale(${scale})`;
        orbRef.current.style.opacity = opacity;
      }
      if (trailRef.current) {
        trailRef.current.style.left = s.ox + 'px';
        trailRef.current.style.top = s.oy + s.floatY * 0.4 + 'px';
        trailRef.current.style.opacity = s.visible ? (s.hovering ? 0 : 0.35) : 0;
      }
      if (glowRef.current) {
        glowRef.current.style.left = s.mx + 'px';
        glowRef.current.style.top = s.my + 'px';
        glowRef.current.style.opacity = s.visible ? 1 : 0;
      }
      s.raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onOver, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);
    s.raf = requestAnimationFrame(tick);
    return () => {
      document.body.style.cursor = '';
      cancelAnimationFrame(s.raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  return (
    <>
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 10000,
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(204,17,17,.055) 0%, rgba(136,0,0,.03) 40%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          transition: 'opacity .3s',
          willChange: 'transform, opacity',
        }}
      />
      <div
        ref={trailRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 10002,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,17,17,0.7) 0%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          filter: 'blur(6px)',
          transition: 'opacity .25s',
          willChange: 'transform, opacity',
        }}
      />
      <div
        ref={orbRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 100000,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #fff 0%, #CC1111 40%, #880000 100%)',
          boxShadow:
            '0 0 10px rgba(204,17,17,.9), 0 0 24px rgba(204,17,17,.5), 0 0 50px rgba(136,0,0,.3)',
          transition: 'transform .08s cubic-bezier(.34,1.56,.64,1), opacity .2s',
          willChange: 'transform, opacity',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '22%',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,.9)',
            filter: 'blur(1px)',
          }}
        />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────
   Root App — wraps everything in BrowserRouter
───────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <StudentAuthProvider>
        <AppShell />
      </StudentAuthProvider>
    </BrowserRouter>
  );
}

/* ─────────────────────────────────────────────────────
   AppShell — initialises global systems, reads location
───────────────────────────────────────────────────── */
function AppShell() {
  const location = useLocation();
  const [cinDone, setCinDone] = useState(false);
  const [eventsData, setEventsData] = useState(() => getLocalEvents(fallbackEvents));
  const { resolvedTheme: theme } = useTheme();
  const { isOpen: isTerminalOpen, closeTerminal } = useDeveloperMode();

  // Skip cinematic opening for deep links (anything except "/")
  useEffect(() => {
    if (location.pathname !== '/') {
      setCinDone(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket + cross-origin localStorage sync
  useEffect(() => {
    const socket = initializeSocket();
    if (socket) {
      joinRoom('events-room');
      joinRoom('notifications-room');
    }
    initStorageSyncBridge();
    const onPostMessage = (e) => {
      if (e.data && e.data.type === 'ns-content-updated' && e.data.key) {
        window.dispatchEvent(new Event('ns-content-updated'));
      }
    };
    window.addEventListener('message', onPostMessage);
    return () => window.removeEventListener('message', onPostMessage);
  }, []);

  // Events data fetching
  useEffect(() => {
    let alive = true;
    const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
    const applyLocalEvents = () => {
      if (alive) setEventsData(getLocalEvents(fallbackEvents));
    };

    if (!base) {
      applyLocalEvents();
      return subscribePublicContent(applyLocalEvents);
    }

    const url = `${base}/api/content/events`;
    const fetchEvents = () => {
      apiClient(url)
        .then((data) => {
          if (!alive) return;
          if (data && Array.isArray(data.events)) {
            setEventsData(
              data.events.length
                ? mergeEvents(fallbackEvents, data.events)
                : getLocalEvents(fallbackEvents)
            );
          } else if (Array.isArray(data)) {
            setEventsData(
              data.length ? mergeEvents(fallbackEvents, data) : getLocalEvents(fallbackEvents)
            );
          } else {
            setEventsData(getLocalEvents(fallbackEvents));
          }
        })
        .catch(() => {
          if (!alive) return;
          setEventsData((prev) => (prev?.length ? prev : getLocalEvents(fallbackEvents)));
        });
    };

    fetchEvents();
    // Removed unconditional 4s polling — socket event handles live updates.
    // Re-fetch once when the tab becomes visible again after being backgrounded.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchEvents();
    };
    const onContentUpdated = (data) => {
      if (data?.type === 'events' || data?.type === 'activities') fetchEvents();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    on('content:updated', onContentUpdated);

    return () => {
      alive = false;
      clearInterval(interval);
      off('content:updated', onContentUpdated);
    };
  }, []);

  // Push notifications
  useEffect(() => {
    if (!cinDone) return;
    const initPush = async () => {
      try {
        const { initializePushNotifications } = await import('./utils/pushNotificationClient');
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
        if (vapidKey) await initializePushNotifications(vapidKey);
      } catch (err) {
        console.warn('Push notification initialization skipped:', err);
      }
    };
    const timer = setTimeout(initPush, 3500);
    return () => clearTimeout(timer);
  }, [cinDone]);

  /* ── SW update prompt ── */
  const [swUpdateFn, setSwUpdateFn] = useState(null);
  useEffect(() => {
    const handle = (e) => {
      if (e.detail?.updateSW) setSwUpdateFn(() => e.detail.updateSW);
    };
    window.addEventListener('nexasphere:sw-update', handle);
    return () => window.removeEventListener('nexasphere:sw-update', handle);
  }, []);

  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);

  /* Ctrl+K / Cmd+K */
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  return (
    <BookmarkProvider>
      {/* PWA Components */}
      <OfflineBanner />
      <InstallPrompt />
      {swUpdateFn && <UpdatePrompt updateSW={swUpdateFn} />}

      <Chatbot />

      {/* Loading screen — prevents white-flash during cinematic opening */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8900,
          background: theme === 'light' ? '#FFFFFF' : '#0A0A0A',
          opacity: cinDone ? 0 : 1,
          transition: 'opacity .5s ease',
          pointerEvents: 'none',
        }}
      />

      {!cinDone && <CinematicOpening theme={theme} onDone={() => setCinDone(true)} />}

      {cinDone && <ScrollProgress />}
      <Cursor />

      {/* Route-aware main content */}
      <MainRouter
        cinDone={cinDone}
        setCinDone={setCinDone}
        theme={theme}
        eventsData={eventsData}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        bookmarksOpen={bookmarksOpen}
        setBookmarksOpen={setBookmarksOpen}
        isTerminalOpen={isTerminalOpen}
        closeTerminal={closeTerminal}
      />
    </BookmarkProvider>
  );
}

/* ─────────────────────────────────────────────────────
   RequireAuth Wrapper
───────────────────────────────────────────────────── */
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useStudentAuth();
  if (loading) return <PageLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

/* ─────────────────────────────────────────────────────
   MainRouter — renders the Navbar + Routes
───────────────────────────────────────────────────── */
function MainRouter({
  cinDone,
  setCinDone,
  theme,
  eventsData,
  searchOpen,
  setSearchOpen,
  bookmarksOpen,
  setBookmarksOpen,
  isTerminalOpen,
  closeTerminal,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  const [wipeOn, setWipeOn] = useState(false);
  const [wipePh, setWipePh] = useState('out');
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Sync activeTab with current URL
  useEffect(() => {
    const pathMap = {
      '/': 'Home',
      '/activities': 'Activities',
      '/events': 'Events',
      '/projects': 'Projects',
      '/roadmaps': 'Roadmaps',
      '/portfolio': 'Portfolio',
      '/collab': 'Collab',
      '/about': 'About',
      '/team': 'Core Team',
      '/contact': 'Contact',
      '/dashboard': 'Dashboard',
      '/analytics': 'Analytics',
      '/gamification': 'Gamification',
      '/apply': 'Apply',
      '/join': 'Join',
      '/explore': 'Explore',
      '/forum': 'Forum',
      '/mentorship': 'Mentorship',
      '/mentorship/mentors': 'Mentorship',
      '/mentorship/dashboard': 'Mentorship',
    };
    const tab = pathMap[location.pathname] || 'Home';
    setActiveTab(tab);
  }, [location.pathname]);

  // Scroll-spy on home page
  useEffect(() => {
    if (location.pathname !== '/') return;
    const HOME_SECTIONS = ['Home', 'Activities', 'Events', 'About', 'Core Team', 'Contact'];
    const nh = mobile ? MNH : DNH;
    const fn = () => {
      const sy = window.scrollY + nh + 30;
      for (let i = HOME_SECTIONS.length - 1; i >= 0; i--) {
        const idStr = HOME_SECTIONS[i] === 'Core Team' ? 'team' : HOME_SECTIONS[i].toLowerCase();
        const el = document.getElementById(`section-${idStr}`);
        if (el && el.offsetTop <= sy) {
          setActiveTab(HOME_SECTIONS[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [mobile, location.pathname]);

  useInteractionEffects(cinDone, location.pathname !== '/');
  useBackToTop();
  useNsReveal([cinDone, location.pathname]);
  useHeroParallax();
  useNavScrollTint();
  useGlobalMouseParallax();
  useMagneticCards();

  /* ── Wipe-transition navigate ── */
  const nav = useCallback(
    (path, fn) => {
      setWipeOn(true);
      setWipePh('out');
      setTimeout(() => {
        if (fn) fn();
        if (path) navigate(path);
        window.scrollTo({ top: 0 });
        requestAnimationFrame(() => {
          setWipePh('in');
          setTimeout(() => setWipeOn(false), 340);
        });
      }, 275);
    },
    [navigate]
  );

  /* ── Tab click handler ── */
  const onTab = useCallback(
    (tab) => {
      const routeMap = {
        Dashboard: '/dashboard',
        Analytics: '/analytics',
        Gamification: '/gamification',
        Activities: '/activities',
        Events: '/events',
        Projects: '/projects',
        Roadmaps: '/roadmaps',
        Portfolio: '/portfolio',
        Collab: '/collab',
        Explore: '/explore',
        About: '/about',
        'Core Team': '/team',
        Contact: '/contact',
        Forum: '/forum',
        Mentorship: '/mentorship',
      };
      const targetPath = routeMap[tab];
      if (targetPath) {
        nav(targetPath);
        return;
      }
      if (tab === 'Home') {
        if (location.pathname !== '/') {
          nav('/');
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      // Home-page scroll targets
      const idStr = tab === 'Core Team' ? 'team' : tab.toLowerCase();
      if (location.pathname === '/') {
        setActiveTab(tab);
        const el = document.getElementById(`section-${idStr}`);
        if (el) {
          window.scrollTo({
            top: el.offsetTop - (mobile ? MNH : DNH),
            behavior: 'smooth',
          });
        }
      } else {
        nav('/', () => {
          setTimeout(() => {
            const el = document.getElementById(`section-${idStr}`);
            if (el) {
              window.scrollTo({
                top: el.offsetTop - (mobile ? MNH : DNH),
                behavior: 'smooth',
              });
            }
          }, 50);
        });
      }
    },
    [nav, mobile, location.pathname]
  );

  const openApply = useCallback(() => nav('/apply'), [nav]);
  const openJoin = useCallback(() => nav('/join'), [nav]);
  const onBackHome = useCallback(() => nav('/'), [nav]);

  const nh = mobile ? MNH : DNH;

  const onNavigate = useCallback(
    (type, title) => {
      if (type === 'activity') nav(`/activities/${encodeURIComponent(title)}`);
    },
    [nav]
  );

  const onKSSClick = useCallback(
    (ev) => {
      nav(`/events/${ev.id || encodeURIComponent(ev.name || '')}`);
    },
    [nav]
  );

  return (
    <>
      {cinDone && <AmbientOrbs theme={theme} />}
      {cinDone && <GeometricGridBackground theme={theme} />}
      {cinDone && <ParticleBackground theme={theme} />}
      <Wipe on={wipeOn} ph={wipePh} />

      {cinDone && (
        <Navbar
          activeTab={activeTab}
          onTabChange={onTab}
          theme={theme}
          onApply={openApply}
          onJoin={openJoin}
          onToggleBookmarks={() => setBookmarksOpen((prev) => !prev)}
        />
      )}

      <main style={{ paddingTop: nh, position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<PageLoadingSpinner />}>
          <Routes>
            {/* ── Home (scrollable sections) ── */}
            <Route
              path="/"
              element={
                cinDone ? (
                  <PageIn k="home">
                    <HeroSection
                      onTabChange={onTab}
                      onApply={openApply}
                      onJoin={openJoin}
                      theme={theme}
                    />
                    <SectionDivider />
                    <ActivitiesSection onNavigate={onNavigate} />
                    <SectionDivider />
                    <EventsSection onEventClick={onKSSClick} events={eventsData} />
                    <SectionDivider />
                    <AboutSection />
                    <SectionDivider />
                    <TeamSection onApply={openApply} />
                    <div id="section-contact">
                      <Footer
                        onAdmin={() => nav('/admin')}
                        onProjects={() => onTab('Projects')}
                        onRoadmaps={() => onTab('Roadmaps')}
                      />
                    </div>
                  </PageIn>
                ) : null
              }
            />

            {/* ── Activities ── */}
            <Route
              path="/activities"
              element={
                <PageIn k="activities">
                  <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
                </PageIn>
              }
            />
            <Route
              path="/activities/:activityKey"
              element={
                <ActivityDetailWrapper
                  onBack={() => nav('/activities')}
                  onSelectEvent={onKSSClick}
                />
              }
            />

            {/* ── Events ── */}
            <Route
              path="/events"
              element={
                <PageIn k="events">
                  <EventsPage onBack={onBackHome} onEventClick={onKSSClick} events={eventsData} />
                </PageIn>
              }
            />
            <Route
              path="/events/:eventId"
              element={<EventDetailWrapper onBack={() => nav('/events')} events={eventsData} />}
            />

            {/* ── Live Streaming ── */}
            <Route
              path="/stream/:eventId"
              element={
                <PageIn k="stream">
                  <LiveStreamPage />
                </PageIn>
              }
            />
            <Route
              path="/stream/:eventId/:streamId"
              element={
                <PageIn k="stream-id">
                  <LiveStreamPage />
                </PageIn>
              }
            />

            {/* ── Dashboard (requires auth) ── */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <PageIn k="dashboard">
                    <DashboardPage onBack={onBackHome} />
                  </PageIn>
                </RequireAuth>
              }
            />

            {/* ── Gamification ── */}
            <Route
              path="/gamification"
              element={
                <PageIn k="gamification">
                  <GamificationDashboard />
                </PageIn>
              }
            />

            {/* ── Analytics ── */}
            <Route
              path="/analytics"
              element={
                <PageIn k="analytics">
                  <AnalyticsPage onBack={onBackHome} />
                </PageIn>
              }
            />

            {/* ── Projects ── */}
            <Route
              path="/projects"
              element={
                <PageIn k="projects">
                  <ProjectsPage onBack={onBackHome} />
                </PageIn>
              }
            />

            {/* ── Roadmaps ── */}
            <Route
              path="/roadmaps"
              element={
                <PageIn k="roadmaps">
                  <RoadmapsPage onBack={onBackHome} />
                </PageIn>
              }
            />

            {/* ── Portfolio Builder ── */}
            <Route
              path="/portfolio"
              element={
                <PageIn k="portfolio">
                  <PortfolioBuilder />
                </PageIn>
              }
            />
            {/* ── Public Portfolio ── */}
            <Route path="/p/:username" element={<PublicPortfolioWrapper onBack={onBackHome} />} />
            <Route
              path="/profile/:username"
              element={<PublicPortfolioWrapper onBack={onBackHome} />}
            />

            {/* ── Collab ── */}
            <Route
              path="/collab"
              element={
                <PageIn k="collab">
                  <CollabPage onBack={onBackHome} />
                </PageIn>
              }
            />

            {/* ── About ── */}
            <Route
              path="/about"
              element={
                <PageIn k="about">
                  <AboutPage onBack={onBackHome} />
                </PageIn>
              }
            />

            {/* ── Team ── */}
            <Route
              path="/team"
              element={
                <PageIn k="team">
                  <TeamPage onBack={onBackHome} onApply={openApply} />
                </PageIn>
              }
            />

            {/* ── Contact ── */}
            <Route
              path="/contact"
              element={
                <PageIn k="contact">
                  <ContactPage onBack={onBackHome} />
                </PageIn>
              }
            />

            {/* ── Recruitment / Apply ── */}
            <Route
              path="/apply"
              element={
                <PageIn k="apply">
                  <RecruitmentPage onBack={onBackHome} />
                </PageIn>
              }
            />

            {/* ── Membership / Join ── */}
            <Route
              path="/join"
              element={
                <PageIn k="join">
                  <MembershipPage onBack={onBackHome} />
                </PageIn>
              }
            />

            {/* ── Certificate Verify ── */}
            <Route path="/verify/:certId" element={<CertVerifyWrapper onGoHome={onBackHome} />} />

            {/* ── Workspace (collaborative room) ── */}
            <Route path="/workspace/:roomId" element={<WorkspaceWrapper onBack={onBackHome} />} />

            {/* ── Forum ── */}
            <Route
              path="/forum"
              element={
                <PageIn k="forum">
                  <ForumPage onBack={onBackHome} />
                </PageIn>
              }
            />
            <Route
              path="/forum/:id"
              element={
                <PageIn k="forum-thread">
                  <ForumThreadPage onBack={() => nav('/forum')} />
                </PageIn>
              }
            />

            {/* ── Mentorship ── */}
            <Route
              path="/mentorship"
              element={
                <PageIn k="mentorship">
                  <MentorsPage />
                </PageIn>
              }
            />
            <Route
              path="/mentorship/mentors"
              element={
                <PageIn k="mentorship-mentors">
                  <MentorsPage />
                </PageIn>
              }
            />
            <Route
              path="/mentorship/dashboard"
              element={
                <PageIn k="mentorship-dashboard">
                  <MentorshipDashboard />
                </PageIn>
              }
            />

            {/* ── Admin (embedded, for quick access) ── */}
            <Route
              path="/admin"
              element={
                <PageIn k="admin">
                  <AdminPage onBack={onBackHome} />
                </PageIn>
              }
            />

            {/* ── Login / SSO ── */}
            <Route
              path="/login"
              element={
                <PageIn k="login">
                  <LoginPage />
                </PageIn>
              }
            />

            {/* ── 404 ── */}
            <Route path="*" element={<NotFoundPage onGoHome={onBackHome} />} />
          </Routes>
        </Suspense>
      </main>

      {cinDone && <MoveToTop />}

      {/* Floating Search Button */}
      {cinDone && (
        <button
          id="search-fab"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
          title="Search (Ctrl+K)"
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '24px',
            zIndex: 8500,
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#CC1111,#880000)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(204,17,17,0.5)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(204,17,17,0.75)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(204,17,17,0.5)';
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      )}

      {/* Search Overlay */}
      <SearchBar
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        activities={activityPages}
        events={eventsData}
        onNavigate={onNavigate}
        onEventClick={onKSSClick}
      />

      {/* Developer Terminal */}
      <Terminal
        isOpen={isTerminalOpen}
        onClose={closeTerminal}
        theme={theme}
        setTheme={() => {}}
        onNavigate={onTab}
      />

      {/* Bookmarks Drawer */}
      <BookmarksDrawer
        isOpen={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        onNavigate={(type) => {
          if (type === 'Event') onTab('Events');
          else if (type === 'Activity') onTab('Activities');
          else if (type === 'Roadmap') onTab('Roadmaps');
        }}
      />

      {cinDone && <FloatingDock />}
    </>
  );
}

/* ─────────────────────────────────────────────────────
   Route wrapper components (URL param readers)
───────────────────────────────────────────────────── */

function ActivityDetailWrapper({ onBack, onSelectEvent }) {
  const { activityKey } = useParams();
  const decoded = decodeURIComponent(activityKey || '');
  const activity = activityPages[decoded];
  if (!activity) return <NotFoundPage onGoHome={onBack} />;
  return (
    <PageIn k={`activity-${decoded}`}>
      <ActivityDetailPage activity={activity} onBack={onBack} onSelectEvent={onSelectEvent} />
    </PageIn>
  );
}

function EventDetailWrapper({ onBack, events }) {
  const { eventId } = useParams();

  // 1. Look for a matching rich event in the activity pages conductedEvents
  let event = null;
  let activityColor = null;
  let activityIcon = null;

  for (const act of Object.values(activityPages)) {
    const found = (act.conductedEvents || []).find(
      (e) =>
        String(e.id) === eventId ||
        encodeURIComponent(e.name || '') === eventId ||
        encodeURIComponent(e.shortName || '') === eventId
    );
    if (found) {
      event = found;
      activityColor = act.color;
      activityIcon = act.icon;
      break;
    }
  }

  // 2. If not found in rich conductedEvents, fall back to basic events list
  if (!event) {
    event = (events || []).find(
      (e) =>
        String(e.id) === eventId ||
        encodeURIComponent(e.name || '') === eventId ||
        encodeURIComponent(e.shortName || '') === eventId
    );
  }

  if (!event) return <NotFoundPage onGoHome={onBack} />;

  // Render with correct styling if resolved
  const iconElement = activityIcon ? (
    <DynamicIcon
      name={activityIcon}
      size={13}
      style={{ marginRight: '4px', verticalAlign: '-1px' }}
    />
  ) : null;

  return (
    <PageIn k={`event-${eventId}`}>
      <EventDetailPage
        event={event}
        activityColor={activityColor}
        activityIcon={iconElement}
        onBack={onBack}
      />
    </PageIn>
  );
}

function PublicPortfolioWrapper({ onBack }) {
  const { username } = useParams();
  return (
    <PageIn k={`portfolio-${username}`}>
      <PublicPortfolio username={username} onBack={onBack} />
    </PageIn>
  );
}

function CertVerifyWrapper({ onGoHome }) {
  const { certId } = useParams();
  return <CertificateVerifyPage certificateId={certId} onGoHome={onGoHome} />;
}

function WorkspaceWrapper({ onBack }) {
  const { roomId } = useParams();
  return (
    <PageIn k={`workspace-${roomId}`}>
      <WorkspacePage roomId={roomId} onBack={onBack} />
    </PageIn>
  );
}

/* ─────────────────────────────────────────────────────
   Page loading spinner (Suspense fallback)
───────────────────────────────────────────────────── */
function PageLoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--t2)',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid rgba(204,17,17,0.2)',
          borderTop: '3px solid #CC1111',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Loading…</span>
    </div>
  );
}
