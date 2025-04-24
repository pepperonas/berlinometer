import React, { useState } from 'react';

function PromptHelper({ onSelectPrompt }) {
    const [isOpen, setIsOpen] = useState(false);

    const promptExamples = [
        {
            title: "Sonne / Solar",
            examples: [
                "Eine stilisierte, moderne Sonne mit klaren Strahlen als minimalistisches Logo",
                "Ein elegantes Sonnenlogo mit warmen Farben für eine Energiemarke",
                "Eine geometrische, abstrakte Sonnenform mit klaren Linien"
            ]
        },
        {
            title: "Natur & Umwelt",
            examples: [
                "Ein stilisiertes Blatt mit klaren, fließenden Linien für ein Öko-Produkt",
                "Eine geometrische Bergsilhouette für eine Outdoor-Marke",
                "Ein minimalistischer Wassertropfen mit Wellen für ein Wellness-Produkt"
            ]
        },
        {
            title: "Tech & Digital",
            examples: [
                "Ein abstraktes, modernes Technologie-Symbol mit Netzwerklinien",
                "Ein minimalistisches Chip-Design für eine Tech-Firma",
                "Ein futuristisches, geometrisches Symbol für eine KI-Anwendung"
            ]
        }
    ];

    const handleSelectPrompt = (prompt) => {
        onSelectPrompt(prompt);
        setIsOpen(false);
    };

    return (
        <div className="prompt-helper">
            <button
                className="btn btn-outline prompt-helper-toggle"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? 'Beispiele ausblenden ↑' : 'Prompt-Beispiele anzeigen ↓'}
            </button>

            {isOpen && (
                <div className="prompt-examples-container">
                    <h3>Beispiele für bessere Icon-Prompts</h3>

                    <div className="prompt-tips">
                        <h4>Tipps für gute Prompts:</h4>
                        <ul>
                            <li>Beschreibe ein <strong>einzelnes, klares Hauptelement</strong></li>
                            <li>Gib <strong>spezifische Stilrichtungen</strong> an</li>
                            <li>Vermeide <strong>Text und komplexe Szenen</strong></li>
                            <li>Füge <strong>Kontext zur Verwendung</strong> hinzu</li>
                        </ul>
                    </div>

                    <div className="prompt-categories">
                        {promptExamples.map((category, categoryIndex) => (
                            <div key={categoryIndex} className="prompt-category">
                                <h4>{category.title}</h4>
                                <div className="prompt-example-list">
                                    {category.examples.map((example, exampleIndex) => (
                                        <div
                                            key={exampleIndex}
                                            className="prompt-example-item"
                                            onClick={() => handleSelectPrompt(example)}
                                        >
                                            <span className="prompt-example-text">{example}</span>
                                            <button className="use-prompt-btn">
                                                Verwenden
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PromptHelper;