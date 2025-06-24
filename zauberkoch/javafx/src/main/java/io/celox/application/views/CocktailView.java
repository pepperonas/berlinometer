package io.celox.application.views;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.ComponentEventListener;
import com.vaadin.flow.component.DetachEvent;
import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.Key;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.dependency.CssImport;
import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.component.details.Details;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.Hr;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.page.Page;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.data.value.ValueChangeMode;
import com.vaadin.flow.router.BeforeLeaveEvent;
import com.vaadin.flow.router.BeforeLeaveObserver;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.spring.annotation.SpringComponent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Scope;
import org.vaadin.addons.componentfactory.PaperSlider;
import org.vaadin.addons.componentfactory.PaperSliderVariant;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalTime;
import java.util.List;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

import io.celox.application.api.grok.openai.GrokAiClient;
import io.celox.application.api.openai.ChatGptClient;
import io.celox.application.custom.MarkdownView;
import io.celox.application.custom.pulse_effect.ButtonWithExplosionEffect;
import io.celox.application.custom.pulse_effect.ButtonWithPulseEffect;
import io.celox.application.custom.pulse_effect.CheckboxWithPulseEffect;
import io.celox.application.custom.pulse_effect.RadioButtonGroupWithPulseEffect;
import io.celox.application.model.ApiLog;
import io.celox.application.model.Recipe;
import io.celox.application.model.ReferralUsageState;
import io.celox.application.model.User;
import io.celox.application.model.UserSetting;
import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import io.celox.application.utils.FunnyStringManip;
import io.celox.application.utils.GuiUtils;
import io.celox.application.utils.JSONRecipeExtractor;
import io.celox.application.utils.RecipeDbUtils;
import io.celox.application.utils.SecurityUtils;
import jakarta.annotation.security.PermitAll;

@SpringComponent
@Scope("prototype")
@PermitAll
@Route(value = "cocktail", layout = MainLayout.class)
@PageTitle("Cocktail | Zauberbar")
@CssImport("./styles/sparkle.css")
@CssImport("./styles/drunk-style.css") // CSS für betrunkene Effekte
@JsModule("./scripts/sparkle.js")
@JsModule("./scripts/drunk-effects.js") // JS für betrunkene Effekte
public class CocktailView extends VerticalLayout implements BeforeLeaveObserver {

    private static final Logger LOGGER = LoggerFactory.getLogger(CocktailView.class.getName());

    public static final String SLIDER_HEIGHT = "100px";
    public static final String COMPONENT_WIDTH = "100%";

    private User mUser;
    private boolean mPremiumActive;
    private long mApiCallStarted = 0L;

    // Flag um doppelte Klicks zu verhindern
    private final AtomicBoolean isProcessing = new AtomicBoolean(false);

    private RadioButtonGroupWithPulseEffect<String> mRadioGroup;
    private PaperSlider mSliderIngredients;
    private PaperSlider mSliderComplexity;
    private PaperSlider mSliderAlcoholContent;
    private PaperSlider mSliderServes;
    private TextField mTextAdditional;

    private final Div animationContainer = new Div();

    private UserSetting mUserSetting = new UserSetting();

    private long mStoredResponseId = 0;

    private RadioButtonGroupWithPulseEffect<String> mRgTypeDrink;
    private RadioButtonGroupWithPulseEffect<String> mRgStyle;
    private CheckboxWithPulseEffect mCbxFruity;
    private CheckboxWithPulseEffect mCbxDessert;
    private ComboBox<String> mCbSpirit;
    private boolean mIsStarred = false;

    public CocktailView() {
        setSizeFull();
        setAlignItems(Alignment.CENTER);

        addMetaTags();

        try (Connection connection = DbUtils.getConnection()) {
            mUser = DbUtils.getUserByUsername(connection, SecurityUtils.getCurrentUsername());
            if (mUser == null) {
                Notification.show(FunnyStringManip.getError(),
                        Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                return;
            }
            DbUtils.createUserSettingsIfNotExist(connection, mUser.getId());

            mPremiumActive = DbUtils.checkPremiumState(connection, mUser.getUsername());
            ReferralUsageState referralUsageState = DbUtils.getReferralUsageState(connection,
                    mUser.getUsername());

            mUserSetting = DbUtils.loadUserSettings(connection, mUser.getId());

            // Gewähre 3 Monate Bonus bei 5 Empfehlungen
            int referralUsageCount = DbUtils.getReferralCount(connection, mUser.getUsername());
            if (referralUsageCount % Const.REFERRAL_USAGE_TO_GET_BONUS == 0 && referralUsageCount != 0
                && referralUsageState.getUsageCount() != referralUsageCount && referralUsageState.isFlagValid()) {
                DbUtils.updateUserPremiumExpiration(connection, mUser.getUsername(), referralUsageCount);
            }
        } catch (SQLException e) {
            Notification.show("Fehler beim Herstellen der Datenbankverbindung: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            LOGGER.error("Database connection error", e);
            return;
        }

        if (!mUserSetting.isReduceAnimations()) {
            addClassName("drunk-container");
        }

        H1 heading = new H1("🍹 Zauberbar");
        VerticalLayout layoutHeader = new VerticalLayout(heading);
        layoutHeader.setWidthFull();
        layoutHeader.setPadding(false);
        layoutHeader.setMargin(false);
        if (!mUserSetting.isReduceAnimations()) {
            heading.addClassName("pulsating-element");
            heading.addClassName("floating-element");
            heading.addClassName("wobble-element");
            heading.addClassName("blur-shift");
            heading.addClassName("drunk-effect");
            heading.addClassName("blur-shift-delayed");
            layoutHeader.addClassName("blur-shift");
        }
        layoutHeader.setAlignItems(Alignment.START);
        add(layoutHeader);

        createExpandableComponents();

        initSliders(mUser);

        mTextAdditional = new TextField("🔥 Deine Wünsche");
        mTextAdditional.setHelperText("z.B. Gin, Ananas, fruchtig, scharf, bitter...");
        mTextAdditional.setWidth("100%");
        if (!mUserSetting.isReduceAnimations()) {
            mTextAdditional.addClassName("wobble-element");
        }

        mTextAdditional.addFocusListener(event ->
                mTextAdditional.getElement().executeJs("startSparkleAnimation($0)", mTextAdditional.getElement()));

        HorizontalLayout hLayoutSlidersRow1 = new HorizontalLayout();
        HorizontalLayout hLayoutSlidersRow2 = new HorizontalLayout();
        HorizontalLayout hLayoutTextField = new HorizontalLayout();

        applySliderStyle(hLayoutSlidersRow1, hLayoutSlidersRow2);
        hLayoutTextField.setWidth("90%");

        hLayoutSlidersRow1.add(mSliderIngredients, mSliderComplexity);
        hLayoutSlidersRow2.add(mSliderAlcoholContent, mSliderServes);

        Div divTf = new Div(mTextAdditional);
        divTf.setWidth("100%");
        if (!mUserSetting.isReduceAnimations()) {
            hLayoutSlidersRow1.addClassName("blur-shift");
            hLayoutSlidersRow2.addClassName("blur-shift-delayed");
            divTf.addClassName("blur-shift");
            hLayoutTextField.addClassName("blur-shift");
            hLayoutTextField.addClassName("wobble-element");
        }
        hLayoutTextField.add(divTf);

        mTextAdditional.setEnabled(mPremiumActive);
        mTextAdditional.setValue(mPremiumActive ? "" : "Erfordert Premium-Account");
        mTextAdditional.setMaxLength(Const.MAX_LENGTH_TF_ADDITIONAL);
        mTextAdditional.setValueChangeMode(ValueChangeMode.EAGER);
        mTextAdditional.addValueChangeListener(event -> {
            String value = event.getValue();
            int remainingChars = Const.MAX_LENGTH_TF_ADDITIONAL - value.length();

            if (remainingChars <= Const.REMAINING_CHARACTERS_TO_WARN) {
                mTextAdditional.setHelperText("Noch " + remainingChars + " Zeichen übrig");
                mTextAdditional.setHelperComponent(createHelperComponent(remainingChars));
            } else {
                mTextAdditional.setHelperText("z.B. Gin, Ananas, fruchtig, scharf, bitter...");
                mTextAdditional.setHelperComponent(null);
            }
        });

        initRadioGroup();
        Div divRg = new Div(mRadioGroup);

        add(hLayoutSlidersRow1, hLayoutSlidersRow2, hLayoutTextField, mCbSpirit, divRg);

        HorizontalLayout hLayoutButtons = new HorizontalLayout();

        ButtonWithExplosionEffect btnGenerate = new ButtonWithExplosionEffect("🪄");
        btnGenerate.getStyle().set("font-size", "72px");
        btnGenerate.getStyle().set("width", "auto");
        btnGenerate.getStyle().set("height", "auto");
        btnGenerate.getStyle()
                .set("box-shadow", "0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12)");
        if (!mUserSetting.isReduceAnimations()) {
            mRadioGroup.addClassName("floating-element");
            mRadioGroup.addClassName("wobble-element");
            divRg.addClassName("blur-shift");
            hLayoutButtons.addClassName("blur-shift");
            btnGenerate.addClassName("drunk-effect");
            btnGenerate.addClassName("generate-button");
        }

        // Sicherer JavaScript-Aufruf mit Fehlerbehandlung
        try {
            getUI().ifPresent(ui -> {
                ui.access(() -> {
                    ui.getPage().executeJs("try { window.initDrunkEffects(); } catch(e) { console.error('Fehler:', e); }");
                });
            });
        } catch (Exception e) {
            LOGGER.error("Fehler beim Initialisieren der betrunkenen Effekte", e);
        }

        hLayoutButtons.add(btnGenerate);
        hLayoutButtons.getStyle().set("padding-bottom", "20px");
        add(hLayoutButtons);

        UI.getCurrent().getPage().addJsModule("https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.9.6/lottie.min.js");
        animationContainer.setId("lottie-animation");
        animationContainer.getStyle().set("position", "fixed")
                .set("top", "0")
                .set("left", "0")
                .set("width", "100%")
                .set("height", "100%")
                .set("display", "flex")
                .set("align-items", "center")
                .set("justify-content", "center")
                .set("background-color", "rgba(0, 0, 0, 0.3)")
                .set("backdrop-filter", "blur(3px)")
                .set("z-index", "1000");

        String username = SecurityUtils.getCurrentUsername();

        Div divResponse = new Div();
        divResponse.setWidthFull();
        divResponse.getStyle().set("padding-left", "30px");
        if (!mUserSetting.isReduceAnimations()) {
            divResponse.addClassName("blurry-text");
        }
        add(divResponse);
        divResponse.removeAll();

        btnGenerate.addClickListener((ComponentEventListener<ClickEvent<Button>>)
                buttonClickEvent -> {

                    if (isProcessing.getAndSet(true)) {
                        LOGGER.info("Anfrage wird bereits verarbeitet, ignoriere Klick");
                        return;
                    }

                    try (Connection connection = DbUtils.getConnection()) {
                        if (isRateLimited(connection, mPremiumActive, mUser)) {
                            isProcessing.set(false);
                            return;
                        }
                    } catch (SQLException e) {
                        LOGGER.error("Database error during rate limit check", e);
                        isProcessing.set(false);
                        return;
                    }

                    mIsStarred = false;

                    divResponse.removeAll();

                    mApiCallStarted = System.currentTimeMillis();

                    add(animationContainer);
                    UI ui = UI.getCurrent();
                    Page page = ui.getPage();
                    page.executeJs(String.format("""
                                let anim = lottie.loadAnimation({
                                    container: document.getElementById('lottie-animation'),
                                    renderer: 'svg',
                                    loop: true,
                                    autoplay: true,
                                    path: '%s'
                                });
                                document.getElementById('lottie-animation').style.display = 'block';
                            """, Const.LOTTIE_COCKTAIL));

                    CompletableFuture.supplyAsync(() -> {
                        try {
                            String api = mUserSetting.getRgApi();
                            String response;
                            String prompt;
                            if (api.equals(Const.RADIO_GROUP_API_CHAT_GPT)) {
                                prompt = getPromptV2(api);
                                response = ChatGptClient.askChatGpt(prompt);
                            } else {
                                prompt = getPromptV2(api);
                                response = GrokAiClient.askGrok(prompt);
                            }

                            LOGGER.info(response);

                            try (Connection connection = DbUtils.getConnection()) {
                                mStoredResponseId = insertApiLogAndDetectRecipe(
                                        connection, username, prompt, response, mTextAdditional.getValue(),
                                        api, (System.currentTimeMillis() - mApiCallStarted));
                            }
                            return response;
                        } catch (Exception e) {
                            LOGGER.warn("Fehler beim API-Call", e);
                            return "Fehler: Keine Daten erhalten";
                        }
                    }).thenAccept(response -> {
                        LOGGER.info("Callback aufgerufen. Aktualisiere UI...");

                        ui.access(() -> {
                            try {
                                LOGGER.info("Beende Animation...");
                                ui.getPage().executeJs("""
                                            document.getElementById('lottie-animation').style.display = 'none';
                                        """);
                                remove(animationContainer);

                                if (mUser.isAdmin()) {
                                    Notification.show("in " + (System.currentTimeMillis() - mApiCallStarted) + " ms…");
                                }

                                try (Connection connection = DbUtils.getConnection()) {
                                    inflateRecipe(connection, response, divResponse);
                                } catch (SQLException e) {
                                    LOGGER.error("Database error during recipe inflation", e);
                                    Notification.show("Datenbankfehler beim Anzeigen des Rezepts");
                                }

                                LOGGER.info("Rezept erfolgreich angezeigt");
                            } catch (Exception e) {
                                LOGGER.warn("Fehler beim UI-Update", e);
                                Notification.show("Fehler beim Anzeigen des Rezepts. Bitte versuche es erneut.");
                            } finally {
                                isProcessing.set(false);
                            }
                        });
                    }).exceptionally(ex -> {
                        LOGGER.warn("Fehler in CompletableFuture", ex);
                        isProcessing.set(false);
                        UI.getCurrent().access(() -> {
                            Notification.show("Es gab ein Problem bei der Rezepterstellung. Bitte versuche es erneut.");
                            try {
                                remove(animationContainer);
                            } catch (Exception e) {
                                // Ignorieren
                            }
                        });
                        return null;
                    });
                });
        btnGenerate.addClickShortcut(Key.ENTER);

        ensureSliderTriggered();

        mCbxFruity.setValue(mUserSetting.getCbxFruityDrink() == 1);
        mCbxDessert.setValue(mUserSetting.getCbxDessertDrink() == 1);

        mRgTypeDrink.setValue(mUserSetting.getRgTypeDrink());
        mRgStyle.setValue(mUserSetting.getRgStyleDrink());
    }

    private void inflateRecipe(Connection connection, String recipeString, Div divResponse) {
        if (recipeString == null || recipeString.trim().isEmpty()) {
            LOGGER.warn("Leere Rezept-Antwort erhalten");
            divResponse.add(new Span("Keine Antwort erhalten. Bitte versuche es erneut."));
            return;
        }

        try {
            LOGGER.info("Zeige Rezept an, String-Länge: " + recipeString.length());

            ApiLog apiLog = DbUtils.getRecipeById(connection, mStoredResponseId);

            // „Teilen über WhatsApp"-Button hinzufügen
            String shareText = "Ich habe ein leckeres Rezept gezaubert. Schau's es dir am besten direkt an! 🚀"
                               + Const.SERVER_URL + "/recipe?id=" + apiLog.getUuid();
            String whatsappUrl = "https://api.whatsapp.com/send?text=" + GuiUtils.encodeUrl(shareText);
            // Create the Anchor
            Anchor btnShareWhatsApp = new Anchor(whatsappUrl);
            // Create a generic share/message icon (since Vaadin doesn't have a WhatsApp icon)
            Icon shareIcon = VaadinIcon.COMMENT.create();
            //        shareIcon.setSize("24px");
            shareIcon.addClassName("whatsapp-icon");

            // Create a layout to combine the icon and text
            HorizontalLayout buttonContent = new HorizontalLayout(shareIcon);
            buttonContent.setSpacing(true);
            buttonContent.setAlignItems(HorizontalLayout.Alignment.CENTER);

            // Set the content of the Anchor
            btnShareWhatsApp.add(buttonContent);

            // Configure the Anchor
            btnShareWhatsApp.getElement().setAttribute("target", "_blank"); // Öffnet in neuem Tab
            btnShareWhatsApp.addClassName("whatsapp-share-button"); // Für CSS-Styling

            ButtonWithPulseEffect btnStarr = new ButtonWithPulseEffect(VaadinIcon.STAR_O.create());
            ButtonWithPulseEffect btnShare = new ButtonWithPulseEffect(VaadinIcon.SHARE.create());

            if (!mUserSetting.isReduceAnimations()) {
                btnStarr.addClassName("floating-element");
                btnStarr.addClassName("drunk-effect");
                btnShare.addClassName("floating-element");
                btnShare.addClassName("drunk-effect");
                btnShareWhatsApp.addClassName("floating-element");
                btnShareWhatsApp.addClassName("drunk-effect");
            }

            VerticalLayout vLayout = new VerticalLayout();
            HorizontalLayout hLayout = new HorizontalLayout(btnShare, btnShareWhatsApp, btnStarr);
            MarkdownView markdownView = new MarkdownView();

            if (!mUserSetting.isReduceAnimations()) {
                vLayout.addClassName("blur-shift");
                hLayout.addClassName("wobble-element");
                markdownView.addClassName("double-vision-text");
            }

            if (recipeString.contains("```json")) {
                recipeString = recipeString.substring(0, recipeString.indexOf("```json"));
            } else if (recipeString.contains("```")) {
                recipeString = recipeString.replaceAll("```(?:json)?|```", "");
            }

            markdownView.setValue(recipeString.trim());

            vLayout.add(hLayout, markdownView);

            vLayout.setWidthFull();
            vLayout.setMinHeight("400px");

            divResponse.removeAll();
            divResponse.add(vLayout);

            UI.getCurrent().getPage().executeJs("setTimeout(() => { $0.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 200);",
                    vLayout.getElement());

            btnStarr.addClickListener((e -> {
                try (Connection conn = DbUtils.getConnection()) {
                    DbUtils.updateStarredResponse(
                            conn, mStoredResponseId, !mIsStarred);
                    Notification.show(FunnyStringManip.getPositive(),
                            Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
                    btnStarr.setIcon(mIsStarred ? VaadinIcon.STAR_O.create() : VaadinIcon.STAR.create());
                    mIsStarred = !mIsStarred;
                } catch (SQLException ex) {
                    LOGGER.error("Fehler beim Aktualisieren des Sternchens", ex);
                }
            }));
            btnShare.addClickListener(e -> {
                String js = "navigator.clipboard" +
                            ".writeText('" + Const.SERVER_URL + "/recipe?id=" + apiLog.getUuid() + "')" +
                            ".then(() => {"
                            + "    console.log('Erfolgreich kopiert');"
                            + "}).catch(err => {"
                            + "    console.error('Fehler beim Kopieren', err);"
                            + "});";
                getUI().ifPresent(ui -> ui.getPage().executeJs(js));
                Notification.show("Cocktail-Link kopiert", Const.NOTIFICATION_DURATION_LONG, Notification.Position.BOTTOM_CENTER);
            });

            applyStyle(btnStarr, btnShare);
        } catch (Exception e) {
            LOGGER.error("Fehler beim Anzeigen des Rezepts", e);
            divResponse.removeAll();
            divResponse.add(new Span("Fehler beim Anzeigen des Rezepts: " + e.getMessage()));
        }
    }

    private void applyStyle(Button... buttons) {
        for (Button button : buttons) {
            button.getStyle().set("font-size", "24px");
            button.getStyle().set("width", "auto");
            button.getStyle().set("height", "auto");
        }
    }

    private void createExpandableComponents() {
        VerticalLayout layout = new VerticalLayout();

        mRgTypeDrink = new RadioButtonGroupWithPulseEffect<>();

        mRgTypeDrink.setLabel("🥃 Deine Vorlieben:");
        mRgTypeDrink.setItems("Alles", "Keine hochprozentigen Spirituosen", "Nur alkoholfrei");

        HorizontalLayout hLCbxs1 = new HorizontalLayout();

        mRgStyle = new RadioButtonGroupWithPulseEffect<>();
        mRgStyle.setLabel("🎯️ Dein Stil:");
        mRgStyle.setItems("Klassisch", "Modern", "Exotisch");

        mRgStyle.addValueChangeListener(e -> {
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection, mUser.getId(), Const.RADIO_GROUP_STYLE_DRINK, e.getValue());
            } catch (SQLException ex) {
                LOGGER.error("Database error updating user settings", ex);
            }
        });

        HorizontalLayout hLCbxs2 = new HorizontalLayout();
        mCbxFruity = new CheckboxWithPulseEffect("🍓 Fruchtig");
        mCbxDessert = new CheckboxWithPulseEffect("🍰 Dessert-Cocktail");
        hLCbxs2.add(mCbxFruity, mCbxDessert);

        if (!mUserSetting.isReduceAnimations()) {
            layout.addClassName("blur-shift-delayed");
            mRgTypeDrink.addClassName("wobble-element");
            mRgStyle.addClassName("wobble-element");
            hLCbxs2.addClassName("floating-element");
        }

        mCbxFruity.addValueChangeListener(e -> {
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection, mUser.getId(), Const.CBX_FRUITY_DRINK, e.getValue() ? 1 : 0);
            } catch (SQLException ex) {
                LOGGER.error("Database error updating fruity setting", ex);
            }
        });

        mCbxDessert.addValueChangeListener(e -> {
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection, mUser.getId(), Const.CBX_DESSERT_DRINK, e.getValue() ? 1 : 0);
            } catch (SQLException ex) {
                LOGGER.error("Database error updating dessert setting", ex);
            }
        });

        mRgTypeDrink.addValueChangeListener(event -> {
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection, mUser.getId(), Const.RADIO_GROUP_TYPE_DRINK, mRgTypeDrink.getValue());
            } catch (SQLException e) {
                LOGGER.error("Database error updating drink type", e);
            }
        });

        mCbSpirit = new ComboBox<>("🥃 Basis-Spirituose");

        try (Connection connection = DbUtils.getConnection()) {
            List<String> spirits = DbUtils.getAllSpirits(connection);
            List<String> sortedSpirits = new java.util.ArrayList<>(spirits.stream()
                    .sorted(String.CASE_INSENSITIVE_ORDER)
                    .toList());
            mCbSpirit.setItems(sortedSpirits);
        } catch (SQLException e) {
            LOGGER.error("Error loading spirits list", e);
        }

        if (!mPremiumActive) {
            mCbSpirit.setEnabled(false);
        }

        Hr divider2 = new Hr();
        divider2.getStyle().set("border", "1px solid gray").set("margin", "10px 0");
        Hr divider4 = new Hr();
        divider4.getStyle().set("border", "1px solid gray").set("margin", "10px 0");

        VerticalLayout detailsContent = new VerticalLayout(mRgTypeDrink, hLCbxs1, divider2, mRgStyle, hLCbxs2);
        Details details = new Details("📍 Deine Konfiguration", detailsContent);
        if (!mUserSetting.isReduceAnimations()) {
            mCbSpirit.addClassName("blur-shift");
            details.addClassName("wobble-element");
        }

        try (Connection connection = DbUtils.getConnection()) {
            details.setOpened(DbUtils.loadUserSettings(connection, mUser.getId()).isExpandableLayoutOpen());
        } catch (SQLException e) {
            LOGGER.error("Error loading user settings", e);
        }

        details.addOpenedChangeListener((ComponentEventListener<Details.OpenedChangeEvent>)
                event -> {
                    try (Connection connection = DbUtils.getConnection()) {
                        DbUtils.updateUserSettings(connection, mUser.getId(),
                                Const.EXPANDABLE_LAYOUT_OPEN, event.isOpened() ? 1 : 0);
                    } catch (SQLException e) {
                        LOGGER.error("Error updating expandable layout setting", e);
                    }
                });

        layout.add(details);
        add(layout);
    }

    private void ensureSliderTriggered() {
        if (mSliderIngredients.getValue() == null) {
            mSliderIngredients.setValue(2);
        }
        if (mSliderComplexity.getValue() == null) {
            mSliderComplexity.setValue(2);
        }
        if (mSliderAlcoholContent.getValue() == null) {
            mSliderAlcoholContent.setValue(2);
        }
        if (mSliderServes.getValue() == null) {
            mSliderServes.setValue(2);
        }
    }

    private String getPromptV2(String provider) {
        String style = "";
        if (mRgStyle.getValue() != null) {
            style += mRgStyle.getValue();
        }
        if (mCbxFruity.getValue()) {
            style += " Fruchtig, ";
        }
        if (mCbxDessert.getValue()) {
            style += "Dessert-Cocktail, ";
        }

        return generateCocktailPrompt(
                provider,
                mSliderIngredients.getHelperText(),
                mSliderComplexity.getHelperText(),
                mSliderAlcoholContent.getHelperText(),
                mSliderServes.getValue(),
                mRadioGroup.getValue(),
                mTextAdditional.getValue(),
                style);
    }

    public String generateCocktailPrompt(
            String provider,
            String ingredientOptions,
            String complexity,
            String alcoholContent,
            Integer serves,
            String occasion,
            String preferences,
            String style
    ) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Erstelle ein kreatives, leckeres Cocktail-Rezept basierend auf den folgenden Parametern:\n\n");

        if (mRgTypeDrink.getValue() != null) {
            switch (mRgTypeDrink.getValue()) {
                case "Alles" -> {
                    prompt.append("- Keine Einschränkungen bei Alkohol.\n");
                }
                case "Keine hochprozentigen Spirituosen" ->
                        prompt.append("- Niedrigprozentiger Alkohol bevorzugt.\n");
                case "Nur alkoholfrei" ->
                        prompt.append("- Ausschließlich alkoholfreier Cocktail.\n");
            }
        }

        if (mCbSpirit.getValue() != null && !mCbSpirit.getValue().isEmpty()) {
            if (mCbSpirit.getValue().length() < 200) {
                prompt.append("Basis-Spirituose: ").append(mCbSpirit.getValue()).append("\n");
            }
        } else {
            prompt.append("\n");
        }

        if (ingredientOptions != null) {
            prompt.append("- **Zutatenvielfalt:** ").append(ingredientOptions).append("\n");
        }
        if (complexity != null) {
            prompt.append("- **Komplexität der Zubereitung:** ").append(complexity).append("\n");
        }
        if (alcoholContent != null) {
            prompt.append("- **Alkoholgehalt:** ").append(alcoholContent).append("\n");
        }
        if (serves != null) {
            prompt.append("- **Anzahl der Cocktails:** ").append(serves).append("\n");
        }

        if (mPremiumActive) {
            if (preferences != null && !preferences.isEmpty()) {
                prompt.append("- **Cocktail-Wünsche:** ").append(preferences).append("\n");
            }
        }

        prompt.append("- **Anlass:** ").append(occasion).append("\n");
        prompt.append("- **Stil:** ").append(style).append("\n");

        String includeGarnish = new Random().nextInt(60) % 7 == 0 ? "Ja" : "Nein";

        prompt.append("### Wichtige Regeln für das Cocktail-Rezept:\n");
        prompt.append("1. **Keine Wiederholungen!** Vermeide eintönige Zutaten-Kombinationen und kreiere etwas Besonderes.\n");
        prompt.append("2. **Geschmackvoll & praktikabel!** Der Cocktail soll köstlich, realistisch und mit haushaltsüblichen Geräten zuzubereiten sein.\n");
        prompt.append("3. **Zutaten clever anpassen!** Falls bestimmte Zutaten nicht verfügbar sind, nenne Alternativen.\n");
        prompt.append("4. **Besondere Garnierung: ").append(includeGarnish).append("**\n");
        prompt.append("5. **Struktur der Ausgabe (im Markdown-Format):**\n\n");

        prompt.append("**🍸 Cocktail für ").append(serves).append(" Gläser**  \n");
        prompt.append("### 🥂 {Cocktailname}\n\n");
        prompt.append("🕒 **Zubereitungszeit:** {Zeit in Minuten}  \n");
        prompt.append("🔥 **Alkoholgehalt:** {Niedrig/Mittel/Hoch}  \n");
        prompt.append("🛒 **Zutaten:**\n");
        prompt.append("- {Zutatenliste mit Mengenangaben}\n");
        prompt.append("- Falls sinnvoll: Hinweis auf besondere Zutaten\n\n");

        prompt.append("### 🔥 Zubereitung:\n");
        prompt.append("1. {Schritt-für-Schritt-Anleitung in lockerem, modernem Ton mit Emojis}\n");
        prompt.append("2. {Vermeide zu lange Erklärungen – direkt und auf den Punkt}\n\n");

        prompt.append("### 🍹 Serviervorschlag:\n");
        prompt.append("- {Glastyp, Eis, Garnierungen}\n\n");

        prompt.append("✨ **Tipp:** Falls du eine Zutat ersetzen musst, schlage geschmacklich passende Alternativen vor!\n\n");

        if (!provider.equals(Const.RADIO_GROUP_API_GROK)) {
            prompt.append("🚀 **Wichtig:**\n");
            prompt.append("- Keine Begründungen für die Auswahl der Zutaten oder des Rezepts geben.\n");
            prompt.append("- Antworte **knapp und effizient**, damit die Berechnung schnell bleibt!\n\n");
        }

        prompt.append("Lass deiner Kreativität freien Lauf, aber immer mit dem Fokus: **kreative," +
                      " köstliche und einfach zuzubereitende Drinks!**\n\n");

        if (mUserSetting.isRequestJson()) {
            prompt.append("Gib das Ergebnis in zwei Formaten aus:\n" +
                          "\n" +
                          "1. Zuerst ein benutzerfreundliches Format mit Emojis und schöner Formatierung.\n" +
                          "\n" +
                          "2. Danach füge einen JSON-Block ein mit dem Format:\n" +
                          "\n" +
                          "```json\n" +
                          "{\n" +
                          "  \"title\": \"Name des Cocktails\",\n" +
                          "  \"preparationTime\": \"Zubereitungszeit (z.B. 5 Minuten)\",\n" +
                          "  \"alcoholContent\": \"Alkoholgehalt (z.B. Niedrig, Mittel, Hoch)\",\n" +
                          "  \"servings\": 2,\n" +
                          "  \"ingredients\": [\n" +
                          "    {\"name\": \"Zutat 1\", \"quantity\": \"45\", \"unit\": \"ml\"},\n" +
                          "    {\"name\": \"Zutat 2\", \"quantity\": \"15\", \"unit\": \"ml\"}\n" +
                          "  ],\n" +
                          "  \"instructions\": [\n" +
                          "    \"Schritt 1: Beschreibung\",\n" +
                          "    \"Schritt 2: Beschreibung\"\n" +
                          "  ],\n" +
                          "  \"servingSuggestion\": \"Serviervorschlag mit Glastyp und Garnierung\",\n" +
                          "  \"tips\": \"Optionale Tipps zum Cocktail\"\n" +
                          "}\n" +
                          "```\n" +
                          "\n" +
                          "Achte darauf, dass der JSON-Block korrekt formatiert ist und alle erforderlichen Felder enthält.\n\n");
        }

        return prompt.toString();
    }

    public static long insertApiLogAndDetectRecipe(Connection connection, String username,
                                                   String prompt, String response, String focusPhrase, String api, long executionTime) {
        long apiLogId = DbUtils.insertApiLog(connection, username, prompt, response, focusPhrase, api, executionTime, "drink");

        if (apiLogId > 0 && (prompt.toLowerCase().contains("cocktail") || response.toLowerCase().contains("zutaten"))) {
            try {
                int userId = DbUtils.getUserIdByUsername(connection, username);
                Recipe recipe = JSONRecipeExtractor.extractDrinkFromJson(response, userId);
                if (recipe != null) {
                    RecipeDbUtils.insertDrink(connection, recipe, apiLogId);
                }
            } catch (Exception e) {
                System.err.println("Fehler beim automatischen Speichern des Rezepts: " + e.getMessage());
            }
        }

        return apiLogId;
    }

    private boolean isRateLimited(Connection connection, boolean premiumActive, User user) {
        if (!premiumActive) {
            if (DbUtils.hasUserExceededLimit(connection, user.getId(),
                    Const.ALLOWED_REQUESTS_TIMEFRAME_FREE, Const.ALLOWED_REQUESTS_FREE)) {
                getUI().ifPresent(ui -> ui.access(() -> {
                    // Dialog statt Notification erstellen
                    Dialog limitExceededDialog = new Dialog();
                    limitExceededDialog.setCloseOnEsc(true);
                    limitExceededDialog.setCloseOnOutsideClick(true);

                    // Dialog-Titel
                    H2 title = new H2("⚠️ Tageslimit erreicht");
                    title.getStyle().set("margin-top", "0");

                    // Dialog-Inhalt
                    Paragraph message = new Paragraph(
                            "🔮 Du hast das magische Limit für kostenlose Cocktail-Rezepte erreicht!<br>" +
                            "🍸 Entfessle unendliche Drinks und geheime Zaubertränke mit dem Premium-Upgrade! 🪄🥂");

                    // Buttons
                    Button closeButton = new Button("Schließen", event -> limitExceededDialog.close());
                    closeButton.getStyle()
                            .set("margin-right", "auto");

                    ButtonWithPulseEffect upgradeButton = new ButtonWithPulseEffect("💎 Jetzt upgraden",
                            event -> {
                                limitExceededDialog.close();
                                ui.navigate("premium");
                            });
                    upgradeButton.getStyle()
                            .set("background-color", "#2d3748")
                            .set("color", "white")
                            .set("font-weight", "bold");

                    // Button-Layout
                    HorizontalLayout buttonLayout = new HorizontalLayout(closeButton, upgradeButton);
                    buttonLayout.setWidthFull();
                    buttonLayout.setJustifyContentMode(JustifyContentMode.BETWEEN);
                    buttonLayout.setPadding(true);

                    // Dialog-Layout
                    VerticalLayout dialogLayout = new VerticalLayout(title, message, buttonLayout);
                    dialogLayout.setPadding(true);
                    dialogLayout.setSpacing(true);
                    dialogLayout.setAlignItems(Alignment.STRETCH);

                    limitExceededDialog.add(dialogLayout);
                    limitExceededDialog.open();
                }));
                return true;
            }
        }
        if (DbUtils.hasUserExceededLimit(connection, user.getId(),
                Const.ALLOWED_REQUESTS_TIMEFRAME_PRO, Const.ALLOWED_REQUESTS_PRO)) {
            getUI().ifPresent(ui -> ui.access(() -> {
                Notification.show("️️️⚠️ Zu viele Abfragen",
                        Const.NOTIFICATION_DURATION_LONG, Notification.Position.BOTTOM_CENTER);
            }));
            DbUtils.upsertApiLimit(connection, user.getId());
            return true;
        }
        return false;
    }

    private void applySliderStyle(HorizontalLayout hLayoutSlidersRow1, HorizontalLayout hLayoutSlidersRow2) {
        hLayoutSlidersRow1.setWidth("90%");
        hLayoutSlidersRow1.setFlexGrow(0.5, mSliderIngredients);
        hLayoutSlidersRow1.setFlexGrow(0.5, mSliderComplexity);
        hLayoutSlidersRow2.setWidth("90%");
        hLayoutSlidersRow2.setFlexGrow(0.5, mSliderAlcoholContent);
        hLayoutSlidersRow2.setFlexGrow(0.5, mSliderServes);

        if (!mUserSetting.isReduceAnimations()) {
            mSliderIngredients.addClassName("wobble-element");
            mSliderComplexity.addClassName("wobble-element");
            mSliderAlcoholContent.addClassName("wobble-element");
            mSliderServes.addClassName("wobble-element");
        }
    }

    private void initRadioGroup() {
        mRadioGroup = new RadioButtonGroupWithPulseEffect<>();
        mRadioGroup.setItems("Party", "Entspannung", "Dinner", "Special Occasion");
        mRadioGroup.setValue("Party");
        mRadioGroup.getChildren().forEach(component -> {
            component.getElement().getStyle().set("margin-left", "30px");
            component.getElement().getStyle().set("margin-right", "30px");
            if (!mUserSetting.isReduceAnimations()) {
                component.getElement().getClassList().add("floating-element");
            }
        });
        add(mRadioGroup);

        LocalTime now = LocalTime.now();
        if (now.isBefore(LocalTime.of(17, 0))) {
            mRadioGroup.setValue("Entspannung");
        } else if (now.isBefore(LocalTime.of(20, 0))) {
            mRadioGroup.setValue("Dinner");
        } else {
            mRadioGroup.setValue("Party");
        }
        mRadioGroup.getStyle().set("margin-top", "10px");
        mRadioGroup.getStyle().set("margin-bottom", "10px");
    }

    private void initSliders(User user) {
        mSliderIngredients = new PaperSlider("Zutatenvielfalt");
        mSliderIngredients.setMin(1);
        mSliderIngredients.setMax(4);
        mSliderIngredients.setMaxMarkers(1);
        mSliderIngredients.setWidth(COMPONENT_WIDTH);
        mSliderIngredients.setWidthFull();
        mSliderIngredients.setHeight(SLIDER_HEIGHT);
        mSliderIngredients.setPinned(true);
        mSliderIngredients.setSnaps(true);
        mSliderIngredients.addThemeVariants(PaperSliderVariant.LUMO_SECONDARY);
        mSliderIngredients.addValueChangeListener(event -> {
            if (event.getValue() == null) {
                return;
            }
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection,
                        user.getId(), Const.SLIDER_DIVERSITY_DRINK, event.getValue());
            } catch (SQLException e) {
                LOGGER.error("Error updating diversity settings", e);
            }
            switch (event.getValue()) {
                case 1:
                    mSliderIngredients.setHelperText("minimal");
                    break;
                case 2:
                    mSliderIngredients.setHelperText("wenig");
                    break;
                case 3:
                    mSliderIngredients.setHelperText("normal");
                    break;
                case 4:
                    mSliderIngredients.setHelperText("viele");
            }
        });

        mSliderComplexity = new PaperSlider("Komplexität");
        mSliderComplexity.setMin(1);
        mSliderComplexity.setMax(4);
        mSliderComplexity.setMaxMarkers(1);
        mSliderComplexity.setWidth(COMPONENT_WIDTH);
        mSliderComplexity.setWidthFull();
        mSliderComplexity.setHeight(SLIDER_HEIGHT);
        mSliderComplexity.setPinned(true);
        mSliderComplexity.setSnaps(true);
        mSliderComplexity.addThemeVariants(PaperSliderVariant.LUMO_SECONDARY);
        mSliderComplexity.addValueChangeListener(event -> {
            if (event.getValue() == null) {
                return;
            }
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection,
                        user.getId(), Const.SLIDER_COMPLEXITY_DRINK, event.getValue());
            } catch (SQLException e) {
                LOGGER.error("Error updating complexity settings", e);
            }
            switch (event.getValue()) {
                case 1:
                    mSliderComplexity.setHelperText("sehr einfach");
                    break;
                case 2:
                    mSliderComplexity.setHelperText("einfach");
                    break;
                case 3:
                    mSliderComplexity.setHelperText("mittel");
                    break;
                case 4:
                    mSliderComplexity.setHelperText("komplex");
            }
        });

        mSliderAlcoholContent = new PaperSlider("Alkoholgehalt");
        mSliderAlcoholContent.setMin(1);
        mSliderAlcoholContent.setMax(4);
        mSliderAlcoholContent.setMaxMarkers(1);
        mSliderAlcoholContent.setWidth(COMPONENT_WIDTH);
        mSliderAlcoholContent.setWidthFull();
        mSliderAlcoholContent.setHeight(SLIDER_HEIGHT);
        mSliderAlcoholContent.setPinned(true);
        mSliderAlcoholContent.setSnaps(true);
        mSliderAlcoholContent.addThemeVariants(PaperSliderVariant.LUMO_SECONDARY);
        mSliderAlcoholContent.addValueChangeListener(event -> {
            if (event.getValue() == null) {
                return;
            }
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection,
                        user.getId(), Const.SLIDER_ALCOHOL_CONTENT_DRINK, event.getValue());
            } catch (SQLException e) {
                LOGGER.error("Error updating alcohol content settings", e);
            }
            switch (event.getValue()) {
                case 1:
                    mSliderAlcoholContent.setHelperText("sehr niedrig");
                    break;
                case 2:
                    mSliderAlcoholContent.setHelperText("niedrig");
                    break;
                case 3:
                    mSliderAlcoholContent.setHelperText("mittel");
                    break;
                case 4:
                    mSliderAlcoholContent.setHelperText("hoch");
            }
        });

        mSliderServes = new PaperSlider("Anzahl Gläser");
        mSliderServes.setMin(1);
        mSliderServes.setMax(12);
        mSliderServes.setMaxMarkers(1);
        mSliderServes.setWidth(COMPONENT_WIDTH);
        mSliderServes.setWidthFull();
        mSliderServes.setHeight(SLIDER_HEIGHT);
        mSliderServes.setPinned(true);
        mSliderServes.setSnaps(true);
        mSliderServes.addThemeVariants(PaperSliderVariant.LUMO_SECONDARY);
        mSliderServes.addValueChangeListener(event -> {
            if (event.getValue() == null) {
                return;
            }
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection,
                        user.getId(), Const.SLIDER_GLASSES_DRINK, event.getValue());
            } catch (SQLException e) {
                LOGGER.error("Error updating glasses settings", e);
            }
            mSliderServes.setHelperText(event.getValue() + " " + (event.getValue() > 1 ? "Gläser" : "Glas"));
        });

        if (mUserSetting != null) {
            if (mUserSetting.getSliderDiversity() == 0) {
                mSliderIngredients.setValue(2);
            } else {
                mSliderIngredients.setValue(mUserSetting.getSliderDiversityDrink());
            }
            if (mUserSetting.getSliderDuration() == 0) {
                mSliderComplexity.setValue(2);
            } else {
                mSliderComplexity.setValue(mUserSetting.getSliderComplexityDrink());
            }
            if (mUserSetting.getSliderCost() == 0) {
                mSliderAlcoholContent.setValue(2);
            } else {
                mSliderAlcoholContent.setValue(mUserSetting.getSliderAlcoholContentDrink());
            }
            if (mUserSetting.getSliderPortions() == 0) {
                mSliderServes.setValue(2);
            } else {
                mSliderServes.setValue(mUserSetting.getSliderGlassesDrink());
            }
        }
    }

    private Component createHelperComponent(int remainingChars) {
        Span span = new Span("Noch " + remainingChars + " Zeichen übrig");
        if (!mUserSetting.isReduceAnimations()) {
            span.addClassName("wobble-element");
        }

        if (remainingChars <= 10) {
            span.getStyle().set("color", "var(--lumo-error-color)");
        } else if (remainingChars <= 30) {
            span.getStyle().set("color", "var(--lumo-warning-color)");
        } else {
            span.getStyle().set("color", "var(--lumo-secondary-text-color)");
        }

        return span;
    }

    private void addMetaTags() {
        Html metaDescription = new Html(
                "<meta name=\"description\" content=\"Zauberbar generiert personalisierte Cocktailrezepte für dich und bietet dir eine intuitive GUI. Starte jetzt!\">");
        Html metaKeywords = new Html(
                "<meta name=\"keywords\" content=\"zauberbar, cocktailrezepte, personalisiert, intuitive gui\">");
        Html ogTitle = new Html(
                "<meta property=\"og:title\" content=\"Zauberbar - Personalisierte Cocktailrezepte\">");
        Html ogImage = new Html(
                "<meta property=\"og:image\" content=\"https://app.zauberbar.com/images/logo.jpg\">");

        getElement().appendChild(metaDescription.getElement());
        getElement().appendChild(metaKeywords.getElement());
        getElement().appendChild(ogTitle.getElement());
        getElement().appendChild(ogImage.getElement());
    }

    @Override
    public void beforeLeave(BeforeLeaveEvent event) {
        LOGGER.info("View wird verlassen - bereinige betrunkene Effekte");
        getSober("Fehler im beforeLeave");
    }

    private void getSober(String error) {
        try {
            getUI().ifPresent(ui -> ui.access(() -> {
                try {
                    ui.getPage().executeJs("try { if(window.cleanupDrunkEffects) window.cleanupDrunkEffects(); } catch(e) { console.error('Cleanup error:', e); }");
                } catch (Exception e) {
                    LOGGER.error("Fehler beim Cleanup", e);
                }
            }));
        } catch (Exception e) {
            LOGGER.error(error, e);
        }
    }

    @Override
    protected void onDetach(DetachEvent detachEvent) {
        super.onDetach(detachEvent);
        getSober("Fehler im onDetach");
    }
}