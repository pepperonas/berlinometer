import React from 'react';
import { X } from './Icons';
import './ActiveCards.css';

const ActiveCards = ({ activeCards, removeActiveCard }) => {
    if (activeCards.length === 0) {
        return null;
    }

    return (
        <div className="active-cards-section">
            <h3 className="active-cards-title">Aktive Karten</h3>
            <div className="active-cards-grid">
                {activeCards.map((card) => (
                    <div
                        key={card.id}
                        className="active-card"
                        data-color={card.color}
                    >
                        <div className="active-card-header">
                            <h4 className="active-card-title">{card.title}</h4>
                            <button
                                onClick={() => removeActiveCard(card.id)}
                                className="remove-active-card-button"
                                title="Karte entfernen"
                            >
                                <X />
                            </button>
                        </div>
                        <p className="active-card-description">{card.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveCards;