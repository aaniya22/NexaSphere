```java
package org.nexasphere.service;

import jakarta.annotation.PostConstruct;
import org.nexasphere.event.AdminLoginEvent;
import org.nexasphere.event.AdminLogoutEvent;
import org.nexasphere.event.AdminEventPublisher;
import org.nexasphere.model.SessionInfo;
import org.nexasphere.model.TokenSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AdminAuthService {

    @Value("${ADMIN_EMAIL}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD}")
    private String adminPasswordHash;

    // Dummy hash used to prevent username enumeration timing attacks
    private static final String DUMMY_HASH =
            "$2a$10$7EqJtq98hPqEX7fNZaFWoOHi6M6Q8D9WnP6zYx8uQ5K9fY6Z8rW7K";

    private final TokenService tokenService;
    private final AdminEventPublisher publisher;
    private final PasswordEncoder passwordEncoder;

    public AdminAuthService(
            TokenService tokenService,
            AdminEventPublisher publisher,
            PasswordEncoder passwordEncoder
    ) {
        this.tokenService = tokenService;
        this.publisher = publisher;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    void init() {
        this.adminPasswordHash = passwordEncoder.encode(adminPasswordHash);
    }

    public boolean isValidCredentials(String email, String password) {

        // Always compare password hashes to avoid timing leaks
        String hashToCompare =
                adminEmail.equals(email)
                        ? adminPasswordHash
                        : DUMMY_HASH;

        boolean passwordMatches =
                passwordEncoder.matches(password, hashToCompare);

        // Randomized delay to reduce timing analysis
        try {
            Thread.sleep((long) (Math.random() * 100) + 50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return adminEmail.equals(email) && passwordMatches;
    }

    public TokenSession login(String email, String password) {

        if (!isValidCredentials(email, password)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid credentials"
            );
        }

        TokenSession session = tokenService.createSession(email);

        AdminLoginEvent event = new AdminLoginEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setAdminEmail(email);
        event.setAction("LOGIN");
        event.setTimestamp(LocalDateTime.now());

        publisher.publish(event);

        return session;
    }

    public void logout(String token) {

        Optional<SessionInfo> sessionOpt =
                tokenService.validate(token);

        if (sessionOpt.isPresent()) {

            SessionInfo info = sessionOpt.get();

            tokenService.revoke(token);

            AdminLogoutEvent event = new AdminLogoutEvent();

            event.setEventId(UUID.randomUUID().toString());
            event.setAdminEmail(info.email());
            event.setAction("LOGOUT");
            event.setTimestamp(LocalDateTime.now());

            publisher.publish(event);
        }
    }
}
```
