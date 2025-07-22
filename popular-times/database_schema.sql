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