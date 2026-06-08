import { useState, useEffect, useMemo } from 'react';
import { useAnalyticsFilters } from '../../context/AnalyticsFilterContext';
import {
  generateTrendData,
  generateDistributionData,
  generateComparisonData,
  TrendDataPoint,
  DistributionDataPoint,
  ComparisonDataPoint,
} from '../../utils/chartDataFormatters';

const getApiBase = () => (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, '') || '';

/**
 * Returns true when the API base URL is configured for this deployment.
 * Falls back to mock data when offline or unconfigured.
 */
const isApiConfigured = () => Boolean(getApiBase());

export const useAnalyticsData = () => {
  const { filters } = useAnalyticsFilters();
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionDataPoint[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonDataPoint[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const months =
      (filters.dateRange.end.getFullYear() - filters.dateRange.start.getFullYear()) * 12 +
      (filters.dateRange.end.getMonth() - filters.dateRange.start.getMonth());
    const effectiveMonths = Math.max(1, months);

    const applyMockData = () => {
      if (!isMounted) return;
      setIsOffline(true);
      setTrendData(generateTrendData(filters.timeGranularity, effectiveMonths));
      setDistributionData(generateDistributionData(filters.categories));
      setComparisonData(generateComparisonData(filters.categories));
      setLoading(false);
    };

    if (!isApiConfigured()) {
      applyMockData();
      return () => {
        isMounted = false;
      };
    }

    const base = getApiBase();

    Promise.all([
      fetch(`${base}/api/admin/analytics/stats`).then((r) => r.json()),
      fetch(`${base}/api/admin/analytics/growth`).then((r) => r.json()),
      fetch(`${base}/api/admin/analytics/events`).then((r) => r.json()),
    ])
      .then(([stats, growth, events]) => {
        if (!isMounted) return;
        setIsOffline(false);

        // Map API responses to chart data shapes.
        // growth is expected to be an array of { name, users, activity, projects }
        if (Array.isArray(growth) && growth.length > 0) {
          setTrendData(growth as TrendDataPoint[]);
        } else {
          setTrendData(generateTrendData(filters.timeGranularity, effectiveMonths));
        }

        // events is expected to be an array of { name, value } category distribution
        if (Array.isArray(events) && events.length > 0) {
          setDistributionData(events as DistributionDataPoint[]);
          setComparisonData(generateComparisonData(filters.categories));
        } else {
          setDistributionData(generateDistributionData(filters.categories));
          setComparisonData(generateComparisonData(filters.categories));
        }

        setLoading(false);
      })
      .catch(() => {
        // API unreachable — fall back to mock data with a visible indicator
        applyMockData();
      });

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const overviewMetrics = useMemo(() => {
    if (trendData.length === 0)
      return { totalUsers: 0, totalActivity: 0, totalProjects: 0, userGrowth: 0 };

    const latest = trendData[trendData.length - 1];
    const previous = trendData.length > 1 ? trendData[trendData.length - 2] : null;

    const userGrowth =
      previous && previous.users > 0 ? ((latest.users - previous.users) / previous.users) * 100 : 0;

    return {
      totalUsers: latest.users,
      totalActivity: latest.activity,
      totalProjects: latest.projects,
      userGrowth: userGrowth.toFixed(1),
    };
  }, [trendData]);

  return {
    loading,
    isOffline,
    trendData,
    distributionData,
    comparisonData,
    overviewMetrics,
  };
};
