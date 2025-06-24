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
@Route(value = "playground-adv", layout = MainLayout.class)
@PageTitle("Playground | Zauberkoch")
public class PlaygroundAdv extends VerticalLayout {

    private final Button fetchDataButton = new Button("Daten abrufen");
    private final Div animationContainer = new Div();
    private final Div resultContainer = new Div(); // Container für API-Ergebnis

    public PlaygroundAdv() {
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
        // Lottie Animation starten (JS ausführen)
        UI.getCurrent().getPage().executeJs("""
                    let anim = lottie.loadAnimation({
                        container: document.getElementById('lottie-animation'),
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        path: 'https://assets10.lottiefiles.com/packages/lf20_j1adxtyb.json'
                    });
                    document.getElementById('lottie-animation').style.display = 'block';
                """);

        // API Call asynchron ausführen
        CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(5000); // Simuliert API-Request (hier kann echte API-Logik rein)
                return List.of("Alice", "Bob", "Charlie"); // Simulierte API-Antwort
            } catch (InterruptedException e) {
                return List.of("Fehler: Keine Daten erhalten");
            }
        }).thenAccept(response -> {
            getUI().ifPresent(ui -> ui.access(() -> {
                // API-Antwort anzeigen
                resultContainer.removeAll();
                response.forEach(name -> resultContainer.add(new Paragraph(name)));

                // Lottie-Animation ausblenden
                UI.getCurrent().getPage().executeJs("""
                            document.getElementById('lottie-animation').style.display = 'none';
                        """);
            }));
        });
    }
}

