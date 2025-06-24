package io.celox.application.views;

import com.vaadin.flow.component.DetachEvent;
import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.Key;
import com.vaadin.flow.component.Text;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.EmailField;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.VaadinSession;
import com.vaadin.flow.server.auth.AnonymousAllowed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import io.celox.application.custom.pulse_effect.ButtonWithPulseEffect;
import io.celox.application.model.User;
import io.celox.application.service.EmailService;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@Route("register")
@PageTitle("Registrierung | Zauberkoch")
@AnonymousAllowed
public class RegisterView extends VerticalLayout implements BeforeEnterObserver {

    private static final Logger LOGGER = LoggerFactory.getLogger(RegisterView.class);
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int TOKEN_EXPIRY_HOURS = 24;
    private static final int REDIRECT_DELAY_SECONDS = 10;

    private final EmailService emailService;

    private final TextField usernameField = new TextField("Benutzername");
    private final EmailField emailField = new EmailField("E-Mail Adresse");
    private final PasswordField passwordField = new PasswordField("Passwort");
    private final Text textUserAlreadyExists = new Text("");
    private final ButtonWithPulseEffect registerButton = new ButtonWithPulseEffect("Registrieren");
    private final VerticalLayout successLayout = new VerticalLayout();
    private final VerticalLayout formLayout = new VerticalLayout();

    @Autowired
    public RegisterView(EmailService emailService) {
        this.emailService = emailService;

        addMetaTags();
        configureComponents();
        setupLayout();
    }

    private void configureComponents() {
        addClassName("register-view");
        setSizeFull();
        setAlignItems(Alignment.CENTER);
        setJustifyContentMode(JustifyContentMode.CENTER);

        usernameField.setWidthFull();
        usernameField.addValueChangeListener(e -> validateUsername(e.getValue()));

        emailField.setWidthFull();
        emailField.setPattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
        emailField.setErrorMessage("Bitte gib eine gültige E-Mail-Adresse ein.");
        emailField.setClearButtonVisible(true);
        emailField.addValueChangeListener(e -> resetEmailValidation());

        passwordField.setWidthFull();
        passwordField.setPattern(".{" + MIN_PASSWORD_LENGTH + ",}");
        passwordField.setErrorMessage("Das Passwort muss mindestens " + MIN_PASSWORD_LENGTH + " Zeichen lang sein.");

        registerButton.setWidthFull();
        registerButton.addClickShortcut(Key.ENTER);
        registerButton.addClickListener(e -> handleRegistration());

        // Configure success layout (initially hidden)
        successLayout.setVisible(false);
        successLayout.setWidth("300px");
        successLayout.setSpacing(true);
        successLayout.setPadding(true);
        successLayout.setAlignItems(Alignment.CENTER);
        successLayout.getStyle().set("border", "1px solid #ccc")
                .set("border-radius", "8px")
                .set("padding", "20px");
    }

    private void setupLayout() {
        H1 heading = new H1("Registrierung");

        formLayout.add(usernameField, emailField, passwordField,
                textUserAlreadyExists, registerButton);
        formLayout.setWidth("300px");
        formLayout.setSpacing(true);
        formLayout.setPadding(false);
        formLayout.getStyle().set("border", "1px solid #ccc")
                .set("border-radius", "8px")
                .set("padding", "20px");

        add(heading, formLayout, successLayout);
    }

    private void validateUsername(String value) {
        if (value.contains("@")) {
            usernameField.setInvalid(true);
            usernameField.setErrorMessage("Darf kein '@' enthalten.");
            registerButton.setEnabled(false);
        } else {
            usernameField.setInvalid(false);
            usernameField.setErrorMessage("");
            registerButton.setEnabled(true);
        }
    }

    private void resetEmailValidation() {
        registerButton.setEnabled(true);
        textUserAlreadyExists.setText("");
    }

    private void handleRegistration() {
        if (emailField.isInvalid() || usernameField.isInvalid() || passwordField.isInvalid()) {
            Notification.show("Ungültige Eingabe", Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            return;
        }

        if (usernameField.isEmpty()) {
            Notification.show("Benutzername darf nicht leer sein",
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            return;
        }

        try (Connection connection = DbUtils.getConnection()) {
            if (isEmailTaken(connection, emailField.getValue())) {
                handleExistingEmail();
                return;
            }

            User newUser = new User(usernameField.getValue(), emailField.getValue(), passwordField.getValue());
            int userId = DbUtils.insertUser(connection, newUser, false);
            newUser.setId(userId);

            checkReferralAndEnsureUpdate(connection);
            String token = generateToken();
            saveVerificationToken(connection, newUser, token);
            sendVerificationEmail(newUser.getEmail(), token);
            showSuccessMessage();
        } catch (SQLException e) {
            LOGGER.error("Database error during registration: {}", e.getMessage(), e);
            Notification.show("Datenbankfehler bei der Registrierung",
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
        }
    }

    private void showSuccessMessage() {
        // Hide the form and show success message
        formLayout.setVisible(false);
        successLayout.removeAll();

        Span successIcon = new Span("✓");
        successIcon.getStyle().set("color", "#2d3748")
                .set("font-size", "48px")
                .set("margin-bottom", "10px");

        Span message = new Span("Registrierung erfolgreich!");
        message.getStyle().set("font-weight", "bold")
                .set("margin-bottom", "10px");

        Span subMessage = new Span("Eine Bestätigungs-E-Mail wurde an deine E-Mail-Adresse gesendet.");
        subMessage.getStyle().set("text-align", "center")
                .set("margin-bottom", "15px");

        Span redirectMessage = new Span("Du wirst in " + REDIRECT_DELAY_SECONDS + " Sekunden weitergeleitet...");
        redirectMessage.setId("redirect-countdown");

        Button loginButton = new Button("Jetzt anmelden", e -> navigateToLogin());
        loginButton.setWidthFull();
        loginButton.getStyle().set("margin-top", "15px");

        successLayout.add(successIcon, message, subMessage, redirectMessage, loginButton);
        successLayout.setVisible(true);

        // Schedule redirect
        scheduleRedirect();
    }

    private void scheduleRedirect() {
        // Get UI reference for thread safety
        UI ui = UI.getCurrent();

        // Create a thread to update the countdown
        new Thread(() -> {
            for (int i = REDIRECT_DELAY_SECONDS; i > 0; i--) {
                final int secondsLeft = i;
                ui.access(() -> {
                    Optional<Span> countdownSpan = Optional.ofNullable(successLayout.getChildren()
                            .filter(component -> component.getId().orElse("").equals("redirect-countdown"))
                            .findFirst()
                            .map(component -> (Span) component).orElse(null));

                    countdownSpan.ifPresent(span ->
                            span.setText("Du wirst in " + secondsLeft + " Sekunden weitergeleitet..."));
                });

                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }

            // Navigate to login page
            ui.access(this::navigateToLogin);
        }).start();
    }

    private void navigateToLogin() {
        getUI().ifPresent(ui -> ui.navigate("login"));
    }

    private boolean isEmailTaken(Connection connection, String email) {
        try (PreparedStatement stmt = connection.prepareStatement("SELECT COUNT(*) FROM fooddb.users WHERE email = ?")) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            LOGGER.error("Error checking email existence.", e);
            throw new RuntimeException("Datenbankfehler bei der E-Mail-Überprüfung.", e);
        }
    }

    private void handleExistingEmail() {
        textUserAlreadyExists.setText("E-Mail bereits vergeben.");
        registerButton.setEnabled(false);
        Notification.show("E-Mail bereits vergeben.", 5000, Notification.Position.MIDDLE);
        Button backToLogin = new Button("Zurück zur Anmeldung",
                e -> getUI().ifPresent(ui -> ui.navigate("login")));
        add(backToLogin);
    }

    private void checkReferralAndEnsureUpdate(Connection connection) {
        String referralCode = (String) VaadinSession.getCurrent().getAttribute("referralCode");
        if (referralCode != null) {
            int userId = DbUtils.getUserIdByReferralCode(connection, referralCode);
            DbUtils.resetUsersReferralFlag(connection, userId);
            try {
                DbUtils.updateReferralUsage(connection, referralCode);
            } catch (SQLException e) {
                LOGGER.error("Error updating referral usage.", e);
                throw new RuntimeException("Fehler beim Aktualisieren des Referral-Codes.", e);
            }
        }
    }

    private String generateToken() {
        SecureRandom random = new SecureRandom();
        int tokenInt = 100000 + random.nextInt(900000); // 6-digit code
        return String.valueOf(tokenInt);
    }

    private void saveVerificationToken(Connection connection, User user, String token) {
        if (user.getId() == 0) {
            LOGGER.error("User ID is 0, cannot save verification token.");
            Notification.show("Interner Fehler bei der Registrierung.",
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            return;
        }
        try (PreparedStatement stmt = connection.prepareStatement(
                "INSERT INTO fooddb.verification_tokens (user_id, token, expiry_date) VALUES (?, ?, ?)")) {
            stmt.setLong(1, user.getId());
            stmt.setString(2, token);
            stmt.setLong(3, LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS).toEpochSecond(ZoneOffset.UTC));
            stmt.executeUpdate();
        } catch (SQLException e) {
            LOGGER.error("Error saving verification token.", e);
            Notification.show("Fehler beim Speichern des Verifizierungstokens.",
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
        }
    }

    private void sendVerificationEmail(String userEmail, String token) {
        String link = Const.SERVER_URL + "/verify?token=" + token;
        emailService.sendEmail(userEmail, true, link);
    }

    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        Optional<String> referralCode = event.getLocation().getQueryParameters()
                .getParameters().getOrDefault("ref", List.of("")).stream().findFirst();
        referralCode.ifPresent(code -> VaadinSession.getCurrent().setAttribute("referralCode", code));
    }

    // Da wir keine dauerhafte Verbindung mehr halten, ist onDetach nicht mehr erforderlich
    @Override
    protected void onDetach(DetachEvent detachEvent) {
        super.onDetach(detachEvent);
        // Keine Connection zu schließen
    }

    private void addMetaTags() {
        Html metaDescription = new Html(
                "<meta name=\"description\" content=\"Registriere dich bei Zauberkoch" +
                " und erhalte personalisierte Kochrezepte.\">");
        Html metaKeywords = new Html(
                "<meta name=\"keywords\" content=\"zauberkoch, registrieren, kochrezepte, personalisiert\">");
        getElement().appendChild(metaDescription.getElement());
        getElement().appendChild(metaKeywords.getElement());
    }
}