import React, { useState, useEffect } from 'react';

function PWAPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Prüfe, ob die App bereits installiert ist
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone ||
            document.referrer.includes('android-app://');

        // Prüfe, ob das Gerät iOS verwendet
        const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
        setIsIOS(ios);

        if (!isStandalone) {
            // Event für den Install-Button auf Android/Chrome speichern
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                setInstallPromptEvent(e);
                setShowPrompt(true);
            });

            // Bei iOS zeige den Prompt nach 3 Sekunden
            if (ios) {
                const timer = setTimeout(() => {
                    setShowPrompt(true);
                }, 3000);

                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleInstallClick = () => {
        if (installPromptEvent) {
            // Den nativen Install-Prompt auf Android anzeigen
            installPromptEvent.prompt();

            installPromptEvent.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Benutzer hat die App installiert');
                }
                setShowPrompt(false);
            });
        }
    };

    const dismissPrompt = () => {
        setShowPrompt(false);
        // Speichern, dass der Nutzer den Prompt abgelehnt hat (optional)
        localStorage.setItem('pwaPromptDismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div className="pwa-prompt">
            <div className="pwa-content">
                <div className="pwa-icon">📱</div>
                <div className="pwa-message">
                    {isIOS ? (
                        <>
                            <h3>Installiere diese App</h3>
                            <p>Tippe auf <strong>Teilen</strong> <span className="share-icon">⎋</span> und dann auf <strong>"Zum Home-Bildschirm"</strong></p>
                        </>
                    ) : (
                        <>
                            <h3>Diese App installieren?</h3>
                            <p>Füge Secret Content zu deinem Startbildschirm hinzu für einen schnelleren Zugriff</p>
                        </>
                    )}
                </div>
                <div className="pwa-buttons">
                    {!isIOS && (
                        <button className="primary-btn" onClick={handleInstallClick}>
                            Installieren
                        </button>
                    )}
                    <button className="secondary-btn" onClick={dismissPrompt}>
                        Später
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PWAPrompt;