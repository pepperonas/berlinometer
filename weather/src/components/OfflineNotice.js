import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function OfflineNotice() {
    const { darkMode } = useContext(ThemeContext);

    return (
        <div className={`rounded-lg shadow-lg p-4 sm:p-6 mt-4 sm:mt-6 ${darkMode ? 'bg-primary-light' : 'bg-white'}`}>
            <div className="flex flex-col items-center justify-center text-center py-6">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-16 w-16 mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>

                <h2 className="text-xl sm:text-2xl font-bold mb-2">Du bist offline</h2>

                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Keine Internetverbindung verfügbar. Deine Wetter-App funktioniert mit den zuletzt abgerufenen Daten.
                </p>

                <button
                    className={`text-sm sm:text-base font-semibold py-2 px-4 sm:px-6 rounded-full shadow-md transition duration-300 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    onClick={() => window.location.reload()}
                >
                    ERNEUT VERSUCHEN
                </button>
            </div>
        </div>
    );
}

export default OfflineNotice;