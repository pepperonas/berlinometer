package io.celox.application.dialogs;

import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;

import io.celox.application.custom.FoodPreferenceModule;
import io.celox.application.custom.pulse_effect.ButtonWithPulseEffect;
import io.celox.application.utils.Const;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class DialogFoodPreference {

    private Dialog mDialog;

    public DialogFoodPreference() {
        openDialog();
    }

    private void openDialog() {
        mDialog = new Dialog();
        HorizontalLayout hLayout = new HorizontalLayout();

        if (!Const.ONLY_DISLIKED_FOOD) {
            hLayout.add(new FoodPreferenceModule(true));
        }

        hLayout.add(new FoodPreferenceModule(false));

        H2 h2 = new H2("Deine Vorlieben");
        if (Const.ONLY_DISLIKED_FOOD) {
            h2 = new H2("Bitte ohne…");
        }
        mDialog.add(h2);
        Div div = new Div();
        div.setHeight("24px");
        ButtonWithPulseEffect btnClose = new ButtonWithPulseEffect("Schließen",
                buttonClickEvent -> mDialog.close());
        mDialog.add(div, hLayout, btnClose);
        mDialog.open();
    }
}