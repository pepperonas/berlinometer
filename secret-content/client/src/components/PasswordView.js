import React, { useState, useRef, useEffect } from 'react';
import { generateToken } from '../utils/helpers';

function PasswordView({ onSubmit, bypassReady }) {
    const [buttonSwipeDistance, setButtonSwipeDistance] = useState(0);
    const touchStartXButtonRef = useRef(null);
    const touchEndXButtonRef = useRef(null);
    const minButtonSwipeDistance = 80;
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
    const inputRef = useRef(null);
    const buttonRef = useRef(null);
    const swipeCompletedRef = useRef(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
        setPassword('');
    };
    
    const handleButtonTouchStart = (e) => {
        if (bypassReady) {
            touchStartXButtonRef.current = e.targetTouches[0].clientX;
            swipeCompletedRef.current = false;
        }
    };
    
    const handleButtonTouchMove = (e) => {
        if (bypassReady && touchStartXButtonRef.current !== null) {
            touchEndXButtonRef.current = e.targetTouches[0].clientX;
            const moveDistance = touchEndXButtonRef.current - touchStartXButtonRef.current;
            
            if (moveDistance > 0 && buttonRef.current) {
                const actualMove = Math.min(moveDistance, 150);
                setButtonSwipeDistance(actualMove);
                buttonRef.current.style.transform = `translateX(${actualMove}px)`;
                
                if (actualMove >= minButtonSwipeDistance && !swipeCompletedRef.current) {
                    swipeCompletedRef.current = true;
                    onSubmit(generateToken());
                }
            }
        }
    };
    
    const handleButtonTouchEnd = () => {
        if (buttonRef.current) {
            buttonRef.current.style.transform = 'translateX(0)';
        }
        setButtonSwipeDistance(0);
        touchStartXButtonRef.current = null;
        touchEndXButtonRef.current = null;
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
                            onTouchStart={handleButtonTouchStart}
                            onTouchMove={handleButtonTouchMove}
                            onTouchEnd={handleButtonTouchEnd}
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