import React, { useState, useMemo, useCallback } from 'react';
import EventCard from '../components/EventCard';

const Events = () => {
  const [query, setQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Sample data — replace with your actual API call / props
  const events = [
    {
      id: 1,
      title: 'Tech Summit 2025',
      date: '2025-08-10',
      description: 'Annual tech summit.',
      location: 'Hyderabad',
      category: 'Tech',
    },
    {
      id: 2,
      title: 'Design Workshop',
      date: '2025-09-05',
      description: 'UI/UX design workshop.',
      location: 'Bangalore',
      category: 'Design',
    },
    {
      id: 3,
      title: 'Open Source Hackathon',
      date: '2025-09-20',
      description: 'Build open source projects.',
      location: 'Chennai',
      category: 'Tech',
    },
  ];

  // Fix 1: useMemo — filter + sort only recomputes when events or query changes
  const filteredEvents = useMemo(
    () =>
      events
        .filter((e) => e.title.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [events, query]
  );

  // Fix 2: useCallback — stable function reference, won't invalidate React.memo
  const handleSelect = useCallback((id) => {
    setSelectedEvent(id);
    console.log('Selected event id:', id);
  }, []);

  return (
    <div className="events-page" style={{ padding: '1rem' }}>
      <h1>Events</h1>

      <input
        type="text"
        placeholder="Search events..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%', maxWidth: '400px' }}
      />

      {filteredEvents.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div className="events-list" style={{ display: 'grid', gap: '1rem' }}>
          {filteredEvents.map((event) => (
            // Fix 3: React.memo on EventCard skips re-render if props unchanged
            <EventCard key={event.id} event={event} id={event.id} onClick={handleSelect} />
          ))}
        </div>
      )}

      {selectedEvent && <p>Selected event ID: {selectedEvent}</p>}
    </div>
  );
};

export default Events;
