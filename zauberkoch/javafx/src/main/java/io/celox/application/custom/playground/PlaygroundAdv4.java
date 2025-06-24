package io.celox.application.custom.playground;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

import io.celox.application.views.MainLayout;
import jakarta.annotation.security.PermitAll;

@PermitAll
@Route(value = "playground-adv4", layout = MainLayout.class)
@PageTitle("Playground | Zauberkoch")
@JsModule("https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.9.6/lottie.min.js")
public class PlaygroundAdv4 extends VerticalLayout {
    private static final Logger LOGGER = Logger.getLogger(PlaygroundAdv4.class.getName());

    private final Button fetchDataButton = new Button("Daten abrufen");
    private final Div animationContainer = new Div();
    private final Div resultContainer = new Div();

    public PlaygroundAdv4() {
        animationContainer.setId("lottie-animation");
        animationContainer.getStyle()
                .set("width", "150px")
                .set("height", "150px")
                .set("margin", "auto")
                .set("display", "none");

        resultContainer.getStyle()
                .set("margin-top", "20px")
                .set("font-size", "18px")
                .set("font-weight", "bold");

        fetchDataButton.addClickListener(e -> fetchData());

        add(fetchDataButton, animationContainer, resultContainer);
    }

    private void fetchData() {
        UI ui = UI.getCurrent(); // UI-Referenz sichern
        if (ui == null) {
            LOGGER.severe("UI.getCurrent() ist null! Abbruch.");
            return;
        }

        // SecurityContext sichern (damit Spring Security die Authentifizierung behält)
        SecurityContext context = SecurityContextHolder.getContext();

        // 1️⃣ **Sofortiges UI-Update für Sicherheit**
        ui.accessSynchronously(() -> {
            LOGGER.info("TEST 1: UI-Thread läuft!");
            resultContainer.removeAll();
            resultContainer.add(new Paragraph("TEST 2: UI-Update gestartet!"));
            resultContainer.getStyle().set("display", "block");
            resultContainer.getStyle().set("background", "yellow");
            resultContainer.getStyle().set("border", "3px solid red");

            // UI sofort zum Neuladen zwingen
            resultContainer.getElement().executeJs("this.requestUpdate();");
        });

        // 2️⃣ **Asynchroner API-Call mit SecurityContext**
        Executors.newSingleThreadScheduledExecutor().schedule(() -> {
            // SecurityContext in neuem Thread setzen
            SecurityContextHolder.setContext(context);
            LOGGER.info("SECURITY TEST: Aktueller User = " + context.getAuthentication());
            LOGGER.info("SECURITY TEST: Rollen = " + context.getAuthentication().getAuthorities());

            LOGGER.info("TEST 3: Simulierter API-Call beendet!");
            ui.getSession().lock();
            try {
                ui.accessSynchronously(() -> {
                    LOGGER.info("TEST 4: UI-Update nach API-Call!");

                    // **Mini-UI-Update zuerst (um Vaadin zu "wecken")**
                    resultContainer.add(new Paragraph("Loading abgeschlossen..."));

                    // **Haupt-UI-Update**
                    resultContainer.removeAll();
                    resultContainer.add(new Paragraph("TEST 5: Daten geladen!"));

                    // Animation entfernen
                    ui.getPage().executeJs("""
                                document.getElementById('lottie-animation').style.display = 'none';
                            """);

                    // **Garantiertes UI-Update**
                    resultContainer.getElement().executeJs("this.requestUpdate();");

                    LOGGER.info("TEST 6: UI-Update abgeschlossen!");
                });
            } finally {
                ui.getSession().unlock();
            }
        }, 5, TimeUnit.SECONDS);
    }

}
