package io.celox.application.custom.playground;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.page.Page;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;
import java.util.logging.Logger;

import io.celox.application.views.MainLayout;
import jakarta.annotation.security.PermitAll;

@PermitAll
@Route(value = "playground-adv3", layout = MainLayout.class)
@PageTitle("Playground | Zauberkoch")
//@Push // Wichtig für asynchrone Updates
@JsModule("https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.9.6/lottie.min.js")
public class PlaygroundAdv3 extends VerticalLayout {
    private static final Logger LOGGER = Logger.getLogger(PlaygroundAdv3.class.getName());

    private final Button fetchDataButton = new Button("Daten abrufen");
    private final Div animationContainer = new Div();
    private final Div resultContainer = new Div();

    public PlaygroundAdv3() {
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
        LOGGER.info("API-Aufruf gestartet");

        // Lottie Animation starten
        ui.access(() -> {
            LOGGER.info("Starte Animation...");
            Page page = ui.getPage();
            page.executeJs("""
                        let anim = lottie.loadAnimation({
                            container: document.getElementById('lottie-animation'),
                            renderer: 'svg',
                            loop: true,
                            autoplay: true,
                            path: 'https://assets10.lottiefiles.com/packages/lf20_j1adxtyb.json'
                        });
                        document.getElementById('lottie-animation').style.display = 'block';
                    """);
        });

        // Asynchrone API-Anfrage mit `CompletableFuture`
        CompletableFuture.supplyAsync(() -> {
            try {
                LOGGER.info("Starte API-Request...");
                Thread.sleep(5000); // Simulierter API-Aufruf
                LOGGER.info("API-Request beendet");
                return List.of("Alice", "Bob", "Charlie");
            } catch (InterruptedException e) {
                LOGGER.log(Level.SEVERE, "Fehler beim API-Call", e);
                return List.of("Fehler: Keine Daten erhalten");
            }
        }).thenAccept(response -> {
            LOGGER.info("Callback aufgerufen. Aktualisiere UI...");

            // UI muss mit `ui.access()` aktualisiert werden
            ui.access(() -> {
                try {
                    resultContainer.removeAll();
                    response.forEach(name -> resultContainer.add(new Paragraph(name)));

                    // Animation ausblenden
                    LOGGER.info("Beende Animation...");
                    ui.getPage().executeJs("""
                                document.getElementById('lottie-animation').style.display = 'none';
                            """);

                    LOGGER.info("UI-Update abgeschlossen");
                } catch (Exception e) {
                    LOGGER.log(Level.SEVERE, "Fehler beim UI-Update", e);
                }
            });
        }).exceptionally(ex -> {
            LOGGER.log(Level.SEVERE, "Fehler in CompletableFuture", ex);
            return null;
        });
    }
}

