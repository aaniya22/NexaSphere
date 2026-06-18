// src/hooks/useRecommendations.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { userInterestTracker } from '../services/recommendation/userInterestTracker';
import axios from 'axios'; // Assuming axios is installed for API calls

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

  const fetchRecommendationsFromBackend = useCallback(async () => {
    setLoading(true);
    try {
      // In a real application, the user_id would come from an authentication context.
      // For now, using a placeholder.
      const userId = '101'; // Example user ID

      // The backend recommendation engine should ideally fetch all necessary user data
      // (interests, history, followed users, etc.) from the database based on the user_id.
      // However, if the backend needs client-side context for dynamic weighting or other reasons,
      // it could be passed here. For this implementation, we assume the backend fetches its own data.
      const response = await axios.get(`${import.meta.env.VITE_API_BASE}/recommendations`, {
        params: {
          user_id: userId,
          // Example: if backend needs client-side interests for cold start
          // user_interests: JSON.stringify(userInterestTracker.getUserInterests()),
        },
      });
      setRecommendations(response.data);
    } catch (error) {
      console.error('Failed to fetch recommendations from backend:', error);
      setRecommendations([]); // Fallback to empty recommendations on error
    } finally {
      setLoading(false);
    }
  }, []); // Dependencies are empty as this function is a top-level fetcher

  useEffect(() => {
    fetchRecommendationsFromBackend();
  }, [fetchRecommendationsFromBackend]);

  const trackEvent = useCallback(
    (eventId, action, metadata) => {
      userInterestTracker.trackEventInteraction(eventId, action, metadata);
      generateRecommendations();
    },
    [generateRecommendations]
    // Ideally, this interaction should be sent to the backend for the ML model's feedback loop.
    // Example: axios.post(`${import.meta.env.VITE_API_BASE}/user-interactions`, { userId: '101', eventId, action, metadata });
  );

  const getSimilarEvents = useCallback(
    (event, limit = 3) => {
      // This function for "similar events" could either remain client-side (if purely content-based)
      // or be moved to a backend endpoint (e.g., /api/events/{id}/similar) for ML-driven similarity.
      if (similarEvents[event.id]) {
        return similarEvents[event.id];
      }
      // Dynamically import recommendationEngine if it's still needed for client-side similar events
      const { recommendationEngine } = require('../services/recommendation/recommendationEngine');
      const similar = recommendationEngine.getSimilarEvents(event, eventsRef.current, limit); // Still uses client-side engine for similarity
      setSimilarEvents((prev) => ({ ...prev, [event.id]: similar }));
      return similar;
    },
    [similarEvents]
  );

  const setUserPreferences = useCallback(
    (categories, tags) => {
      userInterestTracker.setUserPreferences(categories, tags);
      fetchRecommendationsFromBackend();
    },
    [fetchRecommendationsFromBackend]
    // Ideally, these preferences should be sent to the backend to update the user's profile for ML.
    // Example: axios.post(`${import.meta.env.VITE_API_BASE}/user-preferences`, { userId: '101', categories, tags });
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
