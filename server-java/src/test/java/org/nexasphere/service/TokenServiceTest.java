package org.nexasphere.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.nexasphere.model.SessionInfo;
import org.nexasphere.model.TokenSession;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

/**
 * Unit tests for {@link TokenService} with mocked Redis — no real Redis connection required.
 */
@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private ObjectMapper objectMapper;
    private TokenService tokenService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        tokenService = new TokenService(redisTemplate, objectMapper);
    }

    @Test
    void testCreateSessionStoresInRedisWithTtl() {
        TokenSession session = tokenService.createSession("admin@example.com");

        assertNotNull(session.token());
        assertEquals(48, session.token().length(), "Token should be 48 hex chars (24 bytes)");
        assertTrue(session.token().matches("^[0-9a-f]{48}$"), "Token should be lowercase hex");

        SessionInfo info = session.sessionInfo();
        assertEquals("admin@example.com", info.email());
        assertNotNull(info.createdAt());
        assertNotNull(info.expiresAt());
        assertTrue(info.expiresAt().isAfter(info.createdAt()));

        // Verify Redis SET was called with correct key prefix and 8h TTL
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> valueCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Duration> ttlCaptor = ArgumentCaptor.forClass(Duration.class);

        verify(valueOperations).set(keyCaptor.capture(), valueCaptor.capture(), ttlCaptor.capture());

        assertTrue(keyCaptor.getValue().startsWith("session:admin:"));
        assertEquals(Duration.ofHours(8), ttlCaptor.getValue());
        assertTrue(valueCaptor.getValue().contains("admin@example.com"));
    }

    @Test
    void testValidateValidTokenReturnsSession() throws Exception {
        String rawToken = "a".repeat(48);
        String tokenHash = TokenService.hashToken(rawToken);
        String key = "session:admin:" + tokenHash;

        Instant now = Instant.now();
        SessionInfo stored = new SessionInfo(tokenHash, "admin@test.com", now, now.plusSeconds(3600));
        String json = objectMapper.writeValueAsString(stored);

        when(valueOperations.get(key)).thenReturn(json);

        Optional<SessionInfo> result = tokenService.validate(rawToken);

        assertTrue(result.isPresent());
        assertEquals("admin@test.com", result.get().email());
        assertEquals(tokenHash, result.get().token());
    }

    @Test
    void testValidateExpiredTokenReturnsEmptyAndDeletesKey() throws Exception {
        String rawToken = "b".repeat(48);
        String tokenHash = TokenService.hashToken(rawToken);
        String key = "session:admin:" + tokenHash;

        Instant past = Instant.now().minusSeconds(3600);
        SessionInfo expired = new SessionInfo(tokenHash, "admin@test.com", past.minusSeconds(7200), past);
        String json = objectMapper.writeValueAsString(expired);

        when(valueOperations.get(key)).thenReturn(json);

        Optional<SessionInfo> result = tokenService.validate(rawToken);

        assertTrue(result.isEmpty(), "Expired sessions should return empty");
        verify(redisTemplate).delete(key);
    }

    @Test
    void testValidateMissingKeyReturnsEmpty() {
        String rawToken = "c".repeat(48);
        String tokenHash = TokenService.hashToken(rawToken);
        String key = "session:admin:" + tokenHash;

        when(valueOperations.get(key)).thenReturn(null);

        Optional<SessionInfo> result = tokenService.validate(rawToken);

        assertTrue(result.isEmpty());
    }

    @Test
    void testValidateNullTokenReturnsEmpty() {
        assertTrue(tokenService.validate(null).isEmpty());
        assertTrue(tokenService.validate("").isEmpty());
        assertTrue(tokenService.validate("   ").isEmpty());

        // Verify no Redis calls were made for null/blank tokens
        verify(valueOperations, never()).get(anyString());
    }

    @Test
    void testRevokeDeletesRedisKey() {
        String rawToken = "d".repeat(48);
        String tokenHash = TokenService.hashToken(rawToken);
        String key = "session:admin:" + tokenHash;

        tokenService.revoke(rawToken);

        verify(redisTemplate).delete(key);
    }

    @Test
    void testRevokeNullTokenDoesNothing() {
        tokenService.revoke(null);
        tokenService.revoke("");
        tokenService.revoke("   ");

        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    void testHashTokenIsDeterministic() {
        String token = "test-token-value";
        String hash1 = TokenService.hashToken(token);
        String hash2 = TokenService.hashToken(token);

        assertEquals(hash1, hash2, "Same input must always produce the same hash");
        assertEquals(64, hash1.length(), "SHA-256 produces 64 hex chars");
    }

    @Test
    void testCreateSessionGeneratesUniqueTokens() {
        TokenSession session1 = tokenService.createSession("admin@example.com");
        TokenSession session2 = tokenService.createSession("admin@example.com");

        assertNotEquals(session1.token(), session2.token(),
                "Each session must have a unique random token");
    }
}
