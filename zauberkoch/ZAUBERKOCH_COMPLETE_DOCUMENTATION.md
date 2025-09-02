# ZauberKoch - Vollständige Technische Dokumentation

## Inhaltsverzeichnis

1. [Projektübersicht](#1-projektübersicht)
2. [Technologie-Stack](#2-technologie-stack)
3. [Projektstruktur](#3-projektstruktur)
4. [Datenbankarchitektur](#4-datenbankarchitektur)
5. [Model-Klassen](#5-model-klassen)
6. [Authentication & Security System](#6-authentication--security-system)
7. [API-Services Integration](#7-api-services-integration)
8. [Views und UI-Komponenten](#8-views-und-ui-komponenten)
9. [Custom Components](#9-custom-components)
10. [Utility-Klassen](#10-utility-klassen)
11. [Frontend-Architektur](#11-frontend-architektur)
12. [Services und Business-Logik](#12-services-und-business-logik)
13. [Konfiguration und Properties](#13-konfiguration-und-properties)
14. [Build und Deployment](#14-build-und-deployment)
15. [Feature-Übersicht](#15-feature-übersicht)

---

## 1. Projektübersicht

**ZauberKoch** ist eine KI-gestützte Rezeptgenerierungs-Webanwendung, die personalisierte Koch- und Cocktailrezepte erstellt. Die Anwendung nutzt modernste AI-Technologien (OpenAI GPT-4, DeepSeek, Grok) und bietet ein Premium-Abonnement-Modell mit PayPal-Integration.

### Hauptmerkmale:
- **KI-Rezeptgenerierung** mit drei verschiedenen AI-Providern
- **Personalisierung** basierend auf Ernährungspräferenzen
- **Premium-System** mit PayPal-Subscription
- **Referral-System** für kostenlose Premium-Zugänge
- **Mehrsprachigkeit** (Deutsch/Englisch)
- **OAuth2-Integration** mit Google
- **Progressive Web App** (PWA) Support
- **Responsive Design** für Desktop und Mobile

### Zielgruppe:
- Kochbegeisterte und Hobbyköche
- Menschen mit speziellen Ernährungsbedürfnissen
- Cocktail-Enthusiasten
- Nutzer, die neue Rezeptideen suchen

---

## 2. Technologie-Stack

### Backend
- **Framework**: Spring Boot 3.4.2
- **Programmiersprache**: Java 21
- **UI-Framework**: Vaadin 24.6.4
- **Datenbank**: MySQL 8.0
- **Connection Pooling**: HikariCP
- **Build-Tool**: Maven 3.9.5

### Frontend
- **Framework**: React (via Vaadin Flow)
- **Sprachen**: TypeScript, JavaScript
- **Styling**: CSS, Vaadin Themes
- **Build-Tool**: Vite

### AI-Integration
- **OpenAI**: GPT-4o Model
- **DeepSeek**: Custom API
- **Grok**: X.AI Platform

### Weitere Technologien
- **Authentication**: Custom + OAuth2 (Google)
- **Payment**: PayPal Subscriptions API
- **QR-Code**: ZXing Library
- **Markdown**: FlexMark Parser
- **Email**: Spring Mail mit Hostinger SMTP
- **Analytics**: Google Analytics 4
- **PWA**: Service Worker, Web App Manifest

---

## 3. Projektstruktur

```
zauberkoch/
├── src/
│   ├── main/
│   │   ├── java/io/celox/application/
│   │   │   ├── api/                    # API-Integrationen
│   │   │   │   ├── openai/            # OpenAI GPT-4 Integration
│   │   │   │   ├── deepseek/          # DeepSeek API
│   │   │   │   ├── grok/              # Grok AI Integration
│   │   │   │   └── PayPalSubscriptionInfo.java
│   │   │   ├── custom/                 # Custom UI-Komponenten
│   │   │   │   ├── playground/        # Test-Komponenten
│   │   │   │   ├── pulse_effect/      # Animierte Komponenten
│   │   │   │   └── [Basis-Komponenten]
│   │   │   ├── dialogs/               # Dialog-Komponenten
│   │   │   ├── model/                 # Datenmodelle
│   │   │   ├── security/              # Security-Implementierung
│   │   │   ├── service/               # Business-Services
│   │   │   ├── utils/                 # Utility-Klassen
│   │   │   ├── views/                 # UI-Views (18 Views)
│   │   │   └── Application.java       # Hauptklasse
│   │   ├── frontend/                  # Frontend-Code
│   │   │   ├── generated/             # Generierte Vaadin-Dateien
│   │   │   ├── scripts/               # JavaScript-Dateien
│   │   │   ├── styles/                # CSS-Dateien
│   │   │   └── themes/driver/         # Custom Theme
│   │   └── resources/
│   │       ├── META-INF/resources/    # Statische Ressourcen
│   │       ├── messages_de.properties # Deutsche Übersetzungen
│   │       ├── messages_en.properties # Englische Übersetzungen
│   │       ├── application.properties # Spring-Konfiguration
│   │       └── schema.sql             # Datenbank-Schema
│   └── test/                          # Test-Klassen
├── additional/                         # Zusätzliche Dateien
├── pom.xml                            # Maven-Konfiguration
├── package.json                       # NPM-Konfiguration
└── CLAUDE.md                          # Projekt-Dokumentation
```

### Paket-Struktur (79 Java-Klassen)

#### API-Package (9 Klassen)
- OpenAI: ChatGptClient, OpenAiController, OpenAiService
- DeepSeek: DeepSeekApiService, DeepSeekController
- Grok: GrokAiClient
- Sonstige: DataEndpoint, PayPalSubscriptionInfo

#### Custom-Package (13 Klassen)
- Basis: CardView, FoodPreferenceModule, LanguageSwitcher, MarkdownView
- Playground: 5 Playground-Varianten für Tests
- Pulse-Effects: 4 animierte Komponenten

#### Dialogs-Package (2 Klassen)
- DialogFoodPreference
- DialogShareQrCode

#### Model-Package (8 Klassen)
- User, Recipe, RecipeIngredient
- ApiLog, FoodPreference, UserSetting
- IpLocationResponse, ReferralUsageState

#### Security-Package (5 Klassen)
- OAuth2Controller, OAuth2LoginFilter, OAuth2DuplicateRequestFilter
- CustomAuthService, AccessCheckBeforeEnterObserver

#### Service-Package (2 Klassen)
- BruteForceProtectionService
- EmailService

#### Utils-Package (23 Klassen)
- Datenbank: DbUtils, RecipeDbUtils
- Security: SecurityUtils
- Parsing: JSONRecipeExtractor, RecipeParser
- Internationalisierung: I18NService, ApplicationI18NProvider, I18NConfiguration
- UI: GuiUtils, ThemeUtil, ThemeEventBus, ThemeChangeEvent
- Sonstige: Const, Utils, QrCodeGenerator, PasswordGenerator, etc.

#### Views-Package (18 Klassen)
- Hauptlayout: MainLayout
- Authentication: LoginView, RegisterView, ForgotPasswordView, ResetPasswordView, VerificationView
- Hauptfunktionen: FoodView, CocktailView
- Benutzerfunktionen: FavoritesView, HistoryView, ProfilView, PremiumView
- Admin: AdminView, ReferralStatsView, DebugView
- Sonstige: SharedRecipeView, CameraView

---

## 4. Datenbankarchitektur

### Datenbank-Schema: `fooddb`

Die Anwendung verwendet MySQL mit 13 Haupttabellen:

### 4.1 Tabelle: `users`
Zentrale Benutzertabelle mit Authentifizierung und Profildaten.

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10),
    weight FLOAT,
    nationality INT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    premium_expiration DATETIME,
    subscription_id VARCHAR(255),
    last_meal BIGINT,
    active TINYINT DEFAULT 1,
    admin TINYINT DEFAULT 0,
    verified TINYINT DEFAULT 0,
    google_oauth2 TINYINT DEFAULT 0,
    current_usage_count INT DEFAULT 0,
    theme VARCHAR(10) DEFAULT 'light',
    language VARCHAR(5) DEFAULT 'de',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_premium (premium_expiration)
);
```

### 4.2 Tabelle: `recipes`
Speichert generierte Rezepte mit allen Details.

```sql
CREATE TABLE recipes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    api_log_id BIGINT,
    title VARCHAR(500) NOT NULL,
    preparation_time VARCHAR(100),
    cost VARCHAR(100),
    alcohol_content VARCHAR(100),
    servings INT DEFAULT 2,
    instructions TEXT,
    tips TEXT,
    important_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (api_log_id) REFERENCES api_logs(id) ON DELETE SET NULL,
    INDEX idx_user_recipes (user_id, created_at),
    INDEX idx_favorites (user_id, is_favorite)
);
```

### 4.3 Tabelle: `recipe_ingredients`
Zutaten für Rezepte (1:n Beziehung).

```sql
CREATE TABLE recipe_ingredients (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    recipe_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity VARCHAR(100),
    unit VARCHAR(50),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_recipe_ingredients (recipe_id)
);
```

### 4.4 Tabelle: `api_logs`
Protokollierung aller AI-API-Aufrufe.

```sql
CREATE TABLE api_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    prompt TEXT,
    response TEXT,
    focus_phrase VARCHAR(500),
    api_provider VARCHAR(50),
    execution_time BIGINT,
    type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_logs (user_id, created_at),
    INDEX idx_api_provider (api_provider)
);
```

### 4.5 Tabelle: `user_settings`
Benutzereinstellungen für Rezeptgenerierung.

```sql
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    rg_type VARCHAR(50),
    rg_type_drink VARCHAR(50),
    rg_goal VARCHAR(50),
    rg_style_drink VARCHAR(50),
    rg_api VARCHAR(50) DEFAULT 'ChatGPT',
    slider_diversity INT DEFAULT 1,
    slider_diversity_drink INT DEFAULT 1,
    slider_duration INT DEFAULT 1,
    slider_complexity_drink INT DEFAULT 1,
    slider_cost INT DEFAULT 1,
    slider_alcohol_content_drink INT DEFAULT 1,
    slider_portions INT DEFAULT 2,
    slider_glasses_drink INT DEFAULT 2,
    cbx_get_thin TINYINT DEFAULT 0,
    cbx_get_heavy TINYINT DEFAULT 0,
    cbx_get_muscles TINYINT DEFAULT 0,
    cbx_get_healthy TINYINT DEFAULT 0,
    cbx_fruity_drink TINYINT DEFAULT 0,
    cbx_dessert_drink TINYINT DEFAULT 0,
    expandable_layout_open BOOLEAN DEFAULT TRUE,
    request_json BOOLEAN DEFAULT TRUE,
    reduce_animations BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.6 Tabelle: `food_preferences`
Lebensmittelpräferenzen (Mag ich/Mag ich nicht).

```sql
CREATE TABLE food_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_liked BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_food (user_id, name),
    INDEX idx_user_prefs (user_id)
);
```

### 4.7 Tabelle: `referrals`
Referral-System für Premium-Boni.

```sql
CREATE TABLE referrals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    referrer_user_id INT NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    referred_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_referral_code (referral_code),
    INDEX idx_referrer (referrer_user_id)
);
```

### 4.8 Tabelle: `password_reset_tokens`
Token für Passwort-Zurücksetzen.

```sql
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expiry (expiry_date)
);
```

### 4.9 Tabelle: `verification_tokens`
E-Mail-Verifizierung-Token.

```sql
CREATE TABLE verification_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token)
);
```

### 4.10 Tabelle: `brute_force_attempts`
Schutz vor Brute-Force-Angriffen.

```sql
CREATE TABLE brute_force_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL,
    attempt_count INT DEFAULT 1,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP NULL,
    INDEX idx_ip (ip_address),
    INDEX idx_blocked (blocked_until)
);
```

### 4.11 Tabelle: `shared_recipes`
Geteilte Rezepte mit eindeutigen URLs.

```sql
CREATE TABLE shared_recipes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    recipe_id BIGINT NOT NULL,
    share_code VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_count INT DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_share_code (share_code)
);
```

### 4.12 Tabelle: `user_sessions`
Session-Management für eingeloggte Benutzer.

```sql
CREATE TABLE user_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_user_sessions (user_id, is_active)
);
```

### 4.13 Tabelle: `meal` (Legacy)
Alte Tabelle für Mahlzeiten (wird nicht mehr aktiv genutzt).

```sql
CREATE TABLE meal (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titel TEXT NOT NULL,
    description TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vegetarian INT DEFAULT 1,
    vegan INT DEFAULT 1,
    rating INT DEFAULT 0
);
```

### Datenbank-Beziehungen

```
users (1) ←→ (n) recipes ←→ (n) recipe_ingredients
users (1) ←→ (n) api_logs
users (1) ←→ (1) user_settings
users (1) ←→ (n) food_preferences
users (1) ←→ (n) referrals (als referrer und referred)
users (1) ←→ (n) password_reset_tokens
users (1) ←→ (n) verification_tokens
users (1) ←→ (n) user_sessions
recipes (1) ←→ (n) shared_recipes
```

---

## 5. Model-Klassen

### 5.1 User.java
Zentrale Benutzer-Entity mit allen relevanten Eigenschaften.

```java
package io.celox.application.model;

public class User {
    // Kern-Eigenschaften
    private int id;
    private String username;
    private String email;
    private String password;
    
    // Profil-Informationen
    private String firstName;
    private String lastName;
    private Date birthDate;
    private String gender;
    private float weight;
    private int nationality;
    
    // Status-Eigenschaften
    private boolean active;
    private boolean admin;
    private boolean verified;
    private boolean googleOauth;
    
    // Premium-System
    private Date premiumExpiration;
    private String subscriptionId;
    
    // Tracking
    private Date created;
    private Date lastSeen;
    private long lastMeal;
    private int execCount;
    private int referralsCount;
    
    // Einstellungen
    private String language = "de";
    private String theme = "light";
    
    // Konstruktoren
    public User() {}
    
    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }
    
    // Vollständiger Konstruktor für DB-Abfragen
    public User(int id, int active, int admin, String username, String email, 
                String password, String firstName, String lastName, 
                Date premiumExpiration, Date lastSeen, Date birthDate, 
                String gender, int verified) {
        // Initialisierung aller Felder
    }
    
    // Getter und Setter für alle Eigenschaften
    // ...
}
```

### 5.2 Recipe.java
Rezept-Entity für generierte Koch- und Cocktailrezepte.

```java
package io.celox.application.model;

public class Recipe {
    private long id;
    private int userId;
    private Long apiLogId;
    private String title;
    private String preparationTime;
    private String cost;
    private String alcoholContent; // Für Cocktails
    private int servings;
    private List<RecipeIngredient> ingredients;
    private String instructions;
    private String tips;
    private String importantNotes;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private boolean favorite;
    
    // Konstruktor für neues Rezept
    public Recipe(int userId, String title, String preparationTime, 
                  String cost, int servings, List<RecipeIngredient> ingredients,
                  String instructions, String tips, String importantNotes) {
        // Initialisierung
    }
    
    // Getter und Setter
    // ...
}
```

### 5.3 RecipeIngredient.java
Zutaten-Entity für Rezepte.

```java
package io.celox.application.model;

public class RecipeIngredient {
    private long id;
    private long recipeId;
    private String name;
    private String quantity;
    private String unit;
    
    // Konstruktor
    public RecipeIngredient(String name, String quantity, String unit) {
        this.name = name;
        this.quantity = quantity;
        this.unit = unit;
    }
    
    // Getter und Setter
    // ...
}
```

### 5.4 UserSetting.java
Benutzereinstellungen für Rezeptgenerierung.

```java
package io.celox.application.model;

public class UserSetting {
    private int id;
    private long userId;
    private LocalDateTime updated;
    
    // Rezept-Typ Einstellungen
    private String rgType;           // Ernährungstyp (Alles/Vegetarisch/Vegan)
    private String rgTypeDrink;      // Getränketyp
    private String rgGoal;           // Ernährungsziel
    private String rgStyleDrink;     // Getränkestil
    private String rgApi;            // Bevorzugte AI-API
    
    // Slider-Werte (1-5)
    private int sliderDiversity = 1;
    private int sliderDiversityDrink = 1;
    private int sliderDuration = 1;
    private int sliderComplexityDrink = 1;
    private int sliderCost = 1;
    private int sliderAlcoholContentDrink = 1;
    private int sliderPortions = 2;
    private int sliderGlassesDrink = 2;
    
    // Checkboxen
    private int cbxGetThin = 0;
    private int cbxGetHeavy = 0;
    private int cbxGetMuscles = 0;
    private int cbxGetHealthy = 0;
    private int cbxFruityDrink = 0;
    private int cbxDessertDrink = 0;
    
    // UI-Einstellungen
    private boolean expandableLayoutOpen = true;
    private boolean requestJson = true;
    private boolean reduceAnimations = true;
    
    // Getter und Setter
    // ...
}
```

### 5.5 ApiLog.java
Protokollierung von AI-API-Aufrufen.

```java
package io.celox.application.model;

public class ApiLog {
    private long id;
    private String recipe;      // Generierte Antwort
    private String uuid;        // Session-UUID
    private String title;       // Rezepttitel
    private Timestamp timestamp;
    private String type;        // "food" oder "drink"
    private boolean active;
    
    // Konstruktoren und Methoden
    // ...
}
```

### 5.6 FoodPreference.java
Lebensmittelpräferenzen der Benutzer.

```java
package io.celox.application.model;

public class FoodPreference {
    private long id;
    private String name;
    private boolean liked = false;
    
    // Konstruktor
    public FoodPreference(String name, boolean liked) {
        this.name = name;
        this.liked = liked;
    }
    
    @Override
    public String toString() {
        return name + " (" + (liked ? "mag ich" : "mag ich nicht") + ")";
    }
}
```

---

## 6. Authentication & Security System

### 6.1 Architektur-Überblick

ZauberKoch verwendet ein **custom-built Security System** ohne Spring Security:

- **Dual Authentication**: Database + OAuth2 (Google)
- **Session-basierte Authentifizierung** über Vaadin
- **Custom Filter Chain** für HTTP-Requests
- **Role-based Access Control** (RBAC)
- **Brute-Force-Protection**

### 6.2 Authentication-Flow

#### Database-Login-Flow:
1. Benutzer gibt Username/Email + Passwort ein
2. BruteForceProtectionService prüft IP-Sperre
3. CustomAuthService.authenticate():
   - Benutzer-Lookup in Datenbank
   - BCrypt-Passwort-Verifikation
   - Verified-Status-Check
4. SecurityUtils.login() setzt Session-Attribute
5. Navigation zur Hauptseite

#### OAuth2-Login-Flow:
1. Benutzer klickt "Google Login"
2. OAuth2LoginFilter:
   - State-Parameter generieren (CSRF-Schutz)
   - Weiterleitung zu Google
3. Google Authentication
4. OAuth2-Callback:
   - State-Validierung
   - Authorization Code → Access Token
   - User-Info abrufen
5. Database-Integration:
   - Benutzer-Lookup oder Erstellung
   - Session-Attribute setzen

### 6.3 Security-Komponenten

#### CustomAuthService.java
```java
@Service
public class CustomAuthService {
    
    public boolean authenticate(String usernameOrEmail, String password) {
        // OAuth2-Check
        if ("[OAUTH2]".equals(password)) {
            return processOAuth2Login(usernameOrEmail) != null;
        }
        
        // Database-Authentication
        try (Connection conn = DbUtils.getConnection()) {
            User user = DbUtils.getUserByEmailOrUsername(conn, usernameOrEmail);
            if (user != null && user.isVerified()) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                String saltedPassword = password + Const.SALTED_BY_TYSON;
                return encoder.matches(saltedPassword, user.getPassword());
            }
        }
        return false;
    }
    
    public long registerUser(String username, String email, String password) {
        // Duplikats-Check
        // BCrypt-Hashing mit Salt
        // User-Erstellung in DB
    }
}
```

#### SecurityUtils.java
```java
public class SecurityUtils {
    // Session-Attribute
    private static final String USER_SESSION_ATTR = "authenticated-user";
    private static final String ROLES_SESSION_ATTR = "user-roles";
    private static final String AUTH_TYPE_SESSION_ATTR = "auth-type";
    
    public static boolean isLoggedIn() {
        VaadinSession session = VaadinSession.getCurrent();
        return session != null && 
               session.getAttribute(USER_SESSION_ATTR) != null;
    }
    
    public static boolean isAccessGranted(Class<?> viewClass) {
        // Annotation-basierte Zugriffskontrolle
        if (viewClass.isAnnotationPresent(AnonymousAllowed.class)) {
            return true;
        }
        if (!isLoggedIn()) {
            return false;
        }
        if (viewClass.isAnnotationPresent(PermitAll.class)) {
            return true;
        }
        if (viewClass.isAnnotationPresent(RolesAllowed.class)) {
            RolesAllowed annotation = viewClass.getAnnotation(RolesAllowed.class);
            return Arrays.stream(annotation.value())
                .anyMatch(role -> hasRole(role));
        }
        return false;
    }
}
```

#### BruteForceProtectionService.java
```java
@Service
public class BruteForceProtectionService {
    private static final int MAX_ATTEMPTS = 5;
    private static final int BLOCK_DURATION_MINUTES = 10;
    
    private final Map<String, AttemptInfo> attempts = new ConcurrentHashMap<>();
    
    public void registerFailedAttempt(String ip) {
        attempts.compute(ip, (key, info) -> {
            if (info == null) {
                return new AttemptInfo(1, LocalDateTime.now());
            }
            info.incrementAttempts();
            return info;
        });
    }
    
    public boolean isBlocked(String ip) {
        AttemptInfo info = attempts.get(ip);
        if (info == null) return false;
        
        if (info.getAttempts() >= MAX_ATTEMPTS) {
            LocalDateTime blockUntil = info.getLastAttempt()
                .plusMinutes(BLOCK_DURATION_MINUTES);
            return LocalDateTime.now().isBefore(blockUntil);
        }
        return false;
    }
}
```

### 6.4 OAuth2-Integration

#### OAuth2LoginFilter.java
```java
@Component
public class OAuth2LoginFilter extends OncePerRequestFilter {
    // Google OAuth2 Konfiguration
    private static final String CLIENT_ID = "414030832201-...";
    private static final String CLIENT_SECRET = "GOCSPX-...";
    private static final String REDIRECT_URI = "{SERVER_URL}/login/oauth2/code/google";
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) {
        String path = request.getRequestURI();
        
        if (path.equals("/oauth2/authorization/google")) {
            // OAuth2-Flow starten
            String state = generateRandomState();
            request.getSession().setAttribute("oauth2_state", state);
            
            String authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" +
                "client_id=" + CLIENT_ID +
                "&redirect_uri=" + URLEncoder.encode(REDIRECT_URI, "UTF-8") +
                "&response_type=code" +
                "&scope=email%20profile" +
                "&state=" + state;
            
            response.sendRedirect(authUrl);
        }
        // Callback-Handling...
    }
}
```

---

## 7. API-Services Integration

### 7.1 OpenAI GPT-4 Integration

#### ChatGptClient.java
```java
public class ChatGptClient {
    
    public static String askChatGpt(String userMessage) {
        JSONObject requestBody = new JSONObject();
        requestBody.put("model", "gpt-4o");
        
        JSONArray messages = new JSONArray();
        messages.put(new JSONObject()
            .put("role", "system")
            .put("content", "You are a helpful assistant."));
        messages.put(new JSONObject()
            .put("role", "user")
            .put("content", userMessage));
        
        requestBody.put("messages", messages);
        requestBody.put("max_tokens", Const.GPT_MAX_TOKENS);
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(Const.GPT_API_URL))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + Const.GPT_API_KEY)
            .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
            .timeout(Duration.ofSeconds(60))
            .build();
        
        HttpResponse<String> response = HttpClient.newHttpClient()
            .send(request, HttpResponse.BodyHandlers.ofString());
        
        JSONObject jsonResponse = new JSONObject(response.body());
        return jsonResponse.getJSONArray("choices")
            .getJSONObject(0)
            .getJSONObject("message")
            .getString("content");
    }
    
    // Vision API Support
    public static String askChatGptWithImage(String userMessage, String imagePath) {
        String base64Image = encodeImageToBase64(imagePath);
        // Bild-basierte Anfrage...
    }
}
```

### 7.2 Grok AI Integration

#### GrokAiClient.java
```java
public class GrokAiClient {
    
    public static String askGrok(String userInput) {
        JSONObject payload = new JSONObject();
        payload.put("model", "grok-2-latest");
        
        JSONArray messages = new JSONArray();
        messages.put(new JSONObject()
            .put("role", "system")
            .put("content", "You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy."));
        messages.put(new JSONObject()
            .put("role", "user")
            .put("content", userInput));
        
        payload.put("messages", messages);
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(Const.GROK_API_URL))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + Const.GROK_API_KEY)
            .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
            .build();
        
        // Response-Handling...
    }
}
```

### 7.3 DeepSeek Integration

#### DeepSeekApiService.java
```java
@Service
public class DeepSeekApiService {
    private final WebClient webClient;
    
    public DeepSeekApiService() {
        this.webClient = WebClient.builder()
            .baseUrl("https://api.deepseek.com/v1")
            .defaultHeader(HttpHeaders.AUTHORIZATION, Const.DS_API_KEY)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }
    
    public Mono<Map<String, Object>> queryDeepSeek(String inputText) {
        Map<String, String> requestBody = Map.of("query", inputText);
        
        return webClient.post()
            .uri("/generate")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
            .doOnError(error -> System.err.println("DeepSeek API Fehler: " + error.getMessage()));
    }
}
```

### 7.4 Prompt-Engineering

```java
private String getPromptV2(String provider) {
    StringBuilder prompt = new StringBuilder();
    
    prompt.append("Erstelle ein abwechslungsreiches, leckeres Rezept basierend auf den folgenden Parametern:\n\n");
    
    // Ernährungstyp
    if (mRgType.getValue() != null) {
        switch (mRgType.getValue()) {
            case "Ich esse alles" -> prompt.append("- Omnivor.\n");
            case "Vegetarisch" -> prompt.append("- Vegetarisch.\n");
            case "Vegan" -> prompt.append("- Vegan.\n");
        }
    }
    
    // Weitere Parameter
    prompt.append("- **Zutatenvielfalt:** ").append(shoppingOptions).append("\n");
    prompt.append("- **Maximale Zubereitungszeit:** ").append(maxPreparationTime).append(" Minuten\n");
    prompt.append("- **Budget:** ").append(budget).append("\n");
    prompt.append("- **Anzahl der Portionen:** ").append(portions).append("\n");
    
    // Premium-Features
    if (mPremiumActive && recipeWish != null && !recipeWish.isEmpty()) {
        prompt.append("- **Rezeptwunsch:** ").append(recipeWish).append("\n");
    }
    
    // JSON-Output anfordern
    if (mUserSetting.isRequestJson()) {
        prompt.append("\nGib das Ergebnis zusätzlich als JSON aus:\n");
        prompt.append("```json\n{\n");
        prompt.append("  \"title\": \"Titel\",\n");
        prompt.append("  \"preparationTime\": \"Zeit\",\n");
        prompt.append("  \"cost\": \"Kosten\",\n");
        prompt.append("  \"servings\": 2,\n");
        prompt.append("  \"ingredients\": [...],\n");
        prompt.append("  \"instructions\": [...]\n");
        prompt.append("}\n```\n");
    }
    
    return prompt.toString();
}
```

---

## 8. Views und UI-Komponenten

### 8.1 MainLayout.java
Hauptlayout mit Navigation und Theme-Management.

```java
@Component
public class MainLayout extends AppLayout {
    
    private final I18NService i18nService;
    private Button themeToggle;
    private LanguageSwitcher languageSwitcher;
    
    public MainLayout(I18NService i18nService) {
        this.i18nService = i18nService;
        createHeader();
        createDrawer();
        setupThemeHandling();
    }
    
    private void createHeader() {
        H1 logo = new H1("🧙‍♂️ Zauberkoch");
        logo.addClassName("app-title");
        
        // Theme-Toggle-Button
        themeToggle = new Button(new Icon(VaadinIcon.MOON));
        themeToggle.addClickListener(e -> toggleTheme());
        
        // Language-Switcher
        languageSwitcher = new LanguageSwitcher(i18nService);
        
        // User-Menu
        if (SecurityUtils.isLoggedIn()) {
            createUserMenu();
        }
        
        HorizontalLayout header = new HorizontalLayout(logo, themeToggle, languageSwitcher);
        addToNavbar(header);
    }
    
    private void createDrawer() {
        RouterLink foodLink = new RouterLink(i18nService.getMessage("nav.food"), FoodView.class);
        RouterLink cocktailLink = new RouterLink(i18nService.getMessage("nav.cocktails"), CocktailView.class);
        RouterLink favoritesLink = new RouterLink(i18nService.getMessage("nav.favorites"), FavoritesView.class);
        RouterLink historyLink = new RouterLink(i18nService.getMessage("nav.history"), HistoryView.class);
        
        // Premium-Check für spezielle Views
        if (isPremiumUser()) {
            RouterLink premiumLink = new RouterLink("⭐ Premium", PremiumView.class);
            addToDrawer(premiumLink);
        }
        
        // Admin-Check
        if (SecurityUtils.isAdmin()) {
            RouterLink adminLink = new RouterLink("🔧 Admin", AdminView.class);
            addToDrawer(adminLink);
        }
        
        addToDrawer(new VerticalLayout(foodLink, cocktailLink, favoritesLink, historyLink));
    }
}
```

### 8.2 FoodView.java
Hauptview für Rezeptgenerierung.

```java
@Route(value = "", layout = MainLayout.class)
@PageTitle("Essen | Zauberkoch")
@PermitAll
public class FoodView extends VerticalLayout implements BeforeEnterObserver {
    
    private final I18NService i18nService;
    private User mUser;
    private boolean mPremiumActive;
    
    // UI-Komponenten
    private RadioButtonGroupWithPulseEffect<String> mRgType;
    private PaperSlider mSliderDiversity;
    private PaperSlider mSliderDuration;
    private PaperSlider mSliderCost;
    private PaperSlider mSliderPortions;
    private TextField mTextAdditional;
    private CheckboxWithPulseEffect mCbxGetHealthy;
    private ComboBox<String> mCbRegion;
    
    public FoodView(I18NService i18nService) {
        this.i18nService = i18nService;
        initializeUser();
        buildUI();
    }
    
    private void buildUI() {
        // Titel
        H1 title = new H1(i18nService.getMessage("food.title"));
        
        // Ernährungstyp
        mRgType = new RadioButtonGroupWithPulseEffect<>(
            i18nService.getMessage("food.diet.label"),
            List.of("Ich esse alles", "Vegetarisch", "Vegan")
        );
        
        // Slider für Parameter
        mSliderDiversity = createSlider("food.diversity", 1, 5);
        mSliderDuration = createSlider("food.duration", 1, 5);
        mSliderCost = createSlider("food.cost", 1, 5);
        mSliderPortions = createSlider("food.portions", 1, 6);
        
        // Region-Auswahl
        mCbRegion = new ComboBox<>(i18nService.getMessage("food.region"));
        mCbRegion.setItems(getRegions());
        
        // Zusätzliche Wünsche (Premium)
        if (mPremiumActive) {
            mTextAdditional = new TextField(i18nService.getMessage("food.wishes"));
            mTextAdditional.setWidthFull();
        }
        
        // Generate-Button
        ButtonWithExplosionEffect btnGenerate = new ButtonWithExplosionEffect(
            i18nService.getMessage("food.generate"),
            e -> generateRecipe()
        );
        
        // Layout zusammenbauen
        add(title, mRgType, mSliderDiversity, mSliderDuration, 
            mSliderCost, mSliderPortions, mCbRegion);
        
        if (mPremiumActive) {
            add(mTextAdditional);
        }
        
        add(btnGenerate);
    }
    
    private void generateRecipe() {
        // Rate-Limiting prüfen
        if (!checkRateLimit()) {
            showUpgradeDialog();
            return;
        }
        
        // API-Auswahl
        String api = mUserSetting.getRgApi();
        String prompt = buildPrompt();
        
        // Asynchroner API-Call
        CompletableFuture.supplyAsync(() -> {
            if (api.equals("ChatGPT")) {
                return ChatGptClient.askChatGpt(prompt);
            } else {
                return GrokAiClient.askGrok(prompt);
            }
        }).thenAccept(response -> {
            getUI().ifPresent(ui -> ui.access(() -> {
                displayRecipe(response);
                saveToHistory(response);
            }));
        });
    }
}
```

### 8.3 LoginView.java
Anmeldeseite mit Database- und OAuth2-Login.

```java
@Route("login")
@PageTitle("Anmelden | Zauberkoch")
@AnonymousAllowed
public class LoginView extends VerticalLayout {
    
    private final CustomAuthService authService;
    private final BruteForceProtectionService bruteForceService;
    private final I18NService i18nService;
    
    private TextField username;
    private PasswordField password;
    private Button loginButton;
    private Button googleLoginButton;
    
    public LoginView(CustomAuthService authService, 
                     BruteForceProtectionService bruteForceService,
                     I18NService i18nService) {
        this.authService = authService;
        this.bruteForceService = bruteForceService;
        this.i18nService = i18nService;
        
        buildUI();
    }
    
    private void buildUI() {
        setSizeFull();
        setAlignItems(Alignment.CENTER);
        setJustifyContentMode(JustifyContentMode.CENTER);
        
        // Login-Form
        H1 title = new H1("🧙‍♂️ Zauberkoch");
        
        username = new TextField(i18nService.getMessage("login.username"));
        password = new PasswordField(i18nService.getMessage("login.password"));
        
        loginButton = new Button(i18nService.getMessage("login.button"), e -> login());
        loginButton.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        
        // OAuth2-Login
        googleLoginButton = new Button("Mit Google anmelden", e -> loginWithGoogle());
        googleLoginButton.setIcon(new Icon(VaadinIcon.GOOGLE));
        
        // Links
        RouterLink registerLink = new RouterLink(
            i18nService.getMessage("login.register"), 
            RegisterView.class
        );
        RouterLink forgotLink = new RouterLink(
            i18nService.getMessage("login.forgot"), 
            ForgotPasswordView.class
        );
        
        FormLayout formLayout = new FormLayout();
        formLayout.add(username, password, loginButton, googleLoginButton);
        
        add(title, formLayout, registerLink, forgotLink);
    }
    
    private void login() {
        String ip = Utils.getClientIpAddress();
        
        // Brute-Force-Check
        if (bruteForceService.isBlocked(ip)) {
            long remainingMinutes = bruteForceService.getRemainingBlockTime(ip);
            Notification.show(
                i18nService.getMessage("login.blocked", remainingMinutes),
                Notification.Position.MIDDLE
            );
            return;
        }
        
        // Authentifizierung
        if (SecurityUtils.login(username.getValue(), password.getValue(), authService)) {
            UI.getCurrent().navigate("");
        } else {
            bruteForceService.registerFailedAttempt(ip);
            Notification.show(i18nService.getMessage("login.failed"));
        }
    }
    
    private void loginWithGoogle() {
        UI.getCurrent().getPage().setLocation("/oauth2/authorization/google");
    }
}
```

### 8.4 PremiumView.java
Premium-Subscription-Verwaltung mit PayPal.

```java
@Route(value = "premium", layout = MainLayout.class)
@PageTitle("Premium | Zauberkoch")
@PermitAll
public class PremiumView extends VerticalLayout {
    
    private User currentUser;
    private boolean isPremium;
    
    public PremiumView(I18NService i18nService) {
        loadUserData();
        buildUI();
    }
    
    private void buildUI() {
        H1 title = new H1("⭐ Premium Mitgliedschaft");
        
        if (isPremium) {
            showPremiumStatus();
        } else {
            showUpgradeOptions();
        }
    }
    
    private void showUpgradeOptions() {
        // PayPal-Button einbinden
        Div paypalContainer = new Div();
        paypalContainer.setId("paypal-button-container");
        
        // PayPal JavaScript SDK
        UI.getCurrent().getPage().executeJs(
            "paypal.Buttons({" +
            "  createSubscription: function(data, actions) {" +
            "    return actions.subscription.create({" +
            "      'plan_id': '" + Const.PAYPAL_SUBSCRIPTION_PLAN_ID + "'" +
            "    });" +
            "  }," +
            "  onApprove: function(data, actions) {" +
            "    alert('Subscription ID: ' + data.subscriptionID);" +
            "    window.location.href = '/premium/success?subscription_id=' + data.subscriptionID;" +
            "  }" +
            "}).render('#paypal-button-container');"
        );
        
        // Feature-Liste
        VerticalLayout features = new VerticalLayout();
        features.add(new Span("✅ Unbegrenzte Rezepte"));
        features.add(new Span("✅ Erweiterte Einstellungen"));
        features.add(new Span("✅ Keine Werbung"));
        features.add(new Span("✅ Priority Support"));
        
        add(paypalContainer, features);
    }
    
    private void showPremiumStatus() {
        Span status = new Span("✅ Du bist Premium-Mitglied!");
        Span expiry = new Span("Gültig bis: " + formatDate(currentUser.getPremiumExpiration()));
        
        // Subscription-Management
        if (currentUser.getSubscriptionId() != null) {
            Button cancelButton = new Button("Abo kündigen", e -> cancelSubscription());
            add(cancelButton);
        }
        
        add(status, expiry);
    }
}
```

### 8.5 AdminView.java
Administrator-Dashboard.

```java
@Route(value = "admin", layout = MainLayout.class)
@PageTitle("Admin | Zauberkoch")
@RolesAllowed("ADMIN")
public class AdminView extends VerticalLayout {
    
    private Grid<User> userGrid;
    private TextField searchField;
    
    public AdminView() {
        buildUI();
        loadData();
    }
    
    private void buildUI() {
        H1 title = new H1("🔧 Admin Dashboard");
        
        // Statistiken
        HorizontalLayout stats = new HorizontalLayout();
        stats.add(createStatCard("Benutzer", getUserCount()));
        stats.add(createStatCard("API-Calls", getApiCallCount()));
        stats.add(createStatCard("Rezepte", getRecipeCount()));
        
        // Benutzer-Grid
        searchField = new TextField("Suche");
        searchField.addValueChangeListener(e -> filterUsers(e.getValue()));
        
        userGrid = new Grid<>(User.class);
        userGrid.setColumns("id", "username", "email", "premiumExpiration");
        userGrid.addColumn(user -> user.isAdmin() ? "Admin" : "User").setHeader("Rolle");
        userGrid.addColumn(user -> user.isVerified() ? "✅" : "❌").setHeader("Verifiziert");
        
        // Aktionen
        userGrid.addComponentColumn(user -> {
            Button editBtn = new Button("Edit", e -> editUser(user));
            Button deleteBtn = new Button("Delete", e -> deleteUser(user));
            return new HorizontalLayout(editBtn, deleteBtn);
        }).setHeader("Aktionen");
        
        add(title, stats, searchField, userGrid);
    }
    
    private void loadData() {
        try (Connection conn = DbUtils.getConnection()) {
            List<User> users = DbUtils.getAllUsersForAdminView(conn);
            userGrid.setItems(users);
        } catch (SQLException e) {
            Notification.show("Fehler beim Laden der Benutzer");
        }
    }
}
```

---

## 9. Custom Components

### 9.1 ButtonWithExplosionEffect.java
Button mit Sternen-Explosions-Animation.

```java
public class ButtonWithExplosionEffect extends Button {
    
    public ButtonWithExplosionEffect(String text, ComponentEventListener<ClickEvent<Button>> clickListener) {
        super(text);
        
        if (clickListener != null) {
            addClickListener(clickListener);
        }
        
        // JavaScript für Explosions-Effekt
        getElement().executeJs(
            "this.addEventListener('click', function(event) {" +
            "  const rect = this.getBoundingClientRect();" +
            "  const x = event.clientX - rect.left;" +
            "  const y = event.clientY - rect.top;" +
            "  " +
            "  for (let i = 0; i < 20; i++) {" +
            "    const star = document.createElement('div');" +
            "    star.className = 'explosion-star';" +
            "    star.style.left = (rect.left + x) + 'px';" +
            "    star.style.top = (rect.top + y) + 'px';" +
            "    " +
            "    const angle = Math.random() * Math.PI * 2;" +
            "    const speed = Math.random() * 4 + 3;" +
            "    const vx = Math.cos(angle) * speed;" +
            "    const vy = Math.sin(angle) * speed;" +
            "    " +
            "    document.body.appendChild(star);" +
            "    " +
            "    let posX = rect.left + x;" +
            "    let posY = rect.top + y;" +
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
            "      if (opacity > 0) {" +
            "        requestAnimationFrame(animate);" +
            "      } else {" +
            "        document.body.removeChild(star);" +
            "      }" +
            "    };" +
            "    requestAnimationFrame(animate);" +
            "  }" +
            "});"
        );
    }
}
```

### 9.2 CardView.java
Universelle Karten-Komponente für Rezepte.

```java
public class CardView extends Div {
    
    public enum CardContext {
        SHARED, HISTORIC, FAVORITE
    }
    
    public CardView(Recipe recipe, CardContext context, Component parentView) {
        addClassName("card-view-rec");
        
        // Titel
        H3 title = new H3(recipe.getTitle());
        
        // Inhalt
        VerticalLayout content = new VerticalLayout();
        content.add(new Span("⏱ " + recipe.getPreparationTime()));
        content.add(new Span("💰 " + recipe.getCost()));
        content.add(new Span("🍽 " + recipe.getServings() + " Portionen"));
        
        // Aktions-Buttons je nach Kontext
        HorizontalLayout actions = new HorizontalLayout();
        
        if (context == CardContext.FAVORITE) {
            ButtonWithPulseEffect unfavoriteBtn = new ButtonWithPulseEffect(
                VaadinIcon.STAR.create(),
                e -> toggleFavorite(recipe)
            );
            actions.add(unfavoriteBtn);
        }
        
        // Share-Button
        ButtonWithPulseEffect shareBtn = new ButtonWithPulseEffect(
            VaadinIcon.SHARE.create(),
            e -> shareRecipe(recipe)
        );
        actions.add(shareBtn);
        
        // WhatsApp-Share
        String shareUrl = createShareUrl(recipe);
        String whatsappUrl = "https://wa.me/?text=" + URLEncoder.encode(
            "Schau dir dieses Rezept an: " + shareUrl, 
            StandardCharsets.UTF_8
        );
        
        Anchor whatsappLink = new Anchor(whatsappUrl, new Icon(VaadinIcon.PHONE));
        whatsappLink.setTarget("_blank");
        actions.add(whatsappLink);
        
        add(title, content, actions);
    }
    
    private void shareRecipe(Recipe recipe) {
        String shareUrl = createShareUrl(recipe);
        
        // In Zwischenablage kopieren
        UI.getCurrent().getPage().executeJs(
            "navigator.clipboard.writeText($0).then(" +
            "  () => $1.show()," +
            "  () => $2.show()" +
            ")",
            shareUrl,
            Notification.show("Link kopiert! 📋"),
            Notification.show("Fehler beim Kopieren")
        );
    }
}
```

### 9.3 LanguageSwitcher.java
Sprachwechsel-Komponente.

```java
@Component
public class LanguageSwitcher extends ComboBox<Locale> {
    
    private final I18NService i18nService;
    
    @Autowired
    public LanguageSwitcher(I18NService i18nService) {
        this.i18nService = i18nService;
        
        setItems(
            ApplicationI18NProvider.LOCALE_DE,
            ApplicationI18NProvider.LOCALE_EN
        );
        
        setRenderer(new ComponentRenderer<>(locale -> {
            HorizontalLayout layout = new HorizontalLayout();
            
            // Flagge
            String flag = locale.getLanguage().equals("de") ? "🇩🇪" : "🇬🇧";
            Span flagSpan = new Span(flag);
            
            // Sprachname
            String name = locale.getLanguage().equals("de") ? "Deutsch" : "English";
            Span nameSpan = new Span(name);
            
            layout.add(flagSpan, nameSpan);
            return layout;
        }));
        
        setValue(i18nService.getCurrentLocale());
        
        addValueChangeListener(event -> {
            Locale newLocale = event.getValue();
            i18nService.setLocale(newLocale);
            
            // Seite neu laden mit Sprachparameter
            UI.getCurrent().getPage().executeJs(
                "window.location.href = '/?lang=' + $0",
                newLocale.getLanguage()
            );
        });
    }
}
```

---

## 10. Utility-Klassen

### 10.1 Const.java
Zentrale Konfigurationskonstanten.

```java
public class Const {
    // Server-Konfiguration
    public static final String RC_VERSION = "🌙 rc-";
    public static final String SERVER_URL = "https://app.zauberkoch.com";
    
    // Datenbank
    public static final String MYSQL_DB_URL = "jdbc:mysql://localhost:3306/";
    public static final String DB_USER = "martin";
    public static final String DB_PASSWORD = "N)ZyhegaJ#YLH(c&Jhx7";
    public static final String MYSQL_JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";
    public static final String SALTED_BY_TYSON = "SaltedByTyson!";
    
    // OpenAI
    public static final String GPT_API_URL = "https://api.openai.com/v1/chat/completions";
    public static final String GPT_API_KEY = "sk-proj-...";
    public static final int GPT_MAX_TOKENS = 1500;
    
    // Grok AI
    public static final String GROK_API_URL = "https://api.x.ai/v1/chat/completions";
    public static final String GROK_API_KEY = "xai-...";
    
    // DeepSeek
    public static final String DS_API_KEY = "sk-...";
    
    // PayPal
    public static final String PAYPAL_CLIENT_ID_LIVE = "AbP9XEbG_...";
    public static final String PAYPAL_SUBSCRIPTION_PLAN_ID = "P-3FC35295DJ6051820M7FDZBQ";
    
    // Business-Logik
    public static final int FREE_WEEKS_PREMIUM_AFTER_REG = 1;
    public static final int ALLOWED_REQUESTS_PRO = 10;
    public static final int ALLOWED_REQUESTS_TIMEFRAME_PRO = 10; // Minuten
    public static final int ALLOWED_REQUESTS_FREE = 3;
    public static final int ALLOWED_REQUESTS_TIMEFRAME_FREE = 1440; // 24 Stunden
    public static final int REFERRAL_BONUS_FREE_MONTHS = 3;
    public static final int REFERRAL_USAGE_TO_GET_BONUS = 5;
    
    // UI-Konstanten
    public static final int NOTIFICATION_DURATION_DEFAULT = 3000;
    public static final int NOTIFICATION_DURATION_LONG = 5000;
    
    // E-Mail
    public static final String MAIL_FROM = "noreply@zauberkoch.com";
    public static final String MAIL_HOST = "smtp.hostinger.com";
    public static final int MAIL_PORT = 587;
}
```

### 10.2 DbUtils.java
Datenbank-Utilities mit Connection Pooling.

```java
@Component
public class DbUtils {
    private static final Logger LOGGER = Logger.getLogger(DbUtils.class.getName());
    private static final HikariDataSource dataSource;
    
    static {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(Const.MYSQL_DB_URL);
        config.setUsername(Const.DB_USER);
        config.setPassword(Const.DB_PASSWORD);
        config.setMaximumPoolSize(300);
        config.setMinimumIdle(20);
        config.setConnectionTimeout(30000);
        config.setMaxLifetime(1800000);
        dataSource = new HikariDataSource(config);
    }
    
    public static Connection getConnection() {
        try {
            return dataSource.getConnection();
        } catch (SQLException e) {
            throw new RuntimeException("Error establishing database connection", e);
        }
    }
    
    // User-Management
    public static User getUserByUsername(Connection connection, String username) {
        String sql = "SELECT * FROM fooddb.users WHERE username = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToUser(rs);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe("Error fetching user: " + e.getMessage());
        }
        return null;
    }
    
    // Premium-Check mit PayPal-Integration
    public static boolean checkPremiumState(Connection connection, String username) {
        User user = getUserByUsername(connection, username);
        if (user == null) return false;
        
        // PayPal-Subscription prüfen
        if (user.getSubscriptionId() != null && !user.getSubscriptionId().isEmpty()) {
            PayPalSubscriptionInfo paypal = new PayPalSubscriptionInfo();
            String status = paypal.getSubscriptionStatus(user.getSubscriptionId());
            
            if ("ACTIVE".equals(status)) {
                syncPremiumExpiration(connection, user);
                return true;
            }
        }
        
        // Ablaufdatum prüfen
        return user.getPremiumExpiration() != null && 
               user.getPremiumExpiration().after(new Date());
    }
    
    // API-Logging
    public static long insertApiLog(Connection connection, String username, 
                                   String prompt, String response, String focusPhrase,
                                   String api, long executionTime, String type) {
        String sql = "INSERT INTO fooddb.api_logs (user_id, prompt, response, " +
                    "focus_phrase, api_provider, execution_time, type) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try (PreparedStatement ps = connection.prepareStatement(sql, 
                                     Statement.RETURN_GENERATED_KEYS)) {
            int userId = getUserIdByUsername(connection, username);
            ps.setInt(1, userId);
            ps.setString(2, prompt);
            ps.setString(3, response);
            ps.setString(4, focusPhrase);
            ps.setString(5, api);
            ps.setLong(6, executionTime);
            ps.setString(7, type);
            
            ps.executeUpdate();
            
            try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    return generatedKeys.getLong(1);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe("Error inserting API log: " + e.getMessage());
        }
        return -1;
    }
    
    // Rate-Limiting
    public static boolean hasUserExceededLimit(Connection connection, int userId,
                                              int timeframeMinutes, int maxRequests) {
        String sql = "SELECT COUNT(*) as count FROM fooddb.api_logs " +
                    "WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)";
        
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, timeframeMinutes);
            
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("count") >= maxRequests;
                }
            }
        } catch (SQLException e) {
            LOGGER.severe("Error checking rate limit: " + e.getMessage());
        }
        return false;
    }
}
```

### 10.3 JSONRecipeExtractor.java
Extrahiert Rezepte aus AI-Antworten.

```java
public class JSONRecipeExtractor {
    private static final ObjectMapper objectMapper = new ObjectMapper()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    
    public static Recipe extractRecipeFromJson(String aiResponse, int userId) {
        try {
            // JSON-Block extrahieren
            String jsonContent = extractJsonBlock(aiResponse);
            
            if (jsonContent == null) {
                // Fallback zum Text-Parser
                return RecipeParser.parseRecipeFromAiResponse(aiResponse, userId);
            }
            
            // JSON zu DTO
            RecipeJsonDTO recipeDto = objectMapper.readValue(jsonContent, RecipeJsonDTO.class);
            
            // DTO zu Recipe
            List<RecipeIngredient> ingredients = new ArrayList<>();
            if (recipeDto.ingredients != null) {
                for (IngredientDTO ing : recipeDto.ingredients) {
                    ingredients.add(new RecipeIngredient(
                        ing.name,
                        ing.quantity != null ? ing.quantity : "",
                        ing.unit != null ? ing.unit : ""
                    ));
                }
            }
            
            // Instructions zusammenbauen
            String instructions = recipeDto.instructions != null ?
                String.join("\n", recipeDto.instructions) : "";
            
            return new Recipe(
                userId,
                recipeDto.title,
                recipeDto.preparationTime,
                recipeDto.cost,
                recipeDto.servings != null ? recipeDto.servings : 2,
                ingredients,
                instructions,
                recipeDto.tips,
                recipeDto.importantNotes
            );
            
        } catch (Exception e) {
            LOGGER.warning("JSON-Parsing fehlgeschlagen, verwende Text-Parser: " + e.getMessage());
            return RecipeParser.parseRecipeFromAiResponse(aiResponse, userId);
        }
    }
    
    private static String extractJsonBlock(String aiResponse) {
        // Suche nach ```json ... ```
        Pattern pattern = Pattern.compile("```json\\s*(\\{[\\s\\S]*?\\})\\s*```");
        Matcher matcher = pattern.matcher(aiResponse);
        
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        // Alternative: Nach JSON-ähnlichem Block suchen
        pattern = Pattern.compile("\\{\\s*\"title\"\\s*:[\\s\\S]*?\\}(?=\\s*$|[^}])");
        matcher = pattern.matcher(aiResponse);
        
        if (matcher.find()) {
            return matcher.group(0);
        }
        
        return null;
    }
    
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class RecipeJsonDTO {
        public String title;
        public String preparationTime;
        public String cost;
        public String alcoholContent;
        public Integer servings;
        public List<IngredientDTO> ingredients;
        public List<String> instructions;
        public String tips;
        public String importantNotes;
    }
    
    private static class IngredientDTO {
        public String name;
        public String quantity;
        public String unit;
    }
}
```

### 10.4 I18NService.java
Internationalisierungs-Service.

```java
@Service
@Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
public class I18NService {
    
    private final MessageSource messageSource;
    private static final Logger LOGGER = Logger.getLogger(I18NService.class.getName());
    
    @Autowired
    public I18NService(MessageSource messageSource) {
        this.messageSource = messageSource;
    }
    
    public String getMessage(String key, Object... params) {
        Locale locale = getCurrentLocale();
        return getMessage(key, locale, params);
    }
    
    public String getMessage(String key, Locale locale, Object... params) {
        try {
            return messageSource.getMessage(key, params, locale);
        } catch (NoSuchMessageException e) {
            LOGGER.warning("Missing translation for key: " + key + " in locale: " + locale);
            return "???" + key + "???";
        }
    }
    
    public Locale getCurrentLocale() {
        // Priorität: User-Präferenz > Session > Browser > Default
        
        // 1. User-Präferenz aus DB
        if (SecurityUtils.isLoggedIn()) {
            try (Connection conn = DbUtils.getConnection()) {
                User user = DbUtils.getUserByUsername(conn, SecurityUtils.getCurrentUsername());
                if (user != null && user.getLanguage() != null) {
                    return new Locale(user.getLanguage());
                }
            } catch (SQLException e) {
                LOGGER.warning("Could not load user language preference: " + e.getMessage());
            }
        }
        
        // 2. Session-Locale
        VaadinSession session = VaadinSession.getCurrent();
        if (session != null) {
            Locale sessionLocale = session.getLocale();
            if (sessionLocale != null) {
                return sessionLocale;
            }
        }
        
        // 3. Browser-Locale
        UI current = UI.getCurrent();
        if (current != null) {
            Locale browserLocale = current.getLocale();
            if (browserLocale != null && isSupportedLocale(browserLocale)) {
                return browserLocale;
            }
        }
        
        // 4. Default: Deutsch
        return ApplicationI18NProvider.LOCALE_DE;
    }
    
    public void setLocale(Locale locale) {
        // Session-Locale setzen
        VaadinSession.getCurrent().setLocale(locale);
        
        // User-Präferenz in DB speichern
        if (SecurityUtils.isLoggedIn()) {
            try (Connection conn = DbUtils.getConnection()) {
                String username = SecurityUtils.getCurrentUsername();
                DbUtils.updateUserLanguage(conn, username, locale.getLanguage());
            } catch (SQLException e) {
                LOGGER.warning("Could not save language preference: " + e.getMessage());
            }
        }
    }
    
    private boolean isSupportedLocale(Locale locale) {
        return locale.getLanguage().equals("de") || locale.getLanguage().equals("en");
    }
}
```

---

## 11. Frontend-Architektur

### 11.1 Vaadin-React Integration

Die Anwendung nutzt Vaadin Flow mit React-Komponenten:

```typescript
// src/main/frontend/generated/vaadin-react.tsx
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes.js';

function App() {
  return <RouterProvider router={router} />;
}

const outlet = document.getElementById('outlet');
if (outlet) {
  createRoot(outlet).render(<App />);
}
```

### 11.2 Theme-System

```css
/* src/main/frontend/themes/driver/styles.css */
html {
  --lumo-primary-color: #E91E63;
  --lumo-primary-text-color: #E91E63;
}

/* Dark Theme */
html[theme~="dark"] {
  --lumo-base-color: #1e1e1e;
  --lumo-tint-5pct: rgba(255, 255, 255, 0.05);
  --lumo-tint-10pct: rgba(255, 255, 255, 0.1);
  --lumo-primary-color: #FF4081;
}

/* Custom Komponenten-Styles */
.card-view-rec {
  background: var(--lumo-base-color);
  border-radius: var(--lumo-border-radius-l);
  padding: var(--lumo-space-m);
  box-shadow: var(--lumo-box-shadow-s);
  transition: transform 0.2s;
}

.card-view-rec:hover {
  transform: translateY(-4px);
  box-shadow: var(--lumo-box-shadow-l);
}

/* Pulse-Effekt */
.pulse-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: pulse 0.8s ease-out;
}

@keyframes pulse {
  from {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.8;
  }
  to {
    transform: translate(-50%, -50%) scale(8);
    opacity: 0;
  }
}

/* Explosion-Effekt */
.explosion-star {
  position: fixed;
  width: 4px;
  height: 4px;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
}
```

### 11.3 JavaScript-Module

```javascript
// src/main/frontend/scripts/sparkle.js
export function addSparkleEffect(element) {
  element.addEventListener('click', (event) => {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    
    const rect = element.getBoundingClientRect();
    sparkle.style.left = `${event.clientX - rect.left}px`;
    sparkle.style.top = `${event.clientY - rect.top}px`;
    
    element.appendChild(sparkle);
    
    sparkle.addEventListener('animationend', () => {
      sparkle.remove();
    });
  });
}

// Google Analytics Integration
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-H0K2KT8EKX');
```

### 11.4 Service Worker (PWA)

```javascript
// src/main/resources/META-INF/resources/sw.js
const CACHE_NAME = 'zauberkoch-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon.png',
  '/offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});
```

---

## 12. Services und Business-Logik

### 12.1 EmailService.java

```java
@Service
public class EmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    private static final Logger LOGGER = Logger.getLogger(EmailService.class.getName());
    
    public void sendVerificationEmail(String to, String token) {
        String subject = "Zauberkoch - E-Mail-Verifizierung";
        String verificationUrl = Const.SERVER_URL + "/verify?token=" + token;
        
        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
                    .header { background: #E91E63; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .button { 
                        display: inline-block; 
                        padding: 12px 24px; 
                        background: #E91E63; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 4px; 
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🧙‍♂️ Zauberkoch</h1>
                    </div>
                    <div class="content">
                        <h2>Willkommen bei Zauberkoch!</h2>
                        <p>Bitte bestätige deine E-Mail-Adresse:</p>
                        <p><a href="%s" class="button">E-Mail bestätigen</a></p>
                        <p>Oder kopiere diesen Link: %s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(verificationUrl, verificationUrl);
        
        sendHtmlEmail(to, subject, htmlContent);
    }
    
    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Zauberkoch - Passwort zurücksetzen";
        String resetUrl = Const.SERVER_URL + "/reset-password?token=" + token;
        
        String htmlContent = """
            <h2>Passwort zurücksetzen</h2>
            <p>Klicke auf den folgenden Link, um dein Passwort zurückzusetzen:</p>
            <a href="%s">Passwort zurücksetzen</a>
            <p>Der Link ist 24 Stunden gültig.</p>
            """.formatted(resetUrl);
        
        sendHtmlEmail(to, subject, htmlContent);
    }
    
    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(Const.MAIL_FROM);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            LOGGER.info("Email sent to: " + to);
            
        } catch (MessagingException e) {
            LOGGER.severe("Failed to send email to " + to + ": " + e.getMessage());
            throw new RuntimeException("Email could not be sent", e);
        }
    }
}
```

### 12.2 PayPalSubscriptionInfo.java

```java
public class PayPalSubscriptionInfo {
    
    private static final String PAYPAL_API_BASE = "https://api.paypal.com";
    private static final String CLIENT_ID = Const.PAYPAL_CLIENT_ID_LIVE;
    private static final String CLIENT_SECRET = Const.PAYPAL_CLIENT_SECRET_LIVE;
    
    private String accessToken;
    
    public PayPalSubscriptionInfo() {
        this.accessToken = getAccessToken();
    }
    
    private String getAccessToken() {
        try {
            HttpClient client = HttpClient.newHttpClient();
            
            String auth = Base64.getEncoder().encodeToString(
                (CLIENT_ID + ":" + CLIENT_SECRET).getBytes()
            );
            
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(PAYPAL_API_BASE + "/v1/oauth2/token"))
                .header("Authorization", "Basic " + auth)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials"))
                .build();
            
            HttpResponse<String> response = client.send(request, 
                HttpResponse.BodyHandlers.ofString());
            
            JSONObject json = new JSONObject(response.body());
            return json.getString("access_token");
            
        } catch (Exception e) {
            LOGGER.severe("Failed to get PayPal access token: " + e.getMessage());
            return null;
        }
    }
    
    public String getSubscriptionStatus(String subscriptionId) {
        if (accessToken == null) return "UNKNOWN";
        
        try {
            JSONObject subscription = sendGetRequest(
                PAYPAL_API_BASE + "/v1/billing/subscriptions/" + subscriptionId
            );
            
            if (subscription != null && subscription.has("status")) {
                return subscription.getString("status");
            }
        } catch (Exception e) {
            LOGGER.warning("Error getting subscription status: " + e.getMessage());
        }
        
        return "UNKNOWN";
    }
    
    public String getNextBillingTime(String subscriptionId) {
        if (accessToken == null) return null;
        
        try {
            JSONObject subscription = sendGetRequest(
                PAYPAL_API_BASE + "/v1/billing/subscriptions/" + subscriptionId
            );
            
            if (subscription != null && subscription.has("billing_info")) {
                JSONObject billingInfo = subscription.getJSONObject("billing_info");
                if (billingInfo.has("next_billing_time")) {
                    return billingInfo.getString("next_billing_time");
                }
            }
        } catch (Exception e) {
            LOGGER.warning("Error getting next billing time: " + e.getMessage());
        }
        
        return null;
    }
    
    public boolean cancelSubscription(String subscriptionId) {
        return sendPostRequest(subscriptionId, "cancel");
    }
    
    public boolean suspendSubscription(String subscriptionId) {
        return sendPostRequest(subscriptionId, "suspend");
    }
}
```

---

## 13. Konfiguration und Properties

### 13.1 application.properties

```properties
# Server-Konfiguration
server.port=${PORT:8080}
server.servlet.context-path=/
server.servlet.session.timeout=604800s
server.servlet.session.cookie.name=ZAUBERKOCH_SESSION
server.servlet.session.cookie.http-only=true
server.servlet.session.cookie.secure=true

# Vaadin-Konfiguration
vaadin.allowed-packages=io.celox.application
vaadin.heartbeat-interval=300
vaadin.close-idle-sessions=true
vaadin.productionMode=true
vaadin.devmode.hosts-allowed=localhost,127.0.0.1
vaadin.pnpm.enable=false

# Datenbank (wird programmatisch konfiguriert)
# spring.datasource.url=${DB_URL}
# spring.datasource.username=${DB_USER}
# spring.datasource.password=${DB_PASSWORD}

# E-Mail-Konfiguration
spring.mail.host=smtp.hostinger.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true

# Logging
logging.level.root=INFO
logging.level.io.celox.application=DEBUG
logging.level.com.vaadin=INFO
logging.level.org.springframework=INFO

# Actuator (Health-Checks)
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized

# Multipart (File-Upload)
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Jackson (JSON)
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.time-zone=Europe/Berlin

# Compression
server.compression.enabled=true
server.compression.mime-types=text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json
server.compression.min-response-size=1024
```

### 13.2 messages_de.properties

```properties
# Navigation
nav.food=Essen
nav.cocktails=Cocktails
nav.favorites=Favoriten
nav.history=Verlauf
nav.profile=Profil
nav.premium=Premium
nav.admin=Admin
nav.logout=Abmelden

# Login
login.title=Anmelden
login.username=Benutzername oder E-Mail
login.password=Passwort
login.button=Anmelden
login.google=Mit Google anmelden
login.register=Noch kein Konto? Registrieren
login.forgot=Passwort vergessen?
login.failed=Anmeldung fehlgeschlagen
login.blocked=Zu viele Fehlversuche. Bitte warten Sie {0} Minuten.

# Food View
food.title=Was koche ich heute? 🍳
food.diet.label=Ernährungstyp
food.diet.all=Ich esse alles
food.diet.vegetarian=Vegetarisch
food.diet.vegan=Vegan
food.diversity=Zutatenvielfalt
food.duration=Zubereitungszeit
food.cost=Budget
food.portions=Portionen
food.region=Länderküche
food.wishes=Zusätzliche Wünsche
food.generate=Rezept generieren ✨
food.error.generation=Fehler bei der Rezeptgenerierung
food.error.database=Datenbankfehler

# Premium
premium.title=Premium Mitgliedschaft
premium.benefits.unlimited=Unbegrenzte Rezepte
premium.benefits.wishes=Persönliche Rezeptwünsche
premium.benefits.noads=Keine Werbung
premium.benefits.support=Priority Support
premium.price=4,99 € / Monat
premium.subscribe=Jetzt abonnieren
premium.cancel=Abo kündigen
premium.valid.until=Gültig bis: {0}

# Referral
referral.title=Freunde einladen
referral.description=Lade Freunde ein und erhalte 3 Monate Premium gratis!
referral.code=Dein Referral-Code: {0}
referral.share=Code teilen
referral.stats.invited=Eingeladene Freunde: {0}
referral.stats.bonus=Erhaltene Boni: {0} Monate
```

### 13.3 messages_en.properties

```properties
# Navigation
nav.food=Food
nav.cocktails=Cocktails
nav.favorites=Favorites
nav.history=History
nav.profile=Profile
nav.premium=Premium
nav.admin=Admin
nav.logout=Logout

# Login
login.title=Sign In
login.username=Username or Email
login.password=Password
login.button=Sign In
login.google=Sign in with Google
login.register=No account? Register
login.forgot=Forgot password?
login.failed=Login failed
login.blocked=Too many attempts. Please wait {0} minutes.

# Food View
food.title=What should I cook today? 🍳
food.diet.label=Diet Type
food.diet.all=I eat everything
food.diet.vegetarian=Vegetarian
food.diet.vegan=Vegan
food.diversity=Ingredient Variety
food.duration=Preparation Time
food.cost=Budget
food.portions=Servings
food.region=Cuisine
food.wishes=Additional Wishes
food.generate=Generate Recipe ✨
food.error.generation=Error generating recipe
food.error.database=Database error

# Premium
premium.title=Premium Membership
premium.benefits.unlimited=Unlimited recipes
premium.benefits.wishes=Personal recipe wishes
premium.benefits.noads=No ads
premium.benefits.support=Priority support
premium.price=$4.99 / month
premium.subscribe=Subscribe Now
premium.cancel=Cancel Subscription
premium.valid.until=Valid until: {0}
```

---

## 14. Build und Deployment

### 14.1 Maven Build (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    
    <modelVersion>4.0.0</modelVersion>
    <groupId>io.celox</groupId>
    <artifactId>zauberkoch</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <java.version>21</java.version>
        <vaadin.version>24.6.4</vaadin.version>
        <spring.boot.version>3.4.2</spring.boot.version>
    </properties>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.2</version>
    </parent>
    
    <dependencies>
        <!-- Vaadin -->
        <dependency>
            <groupId>com.vaadin</groupId>
            <artifactId>vaadin-spring-boot-starter</artifactId>
        </dependency>
        
        <!-- Database -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.33</version>
        </dependency>
        <dependency>
            <groupId>com.zaxxer</groupId>
            <artifactId>HikariCP</artifactId>
        </dependency>
        
        <!-- Security -->
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-crypto</artifactId>
        </dependency>
        
        <!-- Mail -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>
        
        <!-- JSON -->
        <dependency>
            <groupId>org.json</groupId>
            <artifactId>json</artifactId>
            <version>20231013</version>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
        
        <!-- QR Code -->
        <dependency>
            <groupId>com.google.zxing</groupId>
            <artifactId>core</artifactId>
            <version>3.5.2</version>
        </dependency>
        <dependency>
            <groupId>com.google.zxing</groupId>
            <artifactId>javase</artifactId>
            <version>3.5.2</version>
        </dependency>
        
        <!-- Markdown -->
        <dependency>
            <groupId>com.vladsch.flexmark</groupId>
            <artifactId>flexmark-all</artifactId>
            <version>0.64.8</version>
        </dependency>
        
        <!-- WebClient -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webflux</artifactId>
        </dependency>
    </dependencies>
    
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.vaadin</groupId>
                <artifactId>vaadin-bom</artifactId>
                <version>${vaadin.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            
            <plugin>
                <groupId>com.vaadin</groupId>
                <artifactId>vaadin-maven-plugin</artifactId>
                <version>${vaadin.version}</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>prepare-frontend</goal>
                            <goal>build-frontend</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
    
    <profiles>
        <profile>
            <id>production</id>
            <build>
                <plugins>
                    <plugin>
                        <groupId>com.vaadin</groupId>
                        <artifactId>vaadin-maven-plugin</artifactId>
                        <executions>
                            <execution>
                                <goals>
                                    <goal>build-frontend</goal>
                                </goals>
                                <phase>compile</phase>
                            </execution>
                        </executions>
                        <configuration>
                            <productionMode>true</productionMode>
                        </configuration>
                    </plugin>
                </plugins>
            </build>
        </profile>
    </profiles>
</project>
```

### 14.2 Build-Befehle

```bash
# Development Build
mvn clean package

# Production Build
mvn clean package -Pproduction

# Frontend clean (bei Problemen)
mvn vaadin:clean-frontend
mvn vaadin:prepare-frontend

# Run Application
mvn spring-boot:run

# Run mit Profil
java -jar target/zauberkoch-1.0.0.jar --spring.profiles.active=production

# Docker Build
docker build -t zauberkoch:latest .
docker run -p 8080:8080 -e DB_PASSWORD=xxx zauberkoch:latest
```

### 14.3 Deployment-Konfiguration

#### Systemd Service (/etc/systemd/system/zauberkoch.service)
```ini
[Unit]
Description=ZauberKoch Application
After=network.target mysql.service

[Service]
Type=simple
User=zauberkoch
WorkingDirectory=/opt/zauberkoch
ExecStart=/usr/bin/java -jar /opt/zauberkoch/zauberkoch.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="PORT=8080"
Environment="DB_PASSWORD=xxx"

[Install]
WantedBy=multi-user.target
```

#### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name app.zauberkoch.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.zauberkoch.com;
    
    ssl_certificate /etc/letsencrypt/live/app.zauberkoch.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.zauberkoch.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket Support
        proxy_read_timeout 86400;
    }
}
```

---

## 15. Feature-Übersicht

### 15.1 Kern-Features

#### Rezeptgenerierung
- **AI-basierte Generierung** mit 3 Providern (OpenAI, DeepSeek, Grok)
- **Personalisierung** nach Ernährungstyp, Budget, Zeit, Portionen
- **Regionale Küchen** (Italienisch, Asiatisch, Deutsch, etc.)
- **Zutaten-Präferenzen** (Mag ich/Mag ich nicht)
- **Premium-Features**: Spezielle Rezeptwünsche

#### Benutzer-Management
- **Registrierung** mit E-Mail-Verifizierung
- **Login** via Database oder Google OAuth2
- **Passwort-Reset** via E-Mail
- **Profilverwaltung** mit persönlichen Daten
- **Mehrsprachigkeit** (DE/EN)

#### Premium-System
- **PayPal-Subscriptions** (4,99€/Monat)
- **Rate-Limiting** (Free: 3/Tag, Premium: 10/10Min)
- **Referral-System** (3 Monate gratis pro 5 Referrals)
- **Premium-Features**: Unbegrenzte Rezepte, Spezialwünsche

#### Social Features
- **Rezept-Sharing** via Link oder WhatsApp
- **Favoriten-System**
- **Rezept-Historie**
- **QR-Code-Sharing**

### 15.2 Technische Features

#### Performance
- **Connection Pooling** mit HikariCP
- **Asynchrone API-Calls**
- **Frontend-Caching**
- **Lazy Loading**
- **Compression**

#### Security
- **BCrypt Password Hashing**
- **CSRF Protection**
- **Brute-Force Protection**
- **Session Management**
- **HTTPS-Only**

#### UI/UX
- **Dark/Light Theme**
- **Responsive Design**
- **Progressive Web App**
- **Animationen** (Pulse, Explosion)
- **Real-time Updates**

#### Monitoring
- **Google Analytics 4**
- **API Call Logging**
- **Error Tracking**
- **Usage Statistics**
- **Health Checks**

### 15.3 Admin-Features

- **User Management**
- **Statistics Dashboard**
- **API Usage Monitoring**
- **Premium Management**
- **System Configuration**

---

## Zusammenfassung

ZauberKoch ist eine umfassende, produktionsreife Webanwendung mit:

- **79 Java-Klassen** in strukturierten Packages
- **13 Datenbanktabellen** mit komplexen Beziehungen
- **3 AI-Provider-Integrationen** für Rezeptgenerierung
- **Dual Authentication System** (Database + OAuth2)
- **Premium-Subscription-System** mit PayPal
- **Internationalisierung** (DE/EN)
- **Progressive Web App** Funktionalität
- **Umfassende Security-Features**
- **Responsive UI** mit Custom Components
- **Vollständiges Admin-Dashboard**

Die Anwendung ist skalierbar, wartbar und bietet eine moderne User Experience für die KI-basierte Rezeptgenerierung.

---

*Diese Dokumentation umfasst alle technischen Aspekte der ZauberKoch-Anwendung und ermöglicht es, das System vollständig zu verstehen und nachzubauen.*