package io.celox.application.security;

import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.Notification.Position;
import com.vaadin.flow.server.VaadinSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.sql.Connection;
import java.sql.SQLException;

import io.celox.application.model.User;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;

/**
 * Controller zur Handhabung von Google OAuth2-Anfragen.
 * Bietet eine vereinfachte Möglichkeit, den OAuth2-Login zu simulieren.
 */
@Controller
public class OAuth2Controller {

    private static final Logger LOGGER = LoggerFactory.getLogger(OAuth2Controller.class);

    private final CustomAuthService authService;

    @Autowired
    public OAuth2Controller(CustomAuthService authService) {
        this.authService = authService;
    }

    /**
     * Vereinfachter Google OAuth2-Startpunkt
     */
    @GetMapping("/oauth2/authorization/google")
    public String initiateGoogleAuth() {
        LOGGER.info("Google OAuth2-Authentifizierung gestartet");

        // Weiterleitung zu unserem eigenen OAuth2-Callback mit einer simulierten E-Mail
        // In einer realen Implementierung würde dies zur Google-Anmeldeseite weiterleiten
        return "redirect:/login/oauth2/code/google?email=example@gmail.com";
    }

    /**
     * Vereinfachter OAuth2-Callback
     * Simuliert einen erfolgreichen OAuth2-Login
     */
    @GetMapping("/login/oauth2/code/google")
    public String handleGoogleCallback(@RequestParam(required = false) String email) {
        try {
            LOGGER.info("OAuth2-Callback mit E-Mail: {}", email);

            if (email == null || email.isEmpty()) {
                // Für Testzwecke verwenden wir eine Beispiel-E-Mail
                email = "example@gmail.com";
            }

            try (Connection connection = DbUtils.getConnection()) {
                // E-Mail in der Datenbank suchen oder neuen Benutzer anlegen
                User user = DbUtils.getGoogleOauth2User(connection, email);
                if (user == null) {
                    // Neuen OAuth2-Benutzer erstellen
                    String username = email.substring(0, email.indexOf('@'));
                    User newUser = new User(username, email, "[OAUTH2]");
                    long userId = DbUtils.insertUser(connection, newUser, true);
                    if (userId > 0) {
                        user = DbUtils.getGoogleOauth2User(connection, email);
                        Notification.show("✅ Neuer Google-Account registriert",
                                Const.NOTIFICATION_DURATION_DEFAULT, Position.BOTTOM_CENTER);
                    }
                }

                if (user != null) {
                    // Benutzer in der Session speichern
                    VaadinSession.getCurrent().setAttribute("authenticated-user", user.getUsername());
                    VaadinSession.getCurrent().setAttribute("auth-type", "OAUTH2");

                    // Admin-Rechte prüfen
                    if (user.isAdmin()) {
                        VaadinSession.getCurrent().setAttribute("user-role", "ADMIN");
                    } else {
                        VaadinSession.getCurrent().setAttribute("user-role", "USER");
                    }

                    Notification.show("✌️ Willkommen zurück, " + user.getUsername(),
                            Const.NOTIFICATION_DURATION_DEFAULT, Position.BOTTOM_CENTER);

                    return "redirect:/";
                } else {
                    LOGGER.error("Fehler bei der OAuth2-Anmeldung für E-Mail: {}", email);
                    return "redirect:/login?error=oauth2";
                }
            }
        } catch (SQLException e) {
            LOGGER.error("OAuth2 Fehler: {}", e.getMessage(), e);
            return "redirect:/login?error=oauth2";
        }
    }
}