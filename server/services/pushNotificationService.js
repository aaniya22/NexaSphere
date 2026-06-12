import admin from 'firebase-admin';
import logger from '../utils/logger.js';
import { CircuitBreaker, circuitBreakerRegistry } from '../utils/circuitBreaker.js';

let messaging = null;

export function initializeFirebase() {
  try {
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }

    messaging = admin.messaging();
    logger.info('Firebase Cloud Messaging initialized');

    const _rawSend = messaging.send.bind(messaging);
    const _rawSendMulticast = messaging.sendMulticast.bind(messaging);
    const _rawSubscribeToTopic = messaging.subscribeToTopic.bind(messaging);

    circuitBreakerRegistry.register(
      'fcm-send',
      new CircuitBreaker(_rawSend, {
        name: 'fcm-send',
        failureThreshold: 3,
        successThreshold: 2,
        coolDownPeriod: 10000,
        maxCoolDownPeriod: 60000,
      })
    );

    circuitBreakerRegistry.register(
      'fcm-multicast',
      new CircuitBreaker(_rawSendMulticast, {
        name: 'fcm-multicast',
        failureThreshold: 3,
        successThreshold: 2,
        coolDownPeriod: 10000,
        maxCoolDownPeriod: 60000,
      })
    );

    circuitBreakerRegistry.register(
      'fcm-subscribe',
      new CircuitBreaker(_rawSubscribeToTopic, {
        name: 'fcm-subscribe',
        failureThreshold: 3,
        successThreshold: 2,
        coolDownPeriod: 10000,
        maxCoolDownPeriod: 60000,
      })
    );

    return messaging;
  } catch (error) {
    logger.warn('Firebase not configured - push notifications disabled', {
      error: error.message,
    });
    return null;
  }
}

export function getMessaging() {
  return messaging;
}

export async function sendPushNotification(userToken, notification) {
  if (!messaging) {
    logger.warn('Push notifications not available');
    return null;
  }

  try {
    const message = {
      token: userToken,
      notification: {
        title: notification.title || 'NexaSphere',
        body: notification.body || '',
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: notification.clickAction || '',
        },
      },
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: notification.tag || 'notification',
          data: notification.data,
        },
        fcmOptions: {
          link: notification.link || '/',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            'content-available': 1,
          },
        },
      },
    };

    const fcmBreaker = circuitBreakerRegistry.get('fcm-send');
    const response = fcmBreaker ? await fcmBreaker.execute(message) : await messaging.send(message);
    logger.info('Push notification sent', { response, title: notification.title });
    return response;
  } catch (error) {
    if (error.code === 'CIRCUIT_OPEN') {
      logger.warn('FCM circuit breaker is OPEN, skipping push notification');
    } else {
      logger.error('Failed to send push notification', {
        error: error.message,
        token: userToken,
      });
    }
    return null;
  }
}

export async function sendMulticastNotification(userTokens, notification) {
  if (!messaging || !userTokens.length) return null;

  try {
    const message = {
      notification: {
        title: notification.title || 'NexaSphere',
        body: notification.body || '',
      },
      data: notification.data || {},
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/pwa-192x192.png',
        },
      },
    };

    const fcmBreaker = circuitBreakerRegistry.get('fcm-multicast');
    const response = fcmBreaker
      ? await fcmBreaker.execute({
          tokens: userTokens,
          ...message,
        })
      : await messaging.sendMulticast({
          tokens: userTokens,
          ...message,
        });

    logger.info('Multicast notification sent', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    return response;
  } catch (error) {
    if (error.code === 'CIRCUIT_OPEN') {
      logger.warn('FCM multicast circuit breaker is OPEN');
    } else {
      logger.error('Multicast notification failed', { error: error.message });
    }
    return null;
  }
}

export async function subscribeToTopic(tokens, topic) {
  if (!messaging) return null;

  try {
    const fcmBreaker = circuitBreakerRegistry.get('fcm-subscribe');
    if (fcmBreaker) {
      await fcmBreaker.execute(tokens, topic);
    } else {
      await messaging.subscribeToTopic(tokens, topic);
    }
    logger.info('Users subscribed to topic', { topic, count: tokens.length });
    return true;
  } catch (error) {
    if (error.code === 'CIRCUIT_OPEN') {
      logger.warn('FCM subscribe circuit breaker is OPEN');
    } else {
      logger.error('Topic subscription failed', { error: error.message, topic });
    }
    return false;
  }
}

export async function sendToTopic(topic, notification) {
  if (!messaging) return null;

  try {
    const message = {
      topic,
      notification: {
        title: notification.title || 'NexaSphere',
        body: notification.body || '',
      },
      data: notification.data || {},
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/pwa-192x192.png',
        },
      },
    };

    const fcmBreaker = circuitBreakerRegistry.get('fcm-send');
    const response = fcmBreaker ? await fcmBreaker.execute(message) : await messaging.send(message);
    logger.info('Topic notification sent', { topic, response });
    return response;
  } catch (error) {
    if (error.code === 'CIRCUIT_OPEN') {
      logger.warn('FCM circuit breaker is OPEN, skipping topic notification');
    } else {
      logger.error('Topic notification failed', { error: error.message, topic });
    }
    return null;
  }
}

export default {
  initializeFirebase,
  getMessaging,
  sendPushNotification,
  sendMulticastNotification,
  subscribeToTopic,
  sendToTopic,
};
