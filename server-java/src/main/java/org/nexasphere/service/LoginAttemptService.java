package org.nexasphere.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private static final Logger logger = LoggerFactory.getLogger(LoginAttemptService.class);

    @Value("${security.auth.max-attempts:5}")
    private int maxAttempts;

    @Value("${security.auth.window-minutes:5}")
    private int windowMinutes;

    @Value("${security.auth.lockout-minutes:10}")
    private int lockoutMinutes;

    private final Map<String, LoginAttemptCache> attemptsCache = new ConcurrentHashMap<>();

    public boolean isBlocked(String ip) {
        LoginAttemptCache cache = attemptsCache.get(ip);
        if (cache == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        // If the IP is locked out, check if the lockout period has expired
        if (cache.getLockoutTime() != null) {
            if (now.isBefore(cache.getLockoutTime())) {
                logger.warn("[RATE_LIMITED] Blocked request from locked out IP: {}", ip);
                return true;
            } else {
                // Lockout expired, reset cache
                attemptsCache.remove(ip);
                logger.info("[LOCKOUT_EXPIRED] Lockout expired for IP: {}", ip);
                return false;
            }
        }

        return false;
    }

    public void loginFailed(String ip) {
        LocalDateTime now = LocalDateTime.now();
        LoginAttemptCache cache = attemptsCache.getOrDefault(ip, new LoginAttemptCache(0, now, null));

        // If the window has expired, reset attempts
        if (cache.getLastAttempt().plusMinutes(windowMinutes).isBefore(now)) {
            cache.setAttempts(0);
        }

        cache.setAttempts(cache.getAttempts() + 1);
        cache.setLastAttempt(now);

        logger.warn("[AUTH_FAILED] Failed login attempt from IP {} (Attempt {}/{})", ip, cache.getAttempts(), maxAttempts);

        if (cache.getAttempts() >= maxAttempts) {
            cache.setLockoutTime(now.plusMinutes(lockoutMinutes));
            logger.warn("[LOCKOUT] IP {} has been locked out for {} minutes due to excessive failed attempts", ip, lockoutMinutes);
        }

        attemptsCache.put(ip, cache);
    }

    public void loginSucceeded(String ip) {
        if (attemptsCache.containsKey(ip)) {
            attemptsCache.remove(ip);
            logger.info("Cleared failed attempt counters for IP: {}", ip);
        }
    }

    // Simple cache object
    private static class LoginAttemptCache {
        private int attempts;
        private LocalDateTime lastAttempt;
        private LocalDateTime lockoutTime;

        public LoginAttemptCache(int attempts, LocalDateTime lastAttempt, LocalDateTime lockoutTime) {
            this.attempts = attempts;
            this.lastAttempt = lastAttempt;
            this.lockoutTime = lockoutTime;
        }

        public int getAttempts() {
            return attempts;
        }

        public void setAttempts(int attempts) {
            this.attempts = attempts;
        }

        public LocalDateTime getLastAttempt() {
            return lastAttempt;
        }

        public void setLastAttempt(LocalDateTime lastAttempt) {
            this.lastAttempt = lastAttempt;
        }

        public LocalDateTime getLockoutTime() {
            return lockoutTime;
        }

        public void setLockoutTime(LocalDateTime lockoutTime) {
            this.lockoutTime = lockoutTime;
        }
    }
}
