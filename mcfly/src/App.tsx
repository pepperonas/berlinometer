import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import backgroundImage from './assets/mcfly_empty_no_statusbar.jpg';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) || value === '🍔🍟') {
      setInputValue(value);
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
