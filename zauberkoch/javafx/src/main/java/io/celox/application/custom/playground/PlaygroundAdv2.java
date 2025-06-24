package io.celox.application.custom.playground;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import io.celox.application.views.MainLayout;
import jakarta.annotation.security.PermitAll;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@PermitAll
@Route(value = "playground-adv2", layout = MainLayout.class)
@PageTitle("Playground | Zauberkoch")
public class PlaygroundAdv2 extends VerticalLayout {

    private final Button fetchDataButton = new Button("Daten abrufen");
    private final Div animationContainer = new Div();
    private final Div resultContainer = new Div(); // Container für API-Ergebnis

    public PlaygroundAdv2() {
        UI.getCurrent().getPage().addJsModule("https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.9.6/lottie.min.js");

        // Animation Container
        animationContainer.setId("lottie-animation");
        animationContainer.getStyle()
                .set("width", "150px")
                .set("height", "150px")
                .set("margin", "auto")
                .set("display", "none"); // Anfangs verstecken

        // Ergebnis-Container (API-Response)
        resultContainer.getStyle()
                .set("margin-top", "20px")
                .set("font-size", "18px")
                .set("font-weight", "bold");

        fetchDataButton.addClickListener(e -> fetchData());

        add(fetchDataButton, animationContainer, resultContainer);
    }

    private void fetchData() {
        UI ui = UI.getCurrent(); // Referenz zum UI-Thread speichern

        // Animation starten
        ui.access(() -> ui.getPage().executeJs("""
                    let anim = lottie.loadAnimation({
                        container: document.getElementById('lottie-animation'),
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        path: 'https://assets10.lottiefiles.com/packages/lf20_j1adxtyb.json'
                    });
                    document.getElementById('lottie-animation').style.display = 'block';
                """));

        // API-Aufruf asynchron ausführen
        CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(5000); // Simulierter API-Call
                return List.of("Alice", "Bob", "Charlie"); // Fake-Daten
            } catch (InterruptedException e) {
                return List.of("Fehler: Keine Daten erhalten");
            }
        }).thenAccept(response -> {
            // UI-Aktualisierung NUR im UI-Thread durchführen
            ui.access(() -> {
                resultContainer.removeAll();
                response.forEach(name -> resultContainer.add(new Paragraph(name)));

                // Animation ausblenden
                ui.getPage().executeJs("""
                            document.getElementById('lottie-animation').style.display = 'none';
                        """);
            });
        });
    }
}

