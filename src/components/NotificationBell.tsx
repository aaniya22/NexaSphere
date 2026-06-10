import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, Users, AtSign, Settings, X, CheckCheck, Trash2 } from 'lucide-react';
import { useSocket } from './providers/SocketProvider';

// Define the Notification interface matching our Prisma schema
export interface Notification {
  id: string;
  userId: string;
  workspaceId: string;
  title: string;
  content: string;
  triggerType: string;
  payload: Record<string, any>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  userId: string;
  workspaceId: string;
}

// Icon mappings based on trigger type
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  COMMENT_ADDED: {
    icon: <MessageCircle size={16} />,
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.15)',
  },
  TASK_ASSIGNED: { icon: <Users size={16} />, color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  MENTION: { icon: <AtSign size={16} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  SYSTEM: { icon: <Settings size={16} />, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
};

function timeAgo(isoString: string): string {
  if (!isoString) return 'just now';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'just now';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * A highly-styled, real-time Notification Bell component.
 * Exposes dropdown overlay with lists of user notifications scoped by tenant.
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({ userId, workspaceId }) => {
  const { subscribe, unsubscribe } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [shouldWiggle, setShouldWiggle] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 1. Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications`, {
          headers: {
            'x-workspace-id': workspaceId,
            'x-user-id': userId,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('[NotificationBell] Failed to fetch notifications:', error);
      }
    };

    if (userId && workspaceId) {
      fetchNotifications();
    }
  }, [userId, workspaceId]);

  // 2. Subscribe to real-time events via SocketProvider
  useEffect(() => {
    if (!userId) return;

    const channelName = `user-${userId}`;
    const eventName = 'notification:new';

    const handleNewNotification = (newNotif: Notification) => {
      // Prepend notification
      setNotifications((prev) => [newNotif, ...prev]);
      // Trigger wiggle animation
      setShouldWiggle(true);
    };

    subscribe(channelName, eventName, handleNewNotification);

    return () => {
      unsubscribe(channelName, eventName, handleNewNotification);
    };
  }, [userId, subscribe, unsubscribe]);

  // Reset wiggle animation
  useEffect(() => {
    if (shouldWiggle) {
      const timer = setTimeout(() => setShouldWiggle(false), 800);
      return () => clearTimeout(timer);
    }
  }, [shouldWiggle]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 3. Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    // Optimistic Update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );

    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
          'x-user-id': userId,
        },
      });
    } catch (error) {
      console.error('[NotificationBell] Failed to mark notification as read:', error);
    }
  };

  // 4. Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    // Optimistic Update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );

    try {
      await fetch(`/api/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
          'x-user-id': userId,
        },
      });
    } catch (error) {
      console.error('[NotificationBell] Failed to mark all as read:', error);
    }
  };

  // 5. Delete notification
  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering markAsRead
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'x-workspace-id': workspaceId,
          'x-user-id': userId,
        },
      });
    } catch (error) {
      console.error('[NotificationBell] Failed to delete notification:', error);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '10px',
          cursor: 'pointer',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <motion.div
          animate={shouldWiggle ? { rotate: [0, -20, 20, -20, 20, -10, 10, 0] } : {}}
          transition={{ duration: 0.7 }}
        >
          <Bell size={20} />
        </motion.div>

        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0f0f11',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '360px',
              backgroundColor: 'rgba(20, 20, 25, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              overflow: 'hidden',
              zIndex: 1000,
            }}
          >
            {/* Dropdown Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f3f4f6' }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div
              style={{
                maxHeight: '320px',
                overflowY: 'auto',
                padding: '8px 0',
              }}
            >
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '13px',
                  }}
                >
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => {
                  const typeCfg = TYPE_CONFIG[notif.triggerType] || TYPE_CONFIG.SYSTEM;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id)}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: notif.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = notif.isRead
                          ? 'transparent'
                          : 'rgba(99, 102, 241, 0.05)';
                      }}
                    >
                      {/* Left Side Icon */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: typeCfg.bg,
                          color: typeCfg.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {typeCfg.icon}
                      </div>

                      {/* Content block */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: notif.isRead ? 500 : 600,
                            color: notif.isRead ? '#9ca3af' : '#f3f4f6',
                            marginBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {notif.title}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            lineHeight: '1.4',
                            marginBottom: '4px',
                          }}
                        >
                          {notif.content}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>
                          {timeAgo(notif.createdAt)}
                        </div>
                      </div>

                      {/* Action buttons / Unread badge */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                          flexShrink: 0,
                          width: '24px',
                        }}
                      >
                        {!notif.isRead && (
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#6366f1',
                              boxShadow: '0 0 8px #6366f1',
                            }}
                          />
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(notif.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#4b5563',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#4b5563')}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
