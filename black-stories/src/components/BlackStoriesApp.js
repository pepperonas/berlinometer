import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, RotateCcw, ChevronRight, ChevronLeft, Shuffle } from 'lucide-react';
import blackStories from '../data/stories';
import './BlackStoriesApp.css';

// Fisher-Yates shuffle algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function BlackStoriesApp() {
  const [shuffledStories, setShuffledStories] = useState([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState([]);

  // Initialize shuffled stories on component mount
  useEffect(() => {
    setShuffledStories(shuffleArray(blackStories));
  }, []);

  const currentStory = shuffledStories[currentStoryIndex] || blackStories[0];

  const nextStory = () => {
    setCurrentStoryIndex((prev) => (prev + 1) % shuffledStories.length);
    setShowSolution(false);
    setShowHints(false);
    setRevealedHints([]);
  };

  const prevStory = () => {
    setCurrentStoryIndex((prev) => (prev - 1 + shuffledStories.length) % shuffledStories.length);
    setShowSolution(false);
    setShowHints(false);
    setRevealedHints([]);
  };

  const reshuffleStories = () => {
    setShuffledStories(shuffleArray(blackStories));
    setCurrentStoryIndex(0);
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
      {/* Animated werewolf silhouettes */}
      <div className="werewolf-silhouette werewolf-1"></div>
      <div className="werewolf-silhouette werewolf-2"></div>
      <div className="werewolf-silhouette werewolf-3"></div>
      
      {/* Animated shadow figures */}
      <div className="shadow-figure shadow-1"></div>
      <div className="shadow-figure shadow-2"></div>
      <div className="shadow-figure shadow-3"></div>
      <div className="shadow-figure shadow-4"></div>
      
      {/* Blood drops */}
      <div className="blood-drop blood-drop-1"></div>
      <div className="blood-drop blood-drop-2"></div>
      <div className="blood-drop blood-drop-3"></div>
      <div className="blood-drop blood-drop-4"></div>
      <div className="blood-drop blood-drop-5"></div>
      <div className="blood-drop blood-drop-6"></div>
      <div className="blood-drop blood-drop-7"></div>
      <div className="blood-drop blood-drop-8"></div>
      <div className="blood-drop blood-drop-9"></div>
      <div className="blood-drop blood-drop-10"></div>
      
      {/* Blood splatter */}
      <div className="blood-splatter blood-splatter-1"></div>
      <div className="blood-splatter blood-splatter-2"></div>
      <div className="blood-splatter blood-splatter-3"></div>
      <div className="blood-splatter blood-splatter-4"></div>
      
      {/* Blood trails */}
      <div className="blood-trail blood-trail-1"></div>
      <div className="blood-trail blood-trail-2"></div>
      <div className="blood-trail blood-trail-3"></div>
      
      {/* Blood puddles */}
      <div className="blood-puddle blood-puddle-1"></div>
      <div className="blood-puddle blood-puddle-2"></div>
      <div className="blood-puddle blood-puddle-3"></div>
      
      {/* Blood streaks */}
      <div className="blood-streak blood-streak-1"></div>
      <div className="blood-streak blood-streak-2"></div>
      <div className="blood-streak blood-streak-3"></div>
      
      {/* Blood mist */}
      <div className="blood-mist blood-mist-1"></div>
      <div className="blood-mist blood-mist-2"></div>
      
      {/* More blood drops */}
      <div className="blood-drop blood-drop-11"></div>
      <div className="blood-drop blood-drop-12"></div>
      <div className="blood-drop blood-drop-13"></div>
      <div className="blood-drop blood-drop-14"></div>
      <div className="blood-drop blood-drop-15"></div>
      
      {/* Additional blood splatters */}
      <div className="blood-splatter blood-splatter-5"></div>
      <div className="blood-splatter blood-splatter-6"></div>
      
      {/* Blood drips on walls */}
      <div className="blood-drip blood-drip-1"></div>
      <div className="blood-drip blood-drip-2"></div>
      <div className="blood-drip blood-drip-3"></div>
      
      {/* Blood pools */}
      <div className="blood-pool blood-pool-1"></div>
      <div className="blood-pool blood-pool-2"></div>
      
      {/* Lightning flash backgrounds */}
      <div className="lightning-flash lightning-flash-1"></div>
      <div className="lightning-flash lightning-flash-2"></div>
      <div className="lightning-flash lightning-flash-3"></div>
      
      {/* Realistic SVG Lightning bolts */}
      <svg className="lightning-svg lightning-svg-1" viewBox="0 0 200 400">
        <path className="lightning-path main-bolt" d="M100,10 L85,45 L105,80 L75,125 L95,160 L70,200 L90,240 L65,285 L85,320 L60,365 L80,390"/>
        <path className="lightning-path branch" d="M85,45 L65,55 L50,75"/>
        <path className="lightning-path branch" d="M105,80 L125,85 L140,105 L155,125"/>
        <path className="lightning-path branch" d="M75,125 L55,135 L40,155"/>
        <path className="lightning-path branch" d="M95,160 L115,165 L130,185"/>
        <path className="lightning-path sub-branch" d="M140,105 L150,95 L165,100"/>
        <path className="lightning-path sub-branch" d="M55,135 L45,125 L35,130"/>
        <path className="lightning-path branch" d="M90,240 L110,250 L125,270"/>
        <path className="lightning-path sub-branch" d="M125,270 L135,275 L145,290"/>
      </svg>

      <svg className="lightning-svg lightning-svg-2" viewBox="0 0 180 450">
        <path className="lightning-path main-bolt" d="M90,15 L105,50 L80,90 L100,130 L75,175 L95,220 L70,265 L85,310 L60,355 L75,400 L55,435"/>
        <path className="lightning-path branch" d="M105,50 L125,60 L145,80 L160,105"/>
        <path className="lightning-path branch" d="M80,90 L60,100 L45,120 L30,145"/>
        <path className="lightning-path branch" d="M100,130 L120,140 L135,160"/>
        <path className="lightning-path branch" d="M75,175 L55,185 L40,205"/>
        <path className="lightning-path sub-branch" d="M160,105 L170,95 L175,110"/>
        <path className="lightning-path sub-branch" d="M30,145 L20,155 L15,170"/>
        <path className="lightning-path branch" d="M85,310 L105,320 L120,340"/>
        <path className="lightning-path sub-branch" d="M120,340 L130,345 L135,360"/>
      </svg>

      <svg className="lightning-svg lightning-svg-3" viewBox="0 0 150 350">
        <path className="lightning-path main-bolt" d="M75,20 L65,55 L85,95 L70,135 L90,175 L75,215 L95,255 L80,295 L100,330"/>
        <path className="lightning-path branch" d="M65,55 L45,65 L30,85"/>
        <path className="lightning-path branch" d="M85,95 L105,105 L120,125"/>
        <path className="lightning-path branch" d="M70,135 L50,145 L35,165"/>
        <path className="lightning-path sub-branch" d="M30,85 L20,90 L15,105"/>
        <path className="lightning-path sub-branch" d="M120,125 L130,130 L135,145"/>
        <path className="lightning-path branch" d="M95,255 L115,265 L130,285"/>
      </svg>
      
      {/* Dark fog */}
      <div className="dark-fog dark-fog-1"></div>
      <div className="dark-fog dark-fog-2"></div>
      <div className="dark-fog dark-fog-3"></div>
      <div className="dark-fog dark-fog-4"></div>
      
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

            <button
              onClick={reshuffleStories}
              className="btn btn-secondary"
              title="Alle Geschichten neu mischen"
            >
              <Shuffle size={20} />
              Neu mischen
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
            Story {currentStoryIndex + 1} von {shuffledStories.length}
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

        {/* Footer */}
        <footer className="footer">
          <p>Made with ❤️ by Martin Pfeffer</p>
        </footer>
      </div>
    </div>
  );
}
