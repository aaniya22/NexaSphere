// src/hooks/useRecommendations.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { userInterestTracker } from '../services/recommendation/userInterestTracker';
import { recommendationEngine } from '../services/recommendation/recommendationEngine';

export function useRecommendations(events) {
  const [recommendations, setRecommendations] = useState([]);
  const [userInterests, setUserInterests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarEvents, setSimilarEvents] = useState({});

  // Keep a stable ref to events so callbacks below don't need events
  // in their dependency arrays — prevents cascading re-renders when
  // the events array reference changes on every render.
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Plain function — not memoised with useCallback because it is never
  // passed as a prop and memoising it with [events] caused a circular
  // dependency: generateRecommendations → trackEvent/setUserPreferences
  // → generateRecommendations, triggering an infinite re-render loop.
  const generateRecommendations = useCallback(() => {
    const currentEvents = eventsRef.current;
    if (!currentEvents || currentEvents.length === 0) return;

    const interests = userInterestTracker.getUserInterests();
    const history = userInterestTracker.getEventHistory();

    setUserInterests(interests);

    const recs = recommendationEngine.getRecommendations(currentEvents, interests, history, 10);
    setRecommendations(recs);
    setLoading(false);
    // Empty dependency array — reads events via eventsRef so the function
    // reference is stable and does not cause cascading dependency updates.
  }, []);

  useEffect(() => {
    if (events && events.length > 0) {
      generateRecommendations();
    }
  }, [events, generateRecommendations]);

  const trackEvent = useCallback(
    (eventId, action, metadata) => {
      userInterestTracker.trackEventInteraction(eventId, action, metadata);
      generateRecommendations();
    },
    [generateRecommendations]
  );

  const getSimilarEvents = useCallback(
    (event, limit = 3) => {
      if (similarEvents[event.id]) {
        return similarEvents[event.id];
      }
      const similar = recommendationEngine.getSimilarEvents(event, eventsRef.current, limit);
      setSimilarEvents((prev) => ({ ...prev, [event.id]: similar }));
      return similar;
    },
    [similarEvents]
  );

  const setUserPreferences = useCallback(
    (categories, tags) => {
      userInterestTracker.setUserPreferences(categories, tags);
      generateRecommendations();
    },
    [generateRecommendations]
  );

  return {
    recommendations,
    userInterests,
    loading,
    trackEvent,
    getSimilarEvents,
    setUserPreferences,
  };
}
