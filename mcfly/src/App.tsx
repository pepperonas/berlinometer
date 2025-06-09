import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import backgroundImage from './assets/mcfly_empty_no_statusbar.jpg';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [showPwned, setShowPwned] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
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
    
    // Animation nach 5 Sekunden beenden
    setTimeout(() => {
      setShowConfetti(false);
      setShowPwned(false);
    }, 5000);
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
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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
            <div className="hacker-text">YOU HAVE BEEN</div>
            <div className="pwned-text">PWNED</div>
            <div className="hacker-subtitle">[ SYSTEM COMPROMISED ]</div>
            <div className="matrix-rain">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="matrix-column" style={{left: `${i * 5}%`}}>
                  {[...Array(10)].map((_, j) => (
                    <span key={j} className="matrix-char">
                      {String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="mobile-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
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
