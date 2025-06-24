package io.celox.application.custom.pulse_effect;

import com.vaadin.flow.component.checkbox.Checkbox;

/**
 * Eine erweiterte Checkbox mit magischem Pulseffekt
 */
public class CheckboxWithPulseEffect extends Checkbox {

    public CheckboxWithPulseEffect() {
        super();
        setupPulseEffect();
    }
    
    public CheckboxWithPulseEffect(String label) {
        super(label);
        setupPulseEffect();
    }
    
    public CheckboxWithPulseEffect(String label, boolean initialValue) {
        super(label, initialValue);
        setupPulseEffect();
    }
    
    public CheckboxWithPulseEffect(boolean initialValue) {
        super(initialValue);
        setupPulseEffect();
    }

    private void setupPulseEffect() {
        getElement().executeJs(
                // Event-Listener für Klicks hinzufügen
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
