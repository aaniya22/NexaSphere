import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

/**
 * Server-side Pusher client used to trigger events.
 *
 * Safe to import and use only in server-side environments (API routes, Server Actions, etc.).
 * Reads configuration details from environment variables.
 */
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || 'mock-app-id',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || 'mock-key',
  secret: process.env.PUSHER_SECRET || 'mock-secret',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  useTLS: true,
});

/**
 * Client-side Pusher client used to subscribe to channels and listen for events.
 *
 * Lazy-initialized to ensure it only runs on the client-side (browser) and avoids
 * server-side rendering (SSR) errors.
 */
export const pusherClient =
  typeof window !== 'undefined'
    ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || 'mock-key', {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
        authEndpoint: '/api/pusher/auth',
      })
    : null;
