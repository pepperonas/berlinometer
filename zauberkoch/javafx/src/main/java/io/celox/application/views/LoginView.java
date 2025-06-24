package io.celox.application.views;

import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.Text;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.dependency.CssImport;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Footer;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.login.LoginForm;
import com.vaadin.flow.component.login.LoginI18n;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.VaadinServletRequest;
import com.vaadin.flow.server.VaadinSession;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.flow.theme.lumo.LumoUtility;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Properties;
import java.util.Set;

import io.celox.application.custom.pulse_effect.ButtonWithPulseEffect;
import io.celox.application.security.CustomAuthService;
import io.celox.application.service.BruteForceProtectionService;
import io.celox.application.utils.Const;
import io.celox.application.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Route("login")
@PageTitle("Login | Zauberkoch")
@AnonymousAllowed
@CssImport("./styles/login-view.css")
public class LoginView extends Div implements BeforeEnterObserver {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoginView.class);
    private final LoginForm loginForm = new LoginForm();
    private final BruteForceProtectionService protectionService;
    private final CustomAuthService authService;

    @Autowired
    public LoginView(BruteForceProtectionService protectionService, CustomAuthService authService) {
        this.protectionService = protectionService;
        this.authService = authService;

        // Setze die Datenbankverbindung für die SecurityUtils
        //        SecurityUtils.setConnection(DbUtils.getConnection());

        addClassName("login-view");
        getStyle()
                .set("position", "relative")
                .set("height", "100vh")
                .set("width", "100vw");

        // Wrapper für den Hauptinhalt (zentriert)
        Div contentWrapper = new Div();
        contentWrapper.addClassName("content-wrapper");
        contentWrapper.getStyle()
                .set("position", "absolute")
                .set("top", "50%")
                .set("left", "50%")
                .set("transform", "translate(-50%, -50%)");

        addMetaTags();

        // Titel
        H1 title = new H1("Zauberkoch");
        title.addClassName("login-title");

        Checkbox rememberMe = new Checkbox("Eingeloggt bleiben");
        rememberMe.getElement().setAttribute("name", "remember-me");

        // Login-Karte
        Div loginCard = new Div();
        loginCard.addClassName("login-card");

        // Login-Form Konfiguration
        loginForm.setI18n(createGermanI18n());
        loginForm.addLoginListener(e -> {
            String clientIp = getClientIp();
            // Prüfe, ob die IP gesperrt ist
            if (protectionService.isBlocked(clientIp)) {
                Notification.show("⛔️ Zu viele fehlerhafte Versuche. Bitte warte " +
                                  protectionService.getRemainingBlockTime(clientIp) + " Minuten.",
                        Const.NOTIFICATION_DURATION_LONG, Notification.Position.BOTTOM_CENTER);
                loginForm.setError(true);
                return;
            }

            try {
                boolean success = SecurityUtils.login(e.getUsername(), e.getPassword(), authService);
                if (success) {
                    protectionService.resetAttempts(clientIp); // Erfolgreicher Login -> Versuche zurücksetzen
                    UI.getCurrent().navigate("");
                } else {
                    protectionService.registerFailedAttempt(clientIp); // Fehlgeschlagener Versuch
                    loginForm.setError(true);
                    Notification.show("❌ Ungültige Anmeldedaten",
                            Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                }
            } catch (Exception ex) {
                LOGGER.error("Fehler beim Login: {}", ex.getMessage(), ex);
                protectionService.registerFailedAttempt(clientIp); // Fehler zählt als fehlgeschlagener Versuch
                loginForm.setError(true);
                Notification.show("❌ Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            }
        });

        loginForm.addForgotPasswordListener(event ->
                UI.getCurrent().navigate("forgot-password")
        );

        loginCard.add(loginForm, rememberMe);
        loginCard.addClassNames(LumoUtility.Gap.Row.MEDIUM, LumoUtility.Gap.Column.XSMALL);

        ButtonWithPulseEffect loginButtonGoogle = new ButtonWithPulseEffect("Login mit Google");
        loginButtonGoogle.addClickListener(event -> {
            UI.getCurrent().getPage().setLocation("/oauth2/authorization/google");
        });
        loginButtonGoogle.addClassName("login-button-google");

        ButtonWithPulseEffect registerButton = new ButtonWithPulseEffect("Registrieren", e ->
                UI.getCurrent().navigate("register")
        );
        registerButton.addClassName("register-button");

        // Komponenten zum Wrapper hinzufügen
        contentWrapper.add(title, loginCard, loginButtonGoogle, registerButton);
        add(contentWrapper);

        // Footer
        String version = "rc-1";
        String build = "---";
        try {
            Properties properties = new Properties();
            properties.load(getClass().getClassLoader().getResourceAsStream("build-info.properties"));
            version = properties.getProperty("project.version");
            build = properties.getProperty("build.timestamp");
            build = build.replace(".", "");
            Instant instant = Instant.parse(build);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyMMdd.HHmmss").withZone(ZoneId.of("Europe/Berlin"));
            build = formatter.format(instant);
        } catch (Exception e) {
            LOGGER.warn("Failed to load properties file", e);
        }

        Footer footer = new Footer(new Text(Const.RC_VERSION + version + " | " + build));
        footer.addClassName("login-footer");
        footer.getStyle()
                .set("position", "absolute")
                .set("bottom", "0")
                .set("width", "100%")
                .set("text-align", "center");
        add(footer);
    }

    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        if (SecurityUtils.isLoggedIn()) {
            event.forwardTo("");
            return;
        }

        if (event.getLocation().getQueryParameters().getParameters().containsKey("oauth2")) {
            LOGGER.info("OAuth2 Parameter erkannt");

            try {
                HttpServletRequest request = VaadinServletRequest.getCurrent().getHttpServletRequest();
                HttpSession session = request.getSession(false);

                if (session != null) {
                    String username = (String) session.getAttribute("oauth2-user");
                    String email = (String) session.getAttribute("oauth2-email");
                    Boolean isAdmin = (Boolean) session.getAttribute("oauth2-admin");

                    LOGGER.info("OAuth2 Daten aus Session: username={}, email={}, isAdmin={}",
                            username, email, isAdmin);

                    if (username != null && email != null) {
                        VaadinSession vaadinSession = VaadinSession.getCurrent();
                        vaadinSession.setAttribute("authenticated-user", username);
                        vaadinSession.setAttribute("auth-type", "OAUTH2");

                        Set<String> roles = new HashSet<>();
                        roles.add("USER");
                        if (isAdmin != null && isAdmin) {
                            roles.add("ADMIN");
                        }
                        vaadinSession.setAttribute("user-roles", roles);

                        session.removeAttribute("oauth2-user");
                        session.removeAttribute("oauth2-email");
                        session.removeAttribute("oauth2-admin");

                        LOGGER.info("OAuth2 Benutzer eingeloggt: {}", username);
                        event.forwardTo("");

                        UI.getCurrent().access(() -> {
                            Notification.show("✌️ Willkommen zurück, " + username,
                                    Const.NOTIFICATION_DURATION_DEFAULT,
                                    Notification.Position.BOTTOM_CENTER);
                        });
                        return;
                    } else {
                        LOGGER.warn("Keine vollständigen OAuth2-Benutzerdaten in der Session gefunden");
                        event.forwardTo("login?error=oauth2_session_missing");
                        return;
                    }
                } else {
                    LOGGER.warn("Keine HTTP-Session vorhanden für OAuth2-Login");
                    event.forwardTo("login?error=oauth2_no_session");
                    return;
                }
            } catch (Exception e) {
                LOGGER.error("Fehler beim OAuth2-Login in Vaadin: {}", e.getMessage(), e);
                event.forwardTo("login?error=oauth2_processing");
                return;
            }
        }

        if (event.getLocation().getQueryParameters().getParameters().containsKey("error")) {
            String error = event.getLocation().getQueryParameters().getParameters().get("error").get(0);
            LOGGER.warn("Login-Fehler erkannt: {}", error);
            loginForm.setError(true);
        }
    }

    private String getClientIp() {
        VaadinServletRequest request = VaadinServletRequest.getCurrent();
        if (request != null) {
            String forwardedFor = request.getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isEmpty()) {
                return forwardedFor.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        }
        return "Unknown";
    }

    private void addMetaTags() {
        Html metaDescription = new Html(
                "<meta name=\"description\" content=\"Zauberkoch | Leckere Rezepte für Jeden Tag.\">");
        Html metaKeywords = new Html(
                "<meta name=\"keywords\" content=\"zauberkoch, login, einloggen, kochrezepte, personalisiert\">");
        Html ogTitle = new Html(
                "<meta property=\"og:title\" content=\"Login - Zauberkoch\">");
        Html ogDescription = new Html(
                "<meta property=\"og:description\" content=\"Zauberkoch | Leckere Rezepte für Jeden Tag.\">");
        Html ogImage = new Html(
                "<meta property=\"og:image\" content=\"https://app.zauberkoch.com/images/logo.jpg\">");

        getElement().appendChild(metaDescription.getElement());
        getElement().appendChild(metaKeywords.getElement());
        getElement().appendChild(ogTitle.getElement());
        getElement().appendChild(ogDescription.getElement());
        getElement().appendChild(ogImage.getElement());
    }

    private LoginI18n createGermanI18n() {
        LoginI18n i18n = LoginI18n.createDefault();
        i18n.getForm().setTitle("Anmeldung");
        i18n.getForm().setUsername("E-Mail oder Benutzername");
        i18n.getForm().setPassword("Passwort");
        i18n.getForm().setSubmit("Anmelden");
        i18n.getForm().setForgotPassword("Passwort vergessen");
        i18n.getErrorMessage().setUsername("E-Mail oder Benutzername ungültig");
        i18n.getErrorMessage().setPassword("Passwort ungültig");
        i18n.getErrorMessage().setTitle("Fehler");
        i18n.getErrorMessage().setMessage("Ungültige Anmeldedaten");
        return i18n;
    }
}