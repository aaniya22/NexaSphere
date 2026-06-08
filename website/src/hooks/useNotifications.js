import { useState, useEffect, useCallback } from 'react';
import socketClient from '../utils/socketClient';
import { buildUrl, getApiBase, getSocketServerUrl } from '../utils/runtimeConfig';

function getAuthHeaders() {
  const token = localStorage.getItem('ns_admin_token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Initialize socket and listen to real-time events
  useEffect(() => {
    let isMounted = true;

    // Fetch persisted notifications from server (if available)
    (async () => {
      try {
        const storedUser = localStorage.getItem('ns_user');
        let userId = null;
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            userId = user?.id || user?.userId;
          } catch (e) {
            console.error('Error parsing stored user info', e);
          }
        }

        const fetchUrls = [buildUrl(getApiBase(), '/api/notifications')];
        if (userId) {
          fetchUrls.push(buildUrl(getApiBase(), `/api/notifications?userId=${userId}`));
        }

        const responses = await Promise.all(
          fetchUrls.map((url) =>
            fetch(url).then((res) => (res.ok ? res.json() : { notifications: [] }))
          )
        );

        if (isMounted) {
          const allNotifications = responses.flatMap((r) => r.notifications || []);
          // De-duplicate by unique id
          const seen = new Set();
          const uniqueNotifications = [];
          for (const item of allNotifications) {
            if (item && item.id && !seen.has(item.id)) {
              seen.add(item.id);
              uniqueNotifications.push(item);
            }
          }
          // Sort by creation date (newest first)
          uniqueNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setNotifications(uniqueNotifications);
        }
      } catch (err) {
        // ignore fetch errors — fallback to empty list
        console.warn('Failed to fetch notifications', err.message);
      }
    })();

    const base = getSocketServerUrl();
    const socket = socketClient.initializeSocket(base);
    if (!socket) {
      return undefined;
    }

    // Personalised socket identification (user-specific notification channel)
    // requires an authenticated user session. The app currently has no auth
    // system — when one is added, call socketClient.identifyUser(userId, email)
    // and socketClient.joinRoom(`user-${userId}`) here using the session data.

    // Join general notification and announcement channels
    socketClient.joinRoom('notifications-room');
    socketClient.joinRoom('global-announcements');

    // Setup real-time event handlers mapping to the notification feed
    const handleRegistration = (data) => {
      setNotifications((prev) => {
        // Prevent duplicate by checking if we recently added a similar notification
        // Note: data.id would be better if server provides it
        return [
          {
            id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'connection',
            title: 'Registration Confirmed! 🎉',
            message: data.eventName
              ? `You are registered for "${data.eventName}"`
              : 'Your registration has been successfully confirmed.',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    };

    const handleWaitlist = (data) => {
      setNotifications((prev) => [
        {
          id: `waitlist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'mention',
          title: 'Waitlist Promotion! 🚀',
          message: data.eventName
            ? `Great news! You have been promoted for "${data.eventName}"`
            : 'You have been promoted from the waitlist.',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    const handleReminder = (data) => {
      setNotifications((prev) => [
        {
          id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'system',
          title: 'Upcoming Event Reminder ⏰',
          message: data.eventName
            ? `"${data.eventName}" is starting soon! Don't miss it.`
            : 'An event is starting shortly.',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    const handleAttendance = (data) => {
      setNotifications((prev) => [
        {
          id: `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'system',
          title: 'Attendance Confirmed! Check-in ✅',
          message: `Your check-in is complete! You earned ${data.points || 50} points.`,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    // Note: The backend seems to emit 'registration-confirmed' but previously it mapped to 'registrationConfirmed'
    // Let's use the actual events emitted by socketClient.js earlier, wait, I removed the mapping, so I must use the exact names from backend!
    // The previous setupEventListeners mapped:
    // 'registration-confirmed' -> 'registrationConfirmed'
    // 'waitlist-promotion' -> 'waitlistPromotion'
    // 'event-reminder' -> 'eventReminder'
    // 'attendance-marked' -> 'attendanceMarked'

    // Register active listeners using the actual backend event names
    socketClient.on('registration-confirmed', handleRegistration);
    socketClient.on('waitlist-promotion', handleWaitlist);
    socketClient.on('event-reminder', handleReminder);
    socketClient.on('attendance-marked', handleAttendance);

    return () => {
      isMounted = false;
      // Cleanup listeners passing handler references
      socketClient.off('registration-confirmed', handleRegistration);
      socketClient.off('waitlist-promotion', handleWaitlist);
      socketClient.off('event-reminder', handleReminder);
      socketClient.off('attendance-marked', handleAttendance);

      // When auth is implemented, call socketClient.leaveRoom(`user-${userId}`) here.
      socketClient.leaveRoom('notifications-room');
      socketClient.leaveRoom('global-announcements');

      // DO NOT disconnect the shared socket here
    };
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    // Persist
    (async () => {
      try {
        await fetch(buildUrl(getApiBase(), '/api/notifications/mark-read'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id }),
        });
      } catch (e) {}
    })();
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    (async () => {
      try {
        await fetch(buildUrl(getApiBase(), '/api/notifications/mark-all-read'), {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      } catch (e) {}
    })();
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    (async () => {
      try {
        await fetch(buildUrl(getApiBase(), '/api/notifications'), {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      } catch (e) {}
    })();
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    notifications,
    unreadCount,
    isOpen,
    togglePanel,
    closePanel,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
