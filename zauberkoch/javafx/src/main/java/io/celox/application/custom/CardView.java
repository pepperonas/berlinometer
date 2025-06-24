package io.celox.application.custom;

import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;

import java.sql.Connection;
import java.sql.SQLException;

import io.celox.application.custom.pulse_effect.ButtonWithPulseEffect;
import io.celox.application.model.ApiLog;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import io.celox.application.utils.FunnyStringManip;
import io.celox.application.utils.GuiUtils;
import io.celox.application.views.FavoritesView;
import io.celox.application.views.HistoryView;

public class CardView extends VerticalLayout {

    public enum RecipeContext {
        SHARED,
        HISTORIC,
        FAVORITE
    }

    private final ApiLog mApiLog;

    /**
     * Neuer Konstruktor ohne Connection-Parameter
     */
    public CardView(Component parent, Component component,
                    ApiLog apiLog, RecipeContext recipeContext) {
        this.mApiLog = apiLog;

        // Erstelle die Card-Container
        Div card = new Div();
        card.addClassName("card-view-rec");

        // Buttons initialisieren
        ButtonWithPulseEffect btnStarr = null;
        ButtonWithPulseEffect btnDelete = null;

        switch (recipeContext) {
            case SHARED:
                break;
            case HISTORIC:
                btnDelete = new ButtonWithPulseEffect(VaadinIcon.TRASH.create());
                btnStarr = new ButtonWithPulseEffect(VaadinIcon.STAR_O.create());
                break;
            case FAVORITE:
                btnStarr = new ButtonWithPulseEffect(VaadinIcon.STAR.create()); // Stern-Symbol für "entfavorisieren"
                break;
        }
        ButtonWithPulseEffect btnDownload = new ButtonWithPulseEffect(VaadinIcon.DOWNLOAD.create());
        ButtonWithPulseEffect btnShare = new ButtonWithPulseEffect(VaadinIcon.SHARE.create());

        setMargin(false);
        btnDownload.setVisible(false);

        if (apiLog != null) {
            // Share-Button Logik
            btnShare.addClickListener(event -> {
                String js = "navigator.clipboard" +
                            ".writeText('" + Const.SERVER_URL + "/recipe?id=" + apiLog.getUuid() + "')" +
                            ".then(() => {" +
                            "    console.log('Erfolgreich kopiert');" +
                            "}).catch(err => {" +
                            "    console.error('Fehler beim Kopieren', err);" +
                            "});";
                getUI().ifPresent(ui -> ui.getPage().executeJs(js));
                Notification.show("Rezept-Link kopiert", Const.NOTIFICATION_DURATION_LONG, Notification.Position.BOTTOM_CENTER);
            });

            // Starr-Button Logik (Favorisieren/Entfavorisieren)
            if (btnStarr != null) {
                switch (recipeContext) {
                    case HISTORIC:
                        btnStarr.addClickListener(e -> {
                            try (Connection connection = DbUtils.getConnection()) {
                                DbUtils.updateStarredResponse(connection, apiLog.getId(), true);
                                Notification.show(FunnyStringManip.getPositive(),
                                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                                // Entferne die Card aus der HistoryView, da sie nun ein Favorit ist
                                if (parent instanceof HistoryView historyView) {
                                    historyView.removeRecipe(apiLog);
                                }
                            } catch (SQLException ex) {
                                Notification.show("Fehler beim Favorisieren: " + ex.getMessage(),
                                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                            }
                        });
                        break;
                    case FAVORITE:
                        btnStarr.addClickListener(e -> {
                            try (Connection connection = DbUtils.getConnection()) {
                                DbUtils.removeRecipeFromStarred(connection, apiLog.getId());
                                Notification.show("Rezept aus Favoriten entfernt",
                                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                                if (parent instanceof FavoritesView favoritesView) {
                                    favoritesView.removeRecipe(apiLog);
                                }
                            } catch (SQLException ex) {
                                Notification.show("Fehler beim Entfernen aus Favoriten: " + ex.getMessage(),
                                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                            }
                        });
                        break;
                    default:
                        break;
                }
            }

            // Delete-Button Logik
            if (btnDelete != null) {
                switch (recipeContext) {
                    case SHARED:
                        break;
                    case HISTORIC:
                        btnDelete.addClickListener(event -> {
                            try (Connection connection = DbUtils.getConnection()) {
                                DbUtils.deactivateApiLog(connection, apiLog.getId());
                                Notification.show("Rezept gelöscht",
                                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                                if (parent instanceof HistoryView historyView) {
                                    historyView.removeRecipe(apiLog);
                                }
                            } catch (SQLException e) {
                                Notification.show("Fehler beim Löschen: " + e.getMessage(),
                                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                            }
                        });
                        break;
                    case FAVORITE:
                        btnDelete.addClickListener(event -> {
                            try (Connection connection = DbUtils.getConnection()) {
                                DbUtils.removeRecipeFromStarred(connection, apiLog.getId());
                                Notification.show("Rezept aus Favoriten entfernt",
                                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                                if (parent instanceof FavoritesView favoritesView) {
                                    favoritesView.removeRecipe(apiLog);
                                }
                            } catch (SQLException e) {
                                Notification.show("Fehler beim Entfernen aus Favoriten: " + e.getMessage(),
                                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                            }
                        });
                        break;
                }
            }
        }

        // „Teilen über WhatsApp"-Button hinzufügen
        String shareText = "Ich habe ein leckeres Rezept gezaubert. Schau's es dir am besten direkt an! 🚀"
                           + Const.SERVER_URL + "/recipe?id=" + apiLog.getUuid();
        String whatsappUrl = "https://api.whatsapp.com/send?text=" + GuiUtils.encodeUrl(shareText);

        // Create the Anchor
        Anchor btnShareWhatsApp = new Anchor(whatsappUrl);

        // Create a generic share/message icon (since Vaadin doesn't have a WhatsApp icon)
        Icon shareIcon = VaadinIcon.COMMENT.create();
        shareIcon.addClassName("whatsapp-icon");

        // Create a layout to combine the icon and text
        HorizontalLayout buttonContent = new HorizontalLayout(shareIcon);
        buttonContent.setSpacing(true);
        buttonContent.setAlignItems(HorizontalLayout.Alignment.CENTER);

        // Set the content of the Anchor
        btnShareWhatsApp.add(buttonContent);

        // Configure the Anchor
        btnShareWhatsApp.getElement().setAttribute("target", "_blank"); // Öffnet in neuem Tab
        btnShareWhatsApp.addClassName("whatsapp-share-button"); // Für CSS-Styling

        VerticalLayout vlContent = new VerticalLayout();
        HorizontalLayout hlControls = new HorizontalLayout();
        if (btnDelete != null) {
            applyStyle(btnDelete, btnShare, btnDownload);
        } else {
            applyStyle(btnShare, btnDownload);
        }
        if (btnStarr != null) {
            applyStyle(btnStarr);
        }

        // Buttons in der richtigen Reihenfolge hinzufügen
        if (btnDelete != null) {
            hlControls.add(btnDelete);
        }

        hlControls.add(btnDownload, btnShare, btnShareWhatsApp);

        vlContent.add(component, hlControls);

        if (btnStarr != null) {
            hlControls.add(btnStarr);
        }
        card.add(vlContent);

        // Füge die Card der Ansicht hinzu
        add(card);
    }

    private void applyStyle(Button... buttons) {
        for (Button button : buttons) {
            button.getStyle().set("font-size", "24px");
            button.getStyle().set("width", "auto");
            button.getStyle().set("height", "auto");
        }
    }

    public ApiLog getRecipe() {
        return mApiLog;
    }
}