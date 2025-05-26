// Für Entwicklung: Erstelle eine .env Datei mit deinen VPS-Datenbank-Zugangsdaten
// DB_HOST=dein-vps-host
// DB_USER=dein-db-user
// DB_PASSWORD=dein-db-passwort

module.exports = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'weather_tracker',
    port: process.env.DB_PORT || 3306
};