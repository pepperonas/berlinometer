package io.celox.application.views;

import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.datepicker.DatePicker;
import com.vaadin.flow.component.datepicker.DatePicker.DatePickerI18n;
import com.vaadin.flow.component.formlayout.FormLayout;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.radiobutton.RadioButtonGroup;
import com.vaadin.flow.component.textfield.EmailField;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.data.binder.Binder;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import io.celox.application.custom.pulse_effect.ButtonWithPulseEffect;
import io.celox.application.custom.pulse_effect.CheckboxWithPulseEffect;
import io.celox.application.model.User;
import io.celox.application.model.UserSetting;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import io.celox.application.utils.FunnyStringManip;
import io.celox.application.utils.SecurityUtils;
import jakarta.annotation.security.PermitAll;

@PermitAll
@Route(value = "profile", layout = MainLayout.class)
@PageTitle("Profil | Zauberkoch")
public class ProfilView extends VerticalLayout {

    private final Binder<User> binder = new Binder<>(User.class);

    public ProfilView() {
        UI.getCurrent().setLocale(Locale.GERMANY);

        checkPwaStatus();
        registerInstallPrompt();

        H1 heading = new H1("⚙️ Profil");
        add(heading);

        User user;
        UserSetting userSettings;

        try (Connection connection = DbUtils.getConnection()) {
            user = DbUtils.getUserByUsername(connection, SecurityUtils.getCurrentUsername());

            if (user == null) {
                Notification.show(FunnyStringManip.getError(),
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                return;
            }

            userSettings = DbUtils.loadUserSettings(connection, user.getId());
        } catch (SQLException e) {
            Notification.show("Fehler beim Laden des Benutzerprofils: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            return;
        }

        binder.setBean(user);

        DatePicker birthDateField = new DatePicker("Geburtsdatum");
        birthDateField.setLocale(Locale.GERMANY);
        birthDateField.setI18n(new DatePickerI18n()
                .setMonthNames(List.of("Januar", "Februar", "März", "April", "Mai", "Juni",
                        "Juli", "August", "September", "Oktober", "November", "Dezember"))
                .setWeekdays(List.of("Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"))
                .setWeekdaysShort(List.of("So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"))
                .setFirstDayOfWeek(1)
                .setToday("Heute")
                .setCancel("Abbrechen"));

        binder.forField(birthDateField)
                .asRequired("Bitte das Geburtsdatum angeben")
                .withValidator(date -> date.isBefore(LocalDate.now()),
                        "Das Geburtsdatum muss in der Vergangenheit liegen")
                .bind(User::getBirthDateLocalDate, User::setBirthDateLocalDate);

        ComboBox<String> genderBox = new ComboBox<>("Geschlecht");
        genderBox.setItems("Männlich", "Weiblich", "Divers");
        genderBox.setPlaceholder("Bitte wählen...");

        TextField firstNameField = new TextField("Name");
        binder.forField(firstNameField).asRequired("Bitte den Namen eingeben").bind(User::getFirstName, User::setFirstName);

        TextField lastNameField = new TextField("Nachname");
        binder.forField(lastNameField).asRequired("Bitte den Nachnamen eingeben").bind(User::getLastName, User::setLastName);

        TextField userNameField = new TextField("Benutzername");
        binder.forField(userNameField).asRequired("Bitte den Benutzernamen eingeben").bindReadOnly(User::getUsername);

        EmailField emailField = new EmailField("E-Mail");
        binder.forField(emailField).asRequired("Bitte eine gültige E-Mail angeben").withValidator(
                email -> email.contains("@"), "Keine gültige E-Mail-Adresse").bindReadOnly(User::getEmail);

        binder.forField(genderBox).asRequired("Bitte Geschlecht auswählen").bind(User::getGender, User::setGender);

        ButtonWithPulseEffect saveButton = new ButtonWithPulseEffect("Speichern");
        saveButton.addClickListener(event -> {
            if (binder.writeBeanIfValid(user)) {
                try (Connection connection = DbUtils.getConnection()) {
                    DbUtils.updateUser(connection, user);
                    Notification.show(FunnyStringManip.getPositive(), 3000, Notification.Position.BOTTOM_CENTER);
                } catch (SQLException e) {
                    Notification.show("Fehler beim Speichern des Profils: " + e.getMessage(),
                            Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                }
            } else {
                Notification.show(FunnyStringManip.getNegative(), 3000, Notification.Position.BOTTOM_CENTER);
            }
        });

        FormLayout formLayout = new FormLayout();
        formLayout.setResponsiveSteps(
                new FormLayout.ResponsiveStep("0px", 1), // 1 Spalte für kleine Bildschirme
                new FormLayout.ResponsiveStep("600px", 2) // 2 Spalten für größere Bildschirme
        );
        formLayout.add(userNameField, emailField, firstNameField, lastNameField, birthDateField, genderBox);

        RadioButtonGroup<String> rgApi = new RadioButtonGroup<>();
        rgApi.setItems("ChatGPT", "Grok");
        rgApi.addValueChangeListener(event -> {
            try (Connection connection = DbUtils.getConnection()) {
                switch (event.getValue()) {
                    case "ChatGPT":
                        DbUtils.updateUserSettings(connection, user.getId(), Const.RADIO_GROUP_API, Const.RADIO_GROUP_API_CHAT_GPT);
                        break;
                    case "Grok":
                        DbUtils.updateUserSettings(connection, user.getId(), Const.RADIO_GROUP_API, Const.RADIO_GROUP_API_GROK);
                        break;
                }
            } catch (SQLException e) {
                Notification.show("Fehler beim Speichern der API-Einstellung: " + e.getMessage(),
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            }
        });

        String api = userSettings.getRgApi();
        if (api.equals(Const.RADIO_GROUP_API_CHAT_GPT)) {
            rgApi.setValue("ChatGPT");
        } else if (api.equals(Const.RADIO_GROUP_API_GROK)) {
            rgApi.setValue("Grok");
        }
        rgApi.setVisible(user.isAdmin());

        CheckboxWithPulseEffect cbxReduceAnimations = new CheckboxWithPulseEffect("Weniger Animationen");
        cbxReduceAnimations.addValueChangeListener(event -> {
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection, user.getId(), Const.CBX_REDUCE_ANIMATIONS, event.getValue() ? 1 : 0);
            } catch (SQLException e) {
                Notification.show("Fehler beim Speichern der Animations-Einstellung: " + e.getMessage(),
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            }
        });
        cbxReduceAnimations.setValue(userSettings.isReduceAnimations());

        add(heading, formLayout, rgApi, saveButton, /*btnInstall,*/ cbxReduceAnimations);
    }

    private void checkPwaStatus() {
        UI.getCurrent().getPage().executeJs(
                "return new Promise((resolve) => {" +
                "  let status = {" +
                "    serviceWorker: 'serviceWorker' in navigator," +
                "    isRegistered: false," +
                "    hasInstallPrompt: window.deferredInstallPrompt != null," +
                "    isStandalone: window.matchMedia('(display-mode: standalone)').matches" +
                "  };" +
                "  if ('serviceWorker' in navigator) {" +
                "    navigator.serviceWorker.getRegistration().then(reg => {" +
                "      status.isRegistered = !!reg;" +
                "      if (reg) {" +
                "        console.log('Service Worker ist registriert:', reg);" +
                "      } else {" +
                "        console.log('Kein Service Worker registriert');" +
                "      }" +
                "      resolve(status);" +
                "    }).catch(err => {" +
                "      console.error('Fehler bei SW-Registrierung:', err);" +
                "      resolve(status);" +
                "    });" +
                "  } else {" +
                "    resolve(status);" +
                "  }" +
                "});"
        ).then(jsonValue -> {
            System.out.println("PWA Status: " + jsonValue.toJson());
        });
    }

    @ClientCallable
    private void _installAccepted() {
        Notification.show("App wurde erfolgreich installiert!",
                3000, Notification.Position.BOTTOM_CENTER);
    }

    @ClientCallable
    private void _installRejected() {
        Notification.show("Installation abgebrochen",
                3000, Notification.Position.BOTTOM_CENTER);
    }

    private void registerInstallPrompt() {
        UI.getCurrent().getPage().executeJs(
                "console.log('PWA Debug: Start registration');" +
                "window.deferredInstallPrompt = null;" +
                "console.log('PWA Debug: Browser:', navigator.userAgent);" +
                "if ('serviceWorker' in navigator) {" +
                "  console.log('PWA Debug: ServiceWorker API unterstützt');" +
                "  navigator.serviceWorker.getRegistration().then(reg => {" +
                "    console.log('PWA Debug: Service Worker:', reg ? 'registriert' : 'nicht registriert');" +
                "  });" +
                "} else {" +
                "  console.log('PWA Debug: ServiceWorker API NICHT unterstützt');" +
                "}" +
                "const manifestLink = document.querySelector('link[rel=\"manifest\"]');" +
                "console.log('PWA Debug: Manifest-Link:', manifestLink ? `gefunden (${manifestLink.href})` : 'nicht gefunden');" +
                "console.log('PWA Debug: Display Mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');" +
                "window.addEventListener('beforeinstallprompt', function(e) {" +
                "  e.preventDefault();" +
                "  console.log('PWA Debug: beforeinstallprompt-Event abgefangen');" +
                "  window.deferredInstallPrompt = e;" +
                "  console.log('PWA Debug: Install prompt details:', JSON.stringify(e));" +
                "});" +
                "window.addEventListener('appinstalled', function(e) {" +
                "  console.log('PWA Debug: App wurde installiert');" +
                "});"
        );
    }
}