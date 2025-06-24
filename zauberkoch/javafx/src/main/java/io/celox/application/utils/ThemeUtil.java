package io.celox.application.utils;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.page.PendingJavaScriptResult;

public class ThemeUtil {

    public interface ThemeCallback {
        void onThemeLoaded(String theme);
    }

    public static void getThemeFromLocalStorage(ThemeCallback callback) {
        String jsCode = "return localStorage.getItem('app-theme') || 'light';";

        // JavaScript ausführen
        PendingJavaScriptResult result = UI.getCurrent().getPage().executeJs(jsCode);

        // Rückgabewert verarbeiten
        result.then(jsonValue -> {
            String theme = jsonValue.asString();
            callback.onThemeLoaded(theme);
        }, error -> {
            // Fehlerbehandlung: Fallback auf 'light'
            callback.onThemeLoaded("light");
        });
    }

    public static void applyThemeToDocument() {
        String applyThemeJs =
                "const theme = localStorage.getItem('app-theme');" +
                "if (theme === 'dark') {" +
                "    document.documentElement.setAttribute('theme', 'dark');" +
                "} else {" +
                "    document.documentElement.removeAttribute('theme');" +
                "}";

        UI.getCurrent().getPage().executeJs(applyThemeJs);
    }
}