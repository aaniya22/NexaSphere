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
import './i18n';
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
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded heavy pages
const RecruitmentPage = lazy(() => import('./pages/recruitment/RecruitmentPage'));
const MembershipPage = lazy(() => import('./pages/membership/MembershipPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const ActivitiesPage = lazy(() => import('./pages/activities/ActivitiesPage'));
const ActivityDetailPage = lazy(() => import('./pages/activities/ActivityDetailPage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage'));
const EventPlanningPage = lazy(() => import('./pages/events/EventPlanningPage'));
const AboutPage = lazy(() => import('./pages/about/AboutPage'));
const TeamPage = lazy(() => import('./pages/team/TeamPage'));
const ContactPage = lazy(() => import('./pages/contact/ContactPage'));
const RoadmapsPage = lazy(() => import('./pages/roadmaps/RoadmapsPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ResourcesPage = lazy(() => import('./pages/resources/ResourcesPage'));

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
const StatusPage = lazy(() => import('./pages/StatusPage'));
const LiveStreamPage = lazy(() => import('./pages/streaming/LiveStreamPage'));
const LiveQa = lazy(() => import('./pages/events/LiveQa'));

const MNH = 88,
  DNH = 64;

/* â”€â”€ Page wipe transition â”€â”€ */
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

/* â”€â”€ Page enter animation â”€â”€ */
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

/* â”€â”€ Anti-gravity orb cursor â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Root App â€” wraps everything in BrowserRouter
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function App() {
  return (
    <BrowserRouter>
      <StudentAuthProvider>
        <AppShell />
      </StudentAuthProvider>
    </BrowserRouter>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   AppShell â€” initialises global systems, reads location
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AppShell() {
  const location = useLocation();
  // Skip the cinematic intro immediately for Playwright E2E runs or deep links
  const isPlaywright =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('Playwright');
  const [cinDone, setCinDone] = useState(isPlaywright || location.pathname !== '/');
  const [eventsData, setEventsData] = useState(() => getLocalEvents(fallbackEvents));
  const { resolvedTheme: theme } = useTheme();
  const { isOpen: isTerminalOpen, closeTerminal } = useDeveloperMode();

  // Skip cinematic opening for deep links (anything except "/")
  useEffect(() => {
    if (location.pathname !== '/' || isPlaywright) {
      setCinDone(true);
    }
  }, [location.pathname]);

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
    // Removed unconditional 4s polling â€” socket event handles live updates.
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
      off('content:updated', onContentUpdated);
      document.removeEventListener('visibilitychange', onVisibilityChange);
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

  /* â”€â”€ SW update prompt â”€â”€ */
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

      {/* Loading screen â€” prevents white-flash during cinematic opening */}
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   RequireAuth Wrapper
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useStudentAuth();
  if (loading) return <PageLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MainRouter â€” renders the Navbar + Routes
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
      '/qa-poll': 'Q&A / Polling',
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

  /* â”€â”€ Wipe-transition navigate â”€â”€ */
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

  /* â”€â”€ Tab click handler â”€â”€ */
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
        Resources: '/resources',
        About: '/about',
        'Core Team': '/team',
        Contact: '/contact',
        Forum: '/forum',
        Mentorship: '/mentorship',
        'Q&A / Polling': '/qa-poll',
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
            {/* â”€â”€ Home (scrollable sections) â”€â”€ */}
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

            {/* â”€â”€ Activities â”€â”€ */}
            <Route
              path="/activities"
              element={
                <ErrorBoundary>
                  <PageIn k="activities">
                    <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />
            <Route
              path="/activities/:activityKey"
              element={
                <ErrorBoundary>
                  <ActivityDetailWrapper
                    onBack={() => nav('/activities')}
                    onSelectEvent={onKSSClick}
                  />
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Events â”€â”€ */}
            <Route
              path="/events"
              element={
                <ErrorBoundary>
                  <PageIn k="events">
                    <EventsPage onBack={onBackHome} onEventClick={onKSSClick} events={eventsData} />
                  </PageIn>
                </ErrorBoundary>
              }
            />
            <Route
              path="/events/:eventId"
              element={
                <ErrorBoundary>
                  <EventDetailWrapper onBack={() => nav('/events')} events={eventsData} />
                </ErrorBoundary>
              }
            />

            {/* ── Event Planning (collaborative) ── */}
            <Route
              path="/events/:eventId/planning"
              element={<EventPlanningWrapper onBack={() => nav('/events')} />}
            />

            {/* ── Live Streaming ── */}
            <Route
              path="/stream/:eventId"
              element={
                <ErrorBoundary>
                  <PageIn k="stream">
                    <LiveStreamPage />
                  </PageIn>
                </ErrorBoundary>
              }
            />
            <Route
              path="/stream/:eventId/:streamId"
              element={
                <ErrorBoundary>
                  <PageIn k="stream-id">
                    <LiveStreamPage />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Dashboard (requires auth) â”€â”€ */}
            <Route
              path="/dashboard"
              element={
                <ErrorBoundary>
                  <RequireAuth>
                    <PageIn k="dashboard">
                      <DashboardPage onBack={onBackHome} />
                    </PageIn>
                  </RequireAuth>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Gamification â”€â”€ */}
            <Route
              path="/gamification"
              element={
                <ErrorBoundary>
                  <PageIn k="gamification">
                    <GamificationDashboard />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Analytics â”€â”€ */}
            <Route
              path="/analytics"
              element={
                <ErrorBoundary>
                  <PageIn k="analytics">
                    <AnalyticsPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Projects â”€â”€ */}
            <Route
              path="/projects"
              element={
                <ErrorBoundary>
                  <PageIn k="projects">
                    <ProjectsPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Roadmaps â”€â”€ */}
            <Route
              path="/roadmaps"
              element={
                <ErrorBoundary>
                  <PageIn k="roadmaps">
                    <RoadmapsPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Portfolio Builder â”€â”€ */}
            <Route
              path="/portfolio"
              element={
                <ErrorBoundary>
                  <PageIn k="portfolio">
                    <PortfolioBuilder />
                  </PageIn>
                </ErrorBoundary>
              }
            />
            {/* â”€â”€ Public Portfolio â”€â”€ */}
            <Route
              path="/p/:username"
              element={
                <ErrorBoundary>
                  <PublicPortfolioWrapper onBack={onBackHome} />
                </ErrorBoundary>
              }
            />
            <Route
              path="/profile/:username"
              element={
                <ErrorBoundary>
                  <PublicPortfolioWrapper onBack={onBackHome} />
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Collab â”€â”€ */}
            <Route
              path="/collab"
              element={
                <ErrorBoundary>
                  <PageIn k="collab">
                    <CollabPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ About â”€â”€ */}
            <Route
              path="/about"
              element={
                <ErrorBoundary>
                  <PageIn k="about">
                    <AboutPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Team â”€â”€ */}
            <Route
              path="/team"
              element={
                <ErrorBoundary>
                  <PageIn k="team">
                    <TeamPage onBack={onBackHome} onApply={openApply} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Contact â”€â”€ */}
            <Route
              path="/contact"
              element={
                <ErrorBoundary>
                  <PageIn k="contact">
                    <ContactPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Recruitment / Apply â”€â”€ */}
            <Route
              path="/apply"
              element={
                <ErrorBoundary>
                  <PageIn k="apply">
                    <RecruitmentPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Membership / Join â”€â”€ */}
            <Route
              path="/join"
              element={
                <ErrorBoundary>
                  <PageIn k="join">
                    <MembershipPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Certificate Verify â”€â”€ */}
            <Route
              path="/verify/:certId"
              element={
                <ErrorBoundary>
                  <CertVerifyWrapper onGoHome={onBackHome} />
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Workspace (collaborative room) â”€â”€ */}
            <Route
              path="/workspace/:roomId"
              element={
                <ErrorBoundary>
                  <WorkspaceWrapper onBack={onBackHome} />
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Forum â”€â”€ */}
            <Route
              path="/forum"
              element={
                <ErrorBoundary>
                  <PageIn k="forum">
                    <ForumPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />
            <Route
              path="/forum/:id"
              element={
                <ErrorBoundary>
                  <PageIn k="forum-thread">
                    <ForumThreadPage onBack={() => nav('/forum')} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Sponsors â”€â”€ */}
            <Route
              path="/sponsors"
              element={
                <PageIn k="sponsors">
                  <SponsorsPage />
                </PageIn>
              }
            />

            {/* â”€â”€ Mentorship â”€â”€ */}
            <Route
              path="/mentorship"
              element={
                <ErrorBoundary>
                  <PageIn k="mentorship">
                    <MentorsPage />
                  </PageIn>
                </ErrorBoundary>
              }
            />
            <Route
              path="/mentorship/mentors"
              element={
                <ErrorBoundary>
                  <PageIn k="mentorship-mentors">
                    <MentorsPage />
                  </PageIn>
                </ErrorBoundary>
              }
            />
            <Route
              path="/mentorship/dashboard"
              element={
                <ErrorBoundary>
                  <PageIn k="mentorship-dashboard">
                    <MentorshipDashboard />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Admin (embedded, for quick access) â”€â”€ */}
            <Route
              path="/admin"
              element={
                <ErrorBoundary>
                  <PageIn k="admin">
                    <AdminPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* â”€â”€ Resources / Library â”€â”€ */}
            <Route
              path="/resources"
              element={
                <ErrorBoundary>
                  <PageIn k="resources">
                    <ResourcesPage onBack={onBackHome} />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* ── Recommendations ── */}
            <Route
              path="/recommendations"
              element={
                <PageIn k="recommendations">
                  <RecommendationsPage onBack={onBackHome} />
                </PageIn>
              }
            />
            {/* ── Notification History ── */}
            <Route
              path="/notifications"
              element={
                <PageIn k="notifications">
                  <NotificationHistoryPage />
                </PageIn>
              }
            />

            {/* â”€â”€ Login / SSO â”€â”€ */}
            <Route
              path="/login"
              element={
                <ErrorBoundary>
                  <PageIn k="login">
                    <LoginPage />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* ── Live Q&A / Polling ── */}
            <Route
              path="/qa-poll"
              element={
                <PageIn k="qa-poll">
                  <LiveQa onBack={onBackHome} />
                </PageIn>
              }
            />
            <Route
              path="/qa-poll/:eventId"
              element={
                <PageIn k="qa-poll-event">
                  <LiveQa onBack={() => nav('/qa-poll')} />
                </PageIn>
              }
            />

            {/* ── Status Page ── */}
            <Route
              path="/status"
              element={
                <ErrorBoundary>
                  <PageIn k="status">
                    <StatusPage />
                  </PageIn>
                </ErrorBoundary>
              }
            />

            {/* ── Skill Exchange ── */}
            <Route
              path="/skill-exchange"
              element={
                <PageIn k="skill-exchange">
                  <SkillExchangePage />
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Route wrapper components (URL param readers)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

function EventPlanningWrapper({ onBack }) {
  const { eventId } = useParams();
  return (
    <PageIn k={`event-planning-${eventId}`}>
      <EventPlanningPage event={{ id: eventId, eventId }} onBack={onBack} />
    </PageIn>
  );
}

/* ─────────────────────────────────────────────────────
   Page loading spinner (Suspense fallback)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
      <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Loadingâ€¦</span>
    </div>
  );
}
