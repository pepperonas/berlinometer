package io.celox.application.security;

import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;

import io.celox.application.utils.SecurityUtils;
import io.celox.application.views.LoginView;

/**
 * Prüft vor dem Betreten einer View, ob der Benutzer die Berechtigung hat
 */
public class AccessCheckBeforeEnterObserver implements BeforeEnterObserver {

    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        Class<?> targetViewClass = event.getNavigationTarget();

        // Prüfe, ob Zugriff erlaubt ist
        if (!SecurityUtils.isAccessGranted(targetViewClass)) {
            // Weiterleitung zur Login-Seite, wenn nicht eingeloggt
            event.forwardTo(LoginView.class);
        }
    }
}