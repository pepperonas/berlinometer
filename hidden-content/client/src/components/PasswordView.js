import React, { useState, useRef, useEffect } from 'react';

function PasswordView({ onSubmit }) {
    // CSS für die Animation
    useEffect(() => {
        // Füge einen Style-Tag hinzu für die Animation
        const styleTag = document.createElement('style');
        styleTag.innerHTML = `
            @keyframes swipeHint {
                0% { transform: translateX(0); }
                20% { transform: translateX(10px); }
                40% { transform: translateX(0); }
                100% { transform: translateX(0); }
            }
            
            .swipe-hint {
                animation: swipeHint 2s ease-in-out infinite;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 0.8; }
            }
        `;
        document.head.appendChild(styleTag);
        
        // Cleanup
        return () => {
            document.head.removeChild(styleTag);
        };
    }, []);
    const [password, setPassword] = useState('');
    const touchStartXRef = useRef(null);
    const touchEndXRef = useRef(null);
    const buttonRef = useRef(null);
    const inputRef = useRef(null);
    const minSwipeDistance = 50; // Mindestdistanz für einen Swipe

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
        setPassword('');
    };

    const handleTouchStart = (e) => {
        touchStartXRef.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndXRef.current = e.targetTouches[0].clientX;
        
        // Berechne die aktuelle Bewegungsdistanz
        const moveDistance = touchEndXRef.current - touchStartXRef.current;
        
        // Nur wenn wir nach rechts swipen (positiver Wert)
        if (moveDistance > 0) {
            // Begrenzen der Bewegung auf die Breite des Buttons
            const maxMove = buttonRef.current.offsetWidth;
            const actualMove = Math.min(moveDistance, maxMove);
            
            // Bewege den Button mit dem Finger
            buttonRef.current.style.transform = `translateX(${actualMove}px)`;
        }
    };

    const handleTouchEnd = (e) => {
        if (!touchStartXRef.current || !touchEndXRef.current) return;
        
        const distance = touchEndXRef.current - touchStartXRef.current;
        
        // Wenn der Swipe weit genug war
        if (distance > minSwipeDistance) {
            // Auto-fill password und submit
            setPassword('💋!');
            setTimeout(() => {
                onSubmit('💋!');
            }, 300);
        }
        
        // Button zur ursprünglichen Position zurücksetzen
        buttonRef.current.style.transform = 'translateX(0)';
        
        // Reset touch positions
        touchStartXRef.current = null;
        touchEndXRef.current = null;
    };

    return (
        <div className="password-view">
            <div className="content-container">
                <div className="password-form">
                    <h2>Bitte gib das Passwort ein</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Passwort"
                            required
                        />
                        <button 
                            ref={buttonRef}
                            type="submit" 
                            className="primary-btn"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={{ transition: 'transform 0.3s ease', position: 'relative' }}
                        >
                            Zugriff
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default PasswordView;