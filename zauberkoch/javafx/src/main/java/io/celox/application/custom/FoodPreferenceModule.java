package io.celox.application.custom;

import com.vaadin.flow.component.Key;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.TextField;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.LinkedHashSet;
import java.util.Set;

import io.celox.application.model.FoodPreference;
import io.celox.application.model.User;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import io.celox.application.utils.FunnyStringManip;
import io.celox.application.utils.SecurityUtils;

public class FoodPreferenceModule extends VerticalLayout {

    private User mUser;
    private final boolean mLiked;

    private final Set<FoodPreference> entries = new LinkedHashSet<>();
    private final TextField mTextField = new TextField();
    private final VerticalLayout listLayout = new VerticalLayout();

    public FoodPreferenceModule(boolean liked) {
        mLiked = liked;
        setSpacing(true);
        setPadding(true);

        try (Connection connection = DbUtils.getConnection()) {
            mUser = DbUtils.getUserByUsername(connection, SecurityUtils.getCurrentUsername());

            if (mUser == null) {
                Notification.show(FunnyStringManip.getError(),
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                return;
            }

            LinkedHashSet<FoodPreference> listModules = DbUtils.readFoodPreference(connection, mUser.getId(), liked);

            for (FoodPreference entry : listModules) {
                addListItemWithoutDb(entry.getName());
            }
        } catch (SQLException e) {
            Notification.show("Fehler beim Laden der Einstellungen: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            return;
        }

        mTextField.setPlaceholder(liked ? "🤤 Lecker…" : "🤢 Bahh…");
        mTextField.setWidthFull();

        VerticalLayout labelAndField = new VerticalLayout(mTextField);
        labelAndField.setSpacing(false);
        labelAndField.setPadding(false);
        labelAndField.setWidth("100%");

        Button btnAdd = new Button(VaadinIcon.PLUS.create());
        HorizontalLayout inputLayout = new HorizontalLayout(labelAndField, btnAdd);

        inputLayout.setWidthFull();
        inputLayout.setFlexGrow(1, labelAndField);
        add(inputLayout);

        Button btnClearAll = new Button("🗑️ Liste leeren");
        VerticalLayout listAndClearLayout = new VerticalLayout(btnClearAll, listLayout);
        listAndClearLayout.setSpacing(true);
        listAndClearLayout.setPadding(false);
        listLayout.setSpacing(false);
        listLayout.setPadding(false);
        add(listAndClearLayout);

        btnAdd.addClickListener(event -> {
            String userInput = mTextField.getValue();
            if (userInput == null || userInput.trim().isEmpty()) {
                Notification.show(FunnyStringManip.getNegative(),
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                return;
            }
            addListItem(userInput.trim());
            mTextField.clear();
        });

        mTextField.addKeyPressListener(Key.ENTER, event -> {
            String userInput = mTextField.getValue().trim();
            if (!userInput.isEmpty()) {
                addListItem(userInput);
                mTextField.clear();
            }
        });

        btnClearAll.addClickListener(event -> showConfirmClearDialog());
    }

    private void addListItemWithoutDb(String value) {
        boolean alreadyExists = entries.stream()
                .anyMatch(e -> e.getName().equalsIgnoreCase(value));
        if (alreadyExists) {
            return;
        }

        FoodPreference newEntry = new FoodPreference(value, mLiked);
        entries.add(newEntry);
        listLayout.add(createItemLayout(newEntry));
    }

    private void addListItem(String value) {
        boolean alreadyExists = entries.stream()
                .anyMatch(e -> e.getName().equalsIgnoreCase(value));
        if (alreadyExists) {
            Notification.show("Eintrag '" + value + "' existiert bereits!",
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            return;
        }

        FoodPreference newEntry = new FoodPreference(value, mLiked);
        entries.add(newEntry);
        listLayout.add(createItemLayout(newEntry));

        try (Connection connection = DbUtils.getConnection()) {
            DbUtils.updateFoodPreference(connection, mUser.getId(), mLiked, entries);
        } catch (SQLException e) {
            Notification.show("Fehler beim Speichern der Einstellung: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
        }
    }

    private HorizontalLayout createItemLayout(FoodPreference entry) {
        Span valueSpan = new Span(entry.getName());
        Button removeButton = new Button(VaadinIcon.MINUS.create());

        removeButton.addClickListener(buttonClickEvent -> {
            entries.remove(entry);
            if (removeButton.getParent().isPresent()) {
                listLayout.remove(removeButton.getParent().get());
            }

            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.deleteFoodPreference(connection, mUser.getId(), entry.getName(), mLiked);
            } catch (SQLException e) {
                Notification.show("Fehler beim Löschen der Einstellung: " + e.getMessage(),
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            }
        });

        HorizontalLayout itemLayout = new HorizontalLayout(valueSpan, removeButton);
        itemLayout.setWidthFull();
        itemLayout.setJustifyContentMode(JustifyContentMode.BETWEEN);
        return itemLayout;
    }

    private void showConfirmClearDialog() {
        Dialog confirmDialog = new Dialog();
        confirmDialog.setCloseOnOutsideClick(false);

        Div message = new Div(new Span("Gesamte Liste leeren?"));
        HorizontalLayout buttons = new HorizontalLayout(
                new Button("Ja, löschen", e -> {
                    clearList();
                    confirmDialog.close();

                    try (Connection connection = DbUtils.getConnection()) {
                        DbUtils.deleteAllFoodPreferences(connection, mUser.getId(), mLiked);
                        Notification.show(FunnyStringManip.getPositive(),
                                Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                    } catch (SQLException ex) {
                        Notification.show("Fehler beim Löschen aller Einstellungen: " + ex.getMessage(),
                                Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                    }
                }),
                new Button("Abbrechen", e -> confirmDialog.close())
        );

        confirmDialog.add(new VerticalLayout(message, buttons));
        confirmDialog.open();
    }

    private void clearList() {
        entries.clear();
        listLayout.removeAll();
    }

    public Set<FoodPreference> getEntries() {
        return entries;
    }
}