package io.celox.application.views;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.ComponentEventListener;
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
import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
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
import java.util.LinkedHashSet;
import java.util.LinkedList;
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
import io.celox.application.dialogs.DialogFoodPreference;
import io.celox.application.model.ApiLog;
import io.celox.application.model.FoodPreference;
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

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@SpringComponent
@Scope("prototype")
@PermitAll
@Route(value = "", layout = MainLayout.class)
@PageTitle("Essen | Zauberkoch")
@CssImport("./styles/sparkle.css")
@JsModule("./scripts/sparkle.js")
public class FoodView extends VerticalLayout implements BeforeEnterObserver {

    private static final Logger LOGGER = LoggerFactory.getLogger(FoodView.class.getName());

    public static final String SLIDER_HEIGHT = "100px";
    public static final String COMPONENT_WIDTH = "100%";

    private User mUser;
    private boolean mPremiumActive;
    private long mApiCallStarted = 0L;

    // Flag um doppelte Klicks zu verhindern
    private final AtomicBoolean isProcessing = new AtomicBoolean(false);

    private RadioButtonGroupWithPulseEffect<String> mRadioGroup;
    private PaperSlider mSliderDiversity;
    private PaperSlider mSliderDuration;
    private PaperSlider mSliderCost;
    private PaperSlider mSliderPortions;
    private TextField mTextAdditional;

    private final Div animationContainer = new Div();

    private UserSetting mUserSetting = new UserSetting();

    private long mStoredResponseId = 0;

    private RadioButtonGroupWithPulseEffect<String> mRgType;
    private RadioButtonGroupWithPulseEffect<String> mRgWeight;
    private CheckboxWithPulseEffect mCbxGetMuscles;
    private CheckboxWithPulseEffect mCbxGetHealthy;
    private ComboBox<String> mCbRegion;
    private boolean mIsStarred = false;

    public FoodView() {
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

        H1 heading = new H1("✨ Zauberküche");
        VerticalLayout layoutHeader = new VerticalLayout(heading);
        layoutHeader.setWidthFull();
        layoutHeader.setPadding(false);
        layoutHeader.setMargin(false);
        layoutHeader.setAlignItems(Alignment.START);
        add(layoutHeader);

        createExpandableComponents();

        initSliders(mUser);

        mTextAdditional = new TextField("🔥 Deine Wünsche");
        mTextAdditional.setHelperText("z.B. Pasta, Thai, scharf… oder Bolognese Schnitzel?!");
        mTextAdditional.setWidth("100%");

        mTextAdditional.addFocusListener(event ->
                mTextAdditional.getElement().executeJs("startSparkleAnimation($0)", mTextAdditional.getElement()));

        HorizontalLayout hLayoutSlidersRow1 = new HorizontalLayout();
        HorizontalLayout hLayoutSlidersRow2 = new HorizontalLayout();
        HorizontalLayout hLayoutTextField = new HorizontalLayout();

        applySliderStyle(hLayoutSlidersRow1, hLayoutSlidersRow2);
        hLayoutTextField.setWidth("90%");

        hLayoutSlidersRow1.add(mSliderDiversity, mSliderDuration);
        hLayoutSlidersRow2.add(mSliderCost, mSliderPortions);

        hLayoutTextField.add(mTextAdditional);

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
                mTextAdditional.setHelperText("z.B. Pasta, Thai, scharf… oder Bolognese Schnitzel?!");
                mTextAdditional.setHelperComponent(null);
            }
        });

        initRadioGroup();

        add(hLayoutSlidersRow1, hLayoutSlidersRow2, hLayoutTextField, mCbRegion, mRadioGroup);

        HorizontalLayout hLayoutButtons = new HorizontalLayout();

        ButtonWithExplosionEffect btnGenerate = new ButtonWithExplosionEffect("🪄");
        btnGenerate.getStyle().set("font-size", "72px");
        btnGenerate.getStyle().set("width", "auto");
        btnGenerate.getStyle().set("height", "auto");
        btnGenerate.getStyle().set("height", "auto");
        btnGenerate.getStyle()
                .set("box-shadow", "0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12)");

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
                            """, Const.LOTTIE_COOKING_XXL));

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

        mCbxGetMuscles.setValue(mUserSetting.getCbxGetMuscles() == 1);
        mCbxGetHealthy.setValue(mUserSetting.getCbxGetHealthy() == 1);

        mRgType.setValue(mUserSetting.getRgType());
        mRgWeight.setValue(mUserSetting.getRgGoal());
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
            VerticalLayout vLayout = new VerticalLayout();
            MarkdownView markdownView = new MarkdownView();
            HorizontalLayout hLayout = new HorizontalLayout(btnShare, btnShareWhatsApp, btnStarr);

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
                Notification.show("Rezept-Link kopiert", Const.NOTIFICATION_DURATION_LONG, Notification.Position.BOTTOM_CENTER);
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

        mRgType = new RadioButtonGroupWithPulseEffect<>();

        mRgType.setLabel("🍽️ Wie isst du:");
        mRgType.setItems("Ich esse alles", "Vegetarisch", "Vegan");

        HorizontalLayout hLCbxs1 = new HorizontalLayout();

        mRgWeight = new RadioButtonGroupWithPulseEffect<>();
        mRgWeight.setLabel("🎯️ Dein Ziel:");
        mRgWeight.setItems("Keine", "Abnehmen", "Zunehmen");

        mRgWeight.addValueChangeListener(e -> {
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection, mUser.getId(), Const.RADIO_GROUP_GOAL, e.getValue());
            } catch (SQLException ex) {
                LOGGER.error("Database error updating user settings", ex);
            }
        });

        HorizontalLayout hLCbxs2 = new HorizontalLayout();
        mCbxGetMuscles = new CheckboxWithPulseEffect("💪 Muskelaufbau");
        mCbxGetHealthy = new CheckboxWithPulseEffect("🍎 Gesundes Essen");
        hLCbxs2.add(mCbxGetMuscles, mCbxGetHealthy);

        mCbxGetMuscles.addValueChangeListener(e -> {
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection, mUser.getId(), Const.CBX_GET_MUSCLES, e.getValue() ? 1 : 0);
            } catch (SQLException ex) {
                LOGGER.error("Database error updating user settings", ex);
            }
        });

        mCbxGetHealthy.addValueChangeListener(e -> {
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection, mUser.getId(), Const.CBX_GET_HEALTHY, e.getValue() ? 1 : 0);
            } catch (SQLException ex) {
                LOGGER.error("Database error updating user settings", ex);
            }
        });

        mRgType.addValueChangeListener(event -> {
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection, mUser.getId(), Const.RADIO_GROUP_TYPE, mRgType.getValue());
            } catch (SQLException e) {
                LOGGER.error("Database error updating drink type", e);
            }
        });

        mCbRegion = new ComboBox<>("🌍 Länderküche");

        try (Connection connection = DbUtils.getConnection()) {
            List<String> regions = DbUtils.getAllCountryKitchens(connection);
            List<String> sortedRegions = new java.util.ArrayList<>(regions.stream()
                    .sorted(String.CASE_INSENSITIVE_ORDER)
                    .toList());
            mCbRegion.setItems(sortedRegions);
        } catch (SQLException e) {
            LOGGER.error("Error loading regions list", e);
        }

        if (!mPremiumActive) {
            mCbRegion.setEnabled(false);
        }

        ButtonWithPulseEffect btnExcludeIngredients = new ButtonWithPulseEffect("🚫 Zutaten ausschließen");
        btnExcludeIngredients.getStyle().set("font-size", "18px");
        btnExcludeIngredients.getStyle().set("width", "auto");
        btnExcludeIngredients.getStyle().set("height", "auto");
        btnExcludeIngredients.addClickListener((ComponentEventListener<ClickEvent<Button>>)
                buttonClickEvent -> new DialogFoodPreference());

        Hr divider2 = new Hr();
        divider2.getStyle().set("border", "1px solid gray").set("margin", "10px 0");
        Hr divider4 = new Hr();
        divider4.getStyle().set("border", "1px solid gray").set("margin", "10px 0");

        VerticalLayout detailsContent = new VerticalLayout(mRgType, hLCbxs1, divider2, mRgWeight,
                hLCbxs2, divider4, btnExcludeIngredients);
        Details details = new Details("📍 Deine Konfiguration", detailsContent);

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
        if (mSliderDiversity.getValue() == null) {
            mSliderDiversity.setValue(2);
        }
        if (mSliderDuration.getValue() == null) {
            mSliderDuration.setValue(2);
        }
        if (mSliderCost.getValue() == null) {
            mSliderCost.setValue(2);
        }
        if (mSliderPortions.getValue() == null) {
            mSliderPortions.setValue(2);
        }
    }

    private String getPromptV2(String provider) {
        String goal = "";
        if (mRgWeight.getValue() != null) {
            goal += mRgWeight.getValue();
        }
        if (mCbxGetMuscles.getValue()) {
            goal += " Muskelaufbau, ";
        }
        if (mCbxGetHealthy.getValue()) {
            goal += "Gesunde Ernährung, ";
        }

        List<String> likedList = new LinkedList<>();
        List<String> dislikedList = new LinkedList<>();

        try (Connection connection = DbUtils.getConnection()) {
            LinkedHashSet<FoodPreference> likedFoods = DbUtils.readFoodPreference(
                    connection, mUser.getId(), true);
            LinkedHashSet<FoodPreference> dislikedFoods = DbUtils.readFoodPreference(
                    connection, mUser.getId(), false);

            for (FoodPreference food : likedFoods) {
                likedList.add(food.getName());
            }
            for (FoodPreference food : dislikedFoods) {
                dislikedList.add(food.getName());
            }
        } catch (SQLException e) {
            LOGGER.error("Error reading food preferences", e);
        }

        return generateRecipePrompt(
                provider,
                mSliderDiversity.getHelperText(),
                mSliderDuration.getHelperText(),
                mSliderCost.getHelperText(),
                mSliderPortions.getValue(),
                mRadioGroup.getValue(),
                mTextAdditional.getValue(),
                goal,
                likedList,
                dislikedList);
    }

    public String generateRecipePrompt(
            String provider,
            String shoppingOptions,
            String maxPreparationTime,
            String budget,
            Integer portions,
            String recipeWish,
            String mealType,
            String goal,
            List<String> favoriteIngredients,
            List<String> dislikedIngredients
    ) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Erstelle ein abwechslungsreiches, leckeres Rezept basierend auf den folgenden Parametern:\n\n");

        if (mRgType.getValue() != null) {
            switch (mRgType.getValue()) {
                case "Ich esse alles" -> {
                    prompt.append("- Omnivor.\n");
                }
                case "Vegetarisch" -> prompt.append("- Vegetarisch.\n");
                case "Vegan" -> prompt.append("- Vegan.\n");
            }
        }

        if (mCbRegion.getValue() != null && !mCbRegion.getValue().isEmpty()) {
            if (mCbRegion.getValue().length() < 200) {
                prompt.append("Länderküche: ").append(mCbRegion.getValue()).append("\n");
            }
        } else {
            prompt.append("\n");
        }

        if (shoppingOptions != null) {
            prompt.append("- **Zutatenvielfalt:** ").append(shoppingOptions).append("\n");
        }
        if (maxPreparationTime != null) {
            prompt.append("- **Maximale Zubereitungszeit:** ").append(maxPreparationTime).append(" Minuten\n");
        }
        if (budget != null) {
            prompt.append("- **Budget:** ").append(budget).append("\n");
        }
        if (portions != null) {
            prompt.append("- **Anzahl der Portionen:** ").append(portions).append("\n");
        }

        if (mPremiumActive) {
            if (recipeWish != null && !recipeWish.isEmpty()) {
                prompt.append("- **Rezeptwunsch:** ").append(recipeWish).append("\n");
            }
        }

        prompt.append("- **Art des Essens:** ").append(mealType).append("\n");
        prompt.append("- **Ziel:** ").append(goal).append("\n");

        if (favoriteIngredients != null && !favoriteIngredients.isEmpty()) {
            prompt.append("- **Beliebte Zutaten:** ")
                    .append(favoriteIngredients).append("\n");
        }
        if (dislikedIngredients != null && !dislikedIngredients.isEmpty()) {
            prompt.append("- **Unbeliebte Zutaten:** ")
                    .append(dislikedIngredients).append("\n");
        }

        String allowFishWithMeat = new Random().nextInt(60) % 7 == 0 ? "Ja" : "Nein";

        prompt.append("### Wichtige Regeln für das Rezept:\n");
        prompt.append("1. **Keine Wiederholungen!** Vermeide eintönige Zutaten-Kombinationen und variiere das Rezept kreativ.\n");
        prompt.append("2. **Schmackhaft & praktikabel!** Das Rezept soll köstlich, realistisch und leicht umsetzbar sein.\n");
        prompt.append("3. **Zutaten clever anpassen!** Falls bestimmte Zutaten nicht ausreichen, ergänze logische Alternativen.\n");
        prompt.append("4. **Fisch-Fleisch-Kombination erlaubt: ").append(allowFishWithMeat).append("**\n");
        prompt.append("5. **Struktur der Ausgabe (im Markdown-Format):**\n\n");

        prompt.append("**👨‍🍳 Rezept für ").append(portions).append(" Personen**  \n");
        prompt.append("### 🍽️ {Rezeptname}\n\n");
        prompt.append("🕒 **Zubereitungszeit:** ").append(maxPreparationTime).append(" Minuten  \n");
        prompt.append("💰 **Kosten:** {geschätzte Preisklasse in €}  \n");
        prompt.append("🛒 **Zutaten & Einkaufstipp:**\n");
        prompt.append("- {Zutatenliste mit Mengenangaben}\n");
        prompt.append("- Falls sinnvoll: Hinweis, wo man eine spezielle Zutat am besten bekommt\n\n");

        prompt.append("### 🔥 Zubereitung:\n");
        prompt.append("1. {Schritt-für-Schritt-Anleitung in lockerem, modernem Ton mit Emojis}\n");
        prompt.append("2. {Vermeide zu lange Erklärungen – direkt und auf den Punkt}\n\n");

        prompt.append("✨ **Tipp:** Falls du eine Zutat ersetzen musst, schlage geschmacklich passende Alternativen vor!\n\n");

        if (!provider.equals(Const.RADIO_GROUP_API_GROK)) {
            prompt.append("🚀 **Wichtig:**\n");
            prompt.append("- Keine Begründungen für die Auswahl der Zutaten oder des Rezepts geben.\n");
            prompt.append("- Antworte **knapp und effizient**, damit die Berechnung schnell bleibt!\n\n");
        }

        prompt.append("Lass deiner Kreativität freien Lauf, aber immer mit dem Fokus: **abwechslungsreiche," +
                      " leckere und einfach umsetzbare Gerichte!**\n\n");

        if (mUserSetting.isRequestJson()) {
            prompt.append("Gib das Ergebnis in zwei Formaten aus:\n" +
                          "\n" +
                          "1. Zuerst ein benutzerfreundliches Format mit Emojis und schöner Formatierung.\n" +
                          "\n" +
                          "2. Danach füge einen JSON-Block ein mit dem Format:\n" +
                          "\n" +
                          "```json\n" +
                          "{\n" +
                          "  \"title\": \"Titel des Rezepts\",\n" +
                          "  \"preparationTime\": \"Zubereitungszeit (z.B. 20 Minuten)\",\n" +
                          "  \"cost\": \"Kostenbereich (z.B. 8-10 €)\",\n" +
                          "  \"servings\": 2,\n" +
                          "  \"ingredients\": [\n" +
                          "    {\"name\": \"Zutat 1\", \"quantity\": \"150\", \"unit\": \"g\"},\n" +
                          "    {\"name\": \"Zutat 2\", \"quantity\": \"1\", \"unit\": \"\"}\n" +
                          "  ],\n" +
                          "  \"instructions\": [\n" +
                          "    \"Schritt 1: Beschreibung\",\n" +
                          "    \"Schritt 2: Beschreibung\"\n" +
                          "  ],\n" +
                          "  \"tips\": \"Optionale Tipps zum Rezept\",\n" +
                          "  \"importantNotes\": \"Wichtige Hinweise zur Zubereitung\"\n" +
                          "}\n" +
                          "```\n" +
                          "\n" +
                          "Achte darauf, dass der JSON-Block korrekt formatiert ist und alle erforderlichen Felder enthält.\n\n");
        }

        return prompt.toString();
    }

    public static void saveRecipeFromApiResponse(String username, String apiResponse, long apiLogId) {
        try (Connection connection = DbUtils.getConnection()) {
            // Benutzer-ID holen
            int userId = DbUtils.getUserIdByUsername(connection, username);
            if (userId <= 0) {
                throw new RuntimeException("Benutzer nicht gefunden: " + username);
            }

            // Rezept aus der JSON-API-Antwort extrahieren
            Recipe recipe = JSONRecipeExtractor.extractRecipeFromJson(apiResponse, userId);
            if (recipe == null) {
                throw new RuntimeException("Konnte kein Rezept aus der API-Antwort extrahieren.");
            }

            // Rezept in der Datenbank speichern
            long recipeId = RecipeDbUtils.insertRecipe(connection, recipe, apiLogId);

            System.out.println("Rezept erfolgreich gespeichert mit ID: " + recipeId);
        } catch (Exception e) {
            System.err.println("Fehler beim Speichern des Rezepts: " + e.getMessage());
        }
    }

    /**
     * Beispiel zur Erweiterung der bestehenden insertApiLog-Methode, um automatisch Rezepte zu erkennen
     */
    public static long insertApiLogAndDetectRecipe(Connection connection, String username,
                                                   String prompt, String response, String focusPhrase, String api, long executionTime) {
        // Bestehende Methode aufrufen
        long apiLogId = DbUtils.insertApiLog(connection, username, prompt, response, focusPhrase, api, executionTime, "food");

        // Prüfen, ob die Antwort ein Rezept enthält (Entweder JSON oder Text)
        if (apiLogId > 0 && (prompt.toLowerCase().contains("rezept") || response.toLowerCase().contains("zutaten"))) {
            try {
                int userId = DbUtils.getUserIdByUsername(connection, username);
                Recipe recipe = JSONRecipeExtractor.extractRecipeFromJson(response, userId);
                if (recipe != null) {
                    RecipeDbUtils.insertRecipe(connection, recipe, apiLogId);
                }
            } catch (Exception e) {
                System.err.println("Fehler beim automatischen Speichern des Rezepts: " + e.getMessage());
                // Fehler nicht werfen, damit die API-Log-ID trotzdem zurückgegeben wird
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
                            "🔮 Du hast das magische Limit der kostenlosen Version berührt!<br>" +
                            "✨ Entfessle unbegrenzte Anfragen und exklusive Zauber mit dem Premium-Upgrade! 🪄");

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
        hLayoutSlidersRow1.setFlexGrow(0.5, mSliderDiversity);
        hLayoutSlidersRow1.setFlexGrow(0.5, mSliderDuration);
        hLayoutSlidersRow2.setWidth("90%");
        hLayoutSlidersRow2.setFlexGrow(0.5, mSliderCost);
        hLayoutSlidersRow2.setFlexGrow(0.5, mSliderPortions);
    }

    private void initRadioGroup() {
        mRadioGroup = new RadioButtonGroupWithPulseEffect<>();
        mRadioGroup.setItems("Frühstück", "Mittagessen", "Abendessen", "Snack");
        mRadioGroup.setValue("Frühstück");
        mRadioGroup.getChildren().forEach(component -> {
            component.getElement().getStyle().set("margin-left", "30px");
            component.getElement().getStyle().set("margin-right", "30px");
        });
        add(mRadioGroup);

        LocalTime now = LocalTime.now();
        if (now.isBefore(LocalTime.of(10, 0))) {
            mRadioGroup.setValue("Frühstück");
        } else if (now.isBefore(LocalTime.of(16, 0))) {
            mRadioGroup.setValue("Mittagessen");
        } else {
            mRadioGroup.setValue("Abendessen");
        }
        mRadioGroup.getStyle().set("margin-top", "10px");
        mRadioGroup.getStyle().set("margin-bottom", "10px");
    }

    private void initSliders(User user) {
        mSliderDiversity = new PaperSlider("Zutatenvielfalt");
        mSliderDiversity.setMin(1);
        mSliderDiversity.setMax(4);
        mSliderDiversity.setMaxMarkers(1);
        mSliderDiversity.setWidth(COMPONENT_WIDTH);
        mSliderDiversity.setWidthFull();
        mSliderDiversity.setHeight(SLIDER_HEIGHT);
        mSliderDiversity.setPinned(true);
        mSliderDiversity.setSnaps(true);
        mSliderDiversity.addThemeVariants(PaperSliderVariant.LUMO_SECONDARY);
        mSliderDiversity.addValueChangeListener(event -> {
            if (event.getValue() == null) {
                return;
            }
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection,
                        user.getId(), Const.SLIDER_DIVERSITY, event.getValue());
            } catch (SQLException e) {
                LOGGER.error("Error updating diversity settings", e);
            }
            switch (event.getValue()) {
                case 1:
                    mSliderDiversity.setHelperText("minimal");
                    break;
                case 2:
                    mSliderDiversity.setHelperText("wenig");
                    break;
                case 3:
                    mSliderDiversity.setHelperText("normal");
                    break;
                case 4:
                    mSliderDiversity.setHelperText("groß");
            }
        });

        mSliderDuration = new PaperSlider("Zubereitungszeit");
        mSliderDuration.setMin(1);
        mSliderDuration.setMax(4);
        mSliderDuration.setMaxMarkers(1);
        mSliderDuration.setWidth(COMPONENT_WIDTH);
        mSliderDuration.setWidthFull();
        mSliderDuration.setHeight(SLIDER_HEIGHT);
        mSliderDuration.setPinned(true);
        mSliderDuration.setSnaps(true);
        mSliderDuration.addThemeVariants(PaperSliderVariant.LUMO_SECONDARY);
        mSliderDuration.addValueChangeListener(event -> {
            if (event.getValue() == null) {
                return;
            }
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection,
                        user.getId(), Const.SLIDER_DURATION, event.getValue());
            } catch (SQLException e) {
                LOGGER.error("Error updating duration settings", e);
            }
            switch (event.getValue()) {
                case 1:
                    mSliderDuration.setHelperText("5-10 Min.");
                    break;
                case 2:
                    mSliderDuration.setHelperText("15-30 Min.");
                    break;
                case 3:
                    mSliderDuration.setHelperText("30-60 Min.");
                    break;
                case 4:
                    mSliderDuration.setHelperText(">1 Stunde");
            }
        });

        mSliderCost = new PaperSlider("Kosten");
        mSliderCost.setMin(1);
        mSliderCost.setMax(4);
        mSliderCost.setMaxMarkers(1);
        mSliderCost.setWidth(COMPONENT_WIDTH);
        mSliderCost.setWidthFull();
        mSliderCost.setHeight(SLIDER_HEIGHT);
        mSliderCost.setPinned(true);
        mSliderCost.setSnaps(true);
        mSliderCost.addThemeVariants(PaperSliderVariant.LUMO_SECONDARY);
        mSliderCost.addValueChangeListener(event -> {
            if (event.getValue() == null) {
                return;
            }
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection,
                        user.getId(), Const.SLIDER_COST, event.getValue());
            } catch (SQLException e) {
                LOGGER.error("Error updating cost settings", e);
            }
            switch (event.getValue()) {
                case 1:
                    mSliderCost.setHelperText("sparsam");
                    break;
                case 2:
                    mSliderCost.setHelperText("bedacht");
                    break;
                case 3:
                    mSliderCost.setHelperText("teuer");
                    break;
                case 4:
                    mSliderCost.setHelperText("Geld spielt keine Rolle");
            }
        });

        mSliderPortions = new PaperSlider("Portionen");
        mSliderPortions.setMin(1);
        mSliderPortions.setMax(12);
        mSliderPortions.setMaxMarkers(1);
        mSliderPortions.setWidth(COMPONENT_WIDTH);
        mSliderPortions.setWidthFull();
        mSliderPortions.setHeight(SLIDER_HEIGHT);
        mSliderPortions.setPinned(true);
        mSliderPortions.setSnaps(true);
        mSliderPortions.addThemeVariants(PaperSliderVariant.LUMO_SECONDARY);
        mSliderPortions.addValueChangeListener(event -> {
            if (event.getValue() == null) {
                return;
            }
            try (Connection connection = DbUtils.getConnection()) {
                DbUtils.updateUserSettings(connection,
                        user.getId(), Const.SLIDER_PORTIONS, event.getValue());
            } catch (SQLException e) {
                LOGGER.error("Error updating portions settings", e);
            }
            mSliderPortions.setHelperText(event.getValue() + " " + (event.getValue() > 1 ? "Portionen" : "Portion"));
        });

        if (mUserSetting != null) {
            if (mUserSetting.getSliderDiversity() == 0) {
                mSliderDiversity.setValue(2);
            } else {
                mSliderDiversity.setValue(mUserSetting.getSliderDiversity());
            }
            if (mUserSetting.getSliderDuration() == 0) {
                mSliderDuration.setValue(2);
            } else {
                mSliderDuration.setValue(mUserSetting.getSliderDuration());
            }
            if (mUserSetting.getSliderCost() == 0) {
                mSliderCost.setValue(2);
            } else {
                mSliderCost.setValue(mUserSetting.getSliderCost());
            }
            if (mUserSetting.getSliderPortions() == 0) {
                mSliderPortions.setValue(2);
            } else {
                mSliderPortions.setValue(mUserSetting.getSliderPortions());
            }
        }
    }

    // Hilfsmethode zum Erstellen einer farbigen Warnung
    private Component createHelperComponent(int remainingChars) {
        Span span = new Span("Noch " + remainingChars + " Zeichen übrig");

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
                "<meta name=\"description\" content=\"Zauberkoch generiert personalisierte Kochrezepte für dich und bietet eine intuitive GUI. Starte jetzt!\">");
        Html metaKeywords = new Html(
                "<meta name=\"keywords\" content=\"zauberkoch, kochrezepte, personalisiert, intuitive gui\">");
        Html ogTitle = new Html(
                "<meta property=\"og:title\" content=\"Zauberkoch - Personalisierte Kochrezepte\">");
        Html ogImage = new Html(
                "<meta property=\"og:image\" content=\"https://app.zauberkoch.com/images/logo.jpg\">");

        getElement().appendChild(metaDescription.getElement());
        getElement().appendChild(metaKeywords.getElement());
        getElement().appendChild(ogTitle.getElement());
        getElement().appendChild(ogImage.getElement());
    }

    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        if (!SecurityUtils.isLoggedIn()) {
            event.rerouteTo("/login");
        }
    }
}