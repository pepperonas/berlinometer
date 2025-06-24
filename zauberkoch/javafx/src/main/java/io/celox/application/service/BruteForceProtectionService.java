package io.celox.application.service;

import com.vaadin.flow.spring.annotation.SpringComponent;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@SpringComponent
public class BruteForceProtectionService {
    private final Map<String, LoginAttempt> attemptCache = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final int BLOCK_DURATION_MINUTES = 10;

    public void registerFailedAttempt(String ip) {
        LoginAttempt attempt = attemptCache.getOrDefault(ip, new LoginAttempt(0, LocalDateTime.now()));
        attempt.incrementAttempts();
        attemptCache.put(ip, attempt);
    }

    public void resetAttempts(String ip) {
        attemptCache.remove(ip);
    }

    public boolean isBlocked(String ip) {
        LoginAttempt attempt = attemptCache.get(ip);
        if (attempt == null) {
            return false;
        }
        if (attempt.getAttempts() >= MAX_ATTEMPTS) {
            LocalDateTime blockEnd = attempt.getLastAttemptTime().plusMinutes(BLOCK_DURATION_MINUTES);
            if (LocalDateTime.now().isBefore(blockEnd)) {
                return true;
            } else {
                attemptCache.remove(ip);
                return false;
            }
        }
        return false;
    }

    // Neue Methode für verbleibende Sperrzeit
    public long getRemainingBlockTime(String ip) {
        LoginAttempt attempt = attemptCache.get(ip);
        if (attempt != null && attempt.getAttempts() >= MAX_ATTEMPTS) {
            LocalDateTime blockEnd = attempt.getLastAttemptTime().plusMinutes(BLOCK_DURATION_MINUTES);
            return ChronoUnit.MINUTES.between(LocalDateTime.now(), blockEnd);
        }
        return 0;
    }

    private static class LoginAttempt {
        private int attempts;
        private LocalDateTime lastAttemptTime;

        public LoginAttempt(int attempts, LocalDateTime lastAttemptTime) {
            this.attempts = attempts;
            this.lastAttemptTime = lastAttemptTime;
        }

        public void incrementAttempts() {
            this.attempts++;
            this.lastAttemptTime = LocalDateTime.now();
        }

        public int getAttempts() {
            return attempts;
        }

        public LocalDateTime getLastAttemptTime() {
            return lastAttemptTime;
        }
    }
}