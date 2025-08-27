CREATE DATABASE IF NOT EXISTS weather_tracker;

USE weather_tracker;

CREATE TABLE IF NOT EXISTS weather_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature_indoor DECIMAL(5,2) DEFAULT NULL,
    humidity_indoor DECIMAL(5,2) DEFAULT NULL,
    pressure_indoor DECIMAL(7,2) DEFAULT NULL,
    temperature_outdoor DECIMAL(5,2) DEFAULT NULL,
    humidity_outdoor DECIMAL(5,2) DEFAULT NULL,
    sensor_indoor VARCHAR(20) DEFAULT NULL,
    sensor_outdoor VARCHAR(20) DEFAULT NULL,
    timestamp INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp)
);