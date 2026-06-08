import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@nexasphere.com';

const hasVapid = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (hasVapid) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function sendWebPush(subscription, payload) {
  if (!hasVapid) return null;
  try {
    const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
    return result;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { expired: true };
    }
    throw err;
  }
}

export async function sendWebPushToAll(subscriptions, payload) {
  if (!hasVapid) return [];
  const results = await Promise.allSettled(subscriptions.map((sub) => sendWebPush(sub, payload)));
  return results.map((r, i) => ({
    index: i,
    ok: r.status === 'fulfilled' && r.value && !r.value?.expired,
    expired: r.status === 'fulfilled' && r.value?.expired === true,
  }));
}

export { VAPID_PUBLIC_KEY, hasVapid };
