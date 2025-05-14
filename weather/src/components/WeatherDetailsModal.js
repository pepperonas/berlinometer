import React, { useContext, useEffect, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function WeatherDetailsModal({ dayData, onClose }) {
    const { darkMode } = useContext(ThemeContext);
    const modalRef = useRef(null);

    // Handle click outside to close modal
    useEffect(() => {
        function handleClickOutside(event) {
            // Check if the click target is the overlay (background) element
            if (event.target.classList.contains('modal-overlay')) {
                onClose();
            }
        }

        // Handle back button on mobile devices
        function handleBackButton(event) {
            if (dayData) {
                event.preventDefault();
                onClose();
            }
        }

        document.addEventListener('click', handleClickOutside);
        window.addEventListener('popstate', handleBackButton);

        // Push a new state to allow back button handling
        window.history.pushState(null, document.title, window.location.href);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            window.removeEventListener('popstate', handleBackButton);
        };
    }, [dayData, onClose]);

    if (!dayData) return null;

    // Datum formatieren
    const date = new Date(dayData[0].dt * 1000);
    const dayName = date.toLocaleDateString('de-DE', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('de-DE');

    // Durchschnittliche Temperatur berechnen
    const getAverageTemp = (data) => {
        const sum = data.reduce((acc, item) => acc + item.main.temp, 0);
        return Math.round(sum / data.length);
    };

    // Min und Max Temperatur finden
    const getMinMaxTemp = (data) => {
        let min = data[0].main.temp_min;
        let max = data[0].main.temp_max;

        data.forEach(item => {
            if (item.main.temp_min < min) min = item.main.temp_min;
            if (item.main.temp_max > max) max = item.main.temp_max;
        });

        return { min: Math.round(min), max: Math.round(max) };
    };

    // Durchschnittliche Luftfeuchtigkeit berechnen
    const getAverageHumidity = (data) => {
        const sum = data.reduce((acc, item) => acc + item.main.humidity, 0);
        return Math.round(sum / data.length);
    };

    // Durchschnittliche Windgeschwindigkeit berechnen
    const getAverageWindSpeed = (data) => {
        const sum = data.reduce((acc, item) => acc + item.wind.speed, 0);
        return Math.round((sum / data.length) * 3.6); // Umrechnung in km/h
    };

    // Wetterbeschreibung und Icon für verschiedene Tageszeiten
    const getTimeBasedWeather = (data) => {
        // Zeiten für morgens, mittags, abends, nachts
        const timeSlots = {
            morning: [], // 6-12 Uhr
            afternoon: [], // 12-18 Uhr
            evening: [], // 18-22 Uhr
            night: [] // 22-6 Uhr
        };

        data.forEach(item => {
            const hour = new Date(item.dt * 1000).getHours();

            if (hour >= 6 && hour < 12) {
                timeSlots.morning.push(item);
            } else if (hour >= 12 && hour < 18) {
                timeSlots.afternoon.push(item);
            } else if (hour >= 18 && hour < 22) {
                timeSlots.evening.push(item);
            } else {
                timeSlots.night.push(item);
            }
        });

        // Für jede Tageszeit ein repräsentatives Wetter finden
        const result = {};

        Object.entries(timeSlots).forEach(([time, items]) => {
            if (items.length > 0) {
                // Einfach das erste Element für die jeweilige Tageszeit nehmen
                result[time] = {
                    icon: items[0].weather[0].icon,
                    description: items[0].weather[0].description,
                    temp: Math.round(items[0].main.temp)
                };
            }
        });

        return result;
    };

    const avgTemp = getAverageTemp(dayData);
    const { min, max } = getMinMaxTemp(dayData);
    const avgHumidity = getAverageHumidity(dayData);
    const avgWindSpeed = getAverageWindSpeed(dayData);
    const timeBasedWeather = getTimeBasedWeather(dayData);

    // Handle direct click on overlay
    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn modal-overlay" onClick={handleOverlayClick}>
            <div ref={modalRef} className={`relative w-full max-w-2xl rounded-lg shadow-lg p-6 ${darkMode ? 'bg-primary-light' : 'bg-white'} animate-slideIn`}>
                {/* Schließen-Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Schließen"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold">{dayName}</h2>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{dateStr}</p>
                </div>

                {/* Hauptinformationen */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Durchschnitt</p>
                        <p className="text-3xl font-bold">{avgTemp}°C</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Min / Max</p>
                        <p className="text-3xl font-bold">{min}° / {max}°</p>
                    </div>
                </div>

                {/* Zusätzliche Informationen */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Luftfeuchtigkeit</p>
                        <p className="text-xl font-semibold">{avgHumidity}%</p>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Wind</p>
                        <p className="text-xl font-semibold">{avgWindSpeed} km/h</p>
                    </div>
                </div>

                {/* Wetterinformationen nach Tageszeiten */}
                <h3 className="text-lg font-semibold mb-2">Tagesverlauf</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(timeBasedWeather).map(([time, data]) => (
                        <div key={time} className={`p-3 rounded-lg text-center ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {time === 'morning' ? 'Morgens' :
                                    time === 'afternoon' ? 'Mittags' :
                                        time === 'evening' ? 'Abends' : 'Nachts'}
                            </p>
                            <img
                                src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
                                alt={data.description}
                                className="w-12 h-12 mx-auto"
                            />
                            <p className="capitalize text-xs">{data.description}</p>
                            <p className="text-lg font-semibold">{data.temp}°C</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default WeatherDetailsModal;