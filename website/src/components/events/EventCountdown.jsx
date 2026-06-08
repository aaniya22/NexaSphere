import { DynamicIcon } from '../../shared/Icons';
import useCountdown from '../../hooks/useCountdown';
import './EventCountdown.css';

const STATUS_META = {
  upcoming: {
    label: 'Upcoming',
    subtitle: 'Starts in',
    icon: 'Calendar',
  },
  'starting-soon': {
    label: 'Starting Soon',
    subtitle: 'Starts in',
    icon: 'Clock',
  },
  live: {
    label: 'Live Now',
    subtitle: 'Ends in',
    icon: 'PlayCircle',
  },
  completed: {
    label: 'Completed',
    subtitle: 'Event completed',
    icon: 'CheckCircle',
  },
};

function pad(value) {
  return String(value).padStart(2, '0');
}

export default function EventCountdown({ event, soonThreshold }) {
  const { status, days, hours, minutes, seconds } = useCountdown({
    startDate: event.startDate ?? event.date,
    endDate: event.endDate,
    soonThreshold,
  });

  const meta = STATUS_META[status] ?? STATUS_META.upcoming;
  const showTimer = status !== 'completed';

  return (
    <div className={`event-countdown-card ${status}`}>
      <div className="event-countdown-head">
        <div>
          <div className="event-countdown-title">{meta.label}</div>
          <div className="event-countdown-subtitle">{meta.subtitle}</div>
        </div>
        <span className={`event-countdown-badge ${status}`}>
          <DynamicIcon name={meta.icon} size={14} />
          {meta.label}
        </span>
      </div>

      {showTimer ? (
        <div className="event-countdown-grid">
          <div className="event-countdown-segment">
            <span className="event-countdown-value">{pad(days)}</span>
            <span className="event-countdown-label">Days</span>
          </div>
          <div className="event-countdown-segment">
            <span className="event-countdown-value">{pad(hours)}</span>
            <span className="event-countdown-label">Hours</span>
          </div>
          <div className="event-countdown-segment">
            <span className="event-countdown-value">{pad(minutes)}</span>
            <span className="event-countdown-label">Minutes</span>
          </div>
          <div className="event-countdown-segment">
            <span className="event-countdown-value">{pad(seconds)}</span>
            <span className="event-countdown-label">Seconds</span>
          </div>
        </div>
      ) : (
        <div className="event-countdown-empty">This event is completed.</div>
      )}
    </div>
  );
}
