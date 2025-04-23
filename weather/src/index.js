import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ThemeProvider from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider>
            <App/>
        </ThemeProvider>
    </React.StrictMode>
);

// Service Worker registrieren
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/weather/service-worker.js')
            .then(registration => {
                console.log('Service Worker erfolgreich registriert mit Scope:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker Registrierung fehlgeschlagen:', error);
            });
    });
}