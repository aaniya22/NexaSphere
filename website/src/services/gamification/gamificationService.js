// src/services/gamification/gamificationService.js
import { getApiBase } from '../../utils/runtimeConfig';

// XP Values for different actions
export const XP_VALUES = {
  ATTEND_EVENT: 50,
  ORGANIZE_EVENT: 200,
  COMPLETE_MENTORSHIP: 500,
  ADD_PORTFOLIO_PROJECT: 100,
  GIVE_FEEDBACK: 25,
  HELP_SOMEONE: 30, // Answered a question
  DAILY_STREAK: 20,
  EVENT_REGISTRATION: 10,
  FIRST_BLOG_POST: 50,
  LEARN_NEW_TECH: 40,
  SKILL_ASSESSMENT: 100,
  VOLUNTEER: 150,
  HACKATHON_WIN: 1000,
  SPEAKER: 500,
  BETA_TESTER: 100,
  COMMENT_POSTED: 5,
  SHARE_EVENT: 15,
};

// Achievement tiers and requirements
export const ACHIEVEMENTS = {
  // Event based achievements
  FIRST_EVENT: {
    id: 'first_event',
    title: 'First Step',
    description: 'Attend your first event',
    icon: '🎯',
    tier: 'bronze',
    xpReward: 50,
    requirement: { type: 'events_attended', count: 1 },
  },
  EVENT_STALWART: {
    id: 'event_stalwart',
    title: 'Stalwart',
    description: 'Attend 5 events',
    icon: '🎖️',
    tier: 'silver',
    xpReward: 250,
    requirement: { type: 'events_attended', count: 5 },
  },
  EVENT_MASTER: {
    id: 'event_master',
    title: 'Event Master',
    description: 'Attend 10 events',
    icon: '🏆',
    tier: 'gold',
    xpReward: 500,
    requirement: { type: 'events_attended', count: 10 },
  },
  EVENT_VETERAN: {
    id: 'event_veteran',
    title: 'Event Veteran',
    description: 'Attend 25 events',
    icon: '🎖️',
    tier: 'platinum',
    xpReward: 1000,
    requirement: { type: 'events_attended', count: 25 },
  },
  EVENT_LEGEND: {
    id: 'event_legend',
    title: 'Event Legend',
    description: 'Attend 50 events',
    icon: '👑',
    tier: 'platinum',
    xpReward: 2500,
    requirement: { type: 'events_attended', count: 50 },
  },
  EVENT_CENTURION: {
    id: 'event_centurion',
    title: 'Centurion',
    description: 'Attend 100 events',
    icon: '🏛️',
    tier: 'platinum',
    xpReward: 5000,
    requirement: { type: 'events_attended', count: 100 },
  },

  // Streak achievements
  STREAK_3: {
    id: 'streak_3',
    title: 'On Fire',
    description: '3 day login streak',
    icon: '🔥',
    tier: 'bronze',
    xpReward: 30,
    requirement: { type: 'streak', count: 3 },
  },
  STREAK_7: {
    id: 'streak_7',
    title: 'Unstoppable',
    description: '7 day login streak',
    icon: '⚡',
    tier: 'silver',
    xpReward: 100,
    requirement: { type: 'streak', count: 7 },
  },
  STREAK_30: {
    id: 'streak_30',
    title: 'Committed',
    description: '30 day login streak',
    icon: '🗓️',
    tier: 'gold',
    xpReward: 500,
    requirement: { type: 'streak', count: 30 },
  },

  // Social
  FIRST_CONNECTION: {
    id: 'first_connection',
    title: 'Networker',
    description: 'Make your first connection',
    icon: '🤝',
    tier: 'bronze',
    xpReward: 25,
    requirement: { type: 'connections', count: 1 },
  },
  MENTOR: {
    id: 'mentor',
    title: 'Guide',
    description: 'Become a mentor',
    icon: '🎓',
    tier: 'silver',
    xpReward: 500,
    requirement: { type: 'mentorships_given', count: 1 },
  },

  // Content
  FIRST_PROJECT: {
    id: 'first_project',
    title: 'Innovator',
    description: 'Add your first portfolio project',
    icon: '🚀',
    tier: 'bronze',
    xpReward: 100,
    requirement: { type: 'content_created', count: 1 },
  },
  PORTFOLIO_MASTER: {
    id: 'portfolio_master',
    title: 'Portfolio Master',
    description: 'Showcase 5 portfolio projects',
    icon: '📁',
    tier: 'silver',
    xpReward: 500,
    requirement: { type: 'content_created', count: 5 },
  },

  // Skills
  TECH_LEARNER: {
    id: 'tech_learner',
    title: 'Always Learning',
    description: 'Learn a new technology',
    icon: '🧠',
    tier: 'bronze',
    xpReward: 50,
    requirement: { type: 'tech_learned', count: 1 },
  },

  // Community
  ORGANIZER: {
    id: 'organizer',
    title: 'Initiator',
    description: 'Organize your first event',
    icon: '📣',
    tier: 'gold',
    xpReward: 1000,
    requirement: { type: 'events_organized', count: 1 },
  },
  FEEDBACK_GIVER: {
    id: 'feedback_giver',
    title: 'Helpful Voice',
    description: 'Give your first event feedback',
    icon: '💬',
    tier: 'bronze',
    xpReward: 25,
    requirement: { type: 'feedback', count: 1 },
  },

  // Special
  HACKATHON_CHAMP: {
    id: 'hackathon_champ',
    title: 'Hackathon Winner',
    description: 'Win a NexaSphere Hackathon',
    icon: '🥇',
    tier: 'platinum',
    xpReward: 2000,
    requirement: { type: 'hackathon_wins', count: 1 },
  },
  FOUNDING_MEMBER: {
    id: 'founding_member',
    title: 'Founding Member',
    description: 'Part of the early community',
    icon: '💎',
    tier: 'silver',
    xpReward: 1000,
    requirement: { type: 'special', tag: 'founder' },
  },
};

// Level thresholds
export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Newcomer' },
  { level: 2, xpRequired: 500, title: 'Explorer' },
  { level: 3, xpRequired: 1500, title: 'Contributor' },
  { level: 4, xpRequired: 4000, title: 'Expert' },
  { level: 5, xpRequired: 10000, title: 'Legend' },
];

const ANTI_GAMING_COOLDOWN = 1000 * 60; // 1 minute per action type

class GamificationService {
  constructor() {
    this.userData = this.loadUserData();
  }

  loadUserData() {
    const stored = localStorage.getItem('gamification_user_data');
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      userId: null,
      xp: 0,
      level: 1,
      title: 'Newcomer',
      achievements: [],
      stats: {
        events_attended: 0,
        events_registered: 0,
        comments: 0,
        referrals: 0,
        content_created: 0,
        feedback: 0,
        shares: 0,
        current_streak: 0,
        connections: 0,
        mentorships_given: 0,
        tech_learned: 0,
        events_organized: 0,
        hackathon_wins: 0,
        blogs: 0,
        special_tags: [],
        longest_streak: 0,
        last_active: null,
      },
      badges: [],
      streak_freeze_count: 1,
      last_actions: {}, // For anti-gaming
      notifications: [],
    };
  }

  saveUserData() {
    // Cap notifications to last 50 to prevent unbounded localStorage growth
    if (this.userData.notifications.length > 50) {
      this.userData.notifications = this.userData.notifications.slice(-50);
    }
    try {
      localStorage.setItem('gamification_user_data', JSON.stringify(this.userData));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        console.warn(
          '[GamificationService] localStorage quota exceeded — trimming notifications ' +
            'and retrying. Consider migrating to IndexedDB for long-term storage.'
        );
        // Aggressively trim notifications and retry once
        this.userData.notifications = [];
        try {
          localStorage.setItem('gamification_user_data', JSON.stringify(this.userData));
        } catch (_) {
          // If it still fails, data loss is preferable to a thrown error
          console.warn('[GamificationService] Retry after trim also failed — skipping save.');
        }
      } else {
        throw err;
      }
    }
  }

  // Update user ID
  setUserId(userId) {
    this.userData.userId = userId;
    this.saveUserData();
  }

  // Track user action and award XP
  trackAction(action, metadata = {}) {
    // Anti-gaming: Prevent rapid spamming of same action
    const now = Date.now();
    const lastActionTime = this.userData.last_actions?.[action] || 0;
    if (now - lastActionTime < ANTI_GAMING_COOLDOWN) {
      console.warn(`[Gamification] Action "${action}" ignored due to anti-gaming cooldown.`);
      return { xpEarned: 0, cooldown: true };
    }

    let xpEarned = XP_VALUES[action] || 0;

    // Streak multiplier: 2x for 7+ day streaks
    if (this.userData.stats.current_streak >= 7) {
      xpEarned *= 2;
    }

    // Update stats based on action
    this.updateStats(action, metadata, now);

    // Add XP
    this.addXP(xpEarned);

    // Check and unlock achievements
    const newAchievements = this.checkAchievements();

    // Update streak
    this.updateStreak();

    // Save data
    this.saveUserData();

    return {
      xpEarned,
      newAchievements,
      totalXP: this.userData.xp,
      level: this.userData.level,
    };
  }

  updateStats(action, metadata, timestamp) {
    const stats = this.userData.stats;
    this.userData.last_actions[action] = timestamp;

    switch (action) {
      case 'ATTEND_EVENT':
        stats.events_attended++;
        break;
      case 'EVENT_REGISTRATION':
        stats.events_registered++;
        break;
      case 'SHARE_EVENT':
        stats.shares++;
        break;
      case 'ORGANIZE_EVENT':
        stats.events_organized = (stats.events_organized || 0) + 1;
        break;
      case 'COMMENT_POSTED':
        stats.comments++;
        break;
      case 'ADD_PORTFOLIO_PROJECT':
        stats.content_created++;
        break;
      case 'GIVE_FEEDBACK':
        stats.feedback++;
        break;
      case 'MAKE_CONNECTION':
        stats.connections++;
        break;
      case 'COMPLETE_MENTORSHIP':
        stats.mentorships_given++;
        break;
      case 'SKILL_ASSESSMENT':
        stats.tech_learned++;
        break;
      case 'HACKATHON_WIN':
        stats.hackathon_wins++;
        break;
    }
  }

  // Level-gate check
  isFeatureAllowed(feature) {
    const level = this.userData.level;
    if (feature === 'ORGANIZE_EVENT') return level >= 3;
    return true;
  }

  addXP(amount) {
    this.userData.xp += amount;
    this.updateLevel();
  }

  updateLevel() {
    let newLevel = 1;
    let newTitle = 'Newcomer';

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.userData.xp >= LEVEL_THRESHOLDS[i].xpRequired) {
        newLevel = LEVEL_THRESHOLDS[i].level;
        newTitle = LEVEL_THRESHOLDS[i].title;
        break;
      }
    }

    if (newLevel > this.userData.level) {
      this.userData.notifications.push({
        type: 'level_up',
        message: `Congratulations! You reached Level ${newLevel} - ${newTitle}!`,
        timestamp: new Date().toISOString(),
      });
    }

    this.userData.level = newLevel;
    this.userData.title = newTitle;
  }

  /**
   * Handles daily streaks and "Streak Freeze" logic.
   * If last active was yesterday, increment.
   * If missed one day, use streak freeze if available.
   * Otherwise, reset.
   */
  updateStreak() {
    const today = new Date().toDateString();
    const lastActive = this.userData.stats.last_active;

    if (lastActive === today) {
      return; // Already updated today
    }

    const yesterday = this.getRelativeDate(-1);
    const dayBeforeYesterday = this.getRelativeDate(-2);

    if (lastActive === yesterday) {
      this.incrementStreak();
    } else if (lastActive === dayBeforeYesterday && this.userData.streak_freeze_count > 0) {
      // Streak Freeze triggered!
      this.userData.streak_freeze_count--;
      this.incrementStreak('🧊 Streak Freeze Used! Streak saved.');
    } else {
      this.userData.stats.current_streak = 1;
    }

    this.userData.stats.last_active = today;
  }

  getRelativeDate(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toDateString();
  }

  incrementStreak(specialMessage = null) {
    this.userData.stats.current_streak++;
    if (this.userData.stats.current_streak > this.userData.stats.longest_streak) {
      this.userData.stats.longest_streak = this.userData.stats.current_streak;
    }
    this.addXP(XP_VALUES.DAILY_STREAK);
    this.userData.notifications.push({
      type: 'streak',
      message:
        specialMessage ||
        `🔥 ${this.userData.stats.current_streak} day streak! +${XP_VALUES.DAILY_STREAK} XP`,
      timestamp: new Date().toISOString(),
    });
  }

  checkAchievements() {
    const unlockedAchievements = [];
    const stats = this.userData.stats;
    const existingIds = new Set(this.userData.achievements.map((a) => a.id));

    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (existingIds.has(achievement.id)) continue;

      let progress = 0;
      switch (achievement.requirement.type) {
        case 'events_attended':
          progress = stats.events_attended;
          break;
        case 'streak':
          progress = stats.current_streak;
          break;
        case 'comments':
          progress = stats.comments;
          break;
        case 'referrals':
          progress = stats.referrals;
          break;
        case 'content_created':
          progress = stats.content_created;
          break;
        case 'feedback':
          progress = stats.feedback;
          break;
      }

      if (progress >= achievement.requirement.count) {
        this.userData.achievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString(),
        });
        this.userData.badges.push({
          id: achievement.id,
          title: achievement.title,
          icon: achievement.icon,
          tier: achievement.tier,
          unlockedAt: new Date().toISOString(),
        });
        this.addXP(achievement.xpReward);
        unlockedAchievements.push(achievement);

        this.userData.notifications.push({
          type: 'achievement',
          message: `🏆 Achievement Unlocked: ${achievement.title}! +${achievement.xpReward} XP`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return unlockedAchievements;
  }

  getUserStats() {
    return {
      xp: this.userData.xp,
      level: this.userData.level,
      title: this.userData.title,
      nextLevelXP: this.getNextLevelXP(),
      achievements: this.userData.achievements,
      badges: this.userData.badges,
      stats: this.userData.stats,
      notifications: this.userData.notifications,
    };
  }

  getNextLevelXP() {
    const currentLevel = this.userData.level;
    const nextLevelData = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel + 1);
    return nextLevelData ? nextLevelData.xpRequired : this.userData.xp;
  }

  getXPProgress() {
    const currentLevel = this.userData.level;
    const currentThreshold =
      LEVEL_THRESHOLDS.find((l) => l.level === currentLevel)?.xpRequired || 0;
    const nextThreshold = this.getNextLevelXP();

    if (nextThreshold === this.userData.xp) return 100; // Max level
    const progress =
      ((this.userData.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  async getLeaderboard() {
    const MOCK_LEADERBOARD = [
      { rank: 1, name: 'Alex Johnson', xp: 2850, level: 8, avatar: '👨‍💻' },
      { rank: 2, name: 'Sarah Chen', xp: 2420, level: 7, avatar: '👩‍💻' },
      { rank: 3, name: 'Mike Ross', xp: 2100, level: 7, avatar: '👨‍💼' },
      { rank: 4, name: 'Emma Watson', xp: 1850, level: 6, avatar: '👩‍🎓' },
      { rank: 5, name: 'David Kim', xp: 1520, level: 6, avatar: '👨‍🔬' },
    ];

    const base = getApiBase();
    if (!base) return MOCK_LEADERBOARD;

    try {
      const res = await fetch(`${base}/api/dashboard/leaderboard`);
      if (!res.ok) return MOCK_LEADERBOARD;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return MOCK_LEADERBOARD;
      // Map backend UserProfileEntity shape to leaderboard display shape
      return data.map((user, i) => ({
        rank: i + 1,
        name: user.username || user.name || 'Anonymous',
        xp: user.xp ?? 0,
        level: user.level ?? 1,
        avatar: '👤',
      }));
    } catch {
      return MOCK_LEADERBOARD;
    }
  }

  getTierColor(tier) {
    switch (tier) {
      case 'bronze':
        return '#CD7F32';
      case 'silver':
        return '#C0C0C0';
      case 'gold':
        return '#FFD700';
      case 'platinum':
        return '#E5E4E2';
      default:
        return '#CC1111';
    }
  }

  clearNotifications() {
    this.userData.notifications = [];
    this.saveUserData();
  }
}

export const gamificationService = new GamificationService();
