package io.celox.application.utils;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.server.VaadinSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import io.celox.application.model.User;
import io.celox.application.security.CustomAuthService;
import io.celox.application.views.LoginView;

/**
 * Utilities für die eigene Sicherheitsimplementierung
 */
public class SecurityUtils {

    public enum Role {
        ADMIN, USER, GUEST
    }

    private static final Logger LOGGER = LoggerFactory.getLogger(SecurityUtils.class);
    private static final String USER_SESSION_ATTR = "authenticated-user";
    private static final String ROLES_SESSION_ATTR = "user-roles";
    private static final String AUTH_TYPE_SESSION_ATTR = "auth-type";

    /**
     * Prüft, ob ein Benutzer aktuell eingeloggt ist
     */
    public static boolean isLoggedIn() {
        return VaadinSession.getCurrent() != null &&
               VaadinSession.getCurrent().getAttribute(USER_SESSION_ATTR) != null;
    }

    /**
     * Führt den Login-Prozess durch
     */
    public static boolean login(String usernameOrEmail, String password, CustomAuthService authService) {
        try {
            if (authService.authenticate(usernameOrEmail, password)) {
                // Use try-with-resources to ensure connection is closed properly
                try (Connection connection = DbUtils.getConnection()) {
                    // Bestimme den Benutzernamen (bei E-Mail-Login)
                    String username = usernameOrEmail;
                    if (username.contains("@")) {
                        User user = DbUtils.getUserByEmailOrUsername(connection, usernameOrEmail);
                        if (user != null) {
                            username = user.getUsername();
                        }
                    }

                    // Speichere Benutzerinformationen in der Session
                    VaadinSession session = VaadinSession.getCurrent();
                    session.setAttribute(USER_SESSION_ATTR, username);

                    // Bestimme und speichere Rollen
                    User user = DbUtils.getUserByUsername(connection, username);
                    Set<String> roles = new HashSet<>();
                    roles.add("USER");
                    if (user != null && user.isAdmin()) {
                        roles.add("ADMIN");
                    }
                    session.setAttribute(ROLES_SESSION_ATTR, roles);
                    session.setAttribute(AUTH_TYPE_SESSION_ATTR, "DATABASE");

                    LOGGER.info("Benutzer {} erfolgreich eingeloggt", username);
                    return true;
                }
            } else {
                LOGGER.warn("Login fehlgeschlagen für {}", usernameOrEmail);
                return false;
            }
        } catch (Exception e) {
            LOGGER.error("Fehler beim Login für {}: {}", usernameOrEmail, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Führt den Google OAuth2 Login-Prozess durch
     */
    public static boolean loginWithOAuth2(String email, CustomAuthService authService) {
        try {
            // Fehlerbehandlung für den Fall, dass die E-Mail null ist
            if (email == null || email.trim().isEmpty() || !email.contains("@")) {
                LOGGER.error("Ungültige E-Mail-Adresse bei OAuth2-Login: {}", email);
                return false;
            }

            User user = authService.processOAuth2Login(email);
            if (user != null) {
                // Speichere Benutzerinformationen in der Session
                VaadinSession session = VaadinSession.getCurrent();
                session.setAttribute(USER_SESSION_ATTR, user.getUsername());

                // Bestimme und speichere Rollen
                Set<String> roles = new HashSet<>();
                roles.add("USER");
                if (user.isAdmin()) {
                    roles.add("ADMIN");
                }
                session.setAttribute(ROLES_SESSION_ATTR, roles);
                session.setAttribute(AUTH_TYPE_SESSION_ATTR, "OAUTH2");

                LOGGER.info("Benutzer {} erfolgreich per OAuth2 eingeloggt", user.getUsername());
                return true;
            } else {
                LOGGER.warn("OAuth2 Login fehlgeschlagen für {}", email);
                return false;
            }
        } catch (Exception e) {
            LOGGER.error("Fehler beim OAuth2 Login für {}: {}", email, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Gibt den aktuell eingeloggten Benutzer als User-Objekt zurück
     */
    public static User getCurrentUser() {
        if (!isLoggedIn()) {
            return null;
        }

        String username = getCurrentUsername();
        try (Connection connection = DbUtils.getConnection()) {
            return DbUtils.getUserByUsername(connection, username);
        } catch (SQLException e) {
            LOGGER.error("Fehler beim Abrufen des aktuellen Benutzers: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Gibt den Benutzernamen des aktuell eingeloggten Benutzers zurück
     */
    public static String getCurrentUsername() {
        if (!isLoggedIn()) {
            return null;
        }
        return (String) VaadinSession.getCurrent().getAttribute(USER_SESSION_ATTR);
    }

    /**
     * Gibt den Authentifizierungstyp zurück (DATABASE, OAUTH2)
     */
    public static String getAuthenticationType() {
        if (!isLoggedIn()) {
            return "GUEST";
        }
        return (String) VaadinSession.getCurrent().getAttribute(AUTH_TYPE_SESSION_ATTR);
    }

    /**
     * Prüft, ob der aktuelle Benutzer ein Admin ist
     */
    public static boolean isAdmin() {
        return hasRole("ADMIN");
    }

    /**
     * Führt ein Logout durch und leitet zur Login-Seite weiter
     */
    public static void logout() {
        if (VaadinSession.getCurrent() != null) {
            VaadinSession.getCurrent().getSession().invalidate();  // HTTP-Session invalidieren
            VaadinSession.getCurrent().close();  // Vaadin-Session schließen
        }
        UI.getCurrent().navigate(LoginView.class);  // Zur Login-Seite weiterleiten
    }

    /**
     * Prüft, ob der Benutzer eine bestimmte Rolle hat
     */
    @SuppressWarnings("unchecked")
    public static boolean hasRole(String role) {
        if (!isLoggedIn()) {
            return false;
        }
        VaadinSession session = VaadinSession.getCurrent();
        Set<String> roles = (Set<String>) session.getAttribute(ROLES_SESSION_ATTR);
        return roles != null && roles.contains(role);
    }

    /**
     * Gibt alle Rollen des aktuellen Benutzers zurück
     */
    @SuppressWarnings("unchecked")
    public static Set<String> getRoles() {
        if (!isLoggedIn()) {
            return Collections.emptySet();
        }
        VaadinSession session = VaadinSession.getCurrent();
        Set<String> roles = (Set<String>) session.getAttribute(ROLES_SESSION_ATTR);
        return roles != null ? Collections.unmodifiableSet(roles) : Collections.emptySet();
    }

    /**
     * Bestimmt die Hauptrolle des aktuellen Benutzers (ADMIN oder USER)
     */
    public static Role getRole() {
        if (hasRole("ADMIN")) {
            return Role.ADMIN;
        } else if (isLoggedIn()) {
            return Role.USER;
        } else {
            return Role.GUEST;
        }
    }

    /**
     * Prüft, ob der aktuelle Benutzer auf eine bestimmte View zugreifen darf
     */
    public static boolean isAccessGranted(Class<?> viewClass) {
        // Prüfe, ob die View mit @AnonymousAllowed annotiert ist
        if (viewClass.isAnnotationPresent(com.vaadin.flow.server.auth.AnonymousAllowed.class)) {
            return true;
        }

        // Prüfe, ob der Benutzer eingeloggt ist
        if (!isLoggedIn()) {
            return false;
        }

        // Prüfe auf @PermitAll
        if (viewClass.isAnnotationPresent(jakarta.annotation.security.PermitAll.class)) {
            return true;
        }

        // Prüfe auf @RolesAllowed
        if (viewClass.isAnnotationPresent(jakarta.annotation.security.RolesAllowed.class)) {
            String[] allowedRoles = viewClass.getAnnotation(jakarta.annotation.security.RolesAllowed.class).value();
            for (String role : allowedRoles) {
                if (hasRole(role)) {
                    return true;
                }
            }
            return false;
        }

        // Standardmäßig Zugriff verweigern, wenn keine Annotation gefunden wurde
        return false;
    }
}