// src/services/energyDataService.js
import axios from 'axios';

// Basis-URL für die API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Energiedaten für eine bestimmte Lampe speichern
 * @param {string} userId - Benutzer-ID
 * @param {string} lightId - Lampen-ID
 * @param {Object} data - Zu speichernde Daten
 * @returns {Promise<Object>} - Antwort vom Server
 */
export const saveEnergyData = async (userId, lightId, data) => {
    try {
        const response = await axios.post(`${API_URL}/energy-data`, {
            userId,
            lightId,
            data
        });
        return response.data;
    } catch (error) {
        console.error('Fehler beim Speichern der Energiedaten:', error);
        throw error;
    }
};

/**
 * Energieverlauf für eine bestimmte Lampe abrufen
 * @param {string} userId - Benutzer-ID
 * @param {string} lightId - Lampen-ID
 * @param {number} startTime - Startzeit (Timestamp)
 * @param {number} endTime - Endzeit (Timestamp)
 * @returns {Promise<Array>} - Verlaufsdaten
 */
export const getEnergyHistory = async (userId, lightId, startTime, endTime) => {
    try {
        const response = await axios.get(`${API_URL}/energy-data/${userId}/history/${lightId}`, {
            params: { startTime, endTime }
        });
        return response.data;
    } catch (error) {
        console.error('Fehler beim Abrufen des Energieverlaufs:', error);
        throw error;
    }
};

/**
 * Alle Energiedaten für einen Benutzer abrufen
 * @param {string} userId - Benutzer-ID
 * @returns {Promise<Object>} - Energiedaten
 */
export const getAllUserEnergyData = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/energy-data/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Fehler beim Abrufen aller Energiedaten:', error);
        throw error;
    }
};

/**
 * Hybridfunktion, die versucht, Daten online zu speichern und bei Fehlern lokal speichert
 * @param {string} userId - Benutzer-ID
 * @param {string} lightId - Lampen-ID
 * @param {Object} data - Zu speichernde Daten
 * @param {Function} localSaveFunction - Funktion zum lokalen Speichern
 */
export const saveEnergyDataWithFallback = async (userId, lightId, data, localSaveFunction) => {
    try {
        // Versuche, Daten online zu speichern
        await saveEnergyData(userId, lightId, data);
    } catch (error) {
        console.warn('Online-Speicherung fehlgeschlagen, verwende lokale Speicherung:', error);
        // Bei Fehler lokale Speicherung verwenden
        await localSaveFunction(lightId, data);
    }
};