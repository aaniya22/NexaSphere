package org.nexasphere.service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.nexasphere.model.SessionInfo;
import org.nexasphere.model.TokenSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Manages administrative session tokens using a shared Redis store.
 *
 * <p>Sessions are persisted under the key namespace {@code session:admin:{tokenHash}}
 * with an 8-hour TTL. This enables both the Java backend and the Node.js backend
 * to validate tokens independently — without cross-service HTTP calls.</p>
 *
 * <p>Raw tokens are never stored; only their SHA-256 hashes are used as Redis keys.
 * Redis TTL handles automatic expiry, eliminating the need for scheduled cleanup.</p>
 */
@Service
public class TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenService.class);

    static final Duration SESSION_TTL = Duration.ofHours(8);
    static final String KEY_PREFIX = "session:admin:";

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    public TokenService(RedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public TokenSession createSession(String email) {
        Instant now = Instant.now();
        String token = generateToken();
        String tokenHash = hashToken(token);
        SessionInfo sessionInfo = new SessionInfo(tokenHash, email, now, now.plus(SESSION_TTL));

        String key = KEY_PREFIX + tokenHash;
        try {
            String json = objectMapper.writeValueAsString(sessionInfo);
            redisTemplate.opsForValue().set(key, json, SESSION_TTL);
            log.debug("Created admin session for {} (key={})", email, key);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize session info", e);
        }

        return new TokenSession(token, sessionInfo);
    }

    public Optional<SessionInfo> validate(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        String tokenHash = hashToken(token);
        String key = KEY_PREFIX + tokenHash;
        String json = redisTemplate.opsForValue().get(key);

        if (json == null) {
            return Optional.empty();
        }

        try {
            JsonNode node = objectMapper.readTree(json);
            Instant expiresAt = Instant.parse(node.get("expiresAt").asText());

            if (expiresAt.isBefore(Instant.now())) {
                // Expired session still lingering — delete it
                redisTemplate.delete(key);
                return Optional.empty();
            }

            SessionInfo info = new SessionInfo(
                    node.get("token").asText(),
                    node.get("email").asText(),
                    Instant.parse(node.get("createdAt").asText()),
                    expiresAt
            );
            return Optional.of(info);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize session from Redis (key={})", key, e);
            return Optional.empty();
        }
    }

    public void revoke(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        String key = KEY_PREFIX + hashToken(token);
        redisTemplate.delete(key);
        log.debug("Revoked admin session (key={})", key);
    }

    // lgtm[java/weak-cryptographic-algorithm]
    static String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes());
            return toHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String generateToken() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return toHex(bytes);
    }

    private static String toHex(byte[] bytes) {
        char[] hex = new char[bytes.length * 2];
        final char[] alphabet = "0123456789abcdef".toCharArray();
        for (int i = 0; i < bytes.length; i++) {
            int v = bytes[i] & 0xFF;
            hex[i * 2] = alphabet[v >>> 4];
            hex[i * 2 + 1] = alphabet[v & 0x0F];
        }
        return new String(hex);
    }
}
