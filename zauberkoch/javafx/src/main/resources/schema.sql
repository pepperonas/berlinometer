-- Erstelle die Datenbank, falls sie nicht existiert (optional)
CREATE DATABASE IF NOT EXISTS fooddb;

-- Verwende die Datenbank
USE fooddb;

-- Tabellen erstellen
CREATE TABLE IF NOT EXISTS user
(
    id         INT PRIMARY KEY AUTO_INCREMENT,
    username   VARCHAR(100) UNIQUE NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name  VARCHAR(100) DEFAULT NULL,
    created    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    last_seen  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    premium    INTEGER      DEFAULT 0,
    last_meal  TEXT         DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS meal
(
    id          INT PRIMARY KEY AUTO_INCREMENT,
    titel       TEXT NOT NULL,
    description TEXT      DEFAULT NULL,
    created     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vegetarian  INTEGER   DEFAULT 1,
    vegan       INTEGER   DEFAULT 1,
    rating      INTEGER   DEFAULT 0
);