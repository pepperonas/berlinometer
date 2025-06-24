package io.celox.application.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import io.celox.application.model.User;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Filter zur Handhabung von echten OAuth2-Logins mit Google.
 */
@Component
public class OAuth2LoginFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(OAuth2LoginFilter.class);

    private String CLIENT_ID = "414030832201-ar98j436sr1uscv5thfv2ql48o5sncgr.apps.googleusercontent.com";

    private String CLIENT_SECRET = "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";

    private String REDIRECT_URI = Const.SERVER_URL + "/login/oauth2/code/google";

    private static final String AUTH_URI = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_URI = "https://oauth2.googleapis.com/token";
    private static final String USER_INFO_URI = "https://www.googleapis.com/oauth2/v3/userinfo";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SecureRandom secureRandom = new SecureRandom();

    // Der Konstruktor benötigt keinen DbUtils-Parameter mehr
    public OAuth2LoginFilter() {
        // Keine Connection mehr speichern
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();

        if (requestURI.equals("/oauth2/authorization/google")) {
            LOGGER.info("OAuth2-Login mit Google initiiert");
            try {
                String state = generateRandomState();
                HttpSession session = request.getSession(true);
                session.setAttribute("oauth2_state", state);

                String authUrl = AUTH_URI +
                                 "?client_id=" + CLIENT_ID +
                                 "&response_type=code" +
                                 "&scope=" + URLEncoder.encode("openid email profile", StandardCharsets.UTF_8) +
                                 "&redirect_uri=" + URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8) +
                                 "&state=" + state;

                LOGGER.info("Leite weiter zur Google-Auth: {}", authUrl);
                response.sendRedirect(authUrl);
                return;
            } catch (Exception e) {
                LOGGER.error("Fehler beim Initiieren des OAuth2-Logins: {}", e.getMessage(), e);
                response.sendRedirect("/login?error=oauth2_init");
                return;
            }
        }

        if (requestURI.equals("/login/oauth2/code/google")) {
            String code = request.getParameter("code");
            String state = request.getParameter("state");
            String error = request.getParameter("error");

            HttpSession session = request.getSession(false);

            if (error != null) {
                LOGGER.error("OAuth2-Fehler von Google: {}", error);
                response.sendRedirect("/login?error=oauth2_" + error);
                return;
            }

            if (code == null) {
                LOGGER.error("Kein Autorisierungscode erhalten");
                response.sendRedirect("/login?error=oauth2_no_code");
                return;
            }

            if (session == null || state == null || !state.equals(session.getAttribute("oauth2_state"))) {
                LOGGER.error("Ungültiger State-Parameter. Erwartet: {}, Erhalten: {}",
                        session != null ? session.getAttribute("oauth2_state") : "null", state);
                response.sendRedirect("/login?error=oauth2_invalid_state");
                return;
            }

            session.removeAttribute("oauth2_state");

            try {
                LOGGER.debug("Verwende Autorisierungscode: {}", code);
                String tokenResponse = exchangeCodeForToken(code);
                LOGGER.debug("Token-Response erhalten: {}", tokenResponse);

                JsonNode tokenJson = objectMapper.readTree(tokenResponse);
                String accessToken = tokenJson.path("access_token").asText();

                if (accessToken == null || accessToken.isEmpty()) {
                    LOGGER.error("Kein Access-Token erhalten. Token-Response: {}", tokenResponse);
                    response.sendRedirect("/login?error=oauth2_no_token");
                    return;
                }

                String userInfo = getUserInfo(accessToken);
                LOGGER.debug("UserInfo erhalten: {}", userInfo);

                JsonNode userInfoJson = objectMapper.readTree(userInfo);
                String email = userInfoJson.path("email").asText();
                String name = userInfoJson.path("name").asText();

                if (email == null || email.isEmpty()) {
                    LOGGER.error("Keine E-Mail-Adresse in der UserInfo gefunden: {}", userInfo);
                    response.sendRedirect("/login?error=oauth2_no_email");
                    return;
                }

                LOGGER.info("OAuth2-Login für {} erfolgreich", email);

                // Verwende try-with-resources für jede Datenbankoperation
                try (Connection connection = DbUtils.getConnection()) {
                    User user = DbUtils.getGoogleOauth2User(connection, email);
                    if (user == null) {
                        String username = email.substring(0, email.indexOf('@'));
                        User newUser = new User(username, email, "[OAUTH2]");

                        if (name != null && !name.isEmpty()) {
                            String[] nameParts = name.split(" ");
                            if (nameParts.length > 0) {
                                newUser.setFirstName(nameParts[0]);
                                if (nameParts.length > 1) {
                                    newUser.setLastName(nameParts[nameParts.length - 1]);
                                }
                            }
                        }

                        long userId = DbUtils.insertUser(connection, newUser, true);
                        if (userId > 0) {
                            user = DbUtils.getGoogleOauth2User(connection, email);
                        }
                    }

                    if (user != null) {
                        session.setAttribute("oauth2-user", user.getUsername());
                        session.setAttribute("oauth2-email", user.getEmail());
                        session.setAttribute("oauth2-admin", user.isAdmin());

                        LOGGER.info("Benutzer in Session gespeichert: {}", user.getUsername());
                        response.sendRedirect("/login?oauth2=true");
                        return;
                    } else {
                        LOGGER.error("Fehler beim Erstellen/Abrufen des Benutzers für E-Mail: {}", email);
                        response.sendRedirect("/login?error=oauth2_user_error");
                        return;
                    }
                } catch (SQLException e) {
                    LOGGER.error("Datenbankfehler bei der OAuth2-Verarbeitung: {}", e.getMessage(), e);
                    response.sendRedirect("/login?error=oauth2_database_error");
                    return;
                }
            } catch (Exception e) {
                LOGGER.error("Fehler bei der OAuth2-Verarbeitung: {}", e.getMessage(), e);
                response.sendRedirect("/login?error=oauth2_" + e.getClass().getSimpleName());
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Generiert einen zufälligen State-Parameter zur Sicherheit
     */
    private String generateRandomState() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Tauscht den Autorisierungscode gegen ein Token aus
     */
    private String exchangeCodeForToken(String code) throws IOException, InterruptedException {
        LOGGER.debug("Verwende Client-ID: {}, Client-Secret: {}, Redirect-URI: {}", CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

        Map<String, String> parameters = new HashMap<>();
        parameters.put("client_id", CLIENT_ID);
        parameters.put("client_secret", CLIENT_SECRET);
        parameters.put("code", code);
        parameters.put("redirect_uri", REDIRECT_URI);
        parameters.put("grant_type", "authorization_code");

        String form = parameters.entrySet()
                .stream()
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(TOKEN_URI))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            LOGGER.error("Token-Austausch fehlgeschlagen mit Status {}: {}", response.statusCode(), response.body());
            throw new IOException("Token-Austausch fehlgeschlagen mit Status: " + response.statusCode() + ", Body: " + response.body());
        }

        return response.body();
    }

    /**
     * Ruft die Benutzerinformationen mit dem Access-Token ab
     */
    private String getUserInfo(String accessToken) throws IOException, InterruptedException {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(USER_INFO_URI))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            LOGGER.error("UserInfo-Abruf fehlgeschlagen mit Status {}: {}", response.statusCode(), response.body());
            throw new IOException("UserInfo-Abruf fehlgeschlagen mit Status: " + response.statusCode() + ", Body: " + response.body());
        }

        return response.body();
    }
}