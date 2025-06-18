import React from 'react';
import { ArrowLeft, BookOpen } from './Icons';
import './Instructions.css';

const Instructions = ({ onBack }) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="game-card">
                    <div className="instructions-header">
                        <button
                            onClick={onBack}
                            className="back-button"
                            aria-label="Zurück zum Menü"
                        >
                            <ArrowLeft />
                        </button>
                        <h1 className="instructions-title">
                            <BookOpen />
                            Spielanleitung
                        </h1>
                    </div>
                    
                    <div className="instructions-content">
                        <div className="section">
                            <h2 className="section-title">Spielziel</h2>
                            <p className="section-text">
                                Klatsch-Batsch ist ein lustiges Trinkspiel für 2 oder mehr Personen. 
                                Ziel ist es, gemeinsam Spaß zu haben und die verschiedenen Aufgaben 
                                und Herausforderungen zu meistern.
                            </p>
                        </div>

                        <div className="section">
                            <h2 className="section-title">Spielablauf</h2>
                            <div className="steps">
                                <div className="step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h3>Spieler hinzufügen</h3>
                                        <p>Fügt alle Mitspieler ins Spiel hinzu. Mindestens 2 Spieler sind erforderlich.</p>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h3>Karte ziehen</h3>
                                        <p>Klickt auf eine Karte aus dem Deck, um eine neue Aufgabe zu ziehen.</p>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h3>Aufgabe erfüllen</h3>
                                        <p>Lest die Aufgabe vor und führt sie gemeinsam aus.</p>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h3>Weiter spielen</h3>
                                        <p>Zieht weitere Karten und spielt so lange ihr möchtet.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="section">
                            <h2 className="section-title">Besondere Karten</h2>
                            <div className="special-cards">
                                <div className="special-card">
                                    <h3>Aktive Karten</h3>
                                    <p>
                                        Manche Karten bleiben aktiv und gelten für mehrere Runden. 
                                        Diese werden unten angezeigt und können durch Klicken auf das X entfernt werden.
                                    </p>
                                </div>
                                <div className="special-card">
                                    <h3>King's Cup</h3>
                                    <p>
                                        Eine spezielle Karte, die sich bei jedem Ziehen verändert. 
                                        Befolgt die jeweilige Anweisung auf der Karte.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="section">
                            <h2 className="section-title">Spielregeln</h2>
                            <ul className="rules-list">
                                <li>Statt "trinken" muss immer "batschen" gesagt werden (aus "Du trinkst!" wird "Du batschst!")</li>
                                <li>Trinkt verantwortungsvoll und kennt eure Grenzen</li>
                                <li>Niemand muss eine Aufgabe erfüllen, die er nicht möchte</li>
                                <li>Respektiert eure Mitspieler und deren Grenzen</li>
                                <li>Bei Problemen könnt ihr jederzeit das Spiel zurücksetzen</li>
                                <li>Habt Spaß und genießt das Spiel!</li>
                            </ul>
                        </div>

                        <div className="section warning">
                            <h2 className="section-title">⚠️ Wichtiger Hinweis</h2>
                            <p className="warning-text">
                                Dieses Spiel beinhaltet Alkoholkonsum. Spielt nur, wenn ihr volljährig seid, 
                                und trinkt verantwortungsvoll. Fahrt nicht Auto nach dem Spielen und 
                                achtet auf euer Wohlbefinden und das eurer Mitspieler.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Instructions;