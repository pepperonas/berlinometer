package io.celox.application.utils;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

import io.celox.application.api.PayPalSubscriptionInfo;
import io.celox.application.model.ApiLog;
import io.celox.application.model.FoodPreference;
import io.celox.application.model.IpLocationResponse;
import io.celox.application.model.ReferralUsageState;
import io.celox.application.model.User;
import io.celox.application.model.UserSetting;
import io.celox.application.views.ReferralStatsView;
import jakarta.annotation.PreDestroy;

/**
 * Database connection utility class using HikariCP.
 *
 * <p>Handles the database connection pooling with HikariCP and provides various methods for
 * fetching, inserting, and updating data in the underlying MySQL database (schema "fooddb").</p>
 *
 * @author Martin
 */
@Component
public class DbUtils {

    private static final Logger LOGGER = Logger.getLogger(DbUtils.class.getName());
    private static final HikariDataSource dataSource;

    static {
        // HikariCP Konfiguration
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(Const.MYSQL_DB_URL);
        config.setUsername(Const.DB_USER);
        config.setPassword(Const.DB_PASSWORD);
        config.setDriverClassName(Const.MYSQL_JDBC_DRIVER);

        // Optionale Konfiguration für Performance und Zuverlässigkeit
        config.setMaximumPoolSize(300); // Maximale Anzahl an Verbindungen im Pool
        config.setMinimumIdle(20);      // Minimale Anzahl an idle Verbindungen
        config.setIdleTimeout(300000); // 5 Minuten
        config.setConnectionTimeout(30000); // 30 Sekunden
        config.setMaxLifetime(1800000); // 30 Minuten
        config.setConnectionTestQuery("SELECT 1");
        config.setLeakDetectionThreshold(30000);

        dataSource = new HikariDataSource(config);
    }

    /**
     * Gibt eine neue Datenbankverbindung aus dem HikariCP-Pool zurück.
     *
     * @return Connection
     */
    public static Connection getConnection() {
        try {
            return dataSource.getConnection();
        } catch (SQLException e) {
            throw new RuntimeException("Error establishing database connection", e);
        }
    }

    /**
     * Schließt die Datenquelle (wird typischerweise beim Herunterfahren der Anwendung aufgerufen).
     */
    @PreDestroy
    public static void closeDataSource() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }

    /**
     * Liefert alle User aus der Tabelle <code>fooddb.user</code> zurück.
     */
    public static List<User> getAllUsers(Connection connection) {
        final String sql = "SELECT * FROM fooddb.users";
        List<User> users = new ArrayList<>();

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                users.add(new User(
                        rs.getInt("id"),
                        rs.getInt("active"),
                        rs.getInt("admin"),
                        rs.getString("username"),
                        rs.getString("email"),
                        rs.getString("password"),
                        rs.getString("first_name"),
                        rs.getString("last_name"),
                        rs.getTimestamp("premium_expiration"),
                        rs.getTimestamp("last_seen"),
                        rs.getDate("birth_date"),
                        rs.getString("gender"),
                        rs.getInt("verified")
                ));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all users", e);
        }
        return users;
    }

    /**
     * Liefert alle User aus der Tabelle <code>fooddb.user</code> zurück.
     */
    public static List<User> getAllUsersForAdminView(Connection connection) {
        List<User> users = new ArrayList<>();
        String query = """
                    SELECT u.id, u.username, u.email, u.first_name, u.last_name,
                           u.created, u.premium_expiration, u.last_seen,
                           u.admin, u.verified, u.current_usage_count, u.google_oauth2,
                           COUNT(e.id) AS exec_count
                    FROM fooddb.users u
                    LEFT JOIN fooddb.api_logs e ON u.id = e.user_id
                    GROUP BY u.id, u.username, u.email
                    ORDER BY exec_count DESC;
                """;

        try (PreparedStatement ps = connection.prepareStatement(query);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                int userId = rs.getInt("id");
                String username = rs.getString("username");
                String email = rs.getString("email");
                String firstName = rs.getString("first_name");
                String lastName = rs.getString("last_name");
                Timestamp created = rs.getTimestamp("created");
                Date premiumExpiration = rs.getTimestamp("premium_expiration");
                Date lastSeen = rs.getTimestamp("last_seen");
                boolean admin = rs.getInt("admin") == 1;
                boolean verified = rs.getInt("verified") == 1;
                int execCount = rs.getInt("exec_count");
                boolean oauth2 = rs.getInt("google_oauth2") == 1;

                User u = new User(userId, username, email, firstName, lastName, created, premiumExpiration, lastSeen, admin,
                        verified, execCount, oauth2);

                int totalReferrals = DbUtils.getReferralCount(connection, u.getUsername());
                u.setReferralsCount(totalReferrals);

                users.add(u);
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return users;
    }

    public static List<User> getAllUsersForSubscriptionCheck(Connection connection) {
        final String sql = "SELECT id, username, users.premium_expiration, subscription_id FROM fooddb.users";
        List<User> users = new ArrayList<>();

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                users.add(new User(
                        rs.getInt("id"),
                        rs.getString("username"),
                        rs.getTimestamp("premium_expiration"),
                        rs.getString("subscription_id")
                ));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all users", e);
        }
        return users;
    }

    /**
     * Gibt die User-ID zu einem bestimmten Benutzernamen zurück, oder 0, wenn nicht gefunden.
     */
    public static int getUserIdByUsername(Connection connection, String username) {
        final String sql = "SELECT id FROM fooddb.users WHERE username = ?";

        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setString(1, username);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("id");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching user ID by username", e);
        }
        return 0;
    }

    /**
     * Gibt das User-Objekt für den angegebenen Benutzernamen zurück, oder <code>null</code>, wenn nicht gefunden.
     */
    public static User getUserByUsername(Connection connection, String username) {
        final String sql = "SELECT * FROM fooddb.users WHERE username = ?";

        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setString(1, username);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new User(
                            rs.getInt("id"),
                            rs.getInt("active"),
                            rs.getInt("admin"),
                            rs.getString("username"),
                            rs.getString("email"),
                            rs.getString("password"),
                            rs.getString("first_name"),
                            rs.getString("last_name"),
                            rs.getTimestamp("premium_expiration"),
                            rs.getTimestamp("last_seen"),
                            rs.getDate("birth_date"),
                            rs.getString("gender"),
                            rs.getInt("verified")
                    );
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching user by username", e);
        }
        return null;
    }

    /**
     * Gibt das User-Objekt für den angegebenen Benutzernamen zurück, oder <code>null</code>, wenn nicht gefunden.
     */
    public static User getUserById(Connection connection, int id) {
        final String sql = "SELECT * FROM fooddb.users WHERE id = ?";

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new User(
                            rs.getInt("id"),
                            rs.getInt("active"),
                            rs.getInt("admin"),
                            rs.getString("username"),
                            rs.getString("email"),
                            rs.getString("password"),
                            rs.getString("first_name"),
                            rs.getString("last_name"),
                            rs.getTimestamp("created"),
                            rs.getTimestamp("premium_expiration"),
                            rs.getTimestamp("last_seen"),
                            rs.getDate("birth_date"),
                            rs.getString("gender"),
                            rs.getInt("verified"),
                            rs.getInt("google_oauth2") == 1
                    );
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching user by username", e);
        }
        return null;
    }

    /**
     * Gibt das User-Objekt für den angegebenen Benutzernamen zurück, oder <code>null</code>, wenn nicht gefunden.
     */
    public static User getUserByUsernameForPremiumView(Connection connection, String username) {
        final String sql = "SELECT * FROM fooddb.users WHERE username = ?";

        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setString(1, username);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new User(
                            rs.getInt("id"),
                            rs.getString("username"),
                            rs.getTimestamp("premium_expiration"),
                            rs.getString("subscription_id")
                    );
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching user by username", e);
        }
        return null;
    }

    public static boolean doesUserExist(Connection connection, String username) {
        String query = "SELECT COUNT(*) FROM fooddb.users WHERE username = ?";
        try (PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, username);
            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                if (resultSet.next()) {
                    return resultSet.getInt(1) > 0;
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return false;
    }

    /**
     * Prüft ob Benutzer für Premium freigeschaltet ist
     *
     * @param connection Datenbankverbindung
     * @param username   Benutzername
     * @return true, wenn der Benutzer Premium-Zugriff hat, sonst false
     */
    public static boolean checkPremiumState(Connection connection, String username) {
        User user = getUserByUsername(connection, username);
        if (user == null) {
            LOGGER.warning("User nicht gefunden: " + username);
            return false;
        }

        boolean expirationValid = user.getPremiumExpiration() != null &&
                                  user.getPremiumExpiration().after(new Date());

        LOGGER.info("Premium-Check für Benutzer: " + username + " | Expiration: " + user.getPremiumExpiration() + " | Valid: " + expirationValid);

        // Prüfe zuerst ob eine PayPal-Subscription existiert
        if (user.getSubscriptionId() != null && !user.getSubscriptionId().isEmpty()) {
            PayPalSubscriptionInfo paypal = new PayPalSubscriptionInfo();
            String status = paypal.getSubscriptionStatus(user.getSubscriptionId());
            LOGGER.info("Subscription Status für " + username + ": " + status + " (ID: " + user.getSubscriptionId() + ")");

            // Wenn der Status ACTIVE ist, dann hat der Benutzer Premium - unabhängig vom Ablaufdatum
            if ("ACTIVE".equals(status)) {
                LOGGER.info("Aktives PayPal-Abo für " + username + ": Premium gewährt");

                // Synchronisiere das Ablaufdatum mit PayPal
                syncPremiumExpirationIfNeeded(connection, user);

                return true;
            }
        }

        LOGGER.info("Finale Premium-Entscheidung für " + username + ": " + expirationValid);
        return expirationValid;
    }

    /**
     * Synchronisiert das Premium-Ablaufdatum mit PayPal, falls notwendig
     * (Nur wenn das aktuelle Ablaufdatum in der Vergangenheit liegt oder bald abläuft)
     */
    public static void syncPremiumExpirationIfNeeded(Connection connection, User user) {
        // Nur synchronisieren, wenn nötig
        if (user.getSubscriptionId() != null &&
            !user.getSubscriptionId().isEmpty() &&
            (user.getPremiumExpiration() == null ||
             new Date().after(user.getPremiumExpiration()) ||
             daysBetween(new Date(), user.getPremiumExpiration()) < 7)) {

            LOGGER.info("Synchronisiere Premium-Ablaufdatum für " + user.getUsername());
            syncPremiumExpiration(connection, user);
        }
    }

    /**
     * Berechnet die Tage zwischen zwei Datumsangaben
     */
    private static long daysBetween(Date d1, Date d2) {
        return (d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000);
    }

    public static void syncPremiumExpiration(Connection connection, User user) {
        if (user.getSubscriptionId() != null && !user.getSubscriptionId().isEmpty()) {
            PayPalSubscriptionInfo paypal = new PayPalSubscriptionInfo();
            String subscriptionStatus = paypal.getSubscriptionStatus(user.getSubscriptionId());

            // Nur fortfahren, wenn die Subscription aktiv ist
            if ("ACTIVE".equals(subscriptionStatus)) {
                String nextBillingTime = paypal.getNextBillingTime(user.getSubscriptionId());
                if (nextBillingTime != null) {
                    try {
                        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
                        Date nextBillingDate = sdf.parse(nextBillingTime);

                        // Setze das Ablaufdatum nur, wenn es in der Zukunft liegt und später als das aktuelle Datum ist
                        if (nextBillingDate.after(new Date())) {
                            user.setPremiumExpiration(nextBillingDate);
                            String sql = "UPDATE fooddb.users SET premium_expiration = ? WHERE id = ?";
                            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                                ps.setTimestamp(1, new Timestamp(nextBillingDate.getTime()));
                                ps.setInt(2, user.getId());
                                int updated = ps.executeUpdate();
                                LOGGER.info("Premium-Expiration für " + user.getUsername() + " aktualisiert auf: " + nextBillingDate + " (Zeilen aktualisiert: " + updated + ")");
                            }
                        } else {
                            LOGGER.warning("NextBillingTime liegt in der Vergangenheit für " + user.getUsername() + ": " + nextBillingTime);
                        }
                    } catch (Exception e) {
                        LOGGER.warning("Fehler beim Synchronisieren von premium_expiration für " + user.getUsername() + ": " + e.getMessage());
                    }
                } else {
                    LOGGER.warning("Keine NextBillingTime erhalten für Subscription " + user.getSubscriptionId());
                }
            } else {
                LOGGER.info("Subscription " + user.getSubscriptionId() + " ist nicht aktiv (Status: " + subscriptionStatus + "), keine Synchronisierung");
            }
        } else {
            LOGGER.info("Keine Subscription-ID für Benutzer " + user.getUsername() + ", keine Synchronisierung notwendig");
        }
    }

    /**
     * Gibt das User-Objekt anhand eines Strings zurück, der sowohl E-Mail als auch Username sein kann.
     */
    public static User getUserByEmailOrUsername(Connection connection, String input) {
        final String sql = "SELECT * FROM fooddb.users WHERE username = ? OR email = ?";

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setString(1, input);
            ps.setString(2, input);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new User(
                            rs.getInt("id"),
                            rs.getInt("active"),
                            rs.getInt("admin"),
                            rs.getString("username"),
                            rs.getString("email"),
                            rs.getString("password"),
                            rs.getString("first_name"),
                            rs.getString("last_name"),
                            rs.getTimestamp("premium_expiration"),
                            rs.getTimestamp("last_seen"),
                            rs.getDate("birth_date"),
                            rs.getString("gender"),
                            rs.getInt("verified")
                    );
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching user by email or username", e);
        }
        return null;
    }

    /**
     * Gibt das User-Objekt anhand eines Strings zurück, der sowohl E-Mail als auch Username sein kann.
     */
    public static User getGoogleOauth2User(Connection connection, String input) {
        final String sql = "SELECT * FROM fooddb.users WHERE email = ? AND google_oauth2 = 1";

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setString(1, input);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new User(
                            rs.getInt("id"),
                            rs.getInt("active"),
                            rs.getInt("admin"),
                            rs.getString("username"),
                            rs.getString("email"),
                            rs.getString("password"),
                            rs.getString("first_name"),
                            rs.getString("last_name"),
                            rs.getTimestamp("created"),
                            rs.getTimestamp("premium_expiration"),
                            rs.getTimestamp("last_seen"),
                            rs.getDate("birth_date"),
                            rs.getString("gender"),
                            rs.getInt("verified"),
                            rs.getInt("google_oauth2") == 1
                    );
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching user by email or username", e);
        }
        return null;
    }

    /**
     * Fügt einen neuen Benutzer in die Datenbank ein und gibt dessen ID zurück.
     */
    public static int insertUser(Connection connection, User user, boolean oauth2) {
        final String insertSql = "INSERT INTO fooddb.users (username, email, password, premium_expiration, google_oauth2, verified)" +
                                 " VALUES (?, ?, ?, ?, ?, ?)";
        final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashedPassword = encoder.encode(user.getPassword() + Const.SALTED_BY_TYSON);
        hashedPassword = oauth2 ? "[OAUTH2]" : hashedPassword;
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String premiumExpiry = sdf.format(new Date(System.currentTimeMillis()
                                                   + (Const.FREE_WEEKS_PREMIUM_AFTER_REG * Const.ONE_WEEK_IN_MS)));

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(insertSql)) {
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getEmail());
            ps.setString(3, hashedPassword);
            ps.setString(4, premiumExpiry);
            ps.setInt(5, oauth2 ? 1 : 0);
            ps.setInt(6, oauth2 ? 1 : 0); // bei oauth2 verifiziert setzen

            int result = ps.executeUpdate();
            if (result > 0) {
                final String selectSql = "SELECT id FROM fooddb.users WHERE email = ?";
                try (PreparedStatement psSelect = connection.prepareStatement(selectSql)) {
                    psSelect.setString(1, user.getEmail());
                    try (ResultSet rs = psSelect.executeQuery()) {
                        if (rs.next()) {
                            return rs.getInt("id");
                        }
                    }
                }
            }
        } catch (SQLException e) {
            LOGGER.warning(e.getMessage());
        }
        return 0;
    }

    /**
     * Aktualisiert das Feld "last_seen" für einen Benutzer.
     */
    public static void updateLastSeen(Connection connection, String username) {
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        int userId = getUserIdByUsername(connection, username);
        updateUserStats(connection, userId);

        final String sql = "UPDATE fooddb.users SET last_seen = ? WHERE username = ?";
        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setTimestamp(1, new Timestamp(System.currentTimeMillis()));
            ps.setString(2, username);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Error updating last_seen for user", e);
        }
    }

    /**
     * Aktualisierte Methode zum Speichern der Benutzerstatistiken mit Standortinformationen
     */
    public static void updateUserStats(Connection connection, int userId) {
        try {
            // Hole die IP-Adresse des Clients
            String ipAddress = Utils.getClientIpAddress();

            // Hole Standortinformationen zur IP-Adresse
            IpLocationResponse locationInfo = Utils.getIpLocationInfo(ipAddress);

            if (locationInfo != null && "success".equals(locationInfo.getStatus())) {
                // SQL mit erweiterten Feldern für Standortinformationen
                String sql = "INSERT INTO fooddb.user_stats (user_id, ip, country, region, city, district, isp, org, mobile) " +
                             "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

                try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                    stmt.setInt(1, userId);
                    stmt.setString(2, ipAddress);
                    stmt.setString(3, locationInfo.getCountry());
                    stmt.setString(4, locationInfo.getRegion());
                    stmt.setString(5, locationInfo.getCity());
                    stmt.setString(6, locationInfo.getDistrict());
                    stmt.setString(7, locationInfo.getIsp());
                    stmt.setString(8, locationInfo.getOrg());
                    stmt.setBoolean(9, locationInfo.isMobile());

                    stmt.executeUpdate();
                    LOGGER.info("Benutzerstatistiken mit Standortinformationen gespeichert für Benutzer-ID: " + userId);
                }
            } else {
                // Wenn keine Standortinformationen verfügbar sind, nur die IP speichern
                String sql = "INSERT INTO fooddb.user_stats (user_id, ip) VALUES (?, ?)";
                try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                    stmt.setInt(1, userId);
                    stmt.setString(2, ipAddress);
                    stmt.executeUpdate();
                    LOGGER.warning("Keine Standortinformationen verfügbar für IP: " + ipAddress);
                }
            }
        } catch (SQLException e) {
            LOGGER.warning("Fehler beim Speichern der Benutzerstatistiken: " + e.getMessage());
        } catch (Exception e) {
            LOGGER.severe("Unerwarteter Fehler bei der Verarbeitung der Benutzerstatistiken: " + e.getMessage());
        }
    }

    /**
     * Legt ein Ausführungsergebnis ("Prompt/Response") in der Datenbank ab.
     * Gibt die generierte ID zurück oder -1 im Fehlerfall.
     */
    public static long insertApiLog(Connection connection, String username,
                                    String prompt, String response, String focusPhrase, String api, long executionTime, String type) {
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        final String sql = "INSERT INTO fooddb.api_logs (user_id, prompt, response, focus_phrase," +
                           " fooddb.api_logs.rec_uuid,  api, execution_time, type)" +
                           " VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        int userId = getUserIdByUsername(connection, username);

        String token = UUID.randomUUID().toString();

        try (PreparedStatement ps = Objects.requireNonNull(connection)
                .prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, userId);
            ps.setString(2, prompt);
            ps.setString(3, response);
            ps.setString(4, focusPhrase);
            ps.setString(5, token);
            ps.setString(6, api);
            ps.setLong(7, executionTime);
            ps.setString(8, type);
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error inserting executed prompt", e);
        }
        return -1;
    }

    /**
     * Markiert eine bestimmte Response als "starred" (oder entfernt das Flag).
     */
    public static void updateStarredResponse(Connection connection, long responseId, boolean starred) {
        final String sql = "UPDATE fooddb.api_logs SET starred = ? WHERE id = ?";
        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setInt(1, starred ? 1 : 0);
            ps.setLong(2, responseId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Error updating starred response", e);
        }
    }

    /**
     * Gibt alle "starred" Responses eines Benutzers zurück.
     */
    public static List<ApiLog> getRecipes(Connection connection, String username, boolean starred, String type) {
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        final String sql =
                "SELECT al.id, al.response, al.rec_uuid, r.title, al.created, al.type, al.active " +
                "FROM fooddb.api_logs al " +
                "LEFT JOIN fooddb.recipes r ON al.id = r.api_log_id " +
                "WHERE al.user_id = ? " +
                "AND al.starred = " + (starred ? 1 : 0) + " " +
                "AND al.type = '" + type + "' " +
                "ORDER BY al.created DESC";

        List<ApiLog> starredResponses = new ArrayList<>();
        int userId = getUserIdByUsername(connection, username);

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    starredResponses.add(new ApiLog(
                            rs.getLong("id"),
                            rs.getString("response"),
                            rs.getString("rec_uuid"),
                            rs.getString("title"), // Titel aus recipes, kann null sein
                            rs.getTimestamp("created"),
                            rs.getString("type"),
                            rs.getInt("active") == 1
                    ));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching starred responses with titles", e);
        }
        return starredResponses;
    }

    //    public static Recipe getResponse(Connection connection, String username, String response) {
    //        if (username.contains("@")) {
    //            username = username.substring(0, username.indexOf("@"));
    //        }
    //
    //        final String sql =
    //                "SELECT id, response, rec_uuid FROM fooddb.api_logs WHERE user_id = ? AND starred = 1" +
    //                " AND response = ?" + " ORDER BY created DESC";
    //        int userId = getUserIdByUsername(connection, username);
    //
    //        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
    //            ps.setInt(1, userId);
    //            ps.setString(1, response);
    //            try (ResultSet rs = ps.executeQuery()) {
    //                while (rs.next()) {
    //                    return new Recipe(rs.getInt("id"), rs.getString("response"), rs.getString("rec_uuid"));
    //                }
    //            }
    //        } catch (SQLException e) {
    //            throw new RuntimeException("Error fetching starred responses", e);
    //        }
    //        return null;
    //    }

    public static void updateUserSettings(Connection connection, int userId, String param, int value) {
        final String sql = "INSERT INTO fooddb.user_settings (user_id, " + param + ") " +
                           "VALUES (?, ?) " +
                           "ON DUPLICATE KEY UPDATE " + param + " = VALUES(" + param + ")";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, value);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Error updating user preference config", e);
        }
    }

    public static void updateUserSettings(Connection connection, int userId, String param, String value) {
        final String sql = "INSERT INTO fooddb.user_settings (user_id, " + param + ") " +
                           "VALUES (?, ?) " +
                           "ON DUPLICATE KEY UPDATE " + param + " = VALUES(" + param + ")";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, value);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Error updating user preference config", e);
        }
    }

    public static void createUserSettingsIfNotExist(Connection connection, int userId) {
        String sqlInsert = "INSERT IGNORE INTO fooddb.user_settings (user_id) VALUES (?)";
        try (PreparedStatement psInsert = connection.prepareStatement(sqlInsert)) {
            psInsert.setInt(1, userId);
            psInsert.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException(ex);
        }
    }

    public static UserSetting loadUserSettings(Connection connection, int userId) {
        String sql = """
                    SELECT upc.id,
                           upc.user_id,
                           upc.updated,
                           upc.rg_type,
                           upc.rg_type_drink,
                           upc.rg_goal,
                           upc.rg_style_drink,
                           upc.rg_api,
                           upc.slider_diversity,
                           upc.slider_diversity_drink,
                           upc.slider_duration,
                           upc.slider_complexity_drink,
                           upc.slider_cost,
                           upc.slider_alcohol_content_drink,
                           upc.slider_portions,
                           upc.slider_glasses_drink,
                           upc.cbx_get_muscles,
                           upc.cbx_get_healthy,
                           upc.cbx_fruity_drink,
                           upc.cbx_dessert_drink,
                           upc.expandable_layout_open,
                           upc.request_json,
                           upc.cbx_reduce_animations
                      FROM fooddb.user_settings upc
                      JOIN fooddb.users u ON u.id = upc.user_id
                     WHERE u.id = ?
                """;

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setInt(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    UserSetting config = new UserSetting();

                    config.setId(rs.getInt("id"));
                    config.setUserId(rs.getLong("user_id"));

                    Timestamp ts = rs.getTimestamp("updated");
                    if (ts != null) {
                        config.setUpdated(ts.toInstant()
                                .atZone(ZoneId.systemDefault())
                                .toLocalDateTime());
                    }

                    config.setRgType(rs.getString("rg_type"));
                    config.setRgTypeDrink(rs.getString("rg_type_drink"));
                    config.setRgGoal(rs.getString("rg_goal"));
                    config.setRgStyleDrink(rs.getString("rg_style_drink"));
                    config.setRgApi(rs.getString("rg_api"));
                    config.setSliderDiversity(rs.getInt("slider_diversity"));
                    config.setSliderDiversityDrink(rs.getInt("slider_diversity_drink"));
                    config.setSliderDuration(rs.getInt("slider_duration"));
                    config.setSliderComplexityDrink(rs.getInt("slider_complexity_drink"));
                    config.setSliderCost(rs.getInt("slider_cost"));
                    config.setSliderAlcoholContentDrink(rs.getInt("slider_alcohol_content_drink"));
                    config.setSliderPortions(rs.getInt("slider_portions"));
                    config.setSliderGlassesDrink(rs.getInt("slider_glasses_drink"));
                    config.setCbxGetMuscles(rs.getInt("cbx_get_muscles"));
                    config.setCbxGetHealthy(rs.getInt("cbx_get_healthy"));
                    config.setCbxFruityDrink(rs.getInt("cbx_fruity_drink"));
                    config.setCbxDessertDrink(rs.getInt("cbx_dessert_drink"));
                    config.setExpandableLayoutOpen(rs.getInt("expandable_layout_open") == 1);
                    config.setRequestJson(rs.getInt("request_json") == 1);
                    config.setReduceAnimations(rs.getInt("cbx_reduce_animations") == 1);

                    return config;
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return null;
    }

    public static void updateFoodPreference(Connection connection, int userId,
                                            boolean liked, Set<FoodPreference> entries) {
        String sqlUpsert = "INSERT INTO fooddb.users_food_preferences (user_id, food, is_liked) " +
                           "VALUES (?, ?, ?) " +
                           "ON DUPLICATE KEY UPDATE food = VALUES(food), is_liked = VALUES(is_liked)";

        try (PreparedStatement ps = connection.prepareStatement(sqlUpsert)) {
            for (FoodPreference entry : entries) {
                ps.setInt(1, userId);
                ps.setString(2, entry.getName());
                ps.setInt(3, liked ? 1 : 0);
                ps.addBatch();
            }
            ps.executeBatch();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public static void deleteFoodPreference(Connection connection, int userId, String food, boolean liked) {
        String sqlDelete = "DELETE FROM fooddb.users_food_preferences" +
                           " WHERE fooddb.users_food_preferences.user_id = ?" +
                           " AND fooddb.users_food_preferences.food = ? " +
                           " AND fooddb.users_food_preferences.is_liked = ?";

        try (PreparedStatement ps = connection.prepareStatement(sqlDelete)) {
            ps.setInt(1, userId);
            ps.setString(2, food);
            ps.setInt(3, liked ? 1 : 0);
            ps.addBatch();
            ps.executeBatch();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public static void deleteAllFoodPreferences(Connection connection, int userId, boolean liked) {
        String sqlDelete = "DELETE FROM fooddb.users_food_preferences" +
                           " WHERE fooddb.users_food_preferences.user_id = ?" +
                           " AND fooddb.users_food_preferences.is_liked = ?";

        try (PreparedStatement ps = connection.prepareStatement(sqlDelete)) {
            ps.setInt(1, userId);
            ps.setInt(2, liked ? 1 : 0);
            ps.addBatch();
            ps.executeBatch();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public static LinkedHashSet<FoodPreference> readFoodPreference(
            Connection connection, int userId, boolean liked) {
        int ratingValue = liked ? 1 : 0;

        String sql = """
                    SELECT id, food, is_liked
                      FROM fooddb.users_food_preferences
                     WHERE user_id = ?
                       AND is_liked = ?
                     ORDER BY id
                """;
        LinkedHashSet<FoodPreference> results = new LinkedHashSet<>();

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, ratingValue);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    FoodPreference entry = new FoodPreference(rs.getLong("id"), rs.getString("food"), rs.getInt("is_liked") == 1);
                    results.add(entry);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error reading user food list config", e);
        }

        return results;
    }

    public static void updateUser(Connection connection, User user) {
        final String sql = "UPDATE fooddb.users " +
                           " SET fooddb.users.first_name = ?,  fooddb.users.last_name = ?," +
                           " fooddb.users.birth_date = ?, fooddb.users.gender = ?" +
                           " WHERE fooddb.users.id = ?";

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setString(1, user.getFirstName());
            ps.setString(2, user.getLastName());
            ps.setDate(3, new java.sql.Date(user.getBirthDate().getTime()));
            ps.setString(4, user.getGender());
            ps.setInt(5, user.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Error updating user", e);
        }
    }

    public static boolean updateUserSubscription(Connection connection, int id, String subscriptionId) {
        // Zuerst das aktuelle Premium-Ablaufdatum abrufen
        final String selectSql = "SELECT premium_expiration FROM fooddb.users WHERE id = ?";
        Date newExpirationDate = new Date(System.currentTimeMillis() + Const.ONE_MONTH_PREMIUM_SUBSCRIPTION);

        try (PreparedStatement selectPs = Objects.requireNonNull(connection).prepareStatement(selectSql)) {
            selectPs.setInt(1, id);

            try (ResultSet rs = selectPs.executeQuery()) {
                if (rs.next()) {
                    java.sql.Date currentExpiration = rs.getDate("premium_expiration");

                    if (currentExpiration != null) {
                        long currentTime = System.currentTimeMillis();
                        long expirationTime = currentExpiration.getTime();

                        // Prüfe, ob das Ablaufdatum in der Zukunft liegt
                        if (expirationTime > currentTime) {
                            // Datum liegt in der Zukunft, verlängere vom Ablaufdatum aus
                            newExpirationDate = new Date(expirationTime + Const.ONE_MONTH_PREMIUM_SUBSCRIPTION);
                            LOGGER.info("Verlängere Premium vom bestehenden Ablaufdatum: " + new Date(expirationTime) + " -> " + newExpirationDate);
                        } else {
                            // Datum liegt in der Vergangenheit, setze auf einen Monat ab jetzt
                            LOGGER.info("Setze Premium-Ablaufdatum auf einen Monat ab jetzt");
                        }
                    } else {
                        LOGGER.info("Kein bestehendes Ablaufdatum gefunden, setze auf einen Monat ab jetzt");
                    }
                }
            }
        } catch (SQLException e) {
            LOGGER.warning("Fehler beim Prüfen des bestehenden Ablaufdatums: " + e.getMessage());
            return false;
        }

        // Jetzt das Abonnement aktualisieren
        final String sql = "UPDATE fooddb.users SET subscription_id = ?, premium_expiration = ? WHERE id = ?";
        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setString(1, subscriptionId);
            ps.setDate(2, new java.sql.Date(newExpirationDate.getTime()));
            ps.setInt(3, id);
            int rowsAffected = ps.executeUpdate();

            if (rowsAffected > 0) {
                LOGGER.info("Abonnement erfolgreich aktualisiert für Benutzer-ID " + id + ": SubscriptionID=" + subscriptionId + ", Expiration=" + newExpirationDate);
                return true;
            } else {
                LOGGER.warning("Keine Zeilen aktualisiert beim Setzen des Abonnements für Benutzer-ID " + id);
                return false;
            }
        } catch (SQLException e) {
            LOGGER.warning("Fehler beim Aktualisieren des Abonnements: " + e.getMessage());
            return false;
        }
    }

    //    public static boolean updateUserSubscription(Connection connection, int id, String subscriptionId) {
    //        final String sql = "UPDATE fooddb.users SET fooddb.users.subscription_id = ?, fooddb.users.premium_expiration = ?" +
    //                           " WHERE id = ?";
    //        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
    //            ps.setString(1, subscriptionId);
    //            ps.setDate(2, new java.sql.Date(new Date(System.currentTimeMillis() + Const.ONE_MONTH_PREMIUM_SUBSCRIPTION).getTime()));
    //            ps.setInt(3, id);
    //            int rowsAffected = ps.executeUpdate();
    //            return rowsAffected > 0;
    //        } catch (SQLException e) {
    //            LOGGER.warning("Fehler beim Aktualisieren des Abonnements: " + e.getMessage());
    //            return false;
    //        }
    //    }

    public static void extendUserPremium(Connection connection, int id, long duration) {
        // Zuerst das aktuelle Premium-Ablaufdatum abrufen
        final String selectSql = "SELECT premium_expiration FROM fooddb.users WHERE id = ?";

        try (PreparedStatement selectPs = Objects.requireNonNull(connection).prepareStatement(selectSql)) {
            selectPs.setInt(1, id);

            try (ResultSet rs = selectPs.executeQuery()) {
                Date newExpirationDate;

                if (rs.next()) {
                    java.sql.Date currentExpiration = rs.getDate("premium_expiration");

                    if (currentExpiration != null) {
                        long currentTime = System.currentTimeMillis();
                        long expirationTime = currentExpiration.getTime();

                        // Prüfe, ob das Ablaufdatum in der Zukunft liegt
                        if (expirationTime > currentTime) {
                            // Datum liegt in der Zukunft, verlängere vom Ablaufdatum aus
                            newExpirationDate = new Date(expirationTime + duration);
                        } else {
                            // Datum liegt in der Vergangenheit, verlängere vom aktuellen Datum aus
                            newExpirationDate = new Date(currentTime + duration);
                        }
                    } else {
                        // Kein Ablaufdatum gesetzt, verlängere vom aktuellen Datum aus
                        newExpirationDate = new Date(System.currentTimeMillis() + duration);
                    }
                } else {
                    // Benutzer nicht gefunden, setze auf aktuelles Datum + Dauer
                    newExpirationDate = new Date(System.currentTimeMillis() + duration);
                }

                // Aktualisiere das Premium-Ablaufdatum in der Datenbank
                final String updateSql = "UPDATE fooddb.users SET premium_expiration = ? WHERE id = ?";

                try (PreparedStatement updatePs = connection.prepareStatement(updateSql)) {
                    updatePs.setDate(1, new java.sql.Date(newExpirationDate.getTime()));
                    updatePs.setInt(2, id);
                    updatePs.executeUpdate();
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error extending premium", e);
        }
    }

    public static boolean hasUserExceededLimit(Connection connection, int userId, int allowedRequestsTimeframe, int allowedRequests) {
        // Entspricht DEBUG
        LOGGER.log(Level.FINE, "Prüfe, ob Benutzer mit ID {0} das Anfragelimit überschritten hat. Erlaubte Anfragen: {1}, Zeitrahmen: {2} Minuten",
                new Object[]{userId, allowedRequests, allowedRequestsTimeframe});

        String query = "SELECT COUNT(*) FROM fooddb.api_logs WHERE user_id = ?" +
                       " AND created >= NOW() - INTERVAL " + allowedRequestsTimeframe + " MINUTE";

        try (PreparedStatement statement = connection.prepareStatement(query)) {
            statement.setLong(1, userId);
            // Entspricht TRACE
            LOGGER.log(Level.FINER, "Führe Abfrage aus: {0}", statement);

            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    int count = rs.getInt(1);
                    boolean hasExceeded = count > allowedRequests;
                    // Entspricht INFO
                    LOGGER.log(Level.INFO, "Benutzer ID {0} hat {1} Anfragen innerhalb der letzten {2} Minuten gemacht. Erlaubtes Limit: {3}. Limit überschritten: {4}",
                            new Object[]{userId, count, allowedRequestsTimeframe, allowedRequests, hasExceeded});
                    return hasExceeded;
                } else {
                    // Entspricht WARN
                    LOGGER.log(Level.WARNING, "Keine Ergebnisse für Benutzer ID {0} gefunden. Keine Anfragen im Zeitraum der letzten {1} Minuten.",
                            new Object[]{userId, allowedRequestsTimeframe});
                    return false;
                }
            }
        } catch (SQLException e) {
            // Entspricht ERROR
            LOGGER.log(Level.SEVERE, "Fehler beim Überprüfen des Anfragelimits für Benutzer ID {0}. Erlaubte Anfragen: {1}, Zeitrahmen: {2} Minuten. Fehler: {3}",
                    new Object[]{userId, allowedRequests, allowedRequestsTimeframe, e.getMessage(), e});
            throw new RuntimeException("Fehler beim Überprüfen des Anfragelimits", e);
        }
    }

    public static void upsertApiLimit(Connection connection, int userId) {
        String selectQuery = "SELECT count FROM fooddb.api_rate_limits WHERE user_id = ?";
        String insertQuery = "INSERT INTO fooddb.api_rate_limits (user_id, count) VALUES (?, 1)";
        String updateQuery = "UPDATE fooddb.api_rate_limits SET count = count + 1, updated = NOW() WHERE user_id = ?";
        try (PreparedStatement selectStmt = connection.prepareStatement(selectQuery);
             PreparedStatement insertStmt = connection.prepareStatement(insertQuery);
             PreparedStatement updateStmt = connection.prepareStatement(updateQuery)) {
            selectStmt.setInt(1, userId);
            try (ResultSet rs = selectStmt.executeQuery()) {
                if (rs.next()) {
                    updateStmt.setInt(1, userId);
                    updateStmt.executeUpdate();
                } else {
                    insertStmt.setInt(1, userId);
                    insertStmt.executeUpdate();
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Generiert einen Referral-Link und speichert diesen in der Datenbank.
     */
    public static String generateReferral(Connection connection, long userId, String referralCode) {
        if (referralCode == null) {
            referralCode = RandomStringUtils.randomAlphanumeric(8);
        }
        String sql = "INSERT INTO fooddb.referrals (referral_code, fooddb.referrals.user_id) VALUES (?, ?)";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, referralCode);
            stmt.setLong(2, userId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            LOGGER.warning("Failed to generate referral link: " + e.getMessage());
        }
        return Const.SERVER_URL + "/register?ref=" + referralCode;
    }

    public static void updateReferralUsage(Connection connection, String referralCode) throws SQLException {
        String sql = "UPDATE fooddb.referrals SET usage_count = usage_count + 1 WHERE referral_code = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, referralCode);
            stmt.executeUpdate();
        }
    }

    public static int getUserIdByReferralCode(Connection connection, String referralCode) {
        String query = "SELECT user_id FROM fooddb.referrals WHERE referral_code = ?";

        try (PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, referralCode);
            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                if (resultSet.next()) {
                    return resultSet.getInt("user_id");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return 0;
    }

    public static List<ReferralStatsView.Referral> loadReferralStats(Connection connection) {
        List<ReferralStatsView.Referral> referrals = new ArrayList<>();
        String sql = "SELECT user_id, referral_code, usage_count FROM fooddb.referrals";
        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                referrals.add(new ReferralStatsView.Referral(
                        rs.getLong("user_id"),
                        rs.getString("referral_code"),
                        rs.getInt("usage_count")
                ));
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return referrals;
    }

    public static int getReferralCount(Connection connection, String username) {
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        String query = """
                SELECT u.id, u.username, COALESCE(SUM(r.usage_count), 0) AS total_referrals
                FROM fooddb.users u
                LEFT JOIN fooddb.referrals r ON u.id = r.user_id
                WHERE u.username = ?
                GROUP BY u.id, u.username;
                """;
        try (PreparedStatement ps = connection.prepareStatement(query)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("total_referrals");
                }
            }
        } catch (SQLException ex) {
            throw new RuntimeException(ex);
        }
        return 0;
    }

    public static void updateUserPremiumExpiration(Connection connection, String username, int referralUsageCount) {
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        String updateQuery = "UPDATE fooddb.users SET premium_expiration =" +
                             " CASE WHEN premium_expiration >= NOW() THEN DATE_ADD(premium_expiration, INTERVAL " + Const.REFERRAL_BONUS_FREE_MONTHS + " MONTH)" +
                             " ELSE DATE_ADD(NOW(), INTERVAL " + Const.REFERRAL_BONUS_FREE_MONTHS + " MONTH) END," +
                             " current_usage_count = ?, fooddb.users.current_usage_count_flag = 0" +
                             " WHERE username = ?;";

        try (PreparedStatement ps = connection.prepareStatement(updateQuery)) {
            ps.setInt(1, referralUsageCount);
            ps.setString(2, username);
            ps.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException(ex);
        }
    }

    public static ReferralUsageState getReferralUsageState(Connection connection, String username) {
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        String query = "SELECT current_usage_count, current_usage_count_flag FROM fooddb.users WHERE username = ?";

        try (PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, username);
            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                if (resultSet.next()) {
                    return new ReferralUsageState(resultSet.getInt("current_usage_count"), resultSet.getInt("current_usage_count_flag") == 1);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return new ReferralUsageState(0, false);
    }

    public static void resetUsersReferralFlag(Connection connection, int userId) {
        String sql = "UPDATE fooddb.users SET fooddb.users.current_usage_count_flag = 1 WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public static ApiLog getRecipeById(Connection connection, long id) {
        String query = "SELECT response, rec_uuid, active FROM fooddb.api_logs WHERE id = ?";

        try (PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setLong(1, id);
            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                if (resultSet.next()) {
                    return new ApiLog(id, resultSet.getString("response"), resultSet.getString("rec_uuid"),
                            resultSet.getInt("active") == 1);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return null;
    }

    public static ApiLog getRecipeByUuid(Connection connection, String uuid) {
        String query = "SELECT id, response, active FROM fooddb.api_logs WHERE rec_uuid = ?";

        try (PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, uuid);
            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                if (resultSet.next()) {
                    return new ApiLog(resultSet.getInt("id"), resultSet.getString("response"), uuid, resultSet.getInt("active") == 1);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return null;
    }

    public static void removeRecipeFromStarred(Connection connection, long id) {
        String sql = "UPDATE fooddb.api_logs SET fooddb.api_logs.starred = 0 WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public static void deleteApiLogAndRelatedEntries(Connection connection, long apiLogId) {
        // SQL-Queries
        String deleteRecipesSql = "DELETE FROM fooddb.recipes WHERE api_log_id = ?";
        String deleteApiLogSql = "DELETE FROM fooddb.api_logs WHERE id = ?";

        // Transaktion starten, um Konsistenz zu gewährleisten
        try {
            connection.setAutoCommit(false);
            // Schritt 1: Lösche alle recipes, die mit dem api_log_id verknüpft sind
            try (PreparedStatement psRecipes = connection.prepareStatement(deleteRecipesSql)) {
                psRecipes.setLong(1, apiLogId);
                psRecipes.executeUpdate();
            }

            // Schritt 2: Lösche den api_logs-Eintrag
            try (PreparedStatement psApiLog = connection.prepareStatement(deleteApiLogSql)) {
                psApiLog.setLong(1, apiLogId);
                psApiLog.executeUpdate();
            }

            // Transaktion committen
            connection.commit();
        } catch (SQLException e) {
            // Bei Fehler rollback durchführen
            try {
                connection.rollback();
            } catch (SQLException ex) {
                throw new RuntimeException(ex);
            }
        } finally {
            // AutoCommit wieder aktivieren
            try {
                connection.setAutoCommit(true);
            } catch (SQLException e) {
                LOGGER.warning(e.getSQLState());
            }
        }
    }

    public static void deactivateApiLog(Connection connection, long apiLogId) {
        // SQL-Query zum Setzen des active-Status auf 0
        String deactivateApiLogSql = "UPDATE fooddb.api_logs SET active = 0 WHERE id = ?";

        try {
            // Direktes Update ohne Transaktion, da wir nur eine einzelne Operation durchführen
            try (PreparedStatement psApiLog = connection.prepareStatement(deactivateApiLogSql)) {
                psApiLog.setLong(1, apiLogId);
                int rowsAffected = psApiLog.executeUpdate();

                // Optional: Logging der Anzahl der aktualisierten Zeilen
                if (rowsAffected > 0) {
                    LOGGER.info("API Log mit ID " + apiLogId + " wurde deaktiviert.");
                } else {
                    LOGGER.warning("API Log mit ID " + apiLogId + " wurde nicht gefunden oder konnte nicht deaktiviert werden.");
                }
            }
        } catch (SQLException e) {
            LOGGER.warning("Fehler beim Deaktivieren des API Logs: " + e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public static String getTheme(Connection connection, String username) {
        String query = "SELECT theme FROM fooddb.users WHERE username = ?";

        try (PreparedStatement preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, username);
            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                if (resultSet.next()) {
                    return resultSet.getString("theme");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return "light";
    }

    public static void updateTheme(Connection connection, String username, boolean isDarkTheme) {
        String sql = "UPDATE fooddb.users SET fooddb.users.theme = ? WHERE fooddb.users.username = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, isDarkTheme ? "dark" : "light");
            stmt.setString(2, username);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public static int getApiLogCount(Connection connection) {
        String query = "SELECT COUNT(*) FROM fooddb.api_logs";
        try (PreparedStatement statement = connection.prepareStatement(query)) {
            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                } else {
                    return -1;
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Fehler beim Beziehen der ApiLogs", e);
        }
        return -1;
    }

    public static List<String> getAllCountryKitchens(Connection connection) {
        List<String> countryKitchens = new ArrayList<>();
        String query = "SELECT value FROM fooddb.country_kitchen ORDER BY id";

        try (PreparedStatement statement = connection.prepareStatement(query)) {
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    countryKitchens.add(rs.getString("value"));
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Fehler beim Abrufen der Country Kitchens", e);
        }

        return countryKitchens;
    }

    public static List<String> getAllSpirits(Connection connection) {
        List<String> sprits = new ArrayList<>();
        String query = "SELECT value FROM fooddb.spirits ORDER BY id";

        try (PreparedStatement statement = connection.prepareStatement(query)) {
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    sprits.add(rs.getString("value"));
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Fehler beim Abrufen der Spririts", e);
        }

        return sprits;
    }

    /**
     * Gibt paginierte Rezepte eines Benutzers zurück.
     *
     * @param connection Datenbankverbindung
     * @param username   Benutzername
     * @param starred    Nur favorisierte Einträge?
     * @param type       Typ des Rezepts (food/drink)
     * @param offset     Startpunkt der Ergebnisse
     * @param limit      Maximale Anzahl der Ergebnisse
     * @return Liste von ApiLog-Objekten
     */
    public static List<ApiLog> getPaginatedRecipes(Connection connection, String username,
                                                   boolean starred, String type,
                                                   int offset, int limit) {
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        final String sql =
                "SELECT al.id, al.response, al.rec_uuid, r.title, al.created, al.type, al.active " +
                "FROM fooddb.api_logs al " +
                "LEFT JOIN fooddb.recipes r ON al.id = r.api_log_id " +
                "WHERE al.user_id = ? " +
                "AND al.starred = " + (starred ? 1 : 0) + " " +
                "AND al.type = '" + type + "' " +
                "AND al.active = '" + 1 + "' " +
                "ORDER BY al.created DESC " +
                "LIMIT ? OFFSET ?";

        List<ApiLog> responses = new ArrayList<>();
        int userId = getUserIdByUsername(connection, username);

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, limit);
            ps.setInt(3, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    responses.add(new ApiLog(
                            rs.getLong("id"),
                            rs.getString("response"),
                            rs.getString("rec_uuid"),
                            rs.getString("title"),
                            rs.getTimestamp("created"),
                            rs.getString("type"),
                            rs.getInt("active") == 1
                    ));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching paginated responses", e);
        }
        return responses;
    }

    /**
     * Gibt die Gesamtanzahl der Rezepte eines Benutzers zurück.
     *
     * @param connection Datenbankverbindung
     * @param username   Benutzername
     * @param starred    Nur favorisierte Einträge?
     * @param type       Typ des Rezepts (food/drink)
     * @return Anzahl der Rezepte
     */
    public static int getRecipeCount(Connection connection, String username, boolean starred, String type) {
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        final String sql =
                "SELECT COUNT(*) AS count " +
                "FROM fooddb.api_logs al " +
                "WHERE al.user_id = ? " +
                "AND al.starred = " + (starred ? 1 : 0) + " " +
                "AND al.type = '" + type + "' " +
                "AND al.active = '" + 1 + "'";

        int userId = getUserIdByUsername(connection, username);

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("count");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error counting recipes", e);
        }
        return 0;
    }

    /**
     * Gibt paginierte favorisierte Rezepte eines Benutzers zurück.
     *
     * @param connection Datenbankverbindung
     * @param username   Benutzername
     * @param type       Typ des Rezepts (food/drink)
     * @param offset     Startpunkt der Ergebnisse
     * @param limit      Maximale Anzahl der Ergebnisse
     * @return Liste von ApiLog-Objekten
     */
    public static List<ApiLog> getPaginatedFavorites(Connection connection, String username,
                                                     String type, int offset, int limit) {
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        final String sql =
                "SELECT al.id, al.response, al.rec_uuid, r.title, al.created, al.type, al.active " +
                "FROM fooddb.api_logs al " +
                "LEFT JOIN fooddb.recipes r ON al.id = r.api_log_id " +
                "WHERE al.user_id = ? " +
                "AND al.starred = 1 " +
                "AND al.type = '" + type + "' " +
                "AND al.active = '" + 1 + "' " +
                "ORDER BY al.created DESC " +
                "LIMIT ? OFFSET ?";

        List<ApiLog> responses = new ArrayList<>();
        int userId = getUserIdByUsername(connection, username);

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, limit);
            ps.setInt(3, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    responses.add(new ApiLog(
                            rs.getLong("id"),
                            rs.getString("response"),
                            rs.getString("rec_uuid"),
                            rs.getString("title"),
                            rs.getTimestamp("created"),
                            rs.getString("type"),
                            rs.getInt("active") == 1
                    ));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching paginated favorites", e);
        }
        return responses;
    }

    /**
     * Gibt die Gesamtanzahl der favorisierten Rezepte eines Benutzers zurück.
     *
     * @param connection Datenbankverbindung
     * @param username   Benutzername
     * @param type       Typ des Rezepts (food/drink)
     * @return Anzahl der favorisierten Rezepte
     */
    public static int getFavoriteCount(Connection connection, String username, String type) {
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        final String sql =
                "SELECT COUNT(*) AS count " +
                "FROM fooddb.api_logs al " +
                "WHERE al.user_id = ? " +
                "AND al.starred = 1 " +
                "AND al.type = '" + type + "' " +
                "AND al.active = '" + 1 + "'";

        int userId = getUserIdByUsername(connection, username);

        try (PreparedStatement ps = Objects.requireNonNull(connection).prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("count");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error counting favorites", e);
        }
        return 0;
    }

    /**
     * Diagnosemethode für Premium-Status-Probleme
     * Diese Methode prüft alle relevanten Faktoren für den Premium-Status und gibt
     * detaillierte Informationen zurück.
     *
     * @param connection Datenbankverbindung
     * @param username Benutzername
     * @return String mit Diagnoseinformationen
     */
    public static String diagnosePremiumStatus(Connection connection, String username) {
        StringBuilder result = new StringBuilder();
        result.append("Premium-Status-Diagnose für Benutzer: ").append(username).append("\n\n");

        try {
            User user = getUserByUsername(connection, username);
            if (user == null) {
                return "Benutzer nicht gefunden: " + username;
            }

            // Basisinformationen
            result.append("Benutzer-ID: ").append(user.getId()).append("\n");
            result.append("E-Mail: ").append(user.getEmail()).append("\n");

            // Premium-Ablaufdatum
            Date premiumExpiration = user.getPremiumExpiration();
            result.append("Premium-Ablaufdatum: ");
            if (premiumExpiration != null) {
                boolean isExpired = premiumExpiration.before(new Date());
                result.append(new SimpleDateFormat("dd.MM.yyyy HH:mm:ss").format(premiumExpiration))
                        .append(isExpired ? " (ABGELAUFEN)" : " (GÜLTIG)").append("\n");
            } else {
                result.append("Nicht gesetzt\n");
            }

            // PayPal-Subscription
            String subscriptionId = user.getSubscriptionId();
            result.append("Subscription-ID: ");
            if (subscriptionId != null && !subscriptionId.isEmpty()) {
                result.append(subscriptionId).append("\n");

                // PayPal-Status abfragen
                PayPalSubscriptionInfo paypal = new PayPalSubscriptionInfo();
                String status = paypal.getSubscriptionStatus(subscriptionId);
                result.append("PayPal-Status: ").append(status).append("\n");

                // Next Billing Time
                String nextBillingTime = paypal.getNextBillingTime(subscriptionId);
                result.append("Nächste Abrechnung: ").append(nextBillingTime != null ? nextBillingTime : "Nicht verfügbar").append("\n");
            } else {
                result.append("Nicht gesetzt\n");
            }

            // Effektiver Premium-Status
            boolean isPremium = checkPremiumState(connection, username);
            result.append("\nEffektiver Premium-Status: ").append(isPremium ? "AKTIV ✅" : "INAKTIV ❌").append("\n");

            // Aktionen
            result.append("\nMögliche Lösungen:\n");
            if (!isPremium && subscriptionId != null && !subscriptionId.isEmpty()) {
                result.append("- Premium-Ablaufdatum manuell synchronisieren\n");
                result.append("- Subscription-Status bei PayPal prüfen\n");
            } else if (!isPremium && (premiumExpiration == null || premiumExpiration.before(new Date()))) {
                result.append("- Premium-Ablaufdatum manuell verlängern\n");
                result.append("- Benutzer zum Kauf eines Abonnements anleiten\n");
            }

        } catch (Exception e) {
            result.append("Fehler bei der Diagnose: ").append(e.getMessage());
            LOGGER.warning("Fehler bei der Premium-Diagnose für " + username + ": " + e.getMessage());
        }

        return result.toString();
    }

    //    public static void syncPremiumExpiration(Connection connection, User user) {
    //        if (user.getSubscriptionId() != null && !user.getSubscriptionId().isEmpty()) {
    //            PayPalSubscriptionInfo paypal = new PayPalSubscriptionInfo();
    //            String subscriptionStatus = paypal.getSubscriptionStatus(user.getSubscriptionId());
    //            if ("ACTIVE".equals(subscriptionStatus)) {
    //                String nextBillingTime = paypal.getNextBillingTime(user.getSubscriptionId());
    //                if (nextBillingTime != null) {
    //                    try {
    //                        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
    //                        Date nextBillingDate = sdf.parse(nextBillingTime);
    //                        user.setPremiumExpiration(nextBillingDate);
    //                        String sql = "UPDATE fooddb.users SET premium_expiration = ? WHERE username = ?";
    //                        try (PreparedStatement ps = connection.prepareStatement(sql)) {
    //                            ps.setTimestamp(1, new Timestamp(nextBillingDate.getTime()));
    //                            ps.setString(2, user.getUsername());
    //                            ps.executeUpdate();
    //                            LOGGER.info("premiumExpiration für {} aktualisiert auf: " + user.getUsername() + " -> " + nextBillingDate);
    //                        }
    //                    } catch (Exception e) {
    //                        LOGGER.warning("Fehler beim Synchronisieren von premium_expiration" + e);
    //                    }
    //                }
    //            }
    //        }
    //    }
}
