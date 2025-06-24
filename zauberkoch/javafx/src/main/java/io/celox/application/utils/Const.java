package io.celox.application.utils;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class Const {

    // TODO: add controller to retrieve debug and release fields

    /*
     * DB-Connection
     * */
    public static final String MYSQL_DB_URL = "jdbc:mysql://localhost:3306/";
    //    public static final String MARIADB_DB_URL = "jdbc:mariadb:////localhost:3306/";
    public static final String MYSQL_JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";
    //    public static final String MYSQL_JDBC_DRIVER = "com.mysql.jdbc.Driver";
    //    public static final String MARIADB_JDBC_DRIVER = "org.mariadb.jdbc.Driver";
    public static final String DB_USER = "martin";
    public static final String DB_PASSWORD = "N)ZyhegaJ#YLH(c&Jhx7";

    public static final String SALTED_BY_TYSON = "SaltedByTyson!";

    /*
     * Server
     * */
    public static final String RC_VERSION = "🌙 rc-";

//        public static final String SERVER_URL = "http://localhost:8080";
    public static final String SERVER_URL = "https://app.zauberkoch.com";

    public static final String OAUTH_LINK = "";

    public static final String SERVER_URL_NGROK = "https://random-id.ngrok.io";

    /*
     * OpenAI ChatGPT
     * */
    public static final String GPT_API_URL = "https://api.openai.com/v1/chat/completions";
    public static final String GPT_API_KEY = "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";
    public static final int GPT_MAX_TOKENS = 1500;

    /*
     * Grok
     * */
    public static final String GROK_API_URL = "https://api.x.ai/v1/chat/completions";
    public static final String GROK_API_KEY =
            "xai-Os0QkBVJ5jZcaiklMECcBowmMXxeARwcYA2x2QmV8JAjsBurS5xUmhvzbTQZrJfIIZLKhgWnZn2P1YIb";
    public static final int GROK_MAX_TOKENS = 1500;

    /*
     * DeepSeek
     * */
    public static final String DS_API_KEY = "sk-ddd86706a99345e1928bd8838350122c";

    /*
     * PayPal (Sandbox)
     * */
    // public static final String PAYPAL_API_URL_SANDBOX = "https://api-m.sandbox.paypal.com";
    public static final String PAYPAL_CLIENT_ID_SANDBOX =
            "AevlAWrlp5yyjHwIcLggTjPFziuK9deeQ9V8-Vz4XQIOs7OtC7sl6-BIL1p959Ztgjm-73aPDzhZw8e6";
    public static final String PAYPAL_SECRET_SANDBOX =
            "EK4719qlpFLO8VtZY8RKRsWOU7BTTZ97jNaLsJUeFH4xQ54UOFDwc2WHKTGo_yBiuZ1mDJQW_bDQMGw9";

    /*
     * PayPal (Live)
     * */
    public static final String PAYPAL_API_URL_LIVE = "https://api-m.paypal.com";
    public static final String PAYPAL_API_SUBSCRIPTION_URL_LIVE = "https://api.paypal.com/v1/billing/subscriptions/";
    public static final String PAYPAL_CLIENT_ID_LIVE =
            "AbP9XEbG_WzDTLhMTvIrZjaTLz_QkHGc4aHweIiX4MnfVrN1uag7pwhzKdGhd9NxchzoMIpr-hOH-VDf";
    public static final String PAYPAL_SECRET_LIVE =
            "EFj5zfe-PgsWNkv69gERYGUDSSfHOgE098q243-h47UzQ3BpWST02RlVl8ZUCYlBxQ0ArLf56DGreeIX";

    /*
     * PayPal Subscription (Live)
     * */
    //    public static final String PAYPAL_SUBSCRIPTION_PLAN_ID = "P-2S88146304729793GM6ZUYKI";
    public static final String PAYPAL_SUBSCRIPTION_PLAN_ID = "P-3FC35295DJ6051820M7FDZBQ";

    public static final String THEME_SESSION_KEY = "THEME_SESSION_KEY";

    public static final String IP_API_URL = "http://ip-api.com/json/%s?" +
                                            "fields=status,message,country,region,city,district,isp,org,mobile,query";

    public static final int FREE_WEEKS_PREMIUM_AFTER_REG = 1;
    public static final long ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
    public static final long ONE_MONTH_PREMIUM_SUBSCRIPTION = ONE_WEEK_IN_MS * 4L;

    public static final int REMAINING_CHARACTERS_TO_WARN = 50;
    public static final int MAX_LENGTH_TF_ADDITIONAL = 160;

    public static final boolean ONLY_DISLIKED_FOOD = true;

    public static final int COUNTDOWN_REDIRECT = 5;

    public static final int NOTIFICATION_DURATION_DEFAULT = 1500;
    public static final int NOTIFICATION_DURATION_LONG = 3500;

    public static final String RADIO_GROUP_TYPE = "rg_type";
    public static final String RADIO_GROUP_TYPE_DRINK = "rg_type_drink";
    public static final String RADIO_GROUP_GOAL = "rg_goal";
    public static final String RADIO_GROUP_STYLE_DRINK = "rg_style_drink";
    public static final String RADIO_GROUP_API = "rg_api";
    public static final String RADIO_GROUP_API_CHAT_GPT = "chat_gpt";
    public static final String RADIO_GROUP_API_GROK = "grok";
    public static final String SLIDER_DIVERSITY = "slider_diversity";
    public static final String SLIDER_DIVERSITY_DRINK = "slider_diversity_drink";
    public static final String SLIDER_DURATION = "slider_duration";
    public static final String SLIDER_COMPLEXITY_DRINK = "slider_complexity_drink";
    public static final String SLIDER_COST = "slider_cost";
    public static final String SLIDER_ALCOHOL_CONTENT_DRINK = "slider_alcohol_content_drink";
    public static final String SLIDER_PORTIONS = "slider_portions";
    public static final String SLIDER_GLASSES_DRINK = "slider_glasses_drink";
    public static final String CBX_GET_MUSCLES = "cbx_get_muscles";
    public static final String CBX_GET_HEALTHY = "cbx_get_healthy";
    public static final String CBX_FRUITY_DRINK = "cbx_fruity_drink";
    public static final String CBX_DESSERT_DRINK = "cbx_dessert_drink";
    public static final String EXPANDABLE_LAYOUT_OPEN = "expandable_layout_open";
    public static final String CBX_REDUCE_ANIMATIONS = "cbx_reduce_animations";

    public static final int ALLOWED_REQUESTS_PRO = 10;
    public static final int ALLOWED_REQUESTS_TIMEFRAME_PRO = 10;
    public static final int ALLOWED_REQUESTS_FREE = 3;
    public static final int ALLOWED_REQUESTS_TIMEFRAME_FREE = 1440;

    public static final int REFERRAL_BONUS_FREE_MONTHS = 3;
    public static final int REFERRAL_USAGE_TO_GET_BONUS = 3;

    /**
     * Animations from Lotti Files
     *
     * @see <a href="https://app.lottiefiles.com/">Lotti Files</a>}
     */
    public static final String LOTTIE_COOKING_XXL =
            "https://lottie.host/54fac74d-e653-49a3-863d-2537eaadd615/Ovl6Gbko71.json";
    public static final String LOTTIE_COOKING_POT_SIMPLE =
            "https://lottie.host/a7942354-665d-4084-83fb-f4692cea2936/KV5001AKXa.json";
    public static final String LOTTIE_COOKING_ITALIA =
            "https://lottie.host/dd0f01cc-6dba-4c6c-a3b5-7dbf73186a3a/wk02VSgsyr.json";
    public static final String LOTTIE_COCKTAIL =
            "https://lottie.host/d4420f35-ba6b-470f-ab28-d78c7600ef53/XPCuyQYPYU.json";

}
