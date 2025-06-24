package io.celox.application.custom.pulse_effect;

import com.vaadin.flow.component.radiobutton.RadioButtonGroup;

import java.util.Collection;

/**
 * Eine erweiterte RadioButtonGroup mit magischem Pulseffekt
 *
 * @param <T> Der Typ der Elemente in der RadioButtonGroup
 */
public class RadioButtonGroupWithPulseEffect<T> extends RadioButtonGroup<T> {

    public RadioButtonGroupWithPulseEffect() {
        super();
        setupPulseEffect();
    }

    public RadioButtonGroupWithPulseEffect(String label) {
        super(label);
        setupPulseEffect();
    }

    public RadioButtonGroupWithPulseEffect(String label, Collection<T> items) {
        super(label, items);
        setupPulseEffect();
    }

    public RadioButtonGroupWithPulseEffect(Collection<T> items) {
        super(items.toString());
        setupPulseEffect();
    }

    private void setupPulseEffect() {
        // Warten bis die Komponente vollständig im DOM ist und dann den Event-Listener hinzufügen
        getElement().executeJs(
                // Ein kleiner Timeout, um sicherzustellen, dass die Komponente gerendert wurde
                "setTimeout(() => {" +
                "  this.addEventListener('click', function(event) {" +
                "    const target = event.target;" +
                "    if (target.tagName === 'INPUT' || target.tagName === 'LABEL' || " +
                "        target.closest('vaadin-radio-button')) {" +
                "      const pulseEffect = document.createElement('div');" +
                "      pulseEffect.style.position = 'absolute';" +
                "      pulseEffect.style.left = event.clientX + 'px';" +
                "      pulseEffect.style.top = event.clientY + 'px';" +
                "      pulseEffect.style.width = '10px';" +
                "      pulseEffect.style.height = '10px';" +
                "      pulseEffect.style.borderRadius = '50%';" +
                "      pulseEffect.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';" +
                "      pulseEffect.style.boxShadow = '0 0 20px 10px rgba(255, 255, 255, 0.3)';" +
                "      pulseEffect.style.zIndex = '5';" +
                "      pulseEffect.style.transform = 'translate(-50%, -50%)';" +
                "      pulseEffect.style.pointerEvents = 'none';" +
                "      document.body.appendChild(pulseEffect);" +
                "      " +
                "      const animation = pulseEffect.animate([" +
                "        { transform: 'translate(-50%, -50%) scale(0)', opacity: 0.8 }," +
                "        { transform: 'translate(-50%, -50%) scale(8)', opacity: 0 }" +
                "      ], {" +
                "        duration: 800," +
                "        easing: 'ease-out'" +
                "      });" +
                "      " +
                "      animation.onfinish = function() {" +
                "        document.body.removeChild(pulseEffect);" +
                "      };" +
                "    }" +
                "  });" +
                "}, 100);"
        );
    }
}
