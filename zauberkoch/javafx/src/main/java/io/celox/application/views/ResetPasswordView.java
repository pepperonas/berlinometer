package io.celox.application.views;

import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.QueryParameters;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import io.celox.application.custom.pulse_effect.ButtonWithPulseEffect;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;

@Route("reset-password")
@PageTitle("Passwort zurücksetzen | Zauberkoch")
@AnonymousAllowed
public class ResetPasswordView extends VerticalLayout implements BeforeEnterObserver {

    private static final Logger LOGGER = LoggerFactory.getLogger(ResetPasswordView.class);
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int REDIRECT_DELAY_SECONDS = 10;
    private static final String ERROR_INVALID_INPUT = "Ungültige Eingabe.";
    private static final String ERROR_PASSWORDS_MISMATCH = "Passwörter stimmen nicht überein.";
    private static final String ERROR_INVALID_TOKEN = "Ungültiges oder abgelaufenes Token.";
    private static final String ERROR_NO_TOKEN = "Kein Token in der URL gefunden.";
    private static final String ERROR_SERVER = "Ein Fehler ist aufgetreten.";
    private static final String ERROR_DB_CONNECTION = "Datenbankverbindung fehlgeschlagen.";
    private static final String SUCCESS_PASSWORD_RESET = "Passwort erfolgreich geändert.";

    private final VerticalLayout formLayout = new VerticalLayout();
    private final VerticalLayout successLayout = new VerticalLayout();

    private final TextField tokenField = new TextField("Reset-Token");
    private final PasswordField newPasswordField = new PasswordField("Neues Passwort");
    private final PasswordField confirmPasswordField = new PasswordField("Passwort bestätigen");
    private final ButtonWithPulseEffect resetButton = new ButtonWithPulseEffect("Passwort ändern");

    @Autowired
    public ResetPasswordView() {
        addMetaTags();
        configureComponents();
        setupLayout();
        addListeners();
    }

    private void configureComponents() {
        addClassName("reset-password-view");
        setSizeFull();
        setAlignItems(Alignment.CENTER);
        setJustifyContentMode(JustifyContentMode.CENTER);

        tokenField.setReadOnly(true);
        tokenField.setWidthFull();

        newPasswordField.setWidthFull();
        newPasswordField.setPattern(".{" + MIN_PASSWORD_LENGTH + ",}");
        newPasswordField.setErrorMessage("Das Passwort muss mindestens " + MIN_PASSWORD_LENGTH + " Zeichen lang sein.");
        newPasswordField.setRevealButtonVisible(true);

        confirmPasswordField.setWidthFull();
        confirmPasswordField.setRevealButtonVisible(true);

        resetButton.setWidthFull();
        resetButton.addClickShortcut(com.vaadin.flow.component.Key.ENTER);

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

        formLayout.add(tokenField, newPasswordField, confirmPasswordField, resetButton);
        formLayout.setWidth("300px");
        formLayout.setSpacing(true);
        formLayout.setPadding(false);
        formLayout.getStyle().set("border", "1px solid #ccc")
                .set("border-radius", "8px")
                .set("padding", "20px");

        add(heading, formLayout, successLayout);
    }

    private void addListeners() {
        resetButton.addClickListener(e -> handlePasswordReset());
    }

    private void handlePasswordReset() {
        String token = tokenField.getValue();
        String newPassword = newPasswordField.getValue();
        String confirmPassword = confirmPasswordField.getValue();

        if (newPasswordField.isInvalid() || token.isEmpty()) {
            showNotification(ERROR_INVALID_INPUT);
            return;
        }

        if (!newPassword.equals(confirmPassword)) {
            showNotification(ERROR_PASSWORDS_MISMATCH);
            confirmPasswordField.setInvalid(true);
            confirmPasswordField.setErrorMessage(ERROR_PASSWORDS_MISMATCH);
            return;
        }

        try (Connection connection = DbUtils.getConnection()) {
            Optional<Integer> userIdOpt = validateToken(connection, token);
            if (userIdOpt.isPresent()) {
                updatePassword(connection, userIdOpt.get(), newPassword);
                deleteToken(connection, token);
                showSuccessMessage();
            } else {
                showNotification(ERROR_INVALID_TOKEN);
            }
        } catch (SQLException e) {
            LOGGER.error("Database error during password reset", e);
            showNotification(ERROR_SERVER);
        }
    }

    private Optional<Integer> validateToken(Connection connection, String token) throws SQLException {
        String sql = "SELECT user_id, expiry_date FROM fooddb.password_reset_tokens WHERE token = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, token);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    LocalDateTime expiryDate = rs.getTimestamp("expiry_date").toLocalDateTime();
                    if (expiryDate.isAfter(LocalDateTime.now())) {
                        return Optional.of(rs.getInt("user_id"));
                    }
                }
            }
        }
        return Optional.empty();
    }

    private void updatePassword(Connection connection, int userId, String newPassword) throws SQLException {
        String sql = "UPDATE fooddb.users SET password = ? WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            String hashedPassword = new BCryptPasswordEncoder().encode(newPassword + Const.SALTED_BY_TYSON);
            stmt.setString(1, hashedPassword);
            stmt.setInt(2, userId);
            stmt.executeUpdate();
        }
    }

    private void deleteToken(Connection connection, String token) throws SQLException {
        String sql = "DELETE FROM fooddb.password_reset_tokens WHERE token = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, token);
            stmt.executeUpdate();
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

        Span message = new Span("Passwort geändert!");
        message.getStyle().set("font-weight", "bold")
                .set("margin-bottom", "10px");

        Span subMessage = new Span("Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt mit deinem neuen Passwort anmelden.");
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

    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        QueryParameters queryParameters = event.getLocation().getQueryParameters();
        Optional<String> token = queryParameters.getParameters().getOrDefault("token", List.of("")).stream().findFirst();

        if (token.isPresent() && !token.get().isEmpty()) {
            tokenField.setValue(token.get());
        } else {
            showNotification(ERROR_NO_TOKEN);
            event.forwardTo("login");
        }
    }

    private void showNotification(String message) {
        Notification.show(message, Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
    }

    private void addMetaTags() {
        Html metaDescription = new Html(
                "<meta name=\"description\" content=\"Setze dein Zauberkoch-Passwort zurück.\">");
        Html metaKeywords = new Html(
                "<meta name=\"keywords\" content=\"zauberkoch, passwort zurücksetzen, neues passwort\">");
        getElement().appendChild(metaDescription.getElement());
        getElement().appendChild(metaKeywords.getElement());
    }
}