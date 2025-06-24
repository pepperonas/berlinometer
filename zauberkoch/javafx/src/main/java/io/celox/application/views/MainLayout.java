package io.celox.application.views;

import com.vaadin.flow.component.DetachEvent;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.applayout.AppLayout;
import com.vaadin.flow.component.applayout.DrawerToggle;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dependency.CssImport;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.dom.Element;
import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.RouterLink;
import com.vaadin.flow.server.VaadinSession;
import com.vaadin.flow.server.WebBrowser;
import com.vaadin.flow.spring.annotation.SpringComponent;
import com.vaadin.flow.theme.lumo.LumoUtility;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.text.SimpleDateFormat;

import io.celox.application.dialogs.DialogShareQrCode;
import io.celox.application.model.User;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import io.celox.application.utils.GuiUtils;
import io.celox.application.utils.SecurityUtils;
import io.celox.application.utils.ThemeChangeEvent;
import io.celox.application.utils.ThemeEventBus;
import io.celox.application.utils.ThemeUtil;
import jakarta.annotation.security.PermitAll;

@SpringComponent
@Scope("prototype")
@PermitAll
@CssImport("./styles/main-view.css")
@PageTitle("Start | Zauberkoch")
public class MainLayout extends AppLayout implements BeforeEnterObserver {

    private static final Logger LOGGER = LoggerFactory.getLogger(MainLayout.class);

    private String mUsername;
    private final ThemeEventBus themeEventBus;

    @Autowired
    public MainLayout(ThemeEventBus themeEventBus) {
        this.themeEventBus = themeEventBus;

        // Benutzerinformationen abrufen
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            // Sicherheitsmaßnahme, falls nicht authentifiziert
            UI.getCurrent().navigate(LoginView.class);
            return;
        }

        SimpleDateFormat sdf = new SimpleDateFormat("dd.MM.yyyy HH:mm:ss");
        LOGGER.info(sdf.format(new java.util.Date(System.currentTimeMillis())) + " | Login: " + username);

        // Verarbeite den Benutzernamen für die Anzeige
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }
        mUsername = username;

        // Aktualisiere last_seen mit try-with-resources
        try (Connection connection = DbUtils.getConnection()) {
            // OAuth2-Benutzer verarbeiten
            if (SecurityUtils.getAuthenticationType().equals("OAUTH2")) {
                User user = SecurityUtils.getCurrentUser();
                if (user != null) {
                    DbUtils.updateLastSeen(connection, user.getUsername());
                    Notification.show("✌️Hallöchen",
                            Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                }
            } else {
                // Normaler Benutzer
                DbUtils.updateLastSeen(connection, username);
            }
        } catch (SQLException e) {
            LOGGER.error("Fehler beim Aktualisieren von last_seen", e);
        }

        createHeader();
        createDrawer();

        UI.getCurrent().getPage().executeJs(
                "const theme = localStorage.getItem('app-theme');" +
                "if (theme === 'dark') {" +
                "    document.documentElement.setAttribute('theme', 'dark');" +
                "} else {" +
                "    document.documentElement.removeAttribute('theme');" +
                "}"
        );
    }

    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        // Prüfen, ob der Benutzer eingeloggt ist
        if (!SecurityUtils.isLoggedIn()) {
            event.forwardTo(LoginView.class);
        }
    }

    private void createHeader() {
        H1 logo = new H1("Cheers 🍻 " + mUsername);
        logo.addClassName("no-padding-h1");
        logo.addClassNames(LumoUtility.FontSize.LARGE, LumoUtility.Margin.MEDIUM);

        Button btnToggleTheme = new Button(VaadinIcon.MOON.create(),
                event -> toggleTheme());

        WebBrowser browser = VaadinSession.getCurrent().getBrowser();

        Button btnLogout;

        if (GuiUtils.isMobileDevice()) {
            btnLogout = new Button(VaadinIcon.SIGN_OUT.create());
        } else {
            btnLogout = new Button("Ausloggen", VaadinIcon.SIGN_OUT.create());
        }
        btnLogout.getStyle().set("margin-left", "10px");
        btnLogout.addClickListener(e -> SecurityUtils.logout());

        var header = new HorizontalLayout(new DrawerToggle(), logo, btnToggleTheme, btnLogout);
        header.setSpacing(false);
        header.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.CENTER);
        header.expand(logo);
        header.setWidthFull();
        header.addClassNames(LumoUtility.Padding.Vertical.NONE, LumoUtility.Padding.Horizontal.MEDIUM);
        addToNavbar(header);
    }

    private void createDrawer() {
        VerticalLayout drawerContent = new VerticalLayout();
        drawerContent.setSpacing(true);
        drawerContent.setPadding(true);

        RouterLink link = new RouterLink("Essen", FoodView.class);
        link.getStyle().set("padding-top", "15px");
        drawerContent.add(link);

        SecurityUtils.Role role = SecurityUtils.getRole();

        link = new RouterLink("Cocktails", CocktailView.class);
        link.getStyle().set("padding-top", "5px");
        drawerContent.add(link);

        link = new RouterLink("Favoriten", FavoritesView.class);
        link.getStyle().set("padding-top", "5px");
        drawerContent.add(link);

        link = new RouterLink("Verlauf", HistoryView.class);
        link.getStyle().set("padding-top", "5px");
        drawerContent.add(link);

        link = new RouterLink("Premium", PremiumView.class);
        link.getStyle().set("padding-top", "5px");
        drawerContent.add(link);

        link = new RouterLink("Profil", ProfilView.class);
        link.getStyle().set("padding-top", "5px");
        drawerContent.add(link);

        Anchor shareLink = new Anchor("#", "Teilen - Link");
        shareLink.addClassName("custom-link");
        shareLink.getStyle().set("padding-top", "5px");
        Element linkElement = shareLink.getElement();
        // Füge einen ClickListener auf DOM-Ebene hinzu
        linkElement.addEventListener("click", event -> {
            try (Connection connection = DbUtils.getConnection()) {
                GuiUtils.generateReferralForClipboard(connection, UI.getCurrent(),
                        DbUtils.getUserByUsername(connection, mUsername));
                if (!GuiUtils.isMobileDevice()) {
                    Notification.show("✅ Link zum Teilen in Zwischenablage kopiert",
                            Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                }
            } catch (SQLException e) {
                LOGGER.error("Fehler beim Generieren des Referral-Links", e);
            }
        }).addEventData("event.preventDefault()"); // Verhindert Navigation
        drawerContent.add(shareLink);

        shareLink = new Anchor("#", "Teilen - QR-Code");
        shareLink.addClassName("custom-link");
        shareLink.getStyle().set("padding-top", "5px");
        linkElement = shareLink.getElement();
        // Füge einen ClickListener auf DOM-Ebene hinzu
        linkElement.addEventListener("click", event -> {
            try (Connection connection = DbUtils.getConnection()) {
                new DialogShareQrCode(UI.getCurrent(),
                        GuiUtils.generateReferral(connection, DbUtils.getUserByUsername(connection, mUsername)));
            } catch (SQLException e) {
                LOGGER.error("Fehler beim Generieren des QR-Codes", e);
            }
        }).addEventData("event.preventDefault()"); // Verhindert Navigation
        drawerContent.add(shareLink);

        // Admin-Bereich nur für Administratoren anzeigen
        if (role == SecurityUtils.Role.ADMIN) {
            link = new RouterLink("Admin", AdminView.class);
            link.getStyle().set("padding-top", "5px");
            drawerContent.add(link);
        }
        Anchor externalLink = new Anchor("https://zauberkoch.com", "Webseite");
        externalLink.getStyle().set("padding-top", "5px");
        externalLink.setTarget("_blank");
        externalLink.addClassName("custom-link");
        drawerContent.add(externalLink);

        addToDrawer(drawerContent);
    }

    private void toggleTheme() {
        UI.getCurrent().getPage().executeJs(
                "const currentTheme = localStorage.getItem('app-theme');" +
                "const newTheme = currentTheme === 'dark' ? 'light' : 'dark';" +
                "localStorage.setItem('app-theme', newTheme);" +
                "return newTheme;"
        ).then(theme -> {
            String newTheme = theme.asString();
            // Theme auf das Dokument anwenden
            ThemeUtil.applyThemeToDocument();
            // Theme-Änderung an alle Views broadcasten
            themeEventBus.post(new ThemeChangeEvent(newTheme));
        });
    }

    // Da wir keine dauerhaft gespeicherte Connection mehr haben, können wir onDetach entfernen
    // oder alternativ leer lassen
    @Override
    protected void onDetach(DetachEvent detachEvent) {
        super.onDetach(detachEvent);
        // Keine Connection mehr zu schließen
    }

    // Hilfsmethode zum URL-Encoding
    private String encodeUrl(String text) {
        try {
            return java.net.URLEncoder.encode(text, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return text;
        }
    }
}