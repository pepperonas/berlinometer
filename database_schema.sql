-- Datenbank für Popular Times Historie
CREATE DATABASE IF NOT EXISTS popular_times_db;
USE popular_times_db;

-- Tabelle für Location-Stammdaten
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_maps_url VARCHAR(500) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_url (google_maps_url)
);

-- Tabelle für Auslastungs-Historie
CREATE TABLE IF NOT EXISTS occupancy_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    occupancy_percent INT,  -- Aktuelle Auslastung in %
    usual_percent INT,      -- Normale Auslastung in %
    is_live_data BOOLEAN DEFAULT FALSE,
    raw_text TEXT,          -- Original-Text von Google Maps
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    INDEX idx_location_time (location_id, timestamp),
    INDEX idx_timestamp (timestamp)
);

-- View für die letzten 12 Stunden pro Location
CREATE VIEW occupancy_last_12h AS
SELECT 
    l.id as location_id,
    l.google_maps_url,
    l.name,
    oh.occupancy_percent,
    oh.usual_percent,
    oh.is_live_data,
    oh.timestamp
FROM locations l
INNER JOIN occupancy_history oh ON l.id = oh.location_id
WHERE oh.timestamp >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
ORDER BY l.id, oh.timestamp DESC;

-- Stored Procedure zum Einfügen/Updaten von Location und Historie
DELIMITER $$
CREATE PROCEDURE insert_occupancy_data(
    IN p_url VARCHAR(500),
    IN p_name VARCHAR(255),
    IN p_address VARCHAR(500),
    IN p_occupancy_percent INT,
    IN p_usual_percent INT,
    IN p_is_live_data BOOLEAN,
    IN p_raw_text TEXT
)
BEGIN
    DECLARE v_location_id INT;
    
    -- Location einfügen oder aktualisieren
    INSERT INTO locations (google_maps_url, name, address)
    VALUES (p_url, p_name, p_address)
    ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        address = COALESCE(VALUES(address), address),
        updated_at = CURRENT_TIMESTAMP;
    
    -- Location ID abrufen
    SELECT id INTO v_location_id FROM locations WHERE google_maps_url = p_url;
    
    -- Historie-Eintrag hinzufügen
    INSERT INTO occupancy_history (location_id, occupancy_percent, usual_percent, is_live_data, raw_text)
    VALUES (v_location_id, p_occupancy_percent, p_usual_percent, p_is_live_data, p_raw_text);
END$$
DELIMITER ;

-- User Management Tables

-- Table for user accounts
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,  -- Manual activation by admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- Table for user filter preferences
CREATE TABLE IF NOT EXISTS user_filters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filter_type ENUM(
        'location_name_contains',
        'location_name_equals', 
        'address_contains',
        'rating_min',
        'occupancy_max',
        'occupancy_min',
        'exclude_location',
        'only_live_data'
    ) NOT NULL,
    filter_value VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_filters (user_id, is_active),
    INDEX idx_filter_type (filter_type)
);

-- Table for user sessions (JWT token management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_sessions (user_id, is_active),
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
);

-- Table for user's saved locations
CREATE TABLE IF NOT EXISTS user_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location_id INT NOT NULL,
    display_order INT DEFAULT 0,  -- Order in which locations appear for user
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_location (user_id, location_id),
    INDEX idx_user_locations (user_id, is_active),
    INDEX idx_display_order (user_id, display_order)
);

-- View for active user filters
CREATE VIEW user_active_filters AS
SELECT 
    uf.user_id,
    u.username,
    uf.filter_type,
    uf.filter_value,
    uf.created_at
FROM user_filters uf
INNER JOIN users u ON uf.user_id = u.id
WHERE uf.is_active = TRUE AND u.is_active = TRUE
ORDER BY uf.user_id, uf.filter_type;

-- View for user's saved locations with details
CREATE VIEW user_saved_locations AS
SELECT 
    ul.user_id,
    u.username,
    l.id as location_id,
    l.google_maps_url,
    l.name,
    l.address,
    ul.display_order,
    ul.created_at as saved_at
FROM user_locations ul
INNER JOIN users u ON ul.user_id = u.id
INNER JOIN locations l ON ul.location_id = l.id
WHERE ul.is_active = TRUE AND u.is_active = TRUE
ORDER BY ul.user_id, ul.display_order;

-- Table for opening hours history tracking
CREATE TABLE IF NOT EXISTS opening_hours_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    weekday TINYINT NOT NULL,  -- 0=Sonntag, 1=Montag, 2=Dienstag, ..., 6=Samstag
    open_time TIME,            -- Öffnungszeit (NULL wenn ganztägig geschlossen)
    close_time TIME,           -- Schließzeit (NULL wenn ganztägig geschlossen)
    is_closed BOOLEAN DEFAULT FALSE,        -- TRUE wenn ganztägig geschlossen
    is_24h BOOLEAN DEFAULT FALSE,          -- TRUE wenn 24 Stunden geöffnet
    special_hours TEXT,        -- JSON für Feiertage/Sonderzeiten
    raw_text TEXT,            -- Original Google Maps Text
    detected_from_scraping BOOLEAN DEFAULT TRUE,
    confidence_score FLOAT DEFAULT 1.0,   -- Confidence der Erkennung (0.0-1.0)
    first_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_confirmed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    INDEX idx_location_weekday (location_id, weekday),
    INDEX idx_active (is_active),
    INDEX idx_location_active (location_id, is_active),
    UNIQUE KEY unique_location_weekday (location_id, weekday, is_active)
);

-- Stored Procedure für Öffnungszeiten-Update
DELIMITER $$
CREATE PROCEDURE update_opening_hours(
    IN p_location_id INT,
    IN p_weekday TINYINT,
    IN p_open_time TIME,
    IN p_close_time TIME,
    IN p_is_closed BOOLEAN,
    IN p_is_24h BOOLEAN,
    IN p_raw_text TEXT,
    IN p_confidence_score FLOAT
)
BEGIN
    DECLARE v_existing_count INT DEFAULT 0;

    -- Check if we already have hours for this location/weekday
    SELECT COUNT(*) INTO v_existing_count
    FROM opening_hours_history
    WHERE location_id = p_location_id
    AND weekday = p_weekday
    AND is_active = TRUE;

    -- If exists, check if data is different
    IF v_existing_count > 0 THEN
        -- Deactivate old entry if data has changed
        UPDATE opening_hours_history
        SET is_active = FALSE
        WHERE location_id = p_location_id
        AND weekday = p_weekday
        AND is_active = TRUE
        AND (
            COALESCE(open_time, 'NULL') != COALESCE(p_open_time, 'NULL') OR
            COALESCE(close_time, 'NULL') != COALESCE(p_close_time, 'NULL') OR
            is_closed != p_is_closed OR
            is_24h != p_is_24h
        );

        -- Only insert if something actually changed
        IF ROW_COUNT() > 0 THEN
            INSERT INTO opening_hours_history (
                location_id, weekday, open_time, close_time,
                is_closed, is_24h, raw_text, confidence_score
            ) VALUES (
                p_location_id, p_weekday, p_open_time, p_close_time,
                p_is_closed, p_is_24h, p_raw_text, p_confidence_score
            );
        ELSE
            -- Just update confirmation timestamp
            UPDATE opening_hours_history
            SET last_confirmed = CURRENT_TIMESTAMP,
                confidence_score = GREATEST(confidence_score, p_confidence_score)
            WHERE location_id = p_location_id
            AND weekday = p_weekday
            AND is_active = TRUE;
        END IF;
    ELSE
        -- Insert new entry
        INSERT INTO opening_hours_history (
            location_id, weekday, open_time, close_time,
            is_closed, is_24h, raw_text, confidence_score
        ) VALUES (
            p_location_id, p_weekday, p_open_time, p_close_time,
            p_is_closed, p_is_24h, p_raw_text, p_confidence_score
        );
    END IF;
END$$
DELIMITER ;

-- View für aktuelle Öffnungszeiten pro Location
CREATE VIEW current_opening_hours AS
SELECT
    l.id as location_id,
    l.name,
    l.address,
    oh.weekday,
    oh.open_time,
    oh.close_time,
    oh.is_closed,
    oh.is_24h,
    oh.confidence_score,
    oh.last_confirmed,
    CASE
        WHEN oh.is_24h THEN '24h geöffnet'
        WHEN oh.is_closed THEN 'Geschlossen'
        WHEN oh.open_time IS NULL OR oh.close_time IS NULL THEN 'Unbekannt'
        ELSE CONCAT(TIME_FORMAT(oh.open_time, '%H:%i'), ' - ', TIME_FORMAT(oh.close_time, '%H:%i'))
    END as hours_display
FROM locations l
LEFT JOIN opening_hours_history oh ON l.id = oh.location_id AND oh.is_active = TRUE
ORDER BY l.id, oh.weekday;