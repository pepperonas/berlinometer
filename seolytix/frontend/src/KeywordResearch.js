// src/KeywordResearch.js - Komponente für die Keyword-Recherche mit KI-Vorschlägen
// Dark Theme-Version

import React, { useState, useEffect } from 'react';
import {
    Search,
    Tag,
    Sparkles,
    TrendingUp,
    AlertCircle,
    Download,
    Plus,
    X,
    ArrowRight,
    BarChart2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const KeywordResearch = ({ apiKey, apiUrl, mainSiteData, onError }) => {
    const [keyword, setKeyword] = useState('');
    const [isResearching, setIsResearching] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [contentIdeas, setContentIdeas] = useState([]);
    const [activeTab, setActiveTab] = useState('suggestions');
    const [savedKeywords, setSavedKeywords] = useState([]);

    // Funktion zum Generieren von Mock-Daten für Keyword-Vorschläge
    const generateMockKeywordData = (baseKeyword) => {
        if (!baseKeyword.trim()) {
            return { error: 'Kein Keyword angegeben' };
        }

        const trimmedKeyword = baseKeyword.trim().toLowerCase();

        // Generiere Variationen basierend auf dem Basis-Keyword
        const variations = [
            { keyword: trimmedKeyword, searchVolume: Math.floor(Math.random() * 5000) + 1000, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `${trimmedKeyword} kaufen`, searchVolume: Math.floor(Math.random() * 3000) + 500, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `${trimmedKeyword} online`, searchVolume: Math.floor(Math.random() * 2000) + 300, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `bester ${trimmedKeyword}`, searchVolume: Math.floor(Math.random() * 1500) + 200, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `${trimmedKeyword} test`, searchVolume: Math.floor(Math.random() * 1200) + 150, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `${trimmedKeyword} vergleich`, searchVolume: Math.floor(Math.random() * 1000) + 100, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `günstig ${trimmedKeyword}`, searchVolume: Math.floor(Math.random() * 800) + 50, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `${trimmedKeyword} angebot`, searchVolume: Math.floor(Math.random() * 700) + 50, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `${trimmedKeyword} bewertung`, searchVolume: Math.floor(Math.random() * 600) + 50, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `wie funktioniert ${trimmedKeyword}`, searchVolume: Math.floor(Math.random() * 500) + 50, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
        ];

        // Sortieren nach Suchvolumen
        variations.sort((a, b) => b.searchVolume - a.searchVolume);

        // Frage-Keywords
        const questions = [
            { keyword: `was ist ${trimmedKeyword}`, searchVolume: Math.floor(Math.random() * 1000) + 200, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `wie funktioniert ${trimmedKeyword}`, searchVolume: Math.floor(Math.random() * 800) + 150, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `warum ${trimmedKeyword}`, searchVolume: Math.floor(Math.random() * 600) + 100, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `wann ${trimmedKeyword} nutzen`, searchVolume: Math.floor(Math.random() * 400) + 50, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `wo ${trimmedKeyword} kaufen`, searchVolume: Math.floor(Math.random() * 900) + 100, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) }
        ];

        // Verwandte Begriffe
        const related = [
            { keyword: `${trimmedKeyword} alternative`, searchVolume: Math.floor(Math.random() * 900) + 100, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `${trimmedKeyword} ersatz`, searchVolume: Math.floor(Math.random() * 700) + 80, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `ähnlich wie ${trimmedKeyword}`, searchVolume: Math.floor(Math.random() * 500) + 50, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `${trimmedKeyword} vs konkurrenz`, searchVolume: Math.floor(Math.random() * 800) + 120, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) },
            { keyword: `${trimmedKeyword} oder anderen`, searchVolume: Math.floor(Math.random() * 600) + 90, competition: Math.random().toFixed(2), difficulty: Math.floor(Math.random() * 100) }
        ];

        // Content-Ideen generieren
        const ideaTypes = ['Ratgeber', 'Tutorial', 'Checkliste', 'Vergleich', 'FAQ', 'Infografik', 'Video'];
        const ideas = [
            `${ideaTypes[Math.floor(Math.random() * ideaTypes.length)]}: Alles über ${trimmedKeyword}`,
            `${ideaTypes[Math.floor(Math.random() * ideaTypes.length)]}: 10 Tipps für ${trimmedKeyword}`,
            `${ideaTypes[Math.floor(Math.random() * ideaTypes.length)]}: ${trimmedKeyword} im Vergleich`,
            `${ideaTypes[Math.floor(Math.random() * ideaTypes.length)]}: Schritt für Schritt zu ${trimmedKeyword}`,
            `${ideaTypes[Math.floor(Math.random() * ideaTypes.length)]}: ${trimmedKeyword} für Anfänger`
        ];

        // Zusammenfassung der Keyword-Daten
        const summary = {
            totalKeywords: variations.length + questions.length + related.length,
            avgSearchVolume: Math.floor(variations.reduce((sum, item) => sum + item.searchVolume, 0) / variations.length),
            avgDifficulty: Math.floor(variations.reduce((sum, item) => sum + item.difficulty, 0) / variations.length),
            bestOpportunities: variations
                .filter(item => item.searchVolume > 500 && item.difficulty < 50)
                .slice(0, 3)
        };

        return {
            baseKeyword: trimmedKeyword,
            variations,
            questions,
            related,
            contentIdeas: ideas,
            summary
        };
    };

    // Funktion zum Starten der Keyword-Recherche
    const startKeywordResearch = async () => {
        if (!keyword.trim()) {
            setError('Bitte gib ein Keyword ein');
            return;
        }

        setError('');
        setIsResearching(true);
        setResults(null);

        try {
            // In einer realen Implementierung würden wir hier eine API aufrufen
            // Für dieses Beispiel verwenden wir Mock-Daten
            setTimeout(() => {
                const mockData = generateMockKeywordData(keyword);
                if (mockData.error) {
                    setError(mockData.error);
                } else {
                    setResults(mockData);
                    setContentIdeas(mockData.contentIdeas);
                }
                setIsResearching(false);
            }, 1500);

        } catch (error) {
            console.error('Fehler bei der Keyword-Recherche:', error);
            setError(`Fehler bei der Keyword-Recherche: ${error.message}`);
            setIsResearching(false);

            if (onError) {
                onError(error.message);
            }
        }
    };

    // Tastatureingabe für Enter-Taste
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isResearching) {
            e.preventDefault();
            startKeywordResearch();
        }
    };

    // Keyword zu gespeicherten Keywords hinzufügen
    const saveKeyword = (newKeyword) => {
        if (!savedKeywords.some(item => item.keyword === newKeyword.keyword)) {
            setSavedKeywords([...savedKeywords, newKeyword]);
        }
    };

    // Keyword aus gespeicherten Keywords entfernen
    const removeKeyword = (keywordToRemove) => {
        setSavedKeywords(savedKeywords.filter(item => item.keyword !== keywordToRemove));
    };

    // Generiert eine Schwierigkeitsbewertung basierend auf dem Wert
    const getDifficultyLabel = (value) => {
        if (value < 30) return { label: 'Einfach', color: 'text-accent-green' };
        if (value < 60) return { label: 'Mittel', color: 'text-yellow-400' };
        return { label: 'Schwer', color: 'text-accent-red' };
    };

    // CSV-Export der Keyword-Daten
    const exportToCSV = () => {
        if (!results) return;

        // Alle Keywords zusammenführen
        const allKeywords = [
            ...results.variations.map(item => ({ ...item, type: 'Variation' })),
            ...results.questions.map(item => ({ ...item, type: 'Frage' })),
            ...results.related.map(item => ({ ...item, type: 'Verwandt' }))
        ];

        // CSV-Header
        let csv = 'Keyword,Typ,Suchvolumen,Wettbewerb,Schwierigkeit\n';

        // CSV-Daten hinzufügen
        allKeywords.forEach(item => {
            csv += `"${item.keyword}","${item.type}",${item.searchVolume},${item.competition},${item.difficulty}\n`;
        });

        // CSV-Datei erzeugen und herunterladen
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `keyword-recherche-${results.baseKeyword}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Daten für das Balkendiagramm aufbereiten
    const prepareChartData = () => {
        if (!results) return [];

        return results.variations
            .slice(0, 5) // Top 5 Keywords
            .map(item => ({
                name: item.keyword.length > 15 ? item.keyword.slice(0, 15) + '...' : item.keyword,
                originalName: item.keyword,
                Suchvolumen: item.searchVolume,
                Schwierigkeit: item.difficulty
            }));
    };

    // Custom colors für Dark Mode
    const chartColors = {
        suchvolumen: '#688db1',  // Accent-Blau
        schwierigkeit: '#e16162', // Accent-Rot
        gridLines: '#454855',     // Etwas heller als der Hintergrund
        text: '#d1d5db'           // Text-Primary
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-text-primary flex items-center">
                <Tag className="mr-2 text-accent-blue" size={20}/> Keyword-Recherche
            </h2>

            <div className="bg-card-bg rounded-xl shadow-card p-6">
                <p className="text-text-secondary mb-4">
                    Recherchiere relevante Keywords für deine Website und erhalte Vorschläge für Content-Ideen.
                </p>

                {/* Keyword-Eingabe */}
                <div className="mb-6">
                    <div className="flex">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Gib ein Keyword ein..."
                                className="w-full p-3 pr-10 border border-bg-darker bg-bg-darker rounded-l-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-text-primary transition-all duration-300"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-secondary">
                                <Tag size={18}/>
                            </div>
                        </div>
                        <button
                            onClick={startKeywordResearch}
                            disabled={isResearching || !keyword.trim()}
                            className={`px-6 py-3 bg-accent-blue text-white rounded-r-xl hover:bg-opacity-90 flex items-center transition-all duration-300 ${(isResearching || !keyword.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isResearching ? (
                                <>Recherchiere<span className="ml-2 animate-pulse">...</span></>
                            ) : (
                                <>Recherchieren <Search size={18} className="ml-2"/></>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-2 text-accent-red text-sm flex items-center">
                            <AlertCircle size={16} className="mr-1"/> {error}
                        </div>
                    )}
                </div>

                {/* Gespeicherte Keywords */}
                {savedKeywords.length > 0 && (
                    <div className="mb-6 p-4 bg-bg-dark rounded-xl">
                        <h3 className="text-md font-semibold text-text-primary mb-3">Gespeicherte Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                            {savedKeywords.map((item, index) => (
                                <div key={index} className="px-3 py-1 bg-accent-blue bg-opacity-80 text-white rounded-full flex items-center transition-all duration-300">
                                    <span className="mr-2">{item.keyword}</span>
                                    <button
                                        onClick={() => removeKeyword(item.keyword)}
                                        className="hover:text-red-200 focus:outline-none transition-colors duration-300"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isResearching && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue mb-4"></div>
                        <p className="text-text-secondary">Recherchiere Keywords...</p>
                    </div>
                )}

                {results && !isResearching && (
                    <div>
                        {/* Zusammenfassung */}
                        <div className="mb-6 p-4 bg-bg-dark rounded-xl">
                            <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                                <BarChart2 size={18} className="mr-2 text-accent-blue"/> Keyword-Übersicht für "{results.baseKeyword}"
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                                    <div className="text-sm text-text-secondary">Gefundene Keywords</div>
                                    <div className="text-2xl font-bold text-text-primary">{results.summary.totalKeywords}</div>
                                </div>

                                <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                                    <div className="text-sm text-text-secondary">Ø Suchvolumen</div>
                                    <div className="text-2xl font-bold text-text-primary">{results.summary.avgSearchVolume}</div>
                                </div>

                                <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                                    <div className="text-sm text-text-secondary">Ø Schwierigkeit</div>
                                    <div className="text-2xl font-bold text-text-primary">{results.summary.avgDifficulty}%</div>
                                </div>
                            </div>

                            {results.summary.bestOpportunities.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-text-primary mb-2">Beste Chancen</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {results.summary.bestOpportunities.map((item, index) => (
                                            <div key={index} className="bg-accent-green bg-opacity-10 p-2 rounded-xl border border-accent-green border-opacity-30">
                                                <div className="font-medium text-accent-green">{item.keyword}</div>
                                                <div className="flex justify-between text-xs text-accent-green">
                                                    <span>Volumen: {item.searchVolume}</span>
                                                    <span>Schwierigkeit: {item.difficulty}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center text-accent-blue hover:underline transition-colors duration-300"
                                >
                                    <Download size={16} className="mr-1"/> Alle Keywords als CSV exportieren
                                </button>
                            </div>
                        </div>

                        {/* Diagramm */}
                        <div className="mb-6">
                            <h3 className="text-md font-semibold text-text-primary mb-3">Top Keywords nach Suchvolumen</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={prepareChartData()}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLines} />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 12, fill: chartColors.text }}
                                            stroke={chartColors.gridLines}
                                        />
                                        <YAxis
                                            tick={{ fill: chartColors.text }}
                                            stroke={chartColors.gridLines}
                                        />
                                        <Tooltip
                                            formatter={(value, name) => [value, name]}
                                            labelFormatter={(name) => {
                                                const item = prepareChartData().find(item => item.name === name);
                                                return item ? item.originalName : name;
                                            }}
                                            contentStyle={{ backgroundColor: '#343845', borderColor: '#454855', color: '#d1d5db' }}
                                        />
                                        <Legend
                                            wrapperStyle={{ color: chartColors.text }}
                                        />
                                        <Bar dataKey="Suchvolumen" fill={chartColors.suchvolumen} />
                                        <Bar dataKey="Schwierigkeit" fill={chartColors.schwierigkeit} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-bg-darker mb-4">
                            <button
                                onClick={() => setActiveTab('suggestions')}
                                className={`px-4 py-2 font-medium text-sm mr-2 ${activeTab === 'suggestions' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                            >
                                Keyword-Vorschläge
                            </button>
                            <button
                                onClick={() => setActiveTab('questions')}
                                className={`px-4 py-2 font-medium text-sm mr-2 ${activeTab === 'questions' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                            >
                                Fragen
                            </button>
                            <button
                                onClick={() => setActiveTab('related')}
                                className={`px-4 py-2 font-medium text-sm mr-2 ${activeTab === 'related' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                            >
                                Verwandte Keywords
                            </button>
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'content' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                            >
                                Content-Ideen
                            </button>
                        </div>

                        {/* Keyword-Vorschläge Tabelle */}
                        {activeTab === 'suggestions' && (
                            <div className="overflow-x-auto pr-1 custom-scrollbar">
                                <table className="min-w-full">
                                    <thead className="bg-bg-darker">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Keyword</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Suchvolumen</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Wettbewerb</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Schwierigkeit</th>
                                        <th className="py-3 px-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider"></th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-card-bg divide-y divide-bg-darker">
                                    {results.variations.map((item, index) => {
                                        const difficultyInfo = getDifficultyLabel(item.difficulty);
                                        return (
                                            <tr key={index} className="hover:bg-bg-dark transition-colors duration-300">
                                                <td className="py-3 px-4 whitespace-nowrap text-text-primary">{item.keyword}</td>
                                                <td className="py-3 px-4 whitespace-nowrap text-text-primary">{item.searchVolume}</td>
                                                <td className="py-3 px-4 whitespace-nowrap text-text-primary">{item.competition}</td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <span className={`${difficultyInfo.color}`}>{item.difficulty}% ({difficultyInfo.label})</span>
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => saveKeyword(item)}
                                                        className="text-accent-blue hover:underline flex items-center justify-end transition-colors duration-300"
                                                    >
                                                        Speichern <Plus size={16} className="ml-1"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Fragen Tabelle */}
                        {activeTab === 'questions' && (
                            <div className="overflow-x-auto pr-1 custom-scrollbar">
                                <table className="min-w-full">
                                    <thead className="bg-bg-darker">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Frage</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Suchvolumen</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Wettbewerb</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Schwierigkeit</th>
                                        <th className="py-3 px-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider"></th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-card-bg divide-y divide-bg-darker">
                                    {results.questions.map((item, index) => {
                                        const difficultyInfo = getDifficultyLabel(item.difficulty);
                                        return (
                                            <tr key={index} className="hover:bg-bg-dark transition-colors duration-300">
                                                <td className="py-3 px-4 whitespace-nowrap text-text-primary">{item.keyword}</td>
                                                <td className="py-3 px-4 whitespace-nowrap text-text-primary">{item.searchVolume}</td>
                                                <td className="py-3 px-4 whitespace-nowrap text-text-primary">{item.competition}</td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <span className={`${difficultyInfo.color}`}>{item.difficulty}% ({difficultyInfo.label})</span>
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => saveKeyword(item)}
                                                        className="text-accent-blue hover:underline flex items-center justify-end transition-colors duration-300"
                                                    >
                                                        Speichern <Plus size={16} className="ml-1"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Verwandte Keywords Tabelle */}
                        {activeTab === 'related' && (
                            <div className="overflow-x-auto pr-1 custom-scrollbar">
                                <table className="min-w-full">
                                    <thead className="bg-bg-darker">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Verwandtes Keyword</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Suchvolumen</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Wettbewerb</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Schwierigkeit</th>
                                        <th className="py-3 px-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider"></th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-card-bg divide-y divide-bg-darker">
                                    {results.related.map((item, index) => {
                                        const difficultyInfo = getDifficultyLabel(item.difficulty);
                                        return (
                                            <tr key={index} className="hover:bg-bg-dark transition-colors duration-300">
                                                <td className="py-3 px-4 whitespace-nowrap text-text-primary">{item.keyword}</td>
                                                <td className="py-3 px-4 whitespace-nowrap text-text-primary">{item.searchVolume}</td>
                                                <td className="py-3 px-4 whitespace-nowrap text-text-primary">{item.competition}</td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <span className={`${difficultyInfo.color}`}>{item.difficulty}% ({difficultyInfo.label})</span>
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => saveKeyword(item)}
                                                        className="text-accent-blue hover:underline flex items-center justify-end transition-colors duration-300"
                                                    >
                                                        Speichern <Plus size={16} className="ml-1"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Content-Ideen */}
                        {activeTab === 'content' && (
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {contentIdeas.map((idea, index) => (
                                        <div key={index} className="bg-bg-dark bg-opacity-80 p-4 rounded-xl hover:bg-bg-darker transition-all duration-300">
                                            <div className="flex items-start space-x-2">
                                                <Sparkles className="text-accent-blue mt-1 flex-shrink-0" size={16}/>
                                                <div>
                                                    <div className="font-medium text-text-primary">{idea}</div>
                                                    <div className="flex items-center mt-2">
                                                        <a href="#" className="text-sm text-accent-blue hover:underline flex items-center transition-colors duration-300">
                                                            Content-Brief erstellen <ArrowRight size={14} className="ml-1"/>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={() => {/* In einer realen Implementierung: Weitere Content-Ideen generieren */}}
                                        className="flex items-center px-4 py-2 bg-accent-blue text-white rounded-xl hover:bg-opacity-90 transition-all duration-300"
                                    >
                                        Mehr Content-Ideen <Sparkles className="ml-2" size={16}/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KeywordResearch;