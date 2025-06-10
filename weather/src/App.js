import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import WeatherCard from './components/WeatherCard';
import SearchBar from './components/SearchBar';
import Forecast from './components/Forecast';
import LoadingSpinner from './components/LoadingSpinner';
import ThemeSwitch from './components/ThemeSwitch';
import OfflineNotice from './components/OfflineNotice';
import {ThemeContext} from './context/ThemeContext';
import WeatherCharts from "./components/WeatherCharts";

function App() {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [location, setLocation] = useState('Berlin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const {darkMode} = useContext(ThemeContext);

    const API_KEY = '21027f5e389230401529c52f24f6887e';
    const API_URL = 'https://api.openweathermap.org/data/2.5';

    // Online/Offline Status überwachen
    useEffect(() => {
        // Handler für Online/Offline Events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // Event-Listener registrieren
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Event-Listener entfernen
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Initial Wetterdaten laden
    useEffect(() => {
        fetchWeather(location);
        updateServiceWorker(); // Aktualisiere Service Worker bei App-Start
    }, [location]);

    const updateServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.update();
                    console.log('Service Worker aktualisiert');
                }
            });
        }
    };

    const fetchWeather = async (city) => {
        setLoading(true);
        setError('');
        try {
            // Aktuelles Wetter abrufen
            const weatherResponse = await axios.get(
                `${API_URL}/weather?q=${city}&units=metric&lang=de&appid=${API_KEY}`
            );

            // 5-Tage-Vorhersage abrufen
            const forecastResponse = await axios.get(
                `${API_URL}/forecast?q=${city}&units=metric&lang=de&appid=${API_KEY}`
            );

            setWeather(weatherResponse.data);

            // Gruppiere Vorhersagedaten nach Tagen
            const dailyData = forecastResponse.data.list.reduce((acc, item) => {
                const date = new Date(item.dt * 1000).toDateString();
                if (!acc[date]) {
                    acc[date] = [];
                }
                acc[date].push(item);
                return acc;
            }, {});

            setForecast(Object.values(dailyData).slice(0, 5));
            setLocation(city);

            // Daten im localStorage speichern für Offline-Nutzung
            localStorage.setItem('weatherData', JSON.stringify(weatherResponse.data));
            localStorage.setItem('forecastData', JSON.stringify(Object.values(dailyData).slice(0, 5)));
            localStorage.setItem('lastLocation', city);
            localStorage.setItem('lastUpdated', new Date().toISOString());

        } catch (err) {
            setError('Stadt nicht gefunden oder API-Fehler. Bitte versuche es erneut.');
            console.error('Fehler beim Abrufen des Wetters:', err);
        } finally {
            setLoading(false);
        }
    };

    // Bei Offline-Status: Daten aus dem LocalStorage laden
    useEffect(() => {
        if (!isOnline && !weather && !forecast) {
            const savedWeather = localStorage.getItem('weatherData');
            const savedForecast = localStorage.getItem('forecastData');
            const savedLocation = localStorage.getItem('lastLocation');

            if (savedWeather) {
                setWeather(JSON.parse(savedWeather));
            }
            if (savedForecast) {
                setForecast(JSON.parse(savedForecast));
            }
            if (savedLocation) {
                setLocation(savedLocation);
            }
        }
    }, [isOnline, weather, forecast]);

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-primary text-white' : 'bg-white text-gray-800'}`}>
            <div className="container mx-auto px-4 py-4 sm:py-8 max-w-5xl">
                <div className="flex justify-between items-center mb-4 sm:mb-8">
                    <h1 className={`text-2xl sm:text-4xl font-bold tracking-tight ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}>
                        Wetter App
                    </h1>
                    <ThemeSwitch/>
                </div>

                {!isOnline && (
                    <div
                        className={`border px-3 py-2 rounded-lg shadow-sm mb-4 text-sm ${darkMode ? 'bg-yellow-800 border-yellow-700 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                        Du bist offline. Es werden gespeicherte Daten angezeigt.
                    </div>
                )}

                <SearchBar onSearch={fetchWeather}/>

                {error && (
                    <div
                        className={`border px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-sm relative mt-3 mb-3 sm:mt-4 sm:mb-4 text-sm sm:text-base ${darkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-gray-100 border-red-300 text-red-600'}`}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <LoadingSpinner/>
                ) : (
                    <>
                        {weather && <WeatherCard weather={weather}/>}

                        {!isOnline && !weather && !forecast && (
                            <OfflineNotice/>
                        )}

                        {forecast && (
                            <>
                                <div className="mt-6 sm:mt-8">
                                    <h2 className={`text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}>
                                        5-Tage-Vorhersage für {location}
                                    </h2>
                                    <Forecast forecast={forecast}/>
                                </div>

                                <WeatherCharts forecast={forecast}/>
                            </>
                        )}
                    </>
                )}

                <div className="mt-6 sm:mt-8 text-center mb-6">
                    <button
                        className={`text-sm sm:text-base font-semibold py-2 px-4 sm:px-6 rounded-full shadow-md transition duration-300 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                        onClick={() => fetchWeather(location)}
                        disabled={!isOnline}
                    >
                        JETZT AKTUALISIEREN!
                    </button>
                </div>

                {!isOnline && (
                    <div className="text-center text-sm mb-4">
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                            Letzte Aktualisierung: {localStorage.getItem('lastUpdated') ?
                            new Date(localStorage.getItem('lastUpdated')).toLocaleString('de-DE') :
                            'Unbekannt'}
                        </p>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <a
                        href="https://mrx3k1.de/weather-tracker/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-block px-6 py-3 rounded-lg font-medium transition-colors ${
                            darkMode 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    >
                        Weather Tracker
                    </a>
                </div>

                <div
                    className={`mt-4 pt-4 pb-2 text-center text-m ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Made with ❤️ by Martin Pfeffer
                </div>
            </div>
        </div>
    );
}

export default App;