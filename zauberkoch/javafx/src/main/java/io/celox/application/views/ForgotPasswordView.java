package io.celox.application.views;

import com.vaadin.flow.component.DetachEvent;
import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.Key;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.EmailField;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import io.celox.application.custom.pulse_effect.ButtonWithPulseEffect;
import io.celox.application.service.EmailService;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

@Route("forgot-password")
@PageTitle("Passwort zurücksetzen | Zauberkoch")
@AnonymousAllowed
public class ForgotPasswordView extends VerticalLayout {

    private static final Logger LOGGER = LoggerFactory.getLogger(ForgotPasswordView.class);
    private static final int REDIRECT_DELAY_SECONDS = 10;

    private final EmailService emailService;

    private final VerticalLayout formLayout = new VerticalLayout();
    private final VerticalLayout successLayout = new VerticalLayout();
    private final EmailField emailField = new EmailField("E-Mail Adresse");
    private final ButtonWithPulseEffect sendButton = new ButtonWithPulseEffect("Passwort zurücksetzen");

    @Autowired
    public ForgotPasswordView(EmailService emailService) {
        this.emailService = emailService;

        addMetaTags();
        configureComponents();
        setupLayout();
        addListeners();
    }

    private void configureComponents() {
        addClassName("forgot-password-view");
        setSizeFull();
        setAlignItems(Alignment.CENTER);
        setJustifyContentMode(JustifyContentMode.CENTER);

        // Email field configuration
        emailField.setWidthFull();
        emailField.setPattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
        emailField.setErrorMessage("Bitte gib eine gültige E-Mail-Adresse ein.");
        emailField.setClearButtonVisible(true);
        emailField.setPlaceholder("name@example.com");

        // Button configuration
        sendButton.setWidthFull();
        sendButton.addClickShortcut(Key.ENTER);

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
        H1 heading = new H1("Passwort zurücksetzen");

        formLayout.add(emailField, sendButton);
        formLayout.setWidth("300px");
        formLayout.setSpacing(true);
        formLayout.setPadding(false);
        formLayout.getStyle().set("border", "1px solid #ccc")
                .set("border-radius", "8px")
                .set("padding", "20px");

        add(heading, formLayout, successLayout);
    }

    private void addListeners() {
        sendButton.addClickListener(event -> handlePasswordReset());
    }

    private void handlePasswordReset() {
        if (emailField.isEmpty() || emailField.isInvalid()) {
            Notification.show("Bitte gib eine gültige E-Mail-Adresse ein.",
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            return;
        }

        String email = emailField.getValue().trim();

        try (Connection connection = DbUtils.getConnection()) {
            // Check if user exists
            if (userExists(connection, email)) {
                long userId = getUserId(connection, email);
                String token = generateToken();
                storeResetToken(connection, userId, token);
                sendResetEmail(email, token);
                showSuccessMessage(email);
            } else {
                // We still show a success message for security reasons (don't reveal if email exists)
                showSuccessMessage(email);
                LOGGER.info("Password reset requested for non-existent email: {}", email);
            }
        } catch (SQLException e) {
            LOGGER.error("Error during password reset process", e);
            Notification.show("Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.",
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
        }
    }

    private boolean userExists(Connection connection, String email) throws SQLException {
        try (PreparedStatement stmt = connection.prepareStatement("SELECT COUNT(*) FROM fooddb.users WHERE email = ?")) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    private long getUserId(Connection connection, String email) throws SQLException {
        try (PreparedStatement stmt = connection.prepareStatement("SELECT id FROM fooddb.users WHERE email = ?")) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong("id");
                }
                throw new SQLException("User not found");
            }
        }
    }

    private String generateToken() {
        return UUID.randomUUID().toString();
    }

    private void storeResetToken(Connection connection, long userId, String token) throws SQLException {
        LocalDateTime expiryDate = LocalDateTime.now().plusHours(24);
        try (PreparedStatement stmt = connection.prepareStatement(
                "INSERT INTO fooddb.password_reset_tokens (token, user_id, expiry_date) VALUES (?, ?, ?)")) {
            stmt.setString(1, token);
            stmt.setLong(2, userId);
            stmt.setTimestamp(3, java.sql.Timestamp.valueOf(expiryDate));
            stmt.executeUpdate();
        }
    }

    private void sendResetEmail(String email, String token) {
        String link = Const.SERVER_URL + "/reset-password?token=" + token;
        emailService.sendEmail(email, false, link);
    }

    private void showSuccessMessage(String email) {
        // Hide the form and show success message
        formLayout.setVisible(false);
        successLayout.removeAll();

        Span successIcon = new Span("✓");
        successIcon.getStyle().set("color", "#2d3748")
                .set("font-size", "48px")
                .set("margin-bottom", "10px");

        Span message = new Span("E-Mail gesendet!");
        message.getStyle().set("font-weight", "bold")
                .set("margin-bottom", "10px");

        // Mask email for privacy (show only first 3 chars and domain)
        String maskedEmail = maskEmail(email);

        Span subMessage = new Span("Wir haben eine E-Mail an " + maskedEmail + " gesendet. " +
                                   "Bitte folge den Anweisungen in der E-Mail, um dein Passwort zurückzusetzen.");
        subMessage.getStyle().set("text-align", "center")
                .set("margin-bottom", "15px");

        Span redirectMessage = new Span("Du wirst in " + REDIRECT_DELAY_SECONDS + " Sekunden weitergeleitet...");
        redirectMessage.setId("redirect-countdown");

        ButtonWithPulseEffect loginButton = new ButtonWithPulseEffect("Zur Anmeldung", e -> navigateToLogin());
        loginButton.setWidthFull();
        loginButton.getStyle().set("margin-top", "15px");

        successLayout.add(successIcon, message, subMessage, redirectMessage, loginButton);
        successLayout.setVisible(true);

        // Schedule redirect
        scheduleRedirect();
    }

    private String maskEmail(String email) {
        if (email == null || email.isEmpty() || !email.contains("@")) {
            return "***@***.***";
        }

        String[] parts = email.split("@", 2);
        String name = parts[0];
        String domain = parts[1];

        // Show first 3 characters of the email address, the rest as asterisks
        String maskedName = name.length() <= 3 ? name : name.substring(0, 3) + "***";

        return maskedName + "@" + domain;
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

    // Da wir keine dauerhaft gespeicherte Connection mehr haben,
    // ist onDetach nicht mehr nötig oder kann leer bleiben
    @Override
    protected void onDetach(DetachEvent detachEvent) {
        super.onDetach(detachEvent);
        // Keine Verbindung mehr zu schließen
    }

    private void addMetaTags() {
        Html metaDescription = new Html(
                "<meta name=\"description\" content=\"Setze dein Zauberkoch-Passwort zurück.\">");
        Html metaKeywords = new Html(
                "<meta name=\"keywords\" content=\"zauberkoch, passwort zurücksetzen, passwort vergessen\">");
        getElement().appendChild(metaDescription.getElement());
        getElement().appendChild(metaKeywords.getElement());
    }
}