package io.celox.application.utils;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.server.VaadinSession;
import com.vaadin.flow.server.WebBrowser;

import org.apache.commons.lang3.RandomStringUtils;

import java.sql.Connection;

import io.celox.application.model.User;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class GuiUtils {

    public static boolean isMobileDevice() {
        WebBrowser browser = VaadinSession.getCurrent().getBrowser();
        if (browser.isAndroid() || browser.isIPhone() || browser.isWindowsPhone()) {
            return true;
        } else {
            return false;
        }
    }

    public static void generateReferralForClipboard(Connection connection, UI ui, User user) {
        String referralCode = generateReferralCode(user);
        String referralLink = DbUtils.generateReferral(connection, user.getId(), referralCode);
        String js = "navigator.clipboard.writeText('" + referralLink + "').then(() => {"
                    + "    console.log('Erfolgreich kopiert');"
                    + "}).catch(err => {"
                    + "    console.error('Fehler beim Kopieren', err);"
                    + "});";
        ui.getUI().ifPresent(_ui -> _ui.getPage().executeJs(js));
    }

    public static String generateReferral(Connection connection, User user) {
        String referralCode = generateReferralCode(user);
        return DbUtils.generateReferral(connection, user.getId(), referralCode);
    }

    private static String generateReferralCode(User user) {
        String pre = RandomStringUtils.randomAlphanumeric(3);
        String post = RandomStringUtils.randomAlphanumeric(3);
        return pre + "-" + LeetConverterReferral.toLeetSpeak(
                user.getUsername().toLowerCase()) + "-" + post;
    }

    // Hilfsmethode zum URL-Encoding
    public static String encodeUrl(String text) {
        try {
            return java.net.URLEncoder.encode(text, "UTF-8");
        } catch (Exception e) {
            return text;
        }
    }

}
