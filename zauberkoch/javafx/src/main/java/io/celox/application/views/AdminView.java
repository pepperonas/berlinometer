package io.celox.application.views;

import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.H4;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.data.renderer.ComponentRenderer;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import io.celox.application.custom.pulse_effect.ButtonWithExplosionEffect;
import io.celox.application.model.User;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import io.celox.application.utils.SecurityUtils;
import jakarta.annotation.security.PermitAll;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@PermitAll
@Route(value = "admin", layout = MainLayout.class)
@PageTitle("Admin | Zauberkoch")
public class AdminView extends VerticalLayout {

    private final Grid<User> userGrid = new Grid<>(User.class, false);
    DateTimeFormatter dtf = DateTimeFormatter
            .ofPattern("dd.MM.yyyy HH:mm")
            .withZone(ZoneId.of("Europe/Berlin"));
    private List<User> users;

    public AdminView() {
        setupLayout();
    }

    private void setupLayout() {
        if (!SecurityUtils.getRole().equals(SecurityUtils.Role.ADMIN)) {
            setupAccessDeniedView();
            return;
        }

        add(new H1("⚡️ Admin - DANGER ZONE!!!"));

        add(new H4("Nutzer: " + loadUserCount()));
        add(new H4("Rezepte: " + loadApiLogCount()));

        getElement().getClassList().add("admin-view");

        configureGrid();
        addUserGrid();

        Button btnExtendPremium = new Button("Extend Premium");
        btnExtendPremium.addClickListener(event -> {
            Dialog dialog = new Dialog();
            H3 title = new H3("Extend Premium");
            VerticalLayout layout = new VerticalLayout();
            ButtonWithExplosionEffect btn1Week = new ButtonWithExplosionEffect("Eine Woche",
                    buttonClickEvent -> {
                        Optional<User> selectedUser = userGrid.getSelectedItems().stream().findFirst();
                        if (selectedUser.isPresent()) {
                            extendPremium(selectedUser.get(), Const.ONE_WEEK_IN_MS);
                            dialog.close();
                        }
                    });

            ButtonWithExplosionEffect btn2Weeks = new ButtonWithExplosionEffect("Zwei Wochen",
                    buttonClickEvent -> {
                        Optional<User> selectedUser = userGrid.getSelectedItems().stream().findFirst();
                        if (selectedUser.isPresent()) {
                            extendPremium(selectedUser.get(), Const.ONE_WEEK_IN_MS * 2L);
                            dialog.close();
                        }
                    });

            ButtonWithExplosionEffect btn1Month = new ButtonWithExplosionEffect("Einen Monat",
                    buttonClickEvent -> {
                        Optional<User> selectedUser = userGrid.getSelectedItems().stream().findFirst();
                        if (selectedUser.isPresent()) {
                            extendPremium(selectedUser.get(), Const.ONE_WEEK_IN_MS * 4L);
                            dialog.close();
                        }
                    });

            layout.add(title, btn1Week, btn2Weeks, btn1Month);
            dialog.add(layout);
            dialog.open();
        });

        add(btnExtendPremium);
    }

    private int loadUserCount() {
        try (Connection connection = DbUtils.getConnection()) {
            return DbUtils.getAllUsersForAdminView(connection).size();
        } catch (SQLException e) {
            Notification.show("Fehler beim Laden der Benutzer: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            return 0;
        }
    }

    private void setupAccessDeniedView() {
        setSizeFull();
        setAlignItems(Alignment.CENTER);
        getStyle().set("background-color", "red");

        Div div1 = new Div();
        div1.setHeightFull();
        Div divPic = new Div();
        divPic.add(new Html("<img src=\"https://stickerapp.de/cdn-assets/images/stickers/786t.png\" alt=\"Finger\">"));
        Div div2 = new Div();
        div2.setHeightFull();
        add(div1, divPic, div2);
    }

    private void configureGrid() {
        userGrid.setSelectionMode(Grid.SelectionMode.SINGLE);

        userGrid.addColumn(User::getId)
                .setHeader("ID")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true);

        userGrid.addColumn(User::getUsername)
                .setHeader("Username")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true);

        userGrid.addColumn(User::getEmail)
                .setHeader("Email")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true);

        userGrid.addColumn(user -> user.isVerified() ? "✅ Ja" : "❌ Nein")
                .setHeader("Verifiziert")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true);

        userGrid.addColumn(user -> user.isAdmin() ? "👑 Admin" : "👤 User")
                .setHeader("Rolle")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true);

        userGrid.addColumn(user -> formatDate(user.getCreated()))
                .setHeader("Erstellt")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true)
                .setComparator(Comparator.comparing(User::getCreated, Comparator.nullsLast(Comparator.naturalOrder())));

        Grid.Column<User> premiumColumn = userGrid.addColumn(new ComponentRenderer<>(user -> {
            String text = user.getPremiumExpiration() != null ? formatDate(user.getPremiumExpiration()) : "Kein Premium";
            Span span = new Span(text);

            if (user.getPremiumExpiration() != null) {
                Date now = new Date();
                if (user.getPremiumExpiration().after(now)) {
                    // Active premium styling
                    span.getStyle().set("color", "white");
                    span.getStyle().set("font-weight", "bold");
                    span.getStyle().set("background-color", "#28a745");
                    span.getStyle().set("border-radius", "4px");
                    span.getStyle().set("padding", "2px 6px");
                } else {
                    // Expired premium styling
                    span.getStyle().set("color", "white");
                    span.getStyle().set("font-weight", "bold");
                    span.getStyle().set("background-color", "#dc3545");
                    span.getStyle().set("border-radius", "4px");
                    span.getStyle().set("padding", "2px 6px");
                }
            }

            return span;
        }));

        premiumColumn.setHeader("Premium")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true)
                .setComparator(Comparator.comparing(User::getPremiumExpiration, Comparator.nullsLast(Comparator.naturalOrder())));

        userGrid.addColumn(user -> formatDate(user.getLastSeen()))
                .setHeader("Letzte Aktivität")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true)
                .setComparator(Comparator.comparing(User::getLastSeen, Comparator.nullsLast(Comparator.naturalOrder())));

        userGrid.addColumn(User::getExecCount)
                .setHeader("Logs")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true);

        userGrid.addColumn(user -> user.isGoogleOauth() ? "🔒 Ja" : "🤷‍♀️ Nein")
                .setHeader("OAuth2")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true);

        userGrid.addColumn(User::getReferralsCount)
                .setHeader("Ref")
                .setAutoWidth(true)
                .setFlexGrow(0)
                .setSortable(true);

        userGrid.setSizeFull();
    }

    private void addUserGrid() {
        setSizeFull();
        remove(userGrid);

        try (Connection connection = DbUtils.getConnection()) {
            users = DbUtils.getAllUsersForAdminView(connection);
            userGrid.setItems(users);
            add(userGrid);
        } catch (SQLException e) {
            Notification.show("Fehler beim Laden der Benutzer: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
        }
    }

    private int loadApiLogCount() {
        try (Connection connection = DbUtils.getConnection()) {
            return DbUtils.getApiLogCount(connection);
        } catch (SQLException e) {
            Notification.show("Fehler beim Laden der Rezepte: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            return 0;
        }
    }

    private void updateGrid() {
        try (Connection connection = DbUtils.getConnection()) {
            users = DbUtils.getAllUsersForAdminView(connection);
            userGrid.setItems(users);
        } catch (SQLException e) {
            Notification.show("Fehler beim Aktualisieren der Benutzer: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
        }
    }

    private void extendPremium(User user, long durationMs) {
        try (Connection connection = DbUtils.getConnection()) {
            int userId = user.getId(); // Speichere die ID für späteren Gebrauch

            // Verlängere das Premium-Abonnement in der Datenbank
            DbUtils.extendUserPremium(connection, userId, durationMs);

            // Lade gezielt nur den aktualisierten Benutzer aus der Datenbank
            User updatedUser = DbUtils.getUserById(connection, userId);

            if (updatedUser != null) {
                // Speichere die aktuelle Selektion
                Set<User> selectedItems = userGrid.getSelectedItems();
                boolean wasSelected = selectedItems.stream().anyMatch(u -> u.getId() == userId);

                // Aktualisiere den Benutzer in der lokalen Liste
                for (int i = 0; i < users.size(); i++) {
                    if (users.get(i).getId() == userId) {
                        // Ersetze den Benutzer in der Liste
                        users.set(i, updatedUser);
                        break;
                    }
                }

                // Aktualisiere die Items im Grid
                userGrid.getDataProvider().refreshAll();

                // Stelle die Selektion wieder her, wenn nötig
                if (wasSelected) {
                    userGrid.select(updatedUser);
                }
            }

            Notification.show("Premium-Status erfolgreich verlängert!",
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
        } catch (SQLException e) {
            Notification.show("Fehler beim Verlängern des Premium-Status: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
        }
    }

    private String formatDate(Date date) {
        return date != null ? dtf.format(date.toInstant()) : "N/A";
    }

    private String formatInstant(Instant instant) {
        return instant != null ? dtf.format(instant) : "N/A";
    }
}