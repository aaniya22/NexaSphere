import React, { useRef } from 'react';
import { AnalyticsFilterProvider, useAnalyticsFilters } from '../../context/AnalyticsFilterContext';
import { useAnalyticsData } from '../../hooks/analytics/useAnalyticsData';
import { TrendChart } from '../../features/analytics/TrendChart';
import { DistributionChart } from '../../features/analytics/DistributionChart';
import { ActivityComparisonChart } from '../../features/analytics/ActivityComparisonChart';
import { formatNumber } from '../../utils/chartDataFormatters';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, ChevronLeft } from 'lucide-react';

interface AnalyticsPageProps {
  onBack?: () => void;
}

/* ── Shared style tokens (match site's CSS vars) ── */
const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg, #0a0a0a)',
    color: 'var(--t1, #fff)',
    padding: '2rem 1.5rem',
    fontFamily: "'Rajdhani', sans-serif",
  } as React.CSSProperties,

  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,

  header: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '2rem',
  } as React.CSSProperties,

  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.45)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '0 0 0.5rem 0',
    fontFamily: "'Rajdhani', sans-serif",
    letterSpacing: '0.06em',
    transition: 'color 0.2s',
  } as React.CSSProperties,

  title: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 0.3rem',
    letterSpacing: '0.04em',
    textShadow: '0 0 24px rgba(204,17,17,0.4)',
  } as React.CSSProperties,

  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.85rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    margin: 0,
  } as React.CSSProperties,

  offlineBadge: {
    color: '#fbbf24',
    fontSize: '0.75rem',
    marginTop: '0.3rem',
  } as React.CSSProperties,

  controls: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: '0.75rem',
  } as React.CSSProperties,

  toggleWrap: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    overflow: 'hidden',
  } as React.CSSProperties,

  toggleBtnBase: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.82rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    padding: '0.4rem 1rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
  } as React.CSSProperties,

  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.82rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    padding: '0.5rem 1.1rem',
    background: 'linear-gradient(135deg, #CC1111, #880000)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(204,17,17,0.35)',
    transition: 'opacity 0.2s, box-shadow 0.2s',
  } as React.CSSProperties,

  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1.25rem',
  } as React.CSSProperties,

  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.25rem',
  } as React.CSSProperties,

  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px',
    padding: '1.25rem 1.4rem',
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'border-color 0.25s, transform 0.25s',
  } as React.CSSProperties,

  metricTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.78rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '0.6rem',
  } as React.CSSProperties,

  metricRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  } as React.CSSProperties,

  metricValue: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '1.9rem',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1,
  } as React.CSSProperties,

  spinnerWrap: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(10,10,10,0.85)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  spinner: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTop: '2px solid #CC1111',
    animation: 'spin 0.7s linear infinite',
  } as React.CSSProperties,
};

/* ── Metric card ── */
const MetricBadge: React.FC<{
  title: string;
  value: string;
  trend?: number;
  loading?: boolean;
}> = ({ title, value, trend, loading }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={{
        ...S.card,
        borderColor: hovered ? 'rgba(204,17,17,0.3)' : 'rgba(255,255,255,0.07)',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading && (
        <div style={S.spinnerWrap}>
          <div style={S.spinner} />
        </div>
      )}
      <p style={S.metricTitle}>{title}</p>
      <div style={S.metricRow}>
        <span style={S.metricValue}>{value}</span>
        {trend !== undefined && (
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              padding: '0.2rem 0.5rem',
              borderRadius: '20px',
              background: trend >= 0 ? 'rgba(74,222,128,0.12)' : 'rgba(204,17,17,0.12)',
              color: trend >= 0 ? '#4ade80' : '#f87171',
              border: `1px solid ${trend >= 0 ? 'rgba(74,222,128,0.25)' : 'rgba(204,17,17,0.25)'}`,
            }}
          >
            {trend >= 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
    </div>
  );
};

/* ── Dashboard content ── */
const AnalyticsDashboardContent: React.FC<AnalyticsPageProps> = ({ onBack }) => {
  const { filters, updateFilter } = useAnalyticsFilters();
  const { loading, isOffline, trendData, distributionData, comparisonData, overviewMetrics } =
    useAnalyticsData();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportHover, setExportHover] = React.useState(false);

  const handleExport = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: '#0a0a0a',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`NexaSphere_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const granularity = filters.timeGranularity;

  return (
    <div style={S.page}>
      <div style={S.inner}>
        {/* ── Header ── */}
        <div style={S.header}>
          <div>
            {onBack && (
              <button
                onClick={onBack}
                style={S.backBtn}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <h1 style={S.title}>Platform Intelligence</h1>
            <p style={S.subtitle}>Real-time analytics and platform metrics</p>
            {isOffline && (
              <p style={S.offlineBadge}>⚠ Demo mode — API unavailable. Showing generated data.</p>
            )}
          </div>

          <div style={S.controls}>
            {/* Period toggle */}
            <div style={S.toggleWrap}>
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => updateFilter('timeGranularity', p)}
                  style={{
                    ...S.toggleBtnBase,
                    background: granularity === p ? 'rgba(204,17,17,0.85)' : 'transparent',
                    color: granularity === p ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              style={{
                ...S.exportBtn,
                opacity: exporting || loading ? 0.5 : 1,
                boxShadow: exportHover
                  ? '0 6px 24px rgba(204,17,17,0.55)'
                  : '0 4px 16px rgba(204,17,17,0.35)',
              }}
              onMouseEnter={() => setExportHover(true)}
              onMouseLeave={() => setExportHover(false)}
            >
              <Download size={15} />
              {exporting ? 'Exporting...' : 'Export Report'}
            </button>
          </div>
        </div>

        {/* ── Dashboard ── */}
        <div
          ref={dashboardRef}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {/* Metric cards */}
          <div style={S.grid4}>
            <MetricBadge
              title="Total Users"
              value={formatNumber(overviewMetrics.totalUsers)}
              trend={Number(overviewMetrics.userGrowth)}
              loading={loading}
            />
            <MetricBadge
              title="Platform Activity"
              value={formatNumber(overviewMetrics.totalActivity)}
              loading={loading}
            />
            <MetricBadge
              title="Active Projects"
              value={formatNumber(overviewMetrics.totalProjects)}
              loading={loading}
            />
            <MetricBadge
              title="Categories"
              value={filters.categories.length.toString()}
              loading={loading}
            />
          </div>

          {/* Trend + Distribution */}
          <div style={S.grid3}>
            <div style={{ gridColumn: 'span 2' }}>
              <TrendChart data={trendData} loading={loading} />
            </div>
            <div>
              <DistributionChart data={distributionData} loading={loading} />
            </div>
          </div>

          {/* Activity comparison */}
          <ActivityComparisonChart data={comparisonData} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage(props: AnalyticsPageProps) {
  return (
    <AnalyticsFilterProvider>
      <AnalyticsDashboardContent {...props} />
    </AnalyticsFilterProvider>
  );
}
