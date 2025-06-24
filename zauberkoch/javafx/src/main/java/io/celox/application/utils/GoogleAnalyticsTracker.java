package io.celox.application.utils;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.page.Page;
import com.vaadin.flow.server.VaadinService;
import com.vaadin.flow.server.VaadinServletRequest;

/**
 * Google Analytics Manager für Vaadin 24
 * Diese Klasse kümmert sich um die Integration und Ereignisverfolgung mit Google Analytics
 */
public class GoogleAnalyticsTracker {

    // Ihre Google Analytics Measurement ID eintragen
    private static final String GA_MEASUREMENT_ID = "G-H0K2KT8EKX";

    /**
     * Initialisiert Google Analytics für die aktuelle UI
     */
    public static void initialize() {
        UI currentUI = UI.getCurrent();
        if (currentUI != null) {
            Page page = currentUI.getPage();

            // Google Analytics 4 Skript einfügen
            page.executeJs("(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':" +
                           "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0]," +
                           "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=" +
                           "'https://www.googletagmanager.com/gtag/js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
                           "})(window,document,'script','dataLayer','" + GA_MEASUREMENT_ID + "');" +
                           "window.dataLayer = window.dataLayer || [];" +
                           "function gtag(){dataLayer.push(arguments);}" +
                           "gtag('js', new Date());" +
                           "gtag('config', '" + GA_MEASUREMENT_ID + "');");

            // Seitenwechsel-Listener für SPA-Navigation hinzufügen
            setupNavigationTracking(currentUI);
        }
    }

    /**
     * Richtet Tracking für Routenwechsel in der Single-Page-Application ein
     */
    private static void setupNavigationTracking(UI ui) {
        ui.addAfterNavigationListener(event -> {
            String newPath = getCurrentPath();
            trackPageView(newPath);
        });
    }

    /**
     * Erfasst einen Seitenaufruf in Google Analytics
     */
    public static void trackPageView(String path) {
        UI currentUI = UI.getCurrent();
        if (currentUI != null) {
            currentUI.getPage().executeJs("gtag('config', $0, { 'page_path': $1 });",
                    GA_MEASUREMENT_ID, path);
        }
    }

    /**
     * Erfasst ein benutzerdefiniertes Ereignis in Google Analytics
     */
    public static void trackEvent(String eventName, String eventCategory, String eventAction, String eventLabel) {
        UI currentUI = UI.getCurrent();
        if (currentUI != null) {
            currentUI.getPage().executeJs("gtag('event', $0, {'event_category': $1, 'event_action': $2, 'event_label': $3});",
                    eventName, eventCategory, eventAction, eventLabel);
        }
    }

    /**
     * Ermittelt den aktuellen Pfad
     */
    private static String getCurrentPath() {
        VaadinServletRequest request = (VaadinServletRequest) VaadinService.getCurrentRequest();
        if (request != null) {
            return request.getPathInfo();
        }
        return "";
    }
}
