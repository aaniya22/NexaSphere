const sessions = new Map();

const IMPERSONATION_TTL_MS = 30 * 60 * 1000;

export const impersonationService = {
  start(token, targetUser) {
    sessions.set(token, {
      targetUser,
      startedAt: new Date().toISOString(),
    });
  },

  stop(token) {
    sessions.delete(token);
  },

  getActive(token) {
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() - new Date(session.startedAt).getTime() > IMPERSONATION_TTL_MS) {
      sessions.delete(token);
      return null;
    }
    return session;
  },
};
