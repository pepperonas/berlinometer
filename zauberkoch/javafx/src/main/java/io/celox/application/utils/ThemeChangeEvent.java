package io.celox.application.utils;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class ThemeChangeEvent {

    private final String theme;

    public ThemeChangeEvent(String theme) {
        this.theme = theme;
    }

    public String getTheme() {
        return theme;
    }
}
