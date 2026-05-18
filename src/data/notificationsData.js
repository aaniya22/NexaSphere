export const NOTIFICATION_TYPES = {
  MESSAGE:    'message',
  CONNECTION: 'connection',
  MENTION:    'mention',
  SYSTEM:     'system',
};

const notificationsData = [
  {
    id: 1,
    type: 'message',
    title: 'New Message',
    message: 'Ayush sent you a direct message.',
    link: '/messages',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    type: 'connection',
    title: 'Connection Accepted',
    message: 'Ravi accepted your connection request.',
    link: '/team',
    isRead: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    type: 'mention',
    title: 'You were mentioned',
    message: 'Someone @mentioned you in a post.',
    link: '/activities',
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    type: 'system',
    title: 'System Update',
    message: 'NexaSphere v2.0 is now live. Check out new features!',
    link: '/home',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default notificationsData;