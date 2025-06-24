package io.celox.application.custom.playground;

import com.vaadin.flow.component.Text;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.details.Details;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.radiobutton.RadioButtonGroup;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import io.celox.application.views.MainLayout;
import jakarta.annotation.security.PermitAll;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@PermitAll
@Route(value = "playground", layout = MainLayout.class)
@PageTitle("Playground | Zauberkoch")
public class Playground extends VerticalLayout {

    public Playground() {
        createExpandableComponents();
    }

    private void createExpandableComponents() {
        VerticalLayout layout = new VerticalLayout();

        // Radio Buttons erstellen
        RadioButtonGroup<String> radioGroup = new RadioButtonGroup<>();
        radioGroup.setLabel("Wähle eine Option:");
        radioGroup.setItems("Option 1", "Option 2", "Option 3");

        // Andere GUI-Komponente (z.B. Button)
        Button button = new Button("Bestätigen");
        Text infoLabel = new Text("Hier könnten weitere Infos stehen.");

        // Layout für die ausklappbaren Komponenten
        VerticalLayout detailsContent = new VerticalLayout(radioGroup, button, infoLabel);

        // `Details`-Komponente zum Einklappen
        Details details = new Details("Erweiterte Optionen", detailsContent);
        details.setOpened(false); // Standardmäßig eingeklappt

        // Alles zum Hauptlayout hinzufügen
        layout.add(details);
        add(layout);
    }

}

