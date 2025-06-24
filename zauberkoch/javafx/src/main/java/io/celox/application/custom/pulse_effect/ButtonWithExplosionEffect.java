package io.celox.application.custom.pulse_effect;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.ComponentEventListener;
import com.vaadin.flow.component.button.Button;

/**
 * Einfache Implementierung des Pulseffekts für einen Vaadin-Button
 */
public class ButtonWithExplosionEffect extends Button {

    public ButtonWithExplosionEffect(String text) {
        super(text);
        setupExplosionEffect();
    }

    public ButtonWithExplosionEffect(Component icon) {
        super(icon);
        setupExplosionEffect();
    }

    public ButtonWithExplosionEffect(String text, ComponentEventListener<ClickEvent<Button>> clickListener) {
        this.setText(text);
        this.addClickListener(clickListener);
    }

    private void setupExplosionEffect() {
        // JavaScript-Code für die Sternen-Explosion
        String explosionScript =
                "this.addEventListener('click', function(event) {" +
                "  const clickX = event.clientX;" +
                "  const clickY = event.clientY;" +
                "  " +
                "  const STAR_COUNT = 20;" +
                "  const STAR_SPEED_MIN = 3;" +
                "  const STAR_SPEED_MAX = 7;" +
                "  const STAR_SIZE_MIN = 1;" +
                "  const STAR_SIZE_MAX = 4;" +
                "  " +
                "  for (let i = 0; i < STAR_COUNT; i++) {" +
                "    const star = document.createElement('div');" +
                "    star.style.position = 'absolute';" +
                "    star.style.backgroundColor = 'white';" +
                "    star.style.borderRadius = '50%';" +
                "    star.style.pointerEvents = 'none';" +
                "    " +
                "    const size = Math.random() * (STAR_SIZE_MAX - STAR_SIZE_MIN) + STAR_SIZE_MIN;" +
                "    star.style.width = size + 'px';" +
                "    star.style.height = size + 'px';" +
                "    " +
                "    star.style.left = clickX + 'px';" +
                "    star.style.top = clickY + 'px';" +
                "    " +
                "    const angle = Math.random() * Math.PI * 2;" +
                "    const speed = Math.random() * (STAR_SPEED_MAX - STAR_SPEED_MIN) + STAR_SPEED_MIN;" +
                "    const vx = Math.cos(angle) * speed;" +
                "    const vy = Math.sin(angle) * speed;" +
                "    " +
                "    const hue = Math.random() * 60 + 180; " +
                "    const saturation = Math.random() * 30 + 70;" +
                "    const lightness = Math.random() * 20 + 80;" +
                "    star.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;" +
                "    star.style.boxShadow = `0 0 ${size * 2}px ${size}px hsl(${hue}, ${saturation}%, ${lightness}%)`;" +
                "    " +
                "    document.body.appendChild(star);" +
                "    " +
                "    let posX = clickX;" +
                "    let posY = clickY;" +
                "    let opacity = 1;" +
                "    " +
                "    const animate = () => {" +
                "      posX += vx;" +
                "      posY += vy;" +
                "      opacity -= 0.01;" +
                "      " +
                "      star.style.left = posX + 'px';" +
                "      star.style.top = posY + 'px';" +
                "      star.style.opacity = opacity;" +
                "      " +
                "      if (opacity > 0 && " +
                "          posX > -50 && posX < window.innerWidth + 50 && " +
                "          posY > -50 && posY < window.innerHeight + 50) {" +
                "        requestAnimationFrame(animate);" +
                "      } else {" +
                "        document.body.removeChild(star);" +
                "      }" +
                "    };" +
                "    " +
                "    requestAnimationFrame(animate);" +
                "  }" +
                "});";

        // JavaScript-Code ausführen, um den Event-Listener zum Button hinzuzufügen
        getElement().executeJs(explosionScript);
    }
}
