package io.celox.application.views;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.VaadinSession;
import com.vaadin.flow.server.auth.AnonymousAllowed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@Route("verify")
@AnonymousAllowed
@PageTitle("Account Verifizierung | Zauberkoch")
public class VerificationView extends VerticalLayout implements BeforeEnterObserver {

    private static final Logger LOGGER = LoggerFactory.getLogger(VerificationView.class);
    private static final int REDIRECT_DELAY_SECONDS = 5;

    private final H3 countdownText = new H3("");

    public VerificationView() {
        configureLayout();
    }

    private void configureLayout() {
        addClassName("verification-view");
        setSizeFull();
        setAlignItems(Alignment.CENTER);
        setJustifyContentMode(JustifyContentMode.CENTER);
    }

    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        Optional<String> token = event.getLocation().getQueryParameters()
                .getParameters().getOrDefault("token", List.of("")).stream().findFirst();

        if (token.isEmpty()) {
            showErrorMessage("Kein Verifizierungstoken gefunden.");
            return;
        }

        String tokenValue = token.get();
        if (tokenValue.isBlank()) {
            showErrorMessage("Ungültiger Verifizierungslink.");
            return;
        }

        try (Connection connection = DbUtils.getConnection()) {
            if (verifyToken(connection, tokenValue)) {
                add(new H2("Dein Account wurde erfolgreich verifiziert! 🎉"));
                checkReferralAndEnsureUpdate(connection);
                startRedirectCountdown();
            } else {
                showErrorMessage("Der Verifizierungslink ist ungültig oder abgelaufen.");
            }
        } catch (SQLException e) {
            LOGGER.error("Database error during verification", e);
            showErrorMessage("Ein Datenbankfehler ist aufgetreten.");
        }
    }

    private boolean verifyToken(Connection connection, String token) {
        try (PreparedStatement stmt = connection.prepareStatement(
                "SELECT user_id, expiry_date FROM fooddb.verification_tokens WHERE token = ?")) {
            stmt.setString(1, token);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    long expiryDate = rs.getLong("expiry_date");
                    if (expiryDate >= LocalDateTime.now().toEpochSecond(ZoneOffset.UTC)) {
                        int userId = rs.getInt("user_id");
                        activateUser(connection, userId);
                        return true;
                    }
                }
            }
        } catch (SQLException e) {
            LOGGER.error("Error verifying token: {}", token, e);
            Notification.show("Fehler bei der Token-Verifizierung.",
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
        }
        return false;
    }

    private void activateUser(Connection connection, long userId) throws SQLException {
        try (PreparedStatement stmt = connection.prepareStatement(
                "UPDATE fooddb.users SET verified = true WHERE id = ?")) {
            stmt.setLong(1, userId);
            stmt.executeUpdate();
        }
    }

    private void checkReferralAndEnsureUpdate(Connection connection) {
        String referralCode = (String) VaadinSession.getCurrent().getAttribute("referralCode");
        if (referralCode != null) {
            try {
                DbUtils.updateReferralUsage(connection, referralCode);
            } catch (SQLException e) {
                LOGGER.warn("Error updating referral code: {}", referralCode, e);
            }
        }
    }

    private void startRedirectCountdown() {
        add(countdownText);
        UI ui = UI.getCurrent();
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

        countdownText.setText("Weiterleitung zum Login in " + REDIRECT_DELAY_SECONDS + " Sekunden...");
        executor.scheduleAtFixedRate(() -> {
            try {
                int remaining = extractSeconds(countdownText.getText());
                if (remaining > 0) {
                    ui.access(() -> countdownText.setText("Weiterleitung zum Login in " + (remaining - 1) + " Sekunden..."));
                } else {
                    ui.access(() -> ui.navigate("login"));
                    executor.shutdown();
                }
            } catch (Exception e) {
                LOGGER.warn("Error during countdown.", e);
                ui.access(() -> ui.navigate("login"));
                executor.shutdown();
            }
        }, 0, 1, TimeUnit.SECONDS);
    }

    private int extractSeconds(String text) {
        return Integer.parseInt(text.replaceAll("[^0-9]", ""));
    }

    private void showErrorMessage(String message) {
        add(new H2(message));
    }
}