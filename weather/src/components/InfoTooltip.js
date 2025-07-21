import React, { useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function InfoTooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);
  const { darkMode } = useContext(ThemeContext);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div className={`absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg max-w-xs whitespace-normal ${positionClasses[position]} ${
          darkMode 
            ? 'bg-gray-700 text-white border border-gray-600' 
            : 'bg-gray-800 text-white'
        }`}>
          <div dangerouslySetInnerHTML={{ __html: content }} />
          <div className={`absolute w-2 h-2 transform rotate-45 ${
            darkMode ? 'bg-gray-700' : 'bg-gray-800'
          } ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
            'right-full top-1/2 -translate-y-1/2 -mr-1'
          }`} />
        </div>
      )}
    </div>
  );
}

export default InfoTooltip;