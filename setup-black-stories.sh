#!/bin/bash

# Black Stories React App Setup Script
# Für Unix/macOS/Linux

set -e  # Beende bei Fehler

echo "🎮 Black Stories React App Setup"
echo "================================"

# Projektname
PROJECT_NAME="black-stories-app"

# Erstelle Projekt mit Create React App
echo "📦 Erstelle React-Projekt..."
npx create-react-app $PROJECT_NAME
cd $PROJECT_NAME

# Installiere zusätzliche Dependencies
echo "📥 Installiere lucide-react..."
npm install lucide-react

# Erstelle Verzeichnisstruktur
echo "📁 Erstelle Verzeichnisstruktur..."
mkdir -p src/components
mkdir -p src/data
mkdir -p public/assets

# Erstelle die Hauptkomponente
echo "💻 Erstelle Black Stories Komponente..."
cat > src/components/BlackStoriesApp.js << 'EOF'
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
EOF

# Erstelle CSS für die Komponente
echo "🎨 Erstelle Styles..."
cat > src/components/BlackStoriesApp.css << 'EOF'
.app-container {
  min-height: 100vh;
  background-color: #1a1b23;
  color: #e4e4e7;
  padding: 1rem;
}

.content-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.header {
  text-align: center;
  padding: 2rem 0;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #f4f4f5;
}

.header p {
  color: #a1a1aa;
}

.story-card {
  background-color: #2C2E3B;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.story-content {
  margin-bottom: 1.5rem;
}

.story-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #f4f4f5;
}

.riddle-text {
  font-size: 1.125rem;
  line-height: 1.75;
  color: #e4e4e7;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #f4f4f5;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background-color: #2563eb;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #4b5563;
}

.btn-secondary:hover {
  background-color: #6b7280;
}

.btn-nav {
  background-color: #374151;
}

.btn-nav:hover {
  background-color: #4b5563;
}

.hints-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #374151;
  border-radius: 0.375rem;
}

.hints-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #f4f4f5;
}

.hints-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hint-item {
  padding: 0.75rem;
  background-color: #4b5563;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.hint-item:hover {
  background-color: #6b7280;
}

.hint-item.revealed {
  background-color: #1f2937;
}

.hint-hidden {
  color: #9ca3af;
  font-style: italic;
}

.solution-section {
  padding: 1rem;
  background-color: rgba(16, 185, 129, 0.1);
  border-radius: 0.375rem;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.solution-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #34d399;
}

.solution-section p {
  color: #f4f4f5;
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.story-counter {
  color: #9ca3af;
}

.info-section {
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

.info-section p:first-child {
  margin-bottom: 0.5rem;
}

/* Responsive Design */
@media (max-width: 640px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .navigation {
    flex-direction: column;
    gap: 1rem;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
EOF

# Erstelle Stories Datei
echo "📝 Erstelle Stories Daten..."
cat > src/data/stories.js << 'EOF'
const blackStories = [
  {
    id: 1,
    title: "Der tödliche Sprung",
    riddle: "Ein Mann springt aus dem Fenster eines 20-stöckigen Gebäudes. Er landet unverletzt. Wie ist das möglich?",
    solution: "Er springt aus dem Fenster im Erdgeschoss.",
    hints: ["Denk an die Formulierung", "Welches Stockwerk?", "Nicht alle Fenster sind hoch"]
  },
  {
    id: 2,
    title: "Das Aquarium",
    riddle: "Romeo und Julia liegen tot auf dem Boden. Um sie herum sind Glasscherben und eine Wasserpfütze. Was ist passiert?",
    solution: "Romeo und Julia sind Goldfische. Ihr Aquarium ist heruntergefallen und zerbrochen.",
    hints: ["Namen können täuschen", "Was liegt auf dem Boden?", "Wasser ist ein wichtiger Hinweis"]
  },
  {
    id: 3,
    title: "Der Wüstenmann",
    riddle: "Ein nackter Mann wird tot in der Wüste gefunden. In seiner Hand hält er einen abgebrochenen Strohhalm. Was ist geschehen?",
    solution: "Er war mit anderen in einem Heißluftballon. Als der Ballon abzustürzen drohte, zogen alle Strohhalme - er hatte den kürzesten und musste springen.",
    hints: ["Der Strohhalm ist entscheidend", "Er war nicht allein", "Denk an Auswahlverfahren"]
  },
  {
    id: 4,
    title: "Das Restaurant",
    riddle: "Ein Mann bestellt in einem Restaurant Albatros. Nach dem ersten Bissen bricht er in Tränen aus und verlässt das Lokal. Warum?",
    solution: "Er war einmal schiffbrüchig. Die Überlebenden aßen angeblich Albatros. Als er jetzt echten Albatros isst, merkt er, dass es damals etwas anderes war - vermutlich Menschenfleisch.",
    hints: ["Geschmack ist wichtig", "Erinnerungen spielen eine Rolle", "Er hat schon mal 'Albatros' gegessen"]
  },
  {
    id: 5,
    title: "Der Fahrstuhl",
    riddle: "Ein Mann wohnt im 10. Stock. Jeden Morgen fährt er mit dem Fahrstuhl ins Erdgeschoss. Abends fährt er nur bis zum 7. Stock und geht die restlichen Stockwerke zu Fuß. Nur wenn es regnet oder jemand mitfährt, fährt er bis zum 10. Stock. Warum?",
    solution: "Der Mann ist kleinwüchsig. Er kommt nur bis zum Knopf für den 7. Stock. Bei Regen hat er einen Regenschirm dabei, mit dem er höhere Knöpfe erreicht. Wenn jemand mitfährt, kann diese Person den Knopf für ihn drücken.",
    hints: ["Größe spielt eine Rolle", "Was ändert sich bei Regen?", "Warum hilft eine andere Person?"]
  }
];

export default blackStories;
EOF

# Update App.js
echo "🔧 Update App.js..."
cat > src/App.js << 'EOF'
import React from 'react';
import BlackStoriesApp from './components/BlackStoriesApp';
import './App.css';

function App() {
  return <BlackStoriesApp />;
}

export default App;
EOF

# Update App.css
echo "🎨 Update globale Styles..."
cat > src/App.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF

# Update index.html für besseren Titel
echo "📄 Update index.html..."
sed -i '' 's/<title>React App<\/title>/<title>Black Stories - Mysteriöse Rätsel<\/title>/g' public/index.html 2>/dev/null || \
sed -i 's/<title>React App<\/title>/<title>Black Stories - Mysteriöse Rätsel<\/title>/g' public/index.html

# Erstelle Production Build
echo "🔨 Erstelle Production Build..."
npm run build

echo "✅ Fertig!"
echo ""
echo "📂 Verzeichnisstruktur:"
echo "   $PROJECT_NAME/"
echo "   ├── build/          <- Dieser Ordner kann auf den VPS hochgeladen werden"
echo "   ├── src/"
echo "   │   ├── components/"
echo "   │   ├── data/"
echo "   │   └── ..."
echo "   └── ..."
echo ""
echo "🚀 Nächste Schritte:"
echo "   1. cd $PROJECT_NAME"
echo "   2. Upload des 'build' Ordners auf deinen VPS"
echo "   3. Konfiguriere deinen Webserver (nginx/Apache) auf den build Ordner"
echo ""
echo "💡 Tipp: Du kannst weitere Stories in src/data/stories.js hinzufügen"
EOF