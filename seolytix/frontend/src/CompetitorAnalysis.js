// src/CompetitorAnalysis.js - Komponente für die Konkurrenzanalyse (Dark Theme)

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
    Users,
    TrendingUp,
    TrendingDown,
    Award,
    AlertTriangle,
    Clock,
    Search,
    Plus,
    X,
    BarChart2,
    FileText,
    Layers,
    Smartphone,
    Tag
} from 'lucide-react';

const CompetitorAnalysis = ({ apiUrl, mainSiteData }) => {
    const [competitorUrls, setCompetitorUrls] = useState(['']);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Fügt ein neues Eingabefeld für Konkurrenz-URL hinzu
    const addCompetitorField = () => {
        if (competitorUrls.length < 5) { // Maximal 5 Konkurrenten zulassen
            setCompetitorUrls([...competitorUrls, '']);
        }
    };

    // Entfernt ein Eingabefeld für Konkurrenz-URL
    const removeCompetitorField = (index) => {
        const updatedUrls = [...competitorUrls];
        updatedUrls.splice(index, 1);
        setCompetitorUrls(updatedUrls);
    };

    // Aktualisiert den Wert eines Konkurrenz-URL-Felds
    const handleCompetitorUrlChange = (index, value) => {
        const updatedUrls = [...competitorUrls];
        updatedUrls[index] = value;
        setCompetitorUrls(updatedUrls);
    };

    // Formatiert URLs (fügt http:// hinzu, falls nötig)
    const formatUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    };

    // Startet die Konkurrenzanalyse
    const startCompetitorAnalysis = async () => {
        if (!mainSiteData) {
            setError('Bitte analysiere zuerst deine Website');
            return;
        }

        // Überprüfen, ob mindestens eine Konkurrenz-URL eingegeben wurde
        const validCompetitorUrls = competitorUrls
            .map(url => url.trim())
            .filter(url => url.length > 0)
            .map(url => formatUrl(url));

        if (validCompetitorUrls.length === 0) {
            setError('Bitte gib mindestens eine Konkurrenz-URL ein');
            return;
        }

        setError('');
        setIsAnalyzing(true);
        setResults(null);

        try {
            const response = await fetch(`${apiUrl}/api/competitors/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mainUrl: mainSiteData.url,
                    competitorUrls: validCompetitorUrls
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Fehler bei der Konkurrenzanalyse');
            }

            setResults(data.data);
        } catch (error) {
            console.error('Fehler bei der Konkurrenzanalyse:', error);
            setError(`Fehler bei der Konkurrenzanalyse: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Grafik-Farben basierend auf dem Status
    const getStatusColor = (status) => {
        switch (status) {
            case 'better': return '#9cb68f';  // Accent-Grün
            case 'worse': return '#e16162';   // Accent-Rot
            default: return '#FFC107';        // Gelb (neutral)
        }
    };

    // Farbe für Score-Vergleiche
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-accent-green';
        if (score >= 60) return 'text-yellow-400';
        return 'text-accent-red';
    };

    // Formatiert eine Domain aus der URL
    const formatDomain = (url) => {
        try {
            const domain = new URL(url).hostname;
            return domain.startsWith('www.') ? domain.substring(4) : domain;
        } catch (e) {
            return url;
        }
    };

    // Vergleichsdaten für Diagramm aufbereiten
    const prepareChartData = () => {
        if (!results || !results.comparison || !results.comparison.scoreComparison) {
            return [];
        }

        const { scoreComparison } = results.comparison;

        return [
            {
                name: 'Gesamt',
                Ihre_Website: scoreComparison.overall.main,
                Konkurrenz: scoreComparison.overall.competitor,
                status: scoreComparison.overall.status
            },
            {
                name: 'Meta-Title',
                Ihre_Website: scoreComparison.metaTitle.main,
                Konkurrenz: scoreComparison.metaTitle.competitor,
                status: scoreComparison.metaTitle.status
            },
            {
                name: 'Meta-Description',
                Ihre_Website: scoreComparison.metaDescription.main,
                Konkurrenz: scoreComparison.metaDescription.competitor,
                status: scoreComparison.metaDescription.status
            },
            {
                name: 'Überschriften',
                Ihre_Website: scoreComparison.headings.main,
                Konkurrenz: scoreComparison.headings.competitor,
                status: scoreComparison.headings.status
            },
            {
                name: 'Inhalt',
                Ihre_Website: scoreComparison.content.main,
                Konkurrenz: scoreComparison.content.competitor,
                status: scoreComparison.content.status
            },
            {
                name: 'Ladezeit',
                Ihre_Website: scoreComparison.loadTime.main,
                Konkurrenz: scoreComparison.loadTime.competitor,
                status: scoreComparison.loadTime.status
            }
        ];
    };

    // Custom colors für Dark Mode charts
    const chartColors = {
        yourSite: '#688db1',   // Accent-Blue
        competitor: '#9cb68f', // Accent-Green
        grid: '#4a4d5a',       // Leicht heller als Hintergrund
        text: '#d1d5db'        // Text-Primary
    };

    // Rendert die Übersichts-Tabelle
    const renderOverviewTab = () => {
        if (!results || !results.comparison) return null;

        const { scoreComparison, strengths, weaknesses } = results.comparison;
        const chartData = prepareChartData();

        return (
            <div>
                {/* Score-Vergleich */}
                <div className="mb-6 p-4 bg-bg-dark rounded-xl">
                    <h3 className="text-md font-semibold text-text-primary mb-4 flex items-center">
                        <BarChart2 size={18} className="mr-2 text-accent-blue"/> SEO-Score Vergleich
                    </h3>

                    <div className="flex justify-between items-center mb-3">
                        <div className="text-center">
                            <span className="block text-text-secondary text-sm">Deine Website</span>
                            <span className={`block text-2xl font-bold ${getScoreColor(scoreComparison.overall.main)}`}>
                                {scoreComparison.overall.main}/100
                            </span>
                        </div>

                        <div className="flex items-center">
                            {scoreComparison.overall.status === 'better' ? (
                                <TrendingUp className="text-accent-green mx-2" size={24} />
                            ) : scoreComparison.overall.status === 'worse' ? (
                                <TrendingDown className="text-accent-red mx-2" size={24} />
                            ) : (
                                <div className="text-yellow-400 mx-2">=</div>
                            )}
                            <span className="text-sm text-text-secondary">
                                {Math.abs(scoreComparison.overall.difference)}%
                            </span>
                        </div>

                        <div className="text-center">
                            <span className="block text-text-secondary text-sm">Ø Konkurrenz</span>
                            <span className={`block text-2xl font-bold ${getScoreColor(scoreComparison.overall.competitor)}`}>
                                {scoreComparison.overall.competitor}/100
                            </span>
                        </div>
                    </div>

                    {/* Vergleichsdiagramm */}
                    <div className="h-80 my-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                <XAxis dataKey="name" stroke={chartColors.text} />
                                <YAxis domain={[0, 100]} stroke={chartColors.text} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#343845', borderColor: '#4a4d5a', color: '#d1d5db' }}
                                />
                                <Legend wrapperStyle={{ color: chartColors.text }} />
                                <Bar dataKey="Ihre_Website" name="Deine Website" fill={chartColors.yourSite} />
                                <Bar dataKey="Konkurrenz" fill={chartColors.competitor} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stärken und Schwächen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Stärken */}
                    <div className="p-4 bg-accent-green bg-opacity-10 rounded-xl border border-accent-green border-opacity-20">
                        <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                            <Award size={18} className="mr-2 text-accent-green"/> Deine SEO-Stärken
                        </h3>

                        {strengths.length > 0 ? (
                            <ul className="space-y-2">
                                {strengths.map((strength, index) => (
                                    <li key={index} className="flex items-start">
                                        <TrendingUp className="text-accent-green mr-2 mt-1" size={16} />
                                        <div className="text-text-primary">
                                            <span className="font-medium">{getFactorName(strength.factor)}: </span>
                                            <span>{strength.difference > 0 ? '+' : ''}{strength.difference}% besser als die Konkurrenz</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-secondary">Keine signifikanten Stärken identifiziert.</p>
                        )}
                    </div>

                    {/* Schwächen */}
                    <div className="p-4 bg-accent-red bg-opacity-10 rounded-xl border border-accent-red border-opacity-20">
                        <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                            <AlertTriangle size={18} className="mr-2 text-accent-red"/> Verbesserungspotenzial
                        </h3>

                        {weaknesses.length > 0 ? (
                            <ul className="space-y-2">
                                {weaknesses.map((weakness, index) => (
                                    <li key={index} className="flex items-start">
                                        <TrendingDown className="text-accent-red mr-2 mt-1" size={16} />
                                        <div className="text-text-primary">
                                            <span className="font-medium">{getFactorName(weakness.factor)}: </span>
                                            <span>{weakness.difference}% schlechter als die Konkurrenz</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-secondary">Keine signifikanten Schwächen identifiziert.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Rendert den Keywords-Tab
    const renderKeywordsTab = () => {
        if (!results || !results.comparison) return null;

        const { sharedKeywords, missingKeywords } = results.comparison;

        return (
            <div>
                {/* Fehlende Keywords */}
                <div className="mb-6 p-4 bg-bg-dark rounded-xl">
                    <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                        <Tag size={18} className="mr-2 text-accent-blue"/> Wichtige Keywords der Konkurrenz
                    </h3>

                    {missingKeywords && missingKeywords.length > 0 ? (
                        <div>
                            <p className="text-sm text-text-secondary mb-3">
                                Diese Keywords werden von deinen Konkurrenten häufig verwendet, fehlen aber auf deiner Website:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {missingKeywords.map((item, index) => (
                                    <div key={index} className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                                        <div className="font-medium text-text-primary mb-1">{item.keyword}</div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-secondary">Quelle: {formatDomain(item.source)}</span>
                                            <span className="text-text-secondary">Häufigkeit: {item.frequency}x</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary">Keine relevanten Keywords gefunden.</p>
                    )}
                </div>

                {/* Gemeinsame Keywords */}
                <div className="p-4 bg-bg-dark rounded-xl">
                    <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                        <Layers size={18} className="mr-2 text-accent-blue"/> Gemeinsame Keywords
                    </h3>

                    {sharedKeywords && Object.keys(sharedKeywords).length > 0 ? (
                        <div className="space-y-4">
                            {Object.entries(sharedKeywords).map(([domain, keywords], domainIndex) => (
                                <div key={domainIndex} className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                                    <h4 className="font-medium text-text-primary mb-2">{formatDomain(domain)}</h4>

                                    {keywords.length > 0 ? (
                                        <div className="space-y-2">
                                            {keywords.map((item, keywordIndex) => (
                                                <div key={keywordIndex} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium text-text-primary">{item.keyword}</span>
                                                    <div className="flex items-center">
                                                        <span className="px-2 py-1 bg-accent-blue bg-opacity-20 rounded mr-2 text-text-primary">
                                                            Du: {item.mainSiteCount}x
                                                        </span>
                                                        <span className="px-2 py-1 bg-accent-green bg-opacity-20 rounded text-text-primary">
                                                            Konkurrenz: {item.competitorCount}x
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-text-secondary">Keine gemeinsamen Keywords mit dieser Website.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary">Keine gemeinsamen Keywords gefunden.</p>
                    )}
                </div>
            </div>
        );
    };

    // Rendert den Konkurrenten-Tab
    const renderCompetitorsTab = () => {
        if (!results || !results.competitors) return null;

        return (
            <div className="space-y-6">
                {results.competitors.map((competitor, index) => (
                    <div key={index} className="p-4 bg-bg-dark rounded-xl">
                        <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                            <Users size={18} className="mr-2 text-accent-blue"/> {formatDomain(competitor.url)}
                        </h3>

                        <div className="flex justify-between items-center mb-4">
                            <span className="text-text-secondary">SEO-Score:</span>
                            <span className={`text-xl font-bold ${getScoreColor(competitor.overallScore)}`}>
                                {competitor.overallScore}/100
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Meta Infos */}
                            <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                                <div className="flex items-start">
                                    <FileText className="text-accent-blue mr-2 mt-1" size={16}/>
                                    <div>
                                        <div className="font-medium text-text-primary">Meta-Informationen</div>
                                        <p className="text-sm text-text-secondary mt-1">
                                            Title: {competitor.metaTitle.exists ? `${competitor.metaTitle.length} Zeichen` : 'Fehlt'}
                                            <br />
                                            Description: {competitor.metaDescription.exists ? `${competitor.metaDescription.length} Zeichen` : 'Fehlt'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Überschriften */}
                            <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                                <div className="flex items-start">
                                    <Layers className="text-accent-blue mr-2 mt-1" size={16}/>
                                    <div>
                                        <div className="font-medium text-text-primary">Überschriften</div>
                                        <p className="text-sm text-text-secondary mt-1">
                                            H1: {competitor.headings.h1Count},
                                            H2: {competitor.headings.h2Count},
                                            H3: {competitor.headings.h3Count}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Inhalt */}
                            <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                                <div className="flex items-start">
                                    <FileText className="text-accent-blue mr-2 mt-1" size={16}/>
                                    <div>
                                        <div className="font-medium text-text-primary">Inhalt</div>
                                        <p className="text-sm text-text-secondary mt-1">
                                            Wortanzahl: {competitor.content.wordCount}
                                            <br />
                                            Lesbarkeit: {competitor.content.readabilityScore}/100
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Ladezeit */}
                            <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                                <div className="flex items-start">
                                    <Clock className="text-accent-blue mr-2 mt-1" size={16}/>
                                    <div>
                                        <div className="font-medium text-text-primary">Ladezeit</div>
                                        <p className="text-sm text-text-secondary mt-1">
                                            {competitor.loadTime.toFixed(2)} Sekunden
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Keywords */}
                        {competitor.keywords && competitor.keywords.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-medium text-text-primary mb-2">Top Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                    {competitor.keywords.slice(0, 10).map((keyword, keywordIndex) => (
                                        <span
                                            key={keywordIndex}
                                            className="px-2 py-1 bg-accent-blue bg-opacity-20 rounded text-sm text-text-primary"
                                        >
                                            {keyword.word} ({keyword.count}x)
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Hilfsfunktion, um Faktornamen lesbar zu machen
    const getFactorName = (factor) => {
        const factorMap = {
            'overall': 'Gesamt-Score',
            'metaTitle': 'Meta-Title',
            'metaDescription': 'Meta-Description',
            'headings': 'Überschriften',
            'content': 'Inhalt',
            'loadTime': 'Ladezeit'
        };

        return factorMap[factor] || factor;
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-text-primary flex items-center">
                <Users className="mr-2 text-accent-blue" size={20}/> Konkurrenzanalyse
            </h2>

            {!results && (
                <div className="bg-card-bg rounded-xl shadow-card p-6">
                    <p className="text-text-secondary mb-4">
                        Vergleiche deine Website mit bis zu 5 Konkurrenzwebsites, um deine SEO-Stärken und -Schwächen zu identifizieren.
                    </p>

                    <div className="space-y-3 mb-4">
                        {competitorUrls.map((url, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div className="relative flex-grow">
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => handleCompetitorUrlChange(index, e.target.value)}
                                        placeholder="https://competitor.com"
                                        className="w-full p-3 pr-10 border border-bg-darker bg-bg-darker rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-text-primary transition-all duration-300"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-secondary">
                                        <Users size={18}/>
                                    </div>
                                </div>
                                {index > 0 && (
                                    <button
                                        onClick={() => removeCompetitorField(index)}
                                        className="p-3 text-accent-red hover:bg-bg-dark rounded-xl transition-all duration-300"
                                    >
                                        <X size={18}/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex space-x-2">
                        {competitorUrls.length < 5 && (
                            <button
                                onClick={addCompetitorField}
                                className="flex items-center px-4 py-2 text-text-primary border border-text-secondary rounded-xl hover:bg-bg-dark transition-all duration-300"
                            >
                                <Plus size={18} className="mr-1"/> Konkurrent hinzufügen
                            </button>
                        )}

                        <button
                            onClick={startCompetitorAnalysis}
                            disabled={isAnalyzing || !mainSiteData}
                            className={`flex-grow px-6 py-2 bg-accent-blue text-white rounded-xl hover:bg-opacity-90 flex items-center justify-center transition-all duration-300 ${(isAnalyzing || !mainSiteData) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isAnalyzing ? (
                                <>Analysiere<span className="ml-2 animate-pulse">...</span></>
                            ) : (
                                <>Konkurrenzanalyse starten <Search size={18} className="ml-2"/></>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-3 text-accent-red text-sm flex items-center">
                            <AlertTriangle size={16} className="mr-1"/> {error}
                        </div>
                    )}

                    {!mainSiteData && (
                        <div className="mt-3 text-yellow-400 text-sm flex items-center">
                            <AlertTriangle size={16} className="mr-1"/> Bitte analysiere zuerst deine Website.
                        </div>
                    )}
                </div>
            )}

            {isAnalyzing && (
                <div className="text-center py-12 bg-card-bg rounded-xl shadow-card">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue mb-4"></div>
                    <p className="text-text-secondary">Analysiere Konkurrenzwebsites...</p>
                </div>
            )}

            {results && !isAnalyzing && (
                <div className="bg-card-bg rounded-xl shadow-card p-6">
                    {/* Tabs */}
                    <div className="flex border-b border-bg-darker mb-6">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 font-medium text-sm mr-2 ${activeTab === 'overview' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'} transition-colors duration-300`}
                        >
                            Übersicht
                        </button>
                        <button
                            onClick={() => setActiveTab('keywords')}
                            className={`px-4 py-2 font-medium text-sm mr-2 ${activeTab === 'keywords' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'} transition-colors duration-300`}
                        >
                            Keywords
                        </button>
                        <button
                            onClick={() => setActiveTab('competitors')}
                            className={`px-4 py-2 font-medium text-sm ${activeTab === 'competitors' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'} transition-colors duration-300`}
                        >
                            Konkurrenten
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'keywords' && renderKeywordsTab()}
                    {activeTab === 'competitors' && renderCompetitorsTab()}

                    {/* Neue Analyse Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => {
                                setResults(null);
                                setCompetitorUrls(['']);
                            }}
                            className="px-4 py-2 border border-text-secondary text-text-primary rounded-xl hover:bg-bg-dark transition-all duration-300"
                        >
                            Neue Analyse
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetitorAnalysis;