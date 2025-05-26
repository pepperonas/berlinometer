import React, { useState, useRef, useEffect } from 'react';
import { generateToken, getPressDuration } from '../utils/helpers';

function PasswordView({ onSubmit, bypassReady }) {
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
    const longPressTimerRef = useRef(null);
    const longPressDuration = getPressDuration();

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
        setPassword('');
    };
    
    const handleTouchStart = () => {
        if (bypassReady) {
            longPressTimerRef.current = setTimeout(() => {
                onSubmit(generateToken());
            }, longPressDuration);
        }
    };
    
    const handleTouchEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };
    
    const handleMouseDown = () => {
        if (bypassReady) {
            longPressTimerRef.current = setTimeout(() => {
                onSubmit(generateToken());
            }, longPressDuration);
        }
    };
    
    const handleMouseUp = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };
    
    const handleMouseLeave = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
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
                            onTouchEnd={handleTouchEnd}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
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