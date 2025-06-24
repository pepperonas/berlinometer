package io.celox.application.custom.pulse_effect;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.ComponentEventListener;
import com.vaadin.flow.component.button.Button;

/**
 * Einfache Implementierung des Pulseffekts für einen Vaadin-Button
 */
public class ButtonWithPulseEffect extends Button {

    public ButtonWithPulseEffect(String text) {
        super(text);
        setupPulseEffect();
    }

    public ButtonWithPulseEffect(Component icon) {
        super(icon);
        setupPulseEffect();
    }

    public ButtonWithPulseEffect(String text, ComponentEventListener<ClickEvent<Button>> clickListener) {
        this.setText(text);
        this.addClickListener(clickListener);
    }

    private void setupPulseEffect() {
        getElement().executeJs(
                // Lese den JavaScript-Code als String
                "this.addEventListener('click', function(event) {" +
                "  const pulseEffect = document.createElement('div');" +
                "  pulseEffect.style.position = 'absolute';" +
                "  pulseEffect.style.left = event.clientX + 'px';" +
                "  pulseEffect.style.top = event.clientY + 'px';" +
                "  pulseEffect.style.width = '10px';" +
                "  pulseEffect.style.height = '10px';" +
                "  pulseEffect.style.borderRadius = '50%';" +
                "  pulseEffect.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';" +
                "  pulseEffect.style.boxShadow = '0 0 20px 10px rgba(255, 255, 255, 0.3)';" +
                "  pulseEffect.style.zIndex = '5';" +
                "  pulseEffect.style.transform = 'translate(-50%, -50%)';" +
                "  pulseEffect.style.pointerEvents = 'none';" +
                "  document.body.appendChild(pulseEffect);" +
                "  " +
                "  const animation = pulseEffect.animate([" +
                "    { transform: 'translate(-50%, -50%) scale(0)', opacity: 0.8 }," +
                "    { transform: 'translate(-50%, -50%) scale(8)', opacity: 0 }" +
                "  ], {" +
                "    duration: 800," +
                "    easing: 'ease-out'" +
                "  });" +
                "  " +
                "  animation.onfinish = function() {" +
                "    document.body.removeChild(pulseEffect);" +
                "  };" +
                "});"
        );
    }
}
