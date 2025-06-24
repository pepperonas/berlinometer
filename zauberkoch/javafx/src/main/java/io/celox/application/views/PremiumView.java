package io.celox.application.views;

import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.Text;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.Date;

import io.celox.application.api.PayPalSubscriptionInfo;
import io.celox.application.model.User;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import io.celox.application.utils.FunnyStringManip;
import io.celox.application.utils.GuiUtils;
import io.celox.application.utils.SecurityUtils;
import jakarta.annotation.security.PermitAll;

@PermitAll
@Route(value = "premium", layout = MainLayout.class)
@PageTitle("Premium | Zauberkoch")
public class PremiumView extends VerticalLayout {

    private static final Logger LOGGER = LoggerFactory.getLogger(PremiumView.class);

    // Preisangaben als Konstanten
    private static final String INTRO_PRICE = "2,49€";
    private static final String REGULAR_PRICE = "4,99€";

    private User mUser;
    private PayPalSubscriptionInfo mPaypalSubscriptionInfo;
    private boolean mPremiumActive; // Neues Feld für den Premium-Status

    public PremiumView() {
        setSpacing(true);
        setPadding(true);
        setWidthFull();

        addMetaTags();

        add(new H1("💎️ Premium"));

        try (Connection connection = DbUtils.getConnection()) {
            mUser = DbUtils.getUserByUsernameForPremiumView(
                    connection, SecurityUtils.getCurrentUsername());
            if (mUser == null) {
                Notification.show(FunnyStringManip.getError(),
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                return;
            }

            LOGGER.info("User: " + mUser.toString());

            mPaypalSubscriptionInfo = new PayPalSubscriptionInfo();

            // Synchronisiere premiumExpiration mit PayPal
            DbUtils.syncPremiumExpiration(connection, mUser);
            // Aktualisiere mUser nach der Synchronisierung
            mUser = DbUtils.getUserByUsername(connection, mUser.getUsername());
            // Prüfe den Premium-Status
            mPremiumActive = DbUtils.checkPremiumState(connection, mUser.getUsername());
            LOGGER.info("Premium-Status für {}: {}", mUser.getUsername(), mPremiumActive);

            // Aufbau der UI-Bereiche
            VerticalLayout premiumStatusLayout = createPremiumStatusSection();
            VerticalLayout benefitsLayout = createBenefitsSection();
            VerticalLayout introOfferLayout = createIntroOfferSection();
            H2 h2Buy = new H2("Kaufen");
            Div paypalContainer = createPaypalSection();
            VerticalLayout paypalSection = new VerticalLayout();
            paypalSection.setSpacing(true);
            paypalSection.add(h2Buy, paypalContainer);
            VerticalLayout bonusLayout = createBonusSection(connection);

            // Hauptlayout zusammenfügen
            VerticalLayout mainLayout = new VerticalLayout();
            mainLayout.setSpacing(true);
            mainLayout.setPadding(true);
            mainLayout.add(premiumStatusLayout, benefitsLayout, introOfferLayout, paypalSection, bonusLayout);
            add(mainLayout);
        } catch (SQLException e) {
            Notification.show("Fehler beim Herstellen der Datenbankverbindung: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            LOGGER.warn("Database connection error", e);
        }
    }

    /**
     * Erstellt den Abschnitt zum Premium-Status.
     */
    private VerticalLayout createPremiumStatusSection() {
        VerticalLayout layout = new VerticalLayout();
        layout.setSpacing(false);
        layout.setPadding(false);
        layout.setMargin(false);

        H2 header = new H2("Status");
        layout.add(header);

        SimpleDateFormat sdf = new SimpleDateFormat("dd.MM.yyyy");

        // Status basierend auf mPremiumActive anzeigen
        Paragraph statusParagraph = new Paragraph();
        if (mPremiumActive) {
            Date displayDate = mUser.getPremiumExpiration();
            if (displayDate == null || displayDate.before(new Date())) {
                // Falls kein gültiges premiumExpiration, aber Subscription aktiv, hole next_billing_time
                if (mUser.getSubscriptionId() != null && !mUser.getSubscriptionId().isEmpty()) {
                    String nextBillingTime = mPaypalSubscriptionInfo.getNextBillingTime(mUser.getSubscriptionId());
                    if (nextBillingTime != null) {
                        try {
                            SimpleDateFormat paypalSdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
                            displayDate = paypalSdf.parse(nextBillingTime);
                        } catch (Exception e) {
                            LOGGER.error("Fehler beim Parsen von next_billing_time: {}", nextBillingTime, e);
                        }
                    }
                }
            }
            if (displayDate != null && displayDate.after(new Date())) {
                statusParagraph.setText("✅ Gültig bis: " + sdf.format(displayDate));
            } else {
                statusParagraph.setText("✅ Gültig (Abo aktiv)");
            }
            statusParagraph.getStyle().set("color", "green");
        } else {
            statusParagraph.setText("❌ Abgelaufen");
            statusParagraph.getStyle().set("color", "red");
        }
        layout.add(statusParagraph);

        // Prüfen, ob der Nutzer in der kostenlosen Testphase ist
        boolean isInTrialPeriod = isInTrialPeriod(mUser.getPremiumExpiration());
        if (isInTrialPeriod && !mPremiumActive) {
            long daysLeft = getTrialDaysLeft(mUser.getPremiumExpiration());
            Paragraph trialParagraph = new Paragraph("🔥 Deine kostenlose Testphase läuft noch " + daysLeft + " Tage!");
            trialParagraph.getStyle().set("color", "var(--lumo-primary-color)");
            trialParagraph.getStyle().set("font-weight", "bold");
            layout.add(trialParagraph);
        }

        // Status vom PayPal-Abo und Buttons
        if (mUser.getSubscriptionId() != null && !mUser.getSubscriptionId().isEmpty()) {
            String subscriptionStatus = mPaypalSubscriptionInfo.getSubscriptionStatus(mUser.getSubscriptionId());
            String displayStatus = mapStatus(subscriptionStatus);
            Text statusText = new Text("Status: " + displayStatus);
            layout.add(statusText);

            // Buttons nur anzeigen, wenn das Abo aktiv ist
            if ("ACTIVE".equals(subscriptionStatus)) {
                Button suspendButton = new Button("Pausieren", e -> showDialog(2));
                Button cancelButton = new Button("Kündigen", e -> showDialog(3));
                HorizontalLayout buttonLayout = new HorizontalLayout(suspendButton, cancelButton);
                buttonLayout.setSpacing(true);
                layout.add(buttonLayout);
            }
        }

        Button refreshStatusButton = createRefreshStatusButton();
        layout.add(refreshStatusButton);

        return layout;
    }

    /**
     * Erstellt den Abschnitt mit den Premium-Vorteilen.
     */
    private VerticalLayout createBenefitsSection() {
        VerticalLayout layout = new VerticalLayout();
        layout.setSpacing(false);
        layout.setPadding(false);

        H2 header = new H2("Premium-Vorteile");
        layout.add(header);

        Paragraph benefit1 = createBenefitParagraph("✨ Unbegrenztes Generieren von Gerichten und Cocktails");
        Paragraph benefit2 = createBenefitParagraph("🎯 Festlegen von spezifischen Rezeptwünschen");
        Paragraph benefit3 = createBenefitParagraph("🌟 Zugriff auf alle Premium-Funktionen");
        Paragraph benefit4 = createBenefitParagraph("🧪 7 Tage kostenlose Testphase für alle neuen Nutzer");

        layout.add(benefit1, benefit2, benefit3, benefit4);

        return layout;
    }

    /**
     * Erstellt den Abschnitt für das Einführungsangebot.
     */
    private VerticalLayout createIntroOfferSection() {
        VerticalLayout layout = new VerticalLayout();
        layout.setSpacing(false);
        layout.setPadding(false);
        layout.getStyle().set("background-color", "rgba(30, 144, 255, 0.1)");
        layout.getStyle().set("border-radius", "8px");
        layout.getStyle().set("padding", "16px");
        layout.getStyle().set("margin-top", "16px");
        layout.getStyle().set("margin-bottom", "16px");

        H3 header = new H3("🔥 Einführungsangebot");
        header.getStyle().set("margin-top", "0");

        Paragraph offerText = new Paragraph(
                "Sichere dir jetzt den dauerhaften Einführungspreis von nur " + INTRO_PRICE + " pro Monat!"
        );
        offerText.getStyle().set("font-weight", "bold");

        HorizontalLayout priceLayout = new HorizontalLayout();
        priceLayout.setAlignItems(FlexComponent.Alignment.BASELINE);

        Span regularPrice = new Span(REGULAR_PRICE);
        regularPrice.getStyle()
                .set("text-decoration", "line-through")
                .set("margin-right", "8px")
                .set("color", "var(--lumo-secondary-text-color)");

        Span introPrice = new Span(INTRO_PRICE);
        introPrice.getStyle()
                .set("font-size", "1.5em")
                .set("font-weight", "bold")
                .set("color", "var(--lumo-primary-color)");

        priceLayout.add(regularPrice, introPrice, new Span("pro Monat"));

        Paragraph limitedTimeText = new Paragraph(
                "Dieses Angebot gilt nur für kurze Zeit. Wer jetzt zuschlägt, behält den günstigen Preis dauerhaft!"
        );

        layout.add(header, offerText, priceLayout, limitedTimeText);

        return layout;
    }

    /**
     * Erstellt den PayPal-Container und bindet das JS ein.
     */
    private Div createPaypalSection() {
        Div paypalContainer = new Div();
        String containerId = "paypal-button-container-" + Const.PAYPAL_SUBSCRIPTION_PLAN_ID;
        paypalContainer.setId(containerId);

        // Elementreferenz für den Server-Callback speichern
        getElement().executeJs("window.paypalContainer = $0", getElement());

        String js = ""
                    + "var script = document.createElement('script');"
                    + "script.src = 'https://www.paypal.com/sdk/js?client-id=" + Const.PAYPAL_CLIENT_ID_LIVE + "&vault=true&intent=subscription';"
                    + "script.setAttribute('data-sdk-integration-source', 'button-factory');"
                    + "document.head.appendChild(script);"
                    + "script.onload = function() {"
                    + "  console.log('PayPal SDK geladen');"
                    + "  paypal.Buttons({"
                    + "      style: {"
                    + "          shape: 'rect',"
                    + "          color: 'black',"
                    + "          layout: 'vertical',"
                    + "          label: 'paypal'"
                    + "      },"
                    + "      createSubscription: function(data, actions) {"
                    + "        console.log('Erstelle Subscription');"
                    + "        return actions.subscription.create({"
                    + "          plan_id: '" + Const.PAYPAL_SUBSCRIPTION_PLAN_ID + "'"
                    + "        });"
                    + "      },"
                    + "      onApprove: function(data, actions) {"
                    + "        console.log('Subscription genehmigt, ID:', data.subscriptionID);"
                    + "        try {"
                    + "          console.log('Sende ID an Server...');"
                    + "          window.paypalContainer.$server.handleSubscription(data.subscriptionID);"
                    + "          console.log('Server-Methode aufgerufen');"
                    + "        } catch(e) {"
                    + "          console.error('Fehler beim Aufrufen der Server-Methode:', e);"
                    + "          alert('Fehler: ' + e.message);"
                    + "        }"
                    + "        alert('Abonnement erfolgreich abgeschlossen! Die Seite wird aktualisiert.');"
                    + "        setTimeout(function() { window.location.reload(); }, 2000);"
                    + "      },"
                    + "      onError: function(err) {"
                    + "        console.error('PayPal Fehler:', err);"
                    + "        alert('Es ist ein Fehler aufgetreten: ' + err);"
                    + "      }"
                    + "  }).render('#" + containerId + "');"
                    + "};";

        // JavaScript ausführen
        getElement().executeJs(js);

        return paypalContainer;
    }

    /**
     * Erstellt den Bonus-Programm-Bereich.
     */
    private VerticalLayout createBonusSection(Connection connection) {
        VerticalLayout layout = new VerticalLayout();
        layout.setSpacing(false);

        H2 bonusHeader = new H2("Bonus-Programm");
        Paragraph infoParagraph = new Paragraph(
                "Lade " + Const.REFERRAL_USAGE_TO_GET_BONUS + " Freunde ein" +
                " und erhalte " + Const.REFERRAL_BONUS_FREE_MONTHS + " Monate Premium!"
        );

        int currentCount = DbUtils.getReferralCount(connection, mUser.getUsername());
        Paragraph stateParagraph = new Paragraph("Aktuell: " + (currentCount % Const.REFERRAL_USAGE_TO_GET_BONUS)
                                                 + " / " + Const.REFERRAL_USAGE_TO_GET_BONUS);

        HorizontalLayout referralLayout = new HorizontalLayout();
        referralLayout.setSpacing(true);
        referralLayout.add(new Text("🚀 Link zum Teilen: "), createReferralButton());

        layout.add(bonusHeader, infoParagraph, stateParagraph, referralLayout);
        return layout;
    }

    /**
     * Erstellt die Schaltfläche für den Referral-Link.
     */
    private Button createReferralButton() {
        return new Button(VaadinIcon.SHARE.create(), event -> {
            try (Connection connection = DbUtils.getConnection()) {
                final String referralLink = DbUtils.generateReferral(connection, mUser.getId(), null);
                String js = "navigator.clipboard.writeText('" + referralLink + "').then(() => {"
                            + "    console.log('Erfolgreich kopiert');"
                            + "}).catch(err => {"
                            + "    console.error('Fehler beim Kopieren', err);"
                            + "});";
                getUI().ifPresent(ui -> ui.getPage().executeJs(js));
                if (!GuiUtils.isMobileDevice()) {
                    Notification.show("✅ Link zum Teilen in Zwischenablage kopiert",
                            Const.NOTIFICATION_DURATION_LONG, Notification.Position.BOTTOM_CENTER);
                }
            } catch (SQLException e) {
                LOGGER.error("Fehler beim Generieren des Referral-Links", e);
                Notification.show("Fehler beim Generieren des Referral-Links",
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            }
        });
    }

    /**
     * Erstellt einen Paragraph für einen Vorteil mit Icon.
     */
    private Paragraph createBenefitParagraph(String text) {
        Paragraph paragraph = new Paragraph(text);
        paragraph.getStyle().set("margin-top", "4px");
        paragraph.getStyle().set("margin-bottom", "4px");
        return paragraph;
    }

    /**
     * Prüft, ob der Nutzer in der kostenlosen Testphase ist (7 Tage).
     */
    private boolean isInTrialPeriod(Date createdAt) {
        if (createdAt == null) return false;

        long creationTime = createdAt.getTime();
        long currentTime = System.currentTimeMillis();
        long trialPeriodMs = 7 * 24 * 60 * 60 * 1000; // 7 Tage in Millisekunden

        return (currentTime - creationTime) <= trialPeriodMs;
    }

    /**
     * Berechnet die verbleibenden Tage der Testphase.
     */
    private long getTrialDaysLeft(Date createdAt) {
        if (createdAt == null) return 0;

        long creationTime = createdAt.getTime();
        long currentTime = System.currentTimeMillis();
        long trialPeriodMs = 7 * 24 * 60 * 60 * 1000; // 7 Tage in Millisekunden
        long timeElapsed = currentTime - creationTime;

        if (timeElapsed >= trialPeriodMs) return 0;

        return (trialPeriodMs - timeElapsed) / (24 * 60 * 60 * 1000) + 1; // +1 für den aktuellen Tag
    }

    /**
     * Übersetzt den von PayPal gelieferten Status in einen benutzerfreundlichen Text.
     */
    private String mapStatus(String status) {
        if (status == null || status.isEmpty()) {
            return "inaktiv";
        }
        return switch (status) {
            case "ACTIVE" -> "Aktiv";
            case "SUSPENDED" -> "Pausiert";
            case "CANCELLED" -> "Gekündigt";
            case "EXPIRED" -> "Abgelaufen";
            default -> status;
        };
    }

    /**
     * Generiert einen QR-Code für den Referral-Link.
     */
    public String generateQrCode(String referralCode) {
        // TODO: implementieren
        return "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://yourapp.com/register?ref=" + referralCode;
    }

    /**
     * Öffnet einen Dialog zur Bestätigung der Abo-Aktion.
     *
     * @param actionCode 2 = Pausieren, 3 = Kündigen
     */
    private void showDialog(int actionCode) {
        Dialog dialog = new Dialog();
        VerticalLayout dialogLayout = new VerticalLayout();
        dialogLayout.setSpacing(true);
        dialogLayout.add(new H2("Bist du sicher?"));

        String content = switch (actionCode) {
            case 2 -> "Abo wirklich pausieren?";
            case 3 -> "Abo wirklich kündigen?";
            default -> "";
        };
        dialogLayout.add(new Text(content));

        Button yesButton = new Button("Ja", event -> {
            switch (actionCode) {
                case 2 -> suspendSubscription();
                case 3 -> cancelSubscription();
                default -> {
                }
            }
            dialog.close();
        });
        Button noButton = new Button("Abbrechen", event -> dialog.close());
        HorizontalLayout buttons = new HorizontalLayout(yesButton, noButton);
        buttons.setSpacing(true);

        dialog.add(dialogLayout, buttons);
        dialog.open();
    }

    /**
     * Aktiviert das Abonnement.
     */
    private void activateSubscription() {
        if (mPaypalSubscriptionInfo.sendPostRequest(mUser.getSubscriptionId(), "activate")) {
            Notification.show("✅ Abo erfolgreich aktiviert!");
        } else {
            Notification.show("Fehler beim Aktivieren!", 3000, Notification.Position.MIDDLE);
        }
    }

    /**
     * Kündigt das Abonnement.
     */
    private void cancelSubscription() {
        if (mPaypalSubscriptionInfo.sendPostRequest(mUser.getSubscriptionId(), "cancel")) {
            Notification.show("✅ Abo erfolgreich gekündigt!");
        } else {
            Notification.show("Fehler beim Kündigen!", 3000, Notification.Position.MIDDLE);
        }
    }

    /**
     * Pausiert das Abonnement.
     */
    private void suspendSubscription() {
        if (mPaypalSubscriptionInfo.sendPostRequest(mUser.getSubscriptionId(), "suspend")) {
            Notification.show("✅ Abo wurde pausiert!");
        } else {
            Notification.show("Fehler beim Pausieren!", 3000, Notification.Position.MIDDLE);
        }
    }


    /**
     * Diese Methode wird von JavaScript aufgerufen.
     */
    @ClientCallable
    public void handleSubscription(String subscriptionID) {
        LOGGER.info("Empfangene Subscription ID: " + subscriptionID);
        try (Connection connection = DbUtils.getConnection()) {
            // Subscription ID in der Datenbank speichern
            boolean updated = DbUtils.updateUserSubscription(connection, mUser.getId(), subscriptionID);

            if (updated) {
                LOGGER.info("Subscription ID erfolgreich gespeichert: " + subscriptionID);

                // Wichtig: Nach dem Speichern der Subscription den Benutzer neu laden
                mUser = DbUtils.getUserById(connection, mUser.getId());

                // Premium-Ablaufdatum sofort mit PayPal synchronisieren
                if (mUser != null) {
                    DbUtils.syncPremiumExpiration(connection, mUser);

                    // Premium-Status nochmals prüfen
                    mPremiumActive = DbUtils.checkPremiumState(connection, mUser.getUsername());
                    LOGGER.info("Premium-Status nach Subscription: " + mPremiumActive);
                }

                getUI().ifPresent(ui -> ui.access(() -> {
                    Notification.show("✅ Premium-Abonnement erfolgreich aktiviert! Du hast dir den günstigen Preis von " +
                                      INTRO_PRICE + " dauerhaft gesichert!",
                            5000, Notification.Position.BOTTOM_CENTER);
                }));
            } else {
                LOGGER.error("Fehler beim Speichern der Subscription ID: " + subscriptionID);
                getUI().ifPresent(ui -> ui.access(() -> {
                    Notification.show("❌ Es gab ein Problem bei der Speicherung deines Abonnements. " +
                                      "Bitte kontaktiere den Support.",
                            5000, Notification.Position.BOTTOM_CENTER);
                }));
            }
        } catch (SQLException e) {
            LOGGER.error("Fehler beim Aktualisieren des Abonnements", e);
            getUI().ifPresent(ui -> ui.access(() -> {
                Notification.show("❌ Datenbankfehler beim Speichern des Abonnements.",
                        5000, Notification.Position.BOTTOM_CENTER);
            }));
        }
    }

    /**
     * Erstellt den Button zur Aktualisierung des Premium-Status
     */
    private Button createRefreshStatusButton() {
        Button refreshButton = new Button("Status aktualisieren");
        refreshButton.addClickListener(e -> {
            try (Connection connection = DbUtils.getConnection()) {
                // Benutzer neu laden
                mUser = DbUtils.getUserById(connection, mUser.getId());

                if (mUser != null) {
                    // Premium-Ablaufdatum mit PayPal synchronisieren
                    if (mUser.getSubscriptionId() != null && !mUser.getSubscriptionId().isEmpty()) {
                        DbUtils.syncPremiumExpiration(connection, mUser);

                        // Benutzer nach der Synchronisierung noch einmal neu laden
                        mUser = DbUtils.getUserById(connection, mUser.getId());
                    }

                    // Premium-Status neu prüfen
                    mPremiumActive = DbUtils.checkPremiumState(connection, mUser.getUsername());

                    // UI aktualisieren (neu laden)
                    UI.getCurrent().getPage().reload();

                    Notification.show("Premium-Status aktualisiert",
                            Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                } else {
                    Notification.show("Benutzer konnte nicht gefunden werden",
                            Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                }
            } catch (SQLException ex) {
                LOGGER.error("Fehler beim Aktualisieren des Premium-Status", ex);
                Notification.show("Fehler beim Aktualisieren des Premium-Status: " + ex.getMessage(),
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            }
        });
        return refreshButton;
    }

//    /**
//     * Diese Methode wird von JavaScript aufgerufen.
//     */
//    @ClientCallable
//    public void handleSubscription(String subscriptionID) {
//        LOGGER.info("Empfangene Subscription ID: {}", subscriptionID);
//        try (Connection connection = DbUtils.getConnection()) {
//            boolean updated = DbUtils.updateUserSubscription(connection, mUser.getId(), subscriptionID);
//            if (updated) {
//                LOGGER.info("Subscription ID erfolgreich gespeichert: {}", subscriptionID);
//                getUI().ifPresent(ui -> ui.access(() -> {
//                    Notification.show("✅ Premium-Abonnement erfolgreich aktiviert! Du hast dir den günstigen Preis von " +
//                                      INTRO_PRICE + " dauerhaft gesichert!",
//                            5000, Notification.Position.BOTTOM_CENTER);
//                }));
//            } else {
//                LOGGER.error("Fehler beim Speichern der Subscription ID: {}", subscriptionID);
//            }
//        } catch (SQLException e) {
//            LOGGER.error("Fehler beim Aktualisieren des Abonnements", e);
//        }
//    }

    private void addMetaTags() {
        // Klassische Meta-Tags für SEO
        Html metaDescription = new Html(
                "<meta name=\"description\" content=\"Werde Premium-Mitglied bei Zauberkoch und erhalte exklusive Features wie erweiterte Rezepte, personalisierte Vorschläge und eine werbefreie GUI.\">");
        Html metaKeywords = new Html(
                "<meta name=\"keywords\" content=\"zauberkoch, premium, kochrezepte, personalisiert, intuitive gui, upgrade, exklusive features, ki-generierte rezepte\">");
        Html metaRobots = new Html(
                "<meta name=\"robots\" content=\"index, follow\">");

        // Open Graph Tags für Social Media (z. B. wenn jemand den Link teilt)
        Html ogTitle = new Html(
                "<meta property=\"og:title\" content=\"Zauberkoch Premium – Exklusive Features für Kochfans\">");
        Html ogDescription = new Html(
                "<meta property=\"og:description\" content=\"Entdecke Zauberkoch Premium: Mehr Rezepte, personalisierte Empfehlungen und eine intuitive, werbefreie Erfahrung.\">");
        Html ogImage = new Html(
                "<meta property=\"og:image\" content=\"https://app.zauberkoch.com/images/premium-og-image.jpg\">");
        Html ogUrl = new Html(
                "<meta property=\"og:url\" content=\"https://app.zauberkoch.com/premium\">");
        Html ogType = new Html(
                "<meta property=\"og:type\" content=\"website\">");

        // Twitter Card Tags (für Twitter Sharing)
        Html twitterCard = new Html(
                "<meta name=\"twitter:card\" content=\"summary_large_image\">");
        Html twitterTitle = new Html(
                "<meta name=\"twitter:title\" content=\"Zauberkoch Premium – Exklusive Features für Kochfans\">");
        Html twitterDescription = new Html(
                "<meta name=\"twitter:description\" content=\"Entdecke Zauberkoch Premium: Mehr Rezepte, personalisierte Empfehlungen und eine intuitive, werbefreie Erfahrung.\">");
        Html twitterImage = new Html(
                "<meta name=\"twitter:image\" content=\"https://app.zauberkoch.com/images/premium-og-image.jpg\">");

        // Strukturierte Daten (JSON-LD) für bessere Sichtbarkeit in Suchmaschinen
        Html structuredData = new Html(
                "<script type=\"application/ld+json\">" +
                "{" +
                "  \"@context\": \"https://schema.org\"," +
                "  \"@type\": \"Product\"," +
                "  \"name\": \"Zauberkoch Premium\"," +
                "  \"description\": \"Zauberkoch Premium bietet exklusive Features wie erweiterte Rezepte, personalisierte Vorschläge und eine werbefreie GUI.\"," +
                "  \"url\": \"https://app.zauberkoch.com/premium\"," +
                "  \"offers\": {" +
                "    \"@type\": \"Offer\"," +
                "    \"priceCurrency\": \"EUR\"," +
                "    \"price\": \"2.49\"," +
                "    \"availability\": \"https://schema.org/InStock\"" +
                "  }" +
                "}" +
                "</script>");

        // Meta-Tags zum <head> hinzufügen
        getElement().appendChild(metaDescription.getElement());
        getElement().appendChild(metaKeywords.getElement());
        getElement().appendChild(metaRobots.getElement());
        getElement().appendChild(ogTitle.getElement());
        getElement().appendChild(ogDescription.getElement());
        getElement().appendChild(ogImage.getElement());
        getElement().appendChild(ogUrl.getElement());
        getElement().appendChild(ogType.getElement());
        getElement().appendChild(twitterCard.getElement());
        getElement().appendChild(twitterTitle.getElement());
        getElement().appendChild(twitterDescription.getElement());
        getElement().appendChild(twitterImage.getElement());
        getElement().appendChild(structuredData.getElement());
    }
}