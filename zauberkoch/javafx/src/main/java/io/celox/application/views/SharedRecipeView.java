package io.celox.application.views;

import com.vaadin.flow.component.DetachEvent;
import com.vaadin.flow.component.Text;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.QueryParameters;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Optional;

import io.celox.application.custom.CardView;
import io.celox.application.custom.MarkdownView;
import io.celox.application.custom.pulse_effect.ButtonWithPulseEffect;
import io.celox.application.model.ApiLog;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import io.celox.application.utils.SecurityUtils;

/**
 * Ansicht für geteilte Rezepte.
 *
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@Route(value = "recipe")
@PageTitle("Rezept | Zauberkoch")
@AnonymousAllowed
public class SharedRecipeView extends VerticalLayout implements BeforeEnterObserver {

    private final DbUtils dbUtils;
    private Connection connection;

    @Autowired
    public SharedRecipeView(DbUtils dbUtils) {
        this.dbUtils = dbUtils;
        initializeConnection();
    }

    private void initializeConnection() {
        try {
            connection = dbUtils.getConnection();
        } catch (RuntimeException e) {
            Notification.show("Fehler beim Herstellen der Datenbankverbindung: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            throw e;
        }

        setPadding(false);
        setMargin(false);
    }

    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        QueryParameters queryParameters = event.getLocation().getQueryParameters();
        Optional<String> uuid = extractUuidFromQuery(queryParameters);

        if (uuid.isEmpty() || uuid.get().isEmpty()) {
            showErrorMessage("Ungültiger Rezept-Link.");
            return;
        }

        Optional<ApiLog> recipe = getRecipeByUuid(uuid.get());
        recipe.ifPresentOrElse(this::displayRecipe, () -> showErrorMessage("Rezept nicht gefunden.")
        );

        if (isGuestUser()) {
            showCreateAccountPrompt();
        }

        UI.getCurrent().getPage().executeJs(
                "const theme = localStorage.getItem('app-theme');" +
                "if (theme === 'dark') {" +
                "    document.documentElement.setAttribute('theme', 'dark');" +
                "} else {" +
                "    document.documentElement.removeAttribute('theme');" +
                "}"
        );
    }

    private Optional<String> extractUuidFromQuery(QueryParameters queryParameters) {
        return Optional.ofNullable(queryParameters.getParameters().get("id"))
                .filter(list -> !list.isEmpty())
                .map(list -> list.get(0));
    }

    private Optional<ApiLog> getRecipeByUuid(String uuid) {
        return Optional.ofNullable(DbUtils.getRecipeByUuid(connection, uuid));
    }

    private void displayRecipe(ApiLog apiLog) {
        MarkdownView markdownView = new MarkdownView();
        String recipeString = apiLog.getRecipe().substring(0, apiLog.getRecipe().indexOf("```"));
        markdownView.setValue(recipeString);
        CardView cardView = new CardView(null, markdownView, apiLog, CardView.RecipeContext.SHARED);
        add(cardView);
    }

    private void showCreateAccountPrompt() {
        VerticalLayout layout = new VerticalLayout();
        layout.add(
                new H2("Nicht angemeldet"),
                new Text("Melde dich an, oder erstelle dein Benutzerkonto."),
                createLoginButton()
        );
        add(layout);
    }

    private Button createLoginButton() {
        ButtonWithPulseEffect button = new ButtonWithPulseEffect("Login");
        button.addClickListener(event -> UI.getCurrent().navigate("login"));
        button.addClassName("login-button");
        return button;
    }

    private void showErrorMessage(String message) {
        add(new H2(message));
    }

    private boolean isGuestUser() {
        String username = SecurityUtils.getCurrentUsername();
        return username == null || username.isEmpty();
    }

    @Override
    protected void onDetach(DetachEvent detachEvent) {
        super.onDetach(detachEvent);
        closeConnection();
    }

    private void closeConnection() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
            }
        } catch (SQLException e) {
            // Consider adding proper logging here instead of silent catch
        }
    }
}