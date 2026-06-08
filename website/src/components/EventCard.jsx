import React from 'react';

const EventCard = React.memo(function EventCard({ event, onClick, id }) {
  return (
    <div className="event-card" onClick={() => onClick(id)} style={{ cursor: 'pointer' }}>
      <h3>{event.title}</h3>
      <p>{event.date}</p>
      <p>{event.description}</p>
      {event.location && <p>{event.location}</p>}
      {event.category && <span className="event-category">{event.category}</span>}
    </div>
  );
});

export default EventCard;
