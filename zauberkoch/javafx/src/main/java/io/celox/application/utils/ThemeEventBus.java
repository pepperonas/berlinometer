package io.celox.application.utils;

import com.vaadin.flow.shared.Registration;
import com.vaadin.flow.spring.annotation.SpringComponent;
import com.vaadin.flow.spring.annotation.VaadinSessionScope;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@SpringComponent
@VaadinSessionScope
public class ThemeEventBus {

    private final Executor executor = Executors.newSingleThreadExecutor();
    private final java.util.List<Consumer<ThemeChangeEvent>> listeners = new java.util.ArrayList<>();

    public Registration addThemeChangeListener(Consumer<ThemeChangeEvent> listener) {
        listeners.add(listener);
        return () -> listeners.remove(listener);
    }

    public void post(ThemeChangeEvent event) {
        listeners.forEach(listener -> executor.execute(() -> listener.accept(event)));
    }
}
