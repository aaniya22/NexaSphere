import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { OfflineBanner } from './components/OfflineBanner';
import ErrorBoundary from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ForumManager } from './pages/ForumManager';
import { MentorshipManager } from './pages/MentorshipManager';
import { DashboardHome } from './pages/DashboardHome';
import { EventsManager } from './pages/EventsManager';
import { ActivityEventsManager } from './pages/ActivityEventsManager';
import { CoreTeamManager } from './pages/CoreTeamManager';
import { MembershipResponsesManager } from './pages/MembershipResponsesManager';
import { RecruitmentResponsesManager } from './pages/RecruitmentResponsesManager';
import { CertificateManager } from './pages/CertificateManager';
import { AnnouncementsManager } from './pages/AnnouncementsManager';
import { PortfolioManager } from './pages/PortfolioManager';
import { StreamManager } from './pages/StreamManager';
import { CircuitBreakerManager } from './pages/CircuitBreakerManager';
import { LiveQaManager } from './pages/LiveQaManager';
import './styles/admin.css';

function RequireAuth() {
  const { isLoading, isVerified } = useAuth();

  if (isLoading) {
    return (
      <div className="login-bg">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <span className="brand-dot lg" style={{ display: 'block', margin: '0 auto 1rem' }} />
          <p className="login-sub">Verifying session…</p>
        </div>
      </div>
    );
  }

  return isVerified ? <Outlet /> : <Navigate to="/login" replace />;
}

function DashboardLayout() {
  return (
    <div className="app-layout">
      <OfflineBanner />
      <ImpersonationBanner />
      <Sidebar />
      <main className="main-content" id="main-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/analytics" element={<ComprehensiveAnalytics />} />
            <Route path="/dashboard/events" element={<EventsManager />} />
            <Route path="/dashboard/activity-events" element={<ActivityEventsManager />} />
            <Route path="/dashboard/core-team" element={<CoreTeamManager />} />
            <Route path="/dashboard/membership" element={<MembershipResponsesManager />} />
            <Route path="/dashboard/recruitment" element={<RecruitmentResponsesManager />} />
            <Route path="/dashboard/certificates" element={<CertificateManager />} />
            <Route path="/dashboard/announcements" element={<AnnouncementsManager />} />
            <Route path="/dashboard/portfolios" element={<PortfolioManager />} />
            <Route path="/dashboard/forum" element={<ForumManager />} />
            <Route path="/dashboard/mentorship" element={<MentorshipManager />} />
            <Route path="/dashboard/streams" element={<StreamManager />} />
            <Route path="/dashboard/circuit-breaker" element={<CircuitBreakerManager />} />
            <Route path="/dashboard/qa-poll" element={<LiveQaManager />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
