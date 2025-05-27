// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import PasswordView from './components/PasswordView';
import OpenerView from './components/OpenerView';
import DatesView from './components/DatesView';
import TipsView from './components/TipsView';
import Toast from './components/Toast';
import PWAPrompt from './components/PWAPrompt';
import { validateSequence, generateToken } from './utils/helpers';
import './App.css';

function App() {
    // States
    const [view, setView] = useState('password');
    const [openerData, setOpenerData] = useState([]);
    const [datesData, setDatesData] = useState([]);
    const [tipsData, setTipsData] = useState(null);
    const [currentOpener, setCurrentOpener] = useState('');
    const [toast, setToast] = useState({ show: false, message: '' });
    const [loading, setLoading] = useState(false);
    const [newVersionAvailable, setNewVersionAvailable] = useState(false);
    const [leftLockSwipeCount, setLeftLockSwipeCount] = useState(0);
    const [rightLockSwipeCount, setRightLockSwipeCount] = useState(0);
    const [bypassReady, setBypassReady] = useState(false);
    
    // Refs für Touch-Handling
    const touchStartXRef = useRef(null);
    const touchEndXRef = useRef(null);
    const touchStartYRef = useRef(null);
    const touchEndYRef = useRef(null);
    const leftLockRef = useRef(null);
    const rightLockRef = useRef(null);
    const minSwipeDistance = 50;

    // Prüfe auf neue App-Versionen
    useEffect(() => {
        // Event-Listener für Service Worker Updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                setNewVersionAvailable(true);
            });
        }
    }, []);
    
    // Überprüfe ob die Bypass-Sequenz erfüllt ist
    useEffect(() => {
        const result = validateSequence(leftLockSwipeCount, rightLockSwipeCount, view);
        setBypassReady(result);
    }, [leftLockSwipeCount, rightLockSwipeCount, view]);
    
    // Handler für linkes Schloss (nach unten wischen)
    const handleLeftLockTouchStart = (e) => {
        if (view !== 'password') return;
        touchStartYRef.current = e.targetTouches[0].clientY;
    };

    const handleLeftLockTouchMove = (e) => {
        if (view !== 'password') return;
        touchEndYRef.current = e.targetTouches[0].clientY;
        const moveDistance = touchEndYRef.current - touchStartYRef.current; // Nach unten = positiv
        
        if (moveDistance > 0 && leftLockRef.current) {
            const actualMove = Math.min(moveDistance, 100);
            leftLockRef.current.style.transform = `translateY(${actualMove}px)`;
        }
    };

    const handleLeftLockTouchEnd = () => {
        if (view !== 'password') return;
        if (!touchStartYRef.current || !touchEndYRef.current) return;
        
        const distance = touchEndYRef.current - touchStartYRef.current;
        
        if (distance > minSwipeDistance) {
            setLeftLockSwipeCount(prev => prev + 1);
            if (leftLockRef.current) {
                leftLockRef.current.style.transform = 'translateY(100px)';
                setTimeout(() => {
                    if (leftLockRef.current) {
                        leftLockRef.current.style.transform = 'translateY(0)';
                    }
                }, 300);
            }
        } else {
            if (leftLockRef.current) {
                leftLockRef.current.style.transform = 'translateY(0)';
            }
        }
        
        touchStartYRef.current = null;
        touchEndYRef.current = null;
    };

    // Handler für rechtes Schloss (nach oben wischen)
    const handleRightLockTouchStart = (e) => {
        if (view !== 'password') return;
        touchStartYRef.current = e.targetTouches[0].clientY;
    };

    const handleRightLockTouchMove = (e) => {
        if (view !== 'password') return;
        touchEndYRef.current = e.targetTouches[0].clientY;
        const moveDistance = touchStartYRef.current - touchEndYRef.current; // Nach oben = positiv
        
        if (moveDistance > 0 && rightLockRef.current) {
            const actualMove = Math.min(moveDistance, 100);
            rightLockRef.current.style.transform = `translateY(-${actualMove}px)`;
        }
    };

    const handleRightLockTouchEnd = () => {
        if (view !== 'password') return;
        if (!touchStartYRef.current || !touchEndYRef.current) return;
        
        const distance = touchStartYRef.current - touchEndYRef.current;
        
        if (distance > minSwipeDistance) {
            setRightLockSwipeCount(prev => prev + 1);
            if (rightLockRef.current) {
                rightLockRef.current.style.transform = 'translateY(-100px)';
                setTimeout(() => {
                    if (rightLockRef.current) {
                        rightLockRef.current.style.transform = 'translateY(0)';
                    }
                }, 300);
            }
        } else {
            if (rightLockRef.current) {
                rightLockRef.current.style.transform = 'translateY(0)';
            }
        }
        
        touchStartYRef.current = null;
        touchEndYRef.current = null;
    };

    // Debugging-Funktion
    const logError = (message, error) => {
        console.error(message, error);
        showToast(message);
    };

    // Zeige Toast-Nachricht
    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    // Neue Version laden
    const updateApp = () => {
        window.location.reload();
    };

    // Passwort prüfen
    const checkPassword = async (password) => {
        console.log('Überprüfe Passwort...');
        setLoading(true);

        // Bypass-Modus erkennen
        const token = generateToken();
        if (password === token) {
            console.log('Bypass-Modus aktiviert');
            loadOpenerData();
            setView('opener');
            setLoading(false);
            return;
        }

        try {
            // API-Anfrage zur Passwortprüfung
            const apiUrl = '/secret-content/api/checkPassword';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const result = await response.json();

            // Rate-Limit-Fehler
            if (response.status === 429) {
                console.log('Rate-Limit überschritten');
                showToast(result.message || "Zu viele Versuche. Bitte warten Sie.");
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            if (result.success) {
                console.log(`Passwort korrekt für: ${result.type}`);

                if (result.type === 'opener') {
                    loadOpenerData();
                    setView('opener');
                } else if (result.type === 'dates') {
                    loadDatesData();
                    setView('dates');
                } else if (result.type === 'tips') {
                    loadTipsData();
                    setView('tips');
                }
            } else {
                console.log('Falsches Passwort');

                // Zeige verbleibende Versuche an, wenn verfügbar
                if (result.message) {
                    showToast(result.message);
                } else {
                    showToast("Falsches Passwort! 🔒");
                }
            }
        } catch (error) {
            logError('Fehler bei der Passwortüberprüfung:', error);
            showToast("Fehler bei der Überprüfung. Versuche es später erneut.");
        } finally {
            setLoading(false);
        }
    };

    // Opener-Daten laden
    const loadOpenerData = async () => {
        setLoading(true);
        try {
            console.log('Lade Opener-Daten...');

            // Vollständiger Pfad zur API
            const apiUrl = '/secret-content/api/getOpeners';
            console.log('Fetching von:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('Response Status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Daten erhalten:', Array.isArray(data) ? data.length : 'Kein Array');

            if (!Array.isArray(data)) {
                console.warn('Unerwartetes Datenformat:', data);
                showToast('Fehler: Unerwartetes Datenformat');
                return;
            }

            setOpenerData(data);

            if (data.length > 0) {
                showRandomOpener(data);
            } else {
                setCurrentOpener('Keine Opener-Daten verfügbar.');
            }
        } catch (error) {
            logError('Fehler beim Laden der Opener-Daten:', error);
            setCurrentOpener('Fehler beim Laden der Daten. Versuche es später erneut.');
        } finally {
            setLoading(false);
        }
    };

    // Dates-Daten laden
    const loadDatesData = async () => {
        setLoading(true);
        try {
            console.log('Lade Dates-Daten...');

            // Vollständiger Pfad zur API
            const apiUrl = '/secret-content/api/getDates';
            console.log('Fetching von:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('Response Status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Daten erhalten:', Array.isArray(data) ? data.length : 'Kein Array');

            if (!Array.isArray(data)) {
                console.warn('Unerwartetes Datenformat:', data);
                showToast('Fehler: Unerwartetes Datenformat');
                return;
            }

            setDatesData(data);
        } catch (error) {
            logError('Fehler beim Laden der Dates-Daten:', error);
        } finally {
            setLoading(false);
        }
    };

    // Tips-Daten laden
    const loadTipsData = async () => {
        setLoading(true);
        try {
            console.log('Lade Tips-Daten...');

            const apiUrl = '/secret-content/api/getTips';
            console.log('Fetching von:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('Response Status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Tips-Daten erhalten');

            setTipsData(data);
        } catch (error) {
            logError('Fehler beim Laden der Tips-Daten:', error);
        } finally {
            setLoading(false);
        }
    };

    // Zufälligen Opener anzeigen
    const showRandomOpener = (data = openerData) => {
        if (!data || data.length === 0) {
            setCurrentOpener('Keine Daten geladen.');
            return;
        }

        let randomIndex = Math.floor(Math.random() * data.length);
        setCurrentOpener(data[randomIndex]);
    };

    // Opener kopieren
    const copyOpener = () => {
        if (currentOpener &&
            currentOpener !== 'Keine Daten geladen.' &&
            !currentOpener.startsWith('Fehler')) {
            navigator.clipboard.writeText(currentOpener)
                .then(() => showToast('Spruch kopiert! 📋'))
                .catch(() => showToast('Fehler beim Kopieren 😕'));
        }
    };

    // Zurück zum Passwort-View
    const goBack = () => {
        setView('password');
        // Reset Bypass-Sequenz
        setLeftLockSwipeCount(0);
        setRightLockSwipeCount(0);
        setBypassReady(false);
    };

    return (
        <div className="app">
            <h1>
                <span 
                    ref={leftLockRef}
                    className="emoji emoji-left"
                    onTouchStart={handleLeftLockTouchStart}
                    onTouchMove={handleLeftLockTouchMove}
                    onTouchEnd={handleLeftLockTouchEnd}
                >
                    {leftLockSwipeCount >= 0x01 ? '🔓' : '🔒'}
                </span>
                {' '}Geheimer Inhalt{' '}
                <span 
                    ref={rightLockRef}
                    className="emoji emoji-right"
                    onTouchStart={handleRightLockTouchStart}
                    onTouchMove={handleRightLockTouchMove}
                    onTouchEnd={handleRightLockTouchEnd}
                >
                    {rightLockSwipeCount >= 0x01 ? '🔓' : '🔒'}
                </span>
            </h1>

            {loading && (
                <div className="loading-indicator">Lädt Daten...</div>
            )}

            {newVersionAvailable && (
                <div className="update-notice">
                    <p>Eine neue Version ist verfügbar!</p>
                    <button className="primary-btn" onClick={updateApp}>Jetzt aktualisieren</button>
                </div>
            )}

            {view === 'password' && (
                <PasswordView 
                    onSubmit={checkPassword} 
                    bypassReady={bypassReady}
                />
            )}

            {view === 'opener' && (
                <OpenerView
                    currentOpener={currentOpener}
                    onNext={() => showRandomOpener()}
                    onCopy={copyOpener}
                    onBack={goBack}
                />
            )}

            {view === 'dates' && (
                <DatesView
                    datesData={datesData}
                    onBack={goBack}
                />
            )}

            {view === 'tips' && tipsData && (
                <TipsView
                    tipsData={tipsData}
                    onBack={goBack}
                />
            )}

            <Toast
                show={toast.show}
                message={toast.message}
            />

            {/* PWA Installationsaufforderung */}
            <PWAPrompt />
        </div>
    );
}

export default App;