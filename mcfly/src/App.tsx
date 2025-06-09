import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import backgroundImage from './assets/mcfly_empty_no_statusbar.jpg';

const App: React.FC = () => {
    const [inputValue, setInputValue] = useState<string>('');
    const [showToast, setShowToast] = useState<boolean>(false);
    const [showPwned, setShowPwned] = useState<boolean>(false);
    const [showConfetti, setShowConfetti] = useState<boolean>(false);
    const [showDisclaimer, setShowDisclaimer] = useState<boolean>(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleLongPress = () => {
        setShowToast(true);
        setInputValue('🍔🍟');
        setTimeout(() => setShowToast(false), 2000);

        if (inputRef.current) {
            inputRef.current.blur();
        }
    };

    const handleMouseDown = () => {
        longPressTimerRef.current = setTimeout(handleLongPress, 500);
    };

    const handleMouseUp = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleTouchStart = () => {
        longPressTimerRef.current = setTimeout(handleLongPress, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const triggerPwnedAnimation = () => {
        setShowConfetti(true);
        setShowPwned(true);

        // Animation nach 10 Sekunden beenden
        setTimeout(() => {
            setShowConfetti(false);
            setShowPwned(false);
        }, 10000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value) || value === '🍔🍟') {
            setInputValue(value);

            // Check für 3001 Easter Egg
            if (value === '3001') {
                triggerPwnedAnimation();
            }
        }
        // Fokus nicht mehr entfernen, damit mehrziffrige Eingaben möglich sind
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
        }
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
        }
        if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    useEffect(() => {
        // Autofokus auf das Eingabefeld setzen, wenn keine Disclaimer angezeigt wird
        if (!showDisclaimer && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);

            return () => clearTimeout(timer);
        }

        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, [showDisclaimer]);

    const handleContinue = () => {
        setShowDisclaimer(false);
    };

    // Disclaimer-Seite anzeigen
    if (showDisclaimer) {
        return (
            <div className="disclaimer-container">
                <div className="disclaimer-content">
                    <div className="disclaimer-header">
                        <h1>🍔 McFly</h1>
                        <div className="disclaimer-subtitle">McDonald's Bestellnummer-Display</div>
                    </div>

                    <div className="disclaimer-warning">
                        <h2>⚠️ Disclaimer</h2>
                        <p>Diese App dient zu Demonstrationszwecken</p>
                    </div>

                    <div className="disclaimer-features">
                        <h3>Funktionen:</h3>
                        <ul>
                            <li>📱 Bestellnummer eingeben wenn die echte McDonald's App nicht
                                funktioniert
                            </li>
                            <li>❗️️ Das Erschleichen von Leistungen ist ein Straftatbestand nach §
                                265a StGB
                            </li>
                            <li>🎯 App dient nur zu Demonstration und Test-Zwecken</li>
                        </ul>
                    </div>

                    <div className="disclaimer-description">
                        <p>
                            Gib deine Bestellnummer manuell ein und zeige sie zur Abholung vor -
                            perfekt als Backup wenn die echte McDonald's App nicht funktioniert.
                        </p>
                    </div>

                    <div className="easter-egg-hint">
                        <h4>🎉 Easter Egg</h4>
                        <p>Probiere die Bestellnummer <strong>3001</strong> für eine Überraschung!
                        </p>
                    </div>

                    <button className="continue-button" onClick={handleContinue}>
                        Weiter zur App →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            {showToast && <div className="toast">mrx3k1</div>}

            {/* Konfetti Animation */}
            {showConfetti && (
                <div className="confetti-container">
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className={`confetti confetti-${i % 6}`}></div>
                    ))}
                </div>
            )}

            {/* Pwned Message */}
            {showPwned && (
                <div className="pwned-overlay">
                    <div className="pwned-message">
                        <div className="fastfood-text">RONALD McDONALD HAS BEEN</div>
                        <div className="pwned-text">PWNED</div>
                        <div className="fastfood-subtitle">[ 🍟 FAST FOOD OVERLOAD 🍔 ]</div>
                        <div className="fastfood-rain">
                            {[...Array(30)].map((_, i) => (
                                <div key={i} className={`fastfood-item fastfood-item-${i % 6}`}
                                     style={{
                                         left: `${Math.random() * 100}%`,
                                         animationDelay: `${Math.random() * 2}s`,
                                         animationDuration: `${2 + Math.random() * 2}s`
                                     }}>
                                    {i % 6 === 0 && '🍔'}
                                    {i % 6 === 1 && '🍟'}
                                    {i % 6 === 2 && '🥤'}
                                    {i % 6 === 3 && '🍕'}
                                    {i % 6 === 4 && '🌭'}
                                    {i % 6 === 5 && '🧀'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="mobile-container" style={{backgroundImage: `url(${backgroundImage})`}}>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onContextMenu={handleContextMenu}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className="number-input"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />
            </div>
        </div>
    );
};

export default App;
