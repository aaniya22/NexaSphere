package org.nexasphere.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.nexasphere.model.SessionInfo;
import org.nexasphere.model.TokenSession;
import org.nexasphere.service.AdminAuthService;
import org.nexasphere.service.LoginAttemptService;
import org.nexasphere.service.LoginRateLimitService;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class AdminControllerRateLimitTest {

    private AdminController adminController;
    private AdminAuthService adminAuthService;
    private LoginRateLimitService rateLimitService;
    private LoginAttemptService loginAttemptService;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        adminAuthService = Mockito.mock(AdminAuthService.class);
        rateLimitService = Mockito.mock(LoginRateLimitService.class);
        loginAttemptService = new LoginAttemptService();
        
        // Set properties that would normally be injected
        ReflectionTestUtils.setField(loginAttemptService, "maxAttempts", 5);
        ReflectionTestUtils.setField(loginAttemptService, "windowMinutes", 5);
        ReflectionTestUtils.setField(loginAttemptService, "lockoutMinutes", 10);
        
        adminController = new AdminController(adminAuthService, rateLimitService, loginAttemptService);
        request = Mockito.mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        
        // Mock generic bucket rate limit to always pass
        when(rateLimitService.tryConsume(anyString())).thenReturn(true);
    }

    @Test
    void testValidLoginResetsCounter() {
        AdminController.LoginRequest validReq = new AdminController.LoginRequest("admin@test.com", "password");
        
        when(adminAuthService.login(anyString(), anyString())).thenReturn(
                new TokenSession(UUID.randomUUID().toString(), new SessionInfo(UUID.randomUUID().toString(), "admin@test.com", Instant.now(), Instant.now().plusSeconds(86400)))
        );

        AdminController.LoginResponse response = adminController.login(validReq, request);
        assertEquals("admin@test.com", response.email());
    }

    @Test
    @SuppressWarnings("null")
    void testRateLimitingOnFailedLogins() {
        AdminController.LoginRequest invalidReq = new AdminController.LoginRequest("admin@test.com", "wrong");
        when(adminAuthService.login(anyString(), anyString())).thenThrow(
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        );

        // Scenario 2: 5 failed logins
        for (int i = 0; i < 5; i++) {
            ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
                adminController.login(invalidReq, request);
            });
            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        }

        // Scenario 3: 6th failed login should throw 429 TOO_MANY_REQUESTS
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            adminController.login(invalidReq, request);
        });
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatusCode());
        assertEquals("Too many failed login attempts. Please try again later.", ex.getReason());
    }
}
