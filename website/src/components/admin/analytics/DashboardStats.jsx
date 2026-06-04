import { CalendarDays, Users, Activity, Percent } from 'lucide-react';

const statConfig = [
  { key: 'totalUsers', label: 'Total Users', icon: Users },
  { key: 'activeRegistrations', label: 'Active Registrations', icon: Activity },
  { key: 'upcomingEvents', label: 'Upcoming Events', icon: CalendarDays },
  { key: 'conversionRate', label: 'Conversion Rate', icon: Percent },
];

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return typeof value === 'number' ? value.toLocaleString() : value;
}

export default function DashboardStats({ stats }) {
  const safeStats = stats ?? {};

  return (
    <section className="stats-grid" aria-label="Analytics summary">
      {statConfig.map(({ key, label, icon: Icon }) => (
        <article className="stat-card" key={key}>
          <span className="stat-icon" aria-hidden="true">
            <Icon size={22} />
          </span>
          <div>
            <div className="stat-value">{formatValue(safeStats[key])}</div>
            <div className="stat-label">{label}</div>
          </div>
        </article>
      ))}
    </section>
  );
}
