package io.celox.application.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.SQLException;

import io.celox.application.model.User;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;

/**
 * Eigener Authentifizierungsservice als Ersatz für Spring Security
 */
@Service
public class CustomAuthService {

    private static final Logger LOGGER = LoggerFactory.getLogger(CustomAuthService.class);
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public CustomAuthService() {
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /**
     * Authentifiziert einen Benutzer anhand von Benutzername/E-Mail und Passwort
     *
     * @param usernameOrEmail Benutzername oder E-Mail-Adresse
     * @param password        Passwort im Klartext
     * @return true, wenn die Authentifizierung erfolgreich war, sonst false
     */
    public boolean authenticate(String usernameOrEmail, String password) {
        try (Connection connection = DbUtils.getConnection()) {
            // Prüfe, ob es ein OAuth2-Login ist
            if (usernameOrEmail.contains("@") && "[OAUTH2]".equals(password)) {
                User user = DbUtils.getGoogleOauth2User(connection, usernameOrEmail);
                return user != null;
            }

            // Normaler Login mit Benutzername/E-Mail und Passwort
            User user = DbUtils.getUserByEmailOrUsername(connection, usernameOrEmail);
            if (user == null) {
                LOGGER.warn("Benutzer nicht gefunden: {}", usernameOrEmail);
                return false;
            }

            // Prüfe, ob der Benutzer verifiziert ist
            if (!user.isVerified()) {
                LOGGER.warn("Benutzer nicht verifiziert: {}", usernameOrEmail);
                return false;
            }

            // Prüfe das Passwort
            boolean passwordMatches = passwordEncoder.matches(password + Const.SALTED_BY_TYSON, user.getPassword());
            if (!passwordMatches) {
                LOGGER.warn("Falsches Passwort für Benutzer: {}", usernameOrEmail);
                return false;
            }

            // Erfolgreich authentifiziert
            LOGGER.info("Benutzer erfolgreich authentifiziert: {}", usernameOrEmail);
            return true;
        } catch (SQLException e) {
            LOGGER.error("Fehler bei der Authentifizierung für Benutzer {}: {}",
                    usernameOrEmail, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Registriert einen neuen Benutzer
     *
     * @param username Benutzername
     * @param email    E-Mail-Adresse
     * @param password Passwort im Klartext
     * @return User-ID oder -1 bei Fehler
     */
    public long registerUser(String username, String email, String password) {
        try (Connection connection = DbUtils.getConnection()) {
            // Prüfe, ob der Benutzer bereits existiert
            User existingUser = DbUtils.getUserByEmailOrUsername(connection, username);
            if (existingUser != null) {
                LOGGER.warn("Benutzername bereits vergeben: {}", username);
                return -1;
            }

            existingUser = DbUtils.getUserByEmailOrUsername(connection, email);
            if (existingUser != null) {
                LOGGER.warn("E-Mail-Adresse bereits vergeben: {}", email);
                return -1;
            }

            // Verschlüssele das Passwort
            String hashedPassword = passwordEncoder.encode(password + Const.SALTED_BY_TYSON);

            // Erstelle den neuen Benutzer
            User newUser = new User(username, email, hashedPassword);
            long userId = DbUtils.insertUser(connection, newUser, false);

            LOGGER.info("Neuer Benutzer registriert: {}", username);
            return userId;
        } catch (SQLException e) {
            LOGGER.error("Fehler bei der Registrierung für Benutzer {}: {}",
                    username, e.getMessage(), e);
            return -1;
        }
    }

    /**
     * Verarbeitet OAuth2-Logins (z.B. Google)
     *
     * @param email E-Mail-Adresse aus OAuth2
     * @return User-Objekt oder null bei Fehler
     */
    public User processOAuth2Login(String email) {
        try (Connection connection = DbUtils.getConnection()) {
            // Prüfe, ob der Benutzer bereits existiert
            User existingUser = DbUtils.getGoogleOauth2User(connection, email);
            if (existingUser != null) {
                LOGGER.info("OAuth2-Benutzer gefunden: {}", email);
                return existingUser;
            }

            // Erstelle einen neuen Benutzer
            String username = email;
            if (username.contains("@")) {
                username = username.substring(0, username.indexOf('@'));
            }

            User newUser = new User(username, email, "[OAUTH2]");
            long userId = DbUtils.insertUser(connection, newUser, true);
            if (userId > 0) {
                LOGGER.info("Neuer OAuth2-Benutzer registriert: {}", email);
                return DbUtils.getGoogleOauth2User(connection, email);
            } else {
                LOGGER.error("Fehler beim Erstellen des OAuth2-Benutzers: {}", email);
                return null;
            }
        } catch (SQLException e) {
            LOGGER.error("Fehler bei der OAuth2-Verarbeitung für {}: {}",
                    email, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Überprüft, ob ein Benutzer Admin-Rechte hat
     *
     * @param username Benutzername
     * @return true, wenn der Benutzer Admin-Rechte hat, sonst false
     */
    public boolean isAdmin(String username) {
        try (Connection connection = DbUtils.getConnection()) {
            User user = DbUtils.getUserByUsername(connection, username);
            return user != null && user.isAdmin();
        } catch (SQLException e) {
            LOGGER.error("Fehler beim Überprüfen der Admin-Rechte für {}: {}",
                    username, e.getMessage(), e);
            return false;
        }
    }
}