import React, { useState } from 'react';
import { Eye, EyeOff, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import blackStories from '../data/stories';
import './BlackStoriesApp.css';

export default function BlackStoriesApp() {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState([]);

  const currentStory = blackStories[currentStoryIndex];

  const nextStory = () => {
    setCurrentStoryIndex((prev) => (prev + 1) % blackStories.length);
    setShowSolution(false);
    setShowHints(false);
    setRevealedHints([]);
  };

  const prevStory = () => {
    setCurrentStoryIndex((prev) => (prev - 1 + blackStories.length) % blackStories.length);
    setShowSolution(false);
    setShowHints(false);
    setRevealedHints([]);
  };

  const toggleHint = (index) => {
    if (revealedHints.includes(index)) {
      setRevealedHints(revealedHints.filter(i => i !== index));
    } else {
      setRevealedHints([...revealedHints, index]);
    }
  };

  const resetStory = () => {
    setShowSolution(false);
    setShowHints(false);
    setRevealedHints([]);
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {/* Header */}
        <header className="header">
          <h1>Black Stories</h1>
          <p>Mysteriöse Rätsel zum Lösen</p>
        </header>

        {/* Story Card */}
        <div className="story-card">
          <div className="story-content">
            <h2>{currentStory.title}</h2>
            <p className="riddle-text">{currentStory.riddle}</p>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={() => setShowHints(!showHints)}
              className="btn btn-secondary"
            >
              <Eye size={20} />
              {showHints ? 'Hinweise verbergen' : 'Hinweise anzeigen'}
            </button>
            
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="btn btn-primary"
            >
              {showSolution ? <EyeOff size={20} /> : <Eye size={20} />}
              {showSolution ? 'Lösung verbergen' : 'Lösung anzeigen'}
            </button>
            
            <button
              onClick={resetStory}
              className="btn btn-secondary"
            >
              <RotateCcw size={20} />
              Zurücksetzen
            </button>
          </div>

          {/* Hints Section */}
          {showHints && (
            <div className="hints-section">
              <h3>Hinweise:</h3>
              <div className="hints-list">
                {currentStory.hints.map((hint, index) => (
                  <div
                    key={index}
                    onClick={() => toggleHint(index)}
                    className={`hint-item ${revealedHints.includes(index) ? 'revealed' : ''}`}
                  >
                    {revealedHints.includes(index) ? (
                      <p>{hint}</p>
                    ) : (
                      <p className="hint-hidden">Hinweis {index + 1} - Klicke zum Aufdecken</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solution Section */}
          {showSolution && (
            <div className="solution-section">
              <h3>Lösung:</h3>
              <p>{currentStory.solution}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="navigation">
          <button
            onClick={prevStory}
            className="btn btn-nav"
          >
            <ChevronLeft size={20} />
            Vorherige Story
          </button>
          
          <span className="story-counter">
            Story {currentStoryIndex + 1} von {blackStories.length}
          </span>
          
          <button
            onClick={nextStory}
            className="btn btn-nav"
          >
            Nächste Story
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <p>Spielanleitung:</p>
          <p>Stelle Ja/Nein-Fragen, um das Rätsel zu lösen. Die Hinweise helfen dir auf die Sprünge!</p>
        </div>
      </div>
    </div>
  );
}
