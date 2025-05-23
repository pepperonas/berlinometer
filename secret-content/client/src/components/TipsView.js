// src/components/TipsView.js
import React from 'react';

function TipsView({ tipsData, onBack }) {
    if (!tipsData) {
        return (
            <div className="tips-view">
                <div className="loading-indicator">Lädt Tips-Daten...</div>
            </div>
        );
    }

    return (
        <div className="tips-view">
            <header className="tips-header">
                <h2>{tipsData.title}</h2>
                <p className="subtitle">{tipsData.subtitle}</p>
            </header>

            <section className="intro">
                <h2>{tipsData.intro.title}</h2>
                <p>{tipsData.intro.text}</p>
            </section>

            <div className="card-container">
                {tipsData.tips.map((tip) => (
                    <div key={tip.number} className="card">
                        <h2>
                            <span className="tip-number">{tip.number}</span> {tip.title}
                        </h2>
                        <p>{tip.description}</p>
                        <ul>
                            {tip.points.map((point, index) => (
                                <li key={index}>{point}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="button-container">
                <button className="secondary-btn" onClick={onBack}>Zurück</button>
            </div>
        </div>
    );
}

export default TipsView;