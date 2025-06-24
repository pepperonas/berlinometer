package io.celox.application;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.component.page.Meta;
import com.vaadin.flow.component.page.Push;
import com.vaadin.flow.server.AppShellSettings;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.server.ServiceInitEvent;
import com.vaadin.flow.server.VaadinServiceInitListener;
import com.vaadin.flow.shared.communication.PushMode;
import com.vaadin.flow.theme.Theme;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.actuate.autoconfigure.security.servlet.ManagementWebSecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration;
import org.springframework.boot.autoconfigure.security.reactive.ReactiveSecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.event.EventListener;

import io.celox.application.utils.GoogleAnalyticsTracker;

/**
 * Die Hauptklasse der Anwendung.
 */
@SpringBootApplication(
        scanBasePackages = "io.celox.application",
        exclude = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                OAuth2ClientAutoConfiguration.class,
                ReactiveSecurityAutoConfiguration.class,
                UserDetailsServiceAutoConfiguration.class,
                ManagementWebSecurityAutoConfiguration.class
        }
)
@Theme(value = "driver")
@Push(PushMode.AUTOMATIC)
@PWA(name = "Zauberkoch",
        startPath = "/",
        iconPath = "icons/icon.png",
        themeColor = "#E91E63",
        backgroundColor = "#FFFFFF",
        description = "Dein KI Gourmet",
        shortName = "Zauberkoch",
        manifestPath = "manifest.json",
        offlinePath = "offline.html",
        offlineResources = {"images/offline.png"})

@Meta(name = "author", content = "Martin Pfeffer")
public class Application extends SpringBootServletInitializer implements AppShellConfigurator, VaadinServiceInitListener {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        System.out.println("Anwendung gestartet.");
    }

    @Override
    public void configurePage(AppShellSettings settings) {
        settings.addFavIcon("icon", "icons/icon.png", "192x192");

        // Service Worker registrieren mittels Script-Tag
        String swRegistration =
                "<script>" +
                "if ('serviceWorker' in navigator) {" +
                "  window.addEventListener('load', function() {" +
                "    navigator.serviceWorker.register('/sw.js')" +
                "      .then(registration => console.log('Service Worker registriert:', registration))" +
                "      .catch(error => console.error('Service Worker Registrierung fehlgeschlagen:', error));" +
                "  });" +
                "}" +
                "</script>";

        settings.addMetaTag("head-content", swRegistration);
    }

    @Override
    public void serviceInit(ServiceInitEvent event) {
        // Google Analytics für jede neue UI-Instanz initialisieren
        event.getSource().addUIInitListener(uiEvent -> {
            GoogleAnalyticsTracker.initialize();
        });
    }

}