package io.celox.application.views;

import com.vaadin.flow.component.DetachEvent;
import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.accordion.Accordion;
import com.vaadin.flow.component.accordion.AccordionPanel;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.progressbar.ProgressBar;
import com.vaadin.flow.component.tabs.TabSheet;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.shared.Registration;

import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Connection;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import io.celox.application.custom.CardView;
import io.celox.application.custom.MarkdownView;
import io.celox.application.model.ApiLog;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import io.celox.application.utils.SecurityUtils;
import io.celox.application.utils.ThemeEventBus;
import io.celox.application.utils.ThemeUtil;
import jakarta.annotation.security.PermitAll;

@PermitAll
@Route(value = "history", layout = MainLayout.class)
@PageTitle("Verlauf | Zauberkoch")
public class HistoryView extends VerticalLayout {

    private static final int PAGE_SIZE = 10; // Anzahl der Einträge pro Seite

    private final List<CardView> cardViews = new ArrayList<>(); // Liste der CardViews zum Aktualisieren
    private final Map<ApiLog, AccordionPanel> recipeToPanelMapFood = new HashMap<>(); // Zuordnung Recipe -> AccordionPanel
    private final Map<ApiLog, AccordionPanel> recipeToPanelMapDrink = new HashMap<>(); // Zuordnung Recipe -> AccordionPanel
    private Registration themeListenerRegistration; // Registration für den Theme-Listener
    private final Accordion accordionFood; // Accordion-Instanz speichern
    private final Accordion accordionDrink; // Accordion-Instanz speichern

    // Pagination-Variablen
    private int offsetFood = 0;
    private int offsetDrink = 0;
    private int totalCountFood = 0;
    private int totalCountDrink = 0;
    private final VerticalLayout loadMoreLayoutFood;
    private final VerticalLayout loadMoreLayoutDrink;
    private final SimpleDateFormat sdf = new SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.GERMANY);
    private String currentTheme = "light"; // Standard-Theme

    @Autowired
    public HistoryView(ThemeEventBus themeEventBus) {
        addMetaTags();

        cardViews.clear(); // Liste leeren
        recipeToPanelMapFood.clear(); // Map leeren
        recipeToPanelMapDrink.clear(); // Map leeren

        setSizeFull();
        setPadding(false);
        setMargin(false);
        H1 heading = new H1("⏱️ Verlauf");
        heading.getStyle().set("padding-left", "20px");
        heading.getStyle().set("padding-top", "20px");
        add(heading);

        try (Connection connection = DbUtils.getConnection()) {
            // Gesamtanzahl der Einträge ermitteln
            totalCountFood = DbUtils.getRecipeCount(connection, SecurityUtils.getCurrentUsername(), false, "food");
            totalCountDrink = DbUtils.getRecipeCount(connection, SecurityUtils.getCurrentUsername(), false, "drink");
        } catch (SQLException e) {
            Notification.show("Fehler beim Abrufen der Anzahl der Einträge: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
        }

        // Accordion-Layouts erstellen
        accordionFood = new Accordion();
        accordionFood.setWidth("100%");
        accordionFood.getStyle()
                .set("border-radius", "8px")
                .set("margin-left", "10px")
                .set("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

        accordionDrink = new Accordion();
        accordionDrink.setWidth("100%");
        accordionDrink.getStyle()
                .set("border-radius", "8px")
                .set("margin-left", "10px")
                .set("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

        // "Mehr laden"-Bereiche erstellen
        loadMoreLayoutFood = new VerticalLayout();
        loadMoreLayoutFood.setWidth("100%");
        loadMoreLayoutFood.setPadding(true);
        loadMoreLayoutFood.setSpacing(true);
        loadMoreLayoutFood.setAlignItems(Alignment.CENTER);

        loadMoreLayoutDrink = new VerticalLayout();
        loadMoreLayoutDrink.setWidth("100%");
        loadMoreLayoutDrink.setPadding(true);
        loadMoreLayoutDrink.setSpacing(true);
        loadMoreLayoutDrink.setAlignItems(Alignment.CENTER);

        // Container für Accordion und Load-More-Button
        VerticalLayout foodContainer = new VerticalLayout(accordionFood, loadMoreLayoutFood);
        foodContainer.setPadding(false);
        foodContainer.setSpacing(false);
        foodContainer.setSizeFull();

        VerticalLayout drinkContainer = new VerticalLayout(accordionDrink, loadMoreLayoutDrink);
        drinkContainer.setPadding(false);
        drinkContainer.setSpacing(false);
        drinkContainer.setSizeFull();

        // Tab-Layout erstellen
        TabSheet tabSheet = new TabSheet();
        tabSheet.setSizeFull();
        tabSheet.add("Essen", foodContainer);
        tabSheet.add("Cocktails", drinkContainer);
        setFlexGrow(1, tabSheet);

        add(tabSheet);

        // Initiales Theme laden und Karten erstellen
        ThemeUtil.getThemeFromLocalStorage(theme -> {
            currentTheme = theme;
            // Initiale Daten laden
            loadMoreRecipes("food");
            loadMoreRecipes("drink");

            // Theme-Änderungen abonnieren
            themeListenerRegistration = themeEventBus.addThemeChangeListener(event -> {
                currentTheme = event.getTheme();
                updateCardStyles(currentTheme);
            });
        });
    }

    private void loadMoreRecipes(String type) {
        ProgressBar progressBar = new ProgressBar();
        progressBar.setIndeterminate(true);
        progressBar.setWidth("80%");

        if ("food".equals(type)) {
            loadMoreLayoutFood.removeAll();
            loadMoreLayoutFood.add(progressBar);

            // Asynchrones Laden, um die UI nicht zu blockieren
            UI.getCurrent().access(() -> {
                try (Connection connection = DbUtils.getConnection()) {
                    List<ApiLog> historiesFood = DbUtils.getPaginatedRecipes(
                            connection,
                            SecurityUtils.getCurrentUsername(),
                            false,
                            "food",
                            offsetFood,
                            PAGE_SIZE
                    );

                    setupCards(historiesFood, accordionFood, sdf, currentTheme);
                    offsetFood += historiesFood.size();
                    updateLoadMoreButton("food");
                } catch (SQLException e) {
                    Notification.show("Fehler beim Laden der Einträge: " + e.getMessage(),
                            Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                }

                // Progress Bar entfernen
                loadMoreLayoutFood.remove(progressBar);
            });
        } else {
            loadMoreLayoutDrink.removeAll();
            loadMoreLayoutDrink.add(progressBar);

            // Asynchrones Laden, um die UI nicht zu blockieren
            UI.getCurrent().access(() -> {
                try (Connection connection = DbUtils.getConnection()) {
                    List<ApiLog> historiesDrink = DbUtils.getPaginatedRecipes(
                            connection,
                            SecurityUtils.getCurrentUsername(),
                            false,
                            "drink",
                            offsetDrink,
                            PAGE_SIZE
                    );

                    setupCards(historiesDrink, accordionDrink, sdf, currentTheme);
                    offsetDrink += historiesDrink.size();
                    updateLoadMoreButton("drink");
                } catch (SQLException e) {
                    Notification.show("Fehler beim Laden der Einträge: " + e.getMessage(),
                            Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                }

                // Progress Bar entfernen
                loadMoreLayoutDrink.remove(progressBar);
            });
        }
    }

    private void updateLoadMoreButton(String type) {
        if ("food".equals(type)) {
            loadMoreLayoutFood.removeAll();

            // Anzeige der geladenen Einträge
            Span infoText = new Span(offsetFood + " von " + totalCountFood + " Einträgen geladen");

            if (offsetFood < totalCountFood) {
                Button loadMoreButton = new Button("Mehr laden", e -> loadMoreRecipes("food"));
                loadMoreButton.addClassName("load-more-button");

                HorizontalLayout buttonLayout = new HorizontalLayout(infoText, loadMoreButton);
                buttonLayout.setAlignItems(Alignment.CENTER);
                buttonLayout.setSpacing(true);

                loadMoreLayoutFood.add(buttonLayout);
            } else {
                loadMoreLayoutFood.add(infoText);
            }
        } else {
            loadMoreLayoutDrink.removeAll();

            // Anzeige der geladenen Einträge
            Span infoText = new Span(offsetDrink + " von " + totalCountDrink + " Einträgen geladen");

            if (offsetDrink < totalCountDrink) {
                Button loadMoreButton = new Button("Mehr laden", e -> loadMoreRecipes("drink"));
                loadMoreButton.addClassName("load-more-button");

                HorizontalLayout buttonLayout = new HorizontalLayout(infoText, loadMoreButton);
                buttonLayout.setAlignItems(Alignment.CENTER);
                buttonLayout.setSpacing(true);

                loadMoreLayoutDrink.add(buttonLayout);
            } else {
                loadMoreLayoutDrink.add(infoText);
            }
        }
    }

    private void setupCards(List<ApiLog> histories, Accordion accordion, SimpleDateFormat sdf, String theme) {
        for (ApiLog historic : histories) {
            //            try (Connection connection = DbUtils.getConnection()) {
            MarkdownView markdownView = new MarkdownView();
            String recipeString = prepareRecipeString(historic);
            markdownView.setValue(recipeString);

            String panelTitle = historic.getTitle() + " | " + sdf.format(historic.getTimestamp());

            CardView cardView = new CardView(this,
                    markdownView,
                    historic,
                    CardView.RecipeContext.HISTORIC
            );

            // Initiales Styling basierend auf dem Theme
            cardView.getStyle()
                    .set("margin", "0px")
                    .set("border-radius", "6px");
            applyCardStyle(cardView, theme);

            // CardView zur Liste hinzufügen
            cardViews.add(cardView);

            Div content = new Div(cardView);
            content.setWidth("100%");

            AccordionPanel panel = new AccordionPanel(panelTitle, content);
            accordion.add(panel);

            // Zuordnung speichern
            if (historic.getType().equals("drink")) {
                recipeToPanelMapDrink.put(historic, panel);
            } else {
                recipeToPanelMapFood.put(historic, panel);
            }
            //            } catch (SQLException e) {
            //                Notification.show("Fehler beim Erstellen der Karten: " + e.getMessage(),
            //                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            //            }
        }

        // Alle Panels geschlossen halten
        accordion.close();
    }

    private void applyCardStyle(CardView cardView, String theme) {
        if ("dark".equals(theme)) {
            cardView.getStyle().set("background", "#212121");
        } else {
            cardView.getStyle().set("background", "white");
        }
    }

    private void updateCardStyles(String theme) {
        getUI().ifPresent(ui -> ui.access(() -> {
            for (CardView cardView : cardViews) {
                applyCardStyle(cardView, theme);
            }
        }));
    }

    private String prepareRecipeString(ApiLog historic) {
        String recipeString = historic.getRecipe();
        if (recipeString.contains("json")) {
            recipeString = recipeString.substring(0, recipeString.indexOf("json"))
                    .replace("```", "");
        }
        return recipeString;
    }

    public void removeRecipe(ApiLog apiLog) {
        // Entferne das entsprechende AccordionPanel
        if (apiLog.getType().equals("drink")) {
            UI.getCurrent().access(() -> {
                AccordionPanel panel = recipeToPanelMapDrink.get(apiLog);
                accordionDrink.remove(panel);
                recipeToPanelMapDrink.remove(apiLog);

                // Entferne die zugehörige CardView aus der Liste
                cardViews.stream()
                        .filter(cardView -> cardView.getRecipe().equals(apiLog))
                        .findFirst().ifPresent(cardViews::remove);

                // check if correct
                offsetDrink--;
                // Aktualisiere die Gesamtanzahl
                totalCountDrink--;
                updateLoadMoreButton("drink");
            });
        } else {
            UI.getCurrent().access(() -> {
                AccordionPanel panel = recipeToPanelMapFood.get(apiLog);
                accordionFood.remove(panel);
                recipeToPanelMapFood.remove(apiLog);

                // Entferne die zugehörige CardView aus der Liste
                cardViews.stream()
                        .filter(cardView -> cardView.getRecipe().equals(apiLog))
                        .findFirst().ifPresent(cardViews::remove);

                // check if correct
                offsetFood--;
                // Aktualisiere die Gesamtanzahl
                totalCountFood--;
                updateLoadMoreButton("food");
            });
        }
    }

    @Override
    protected void onDetach(DetachEvent detachEvent) {
        super.onDetach(detachEvent);
        // Theme-Listener abmelden
        if (themeListenerRegistration != null) {
            themeListenerRegistration.remove();
        }
        // Da wir keine dauerhafte Connection mehr halten, müssen wir hier nichts schließen
    }

    private void addMetaTags() {
        // Die oben definierte Methode addMetaTags() hier einfügen
        Html metaDescription = new Html(
                "<meta name=\"description\" content=\"Deine favorisierten Rezepte bei Zauberkoch – jederzeit abrufbar und personalisiert für dich.\">");
        Html metaKeywords = new Html(
                "<meta name=\"keywords\" content=\"zauberkoch, favoriten, kochrezepte, personalisiert, intuitive gui\">");
        Html metaRobots = new Html(
                "<meta name=\"robots\" content=\"noindex, nofollow\">");

        Html ogTitle = new Html(
                "<meta property=\"og:title\" content=\"Meine Favoriten – Zauberkoch\">");
        Html ogDescription = new Html(
                "<meta property=\"og:description\" content=\"Sieh dir deine favorisierten Rezepte bei Zauberkoch an, personalisiert und intuitiv zusammengestellt.\">");
        Html ogImage = new Html(
                "<meta property=\"og:image\" content=\"https://app.zauberkoch.com/images/favorites-og-image.jpg\">");
        Html ogUrl = new Html(
                "<meta property=\"og:url\" content=\"https://app.zauberkoch.com/favorites\">");
        Html ogType = new Html(
                "<meta property=\"og:type\" content=\"website\">");

        Html twitterCard = new Html(
                "<meta name=\"twitter:card\" content=\"summary_large_image\">");
        Html twitterTitle = new Html(
                "<meta name=\"twitter:title\" content=\"Meine Favoriten – Zauberkoch\">");
        Html twitterDescription = new Html(
                "<meta name=\"twitter:description\" content=\"Sieh dir deine favorisierten Rezepte bei Zauberkoch an, personalisiert und intuitiv zusammengestellt.\">");
        Html twitterImage = new Html(
                "<meta name=\"twitter:image\" content=\"https://app.zauberkoch.com/images/favorites-og-image.jpg\">");

        getElement().appendChild(metaDescription.getElement());
        getElement().appendChild(metaKeywords.getElement());
        getElement().appendChild(metaRobots.getElement());
        getElement().appendChild(ogTitle.getElement());
        getElement().appendChild(ogDescription.getElement());
        getElement().appendChild(ogImage.getElement());
        getElement().appendChild(ogUrl.getElement());
        getElement().appendChild(ogType.getElement());
        getElement().appendChild(twitterCard.getElement());
        getElement().appendChild(twitterTitle.getElement());
        getElement().appendChild(twitterDescription.getElement());
        getElement().appendChild(twitterImage.getElement());
    }
}