// src/App.js - Hauptkomponente für SEOlytix mit Dark Theme

import React, {useEffect, useState} from 'react';
import {
    AlertCircle,
    Clock,
    FileCheck,
    FileText,
    Globe,
    Layers,
    Search,
    Smartphone,
    Sparkles,
    Users,
    Code,
    Heading,
    Copy
} from 'lucide-react';

// Komponenten importieren
import CompetitorAnalysis from './CompetitorAnalysis';
import ApiKeyInput from './ApiKeyInput';
import DashboardView from './DashboardView';
import KeywordResearch from './KeywordResearch';
import ContentGenerator from './ContentGenerator';
import AdvancedCrawling from './AdvancedCrawling';

function App() {
    const [url, setUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [suggestions, setSuggestions] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('analysis');
    const [apiBaseUrl, setApiBaseUrl] = useState('');
    const [mainFeatureTab, setMainFeatureTab] = useState('seo');

    // API-Basis-URL für alle Anfragen
    useEffect(() => {
        const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
        setApiBaseUrl(isLocalhost ? '' : '/seolytix');
    }, []);

    // Historische Daten im localStorage speichern
    const saveHistoricalData = (data) => {
        try {
            // Aktuelle Daten aus dem localStorage abrufen
            const storedData = localStorage.getItem('seoHistoricalData');
            let historicalData = storedData ? JSON.parse(storedData) : [];

            // Neuen Eintrag erstellen
            const newEntry = {
                date: new Date().toISOString(),
                url: data.url,
                score: data.score,
                metaScore: (data.metaTitle.score + data.metaDescription.score) / 2,
                contentScore: data.contentAnalysis.score,
                speedScore: data.loadSpeed.score,
                mobileScore: data.mobileOptimization.score
            };

            // Daten hinzufügen (maximal 100 Einträge speichern)
            historicalData.push(newEntry);
            if (historicalData.length > 100) {
                historicalData = historicalData.slice(-100);
            }

            // Daten im localStorage speichern
            localStorage.setItem('seoHistoricalData', JSON.stringify(historicalData));
        } catch (error) {
            console.error('Fehler beim Speichern der historischen Daten:', error);
        }
    };

    // Analysiert eine Website über die Backend-API
    const analyzeWebsite = async () => {
        if (!url) {
            setError('Bitte gib eine URL ein');
            return;
        }

        setError('');
        setIsAnalyzing(true);
        setSuggestions(null);

        // URL formatieren, falls noch kein Protokoll angegeben ist
        let formattedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            formattedUrl = 'https://' + url;
            setUrl(formattedUrl); // Aktualisiert die URL in der Eingabe
        }

        try {
            // URL-Format validieren
            new URL(formattedUrl);

            // Backend-API aufrufen
            const response = await fetch(`${apiBaseUrl}/api/seo/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({url: formattedUrl}),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Fehler bei der Analyse');
            }

            // Fallback für Sitemap-Daten, falls sie fehlen
            if (!data.data.sitemap) {
                data.data.sitemap = {
                    exists: false,
                    score: 30,
                    message: 'Keine Sitemap gefunden. Eine Sitemap hilft Suchmaschinen, Ihre Website besser zu verstehen.',
                    details: {
                        sitemapUrl: null,
                        urlCount: 0,
                        isSitemapIndex: false
                    }
                };
            }

            // Historischen Score speichern
            saveHistoricalData(data.data);

            setResults(data.data);
            setIsAnalyzing(false);
        } catch (error) {
            console.error('Fehler bei der Analyse:', error);
            const errorMessage = error.message === 'Failed to fetch'
                ? 'Verbindung zum Server fehlgeschlagen. Bitte prüfe, ob der Backend-Server läuft.'
                : `Fehler bei der Analyse: ${error.message}`;
            setError(errorMessage);
            setIsAnalyzing(false);
        }
    };

    // Event-Handler für Enter-Taste
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isAnalyzing) {
            e.preventDefault();

            // Überprüfen und Ergänzen des URL-Protokolls
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                const formattedUrl = 'https://' + url;
                setUrl(formattedUrl);
                // Wir übergeben die formatierte URL direkt an analyzeWebsite,
                // anstatt zu warten bis React state aktualisiert
                setTimeout(() => analyzeWebsite(), 0);
            } else {
                analyzeWebsite();
            }
        }
    };

    // Bestimmt die Farbe basierend auf dem Score
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-accent-green';
        if (score >= 60) return 'text-yellow-400';
        return 'text-accent-red';
    };

    // Generiert SEO-Vorschläge mit ChatGPT API
    const generateSuggestions = async () => {
        if (!apiKey) {
            setError('Bitte gib einen ChatGPT API-Key ein');
            return;
        }

        if (!results) {
            setError('Bitte analysiere zuerst die Website');
            return;
        }

        setError('');
        setIsGenerating(true);

        try {
            const prompt = createChatGPTPrompt(results);

            // API-Anfrage an das Backend senden
            const response = await fetch(`${apiBaseUrl}/api/ai/seo-suggestions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey,
                    data: {
                        prompt
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Fehler bei der API-Anfrage');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Fehler bei der API-Anfrage');
            }

            // Response parsen (als JSON)
            try {
                const content = data.data.choices[0].message.content;
                // JSON aus der Antwort extrahieren
                const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                    content.match(/{[\s\S]*}/);

                const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
                const suggestionsData = JSON.parse(jsonStr);
                setSuggestions(suggestionsData);
            } catch (parseError) {
                console.error('Fehler beim Parsen der Antwort:', parseError);
                setSuggestions({
                    rawResponse: data.data.choices[0].message.content,
                    error: 'Konnte Antwort nicht als JSON parsen'
                });
            }
        } catch (error) {
            console.error('Fehler bei der Generierung von Vorschlägen:', error);
            setError(`Fehler bei der Generierung von Vorschlägen: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Erstellt den Prompt für ChatGPT basierend auf den Analyseergebnissen
    const createChatGPTPrompt = (results) => {
        const sitemapInfo = results.sitemap ? `
8. Sitemap:
   - Vorhanden: ${results.sitemap.exists ? 'Ja' : 'Nein'}
   - Score: ${results.sitemap.score}/100
   - Bewertung: "${results.sitemap.message}"` : '';

        return `
Ich brauche SEO-Verbesserungsvorschläge für die Website ${results.url}.

Die aktuelle SEO-Analyse zeigt folgende Ergebnisse:

1. Meta Title:
   - Vorhanden: ${results.metaTitle.exists ? 'Ja' : 'Nein'}
   - Aktueller Titel: "${results.metaTitle.title}"
   - Länge: ${results.metaTitle.length} Zeichen
   - Score: ${results.metaTitle.score}/100
   - Bewertung: "${results.metaTitle.message}"

2. Meta Description:
   - Vorhanden: ${results.metaDescription.exists ? 'Ja' : 'Nein'}
   - Aktuelle Beschreibung: "${results.metaDescription.description}"
   - Länge: ${results.metaDescription.length} Zeichen
   - Score: ${results.metaDescription.score}/100
   - Bewertung: "${results.metaDescription.message}"

3. Überschriften:
   - H1: ${results.headings.h1Count}, H2: ${results.headings.h2Count}, H3: ${results.headings.h3Count}
   - Score: ${results.headings.score}/100
   - Bewertung: "${results.headings.message}"
   - H1-Elemente: ${JSON.stringify(results.headings.h1Elements)}

4. Bilder:
   - Anzahl: ${results.images.totalImages}
   - Mit Alt-Text: ${results.images.withAlt}/${results.images.totalImages}
   - Score: ${results.images.score}/100
   - Bewertung: "${results.images.message}"

5. Inhalt:
   - Wortanzahl: ${results.contentAnalysis.wordCount}
   - Score: ${results.contentAnalysis.score}/100
   - Bewertung: "${results.contentAnalysis.message}"
   - Top-Keywords: ${JSON.stringify(results.contentAnalysis.topKeywords ? results.contentAnalysis.topKeywords.slice(0, 5) : [])}

6. Ladezeit:
   - Zeit: ${results.loadSpeed.time}s
   - Score: ${results.loadSpeed.score}/100
   - Bewertung: "${results.loadSpeed.message}"

7. Mobile Optimierung:
   - Score: ${results.mobileOptimization.score}/100
   - Bewertung: "${results.mobileOptimization.message}"
${sitemapInfo}

Bitte erstelle einen umfassenden SEO-Verbesserungsvorschlag im folgenden JSON-Format:

\`\`\`json
{
  "metaTags": {
    "title": "Vorgeschlagener Meta-Title (50-60 Zeichen)",
    "description": "Vorgeschlagene Meta-Description (150-160 Zeichen)",
    "additionalTags": [
      {
        "name": "Name des zusätzlichen Meta-Tags (z.B. keywords, robots)",
        "content": "Vorgeschlagener Inhalt"
      }
    ]
  },
  "headings": {
    "h1Suggestion": "Vorgeschlagene H1-Überschrift",
    "headingStructure": "Vorschlag zur Verbesserung der Überschriftenstruktur"
  },
  "content": {
    "suggestions": "Vorschläge zur Verbesserung des Inhalts",
    "keywordOptimization": "Vorschläge zur Keyword-Optimierung"
  },
  "technical": {
    "codeSnippets": [
      {
        "description": "Beschreibung des Code-Snippets",
        "code": "HTML/JavaScript/CSS-Code zur Verbesserung der SEO"
      }
    ],
    "performanceTips": "Tipps zur Verbesserung der Performance"
  }
}
\`\`\`

Konzentriere dich besonders auf Bereiche mit niedrigen Scores. Wenn Meta-Tags fehlen oder unzureichend sind, erstelle optimierte Versionen.
`;
    };

    // Globalen Fehlerhandler für API-Anfragen
    const handleApiError = (errorMessage) => {
        setError(errorMessage);
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark">
            <header className="bg-bg-darker text-text-primary py-4 px-6 shadow-md">
                <div className="container mx-auto">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold flex items-center">
                            <Globe className="mr-2"/> SEOlytix
                        </h1>

                        {/* Hauptnavigation */}
                        <nav className="hidden md:flex space-x-6">
                            <button
                                onClick={() => setMainFeatureTab('seo')}
                                className={`text-sm font-medium ${mainFeatureTab === 'seo' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                SEO-Analyse
                            </button>
                            <button
                                onClick={() => setMainFeatureTab('content')}
                                className={`text-sm font-medium ${mainFeatureTab === 'content' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Content
                            </button>
                            <button
                                onClick={() => setMainFeatureTab('keywords')}
                                className={`text-sm font-medium ${mainFeatureTab === 'keywords' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Keywords
                            </button>
                            <button
                                onClick={() => setMainFeatureTab('dashboard')}
                                className={`text-sm font-medium ${mainFeatureTab === 'dashboard' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Dashboard
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
                {/* SEO-Analyse Feature */}
                {mainFeatureTab === 'seo' && (
                    <div className="bg-card-bg rounded-xl shadow-card p-6 max-w-4xl mx-auto mb-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-4 text-text-primary">Website SEO
                                analysieren</h2>
                            <div className="flex">
                                <div className="relative flex-grow">
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="https://example.com"
                                        className="w-full p-3 pr-10 border border-bg-darker bg-bg-darker rounded-l-lg focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-text-primary"
                                    />
                                    <div
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-secondary">
                                        <Globe size={18}/>
                                    </div>
                                </div>
                                <button
                                    onClick={analyzeWebsite}
                                    disabled={isAnalyzing}
                                    className={`px-6 py-3 bg-accent-blue text-white rounded-r-lg hover:bg-opacity-90 flex items-center ${isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isAnalyzing ? (
                                        <>Analysiere<span
                                            className="ml-2 animate-pulse">...</span></>
                                    ) : (
                                        <>Analysieren <Search size={18} className="ml-2"/></>
                                    )}
                                </button>
                            </div>
                            {error && (
                                <div className="mt-2 text-accent-red text-sm flex items-center">
                                    <AlertCircle size={16} className="mr-1"/> {error}
                                </div>
                            )}
                        </div>

                        {/* ChatGPT API Key Eingabe */}
                        <ApiKeyInput
                            apiKey={apiKey}
                            setApiKey={setApiKey}
                            disabled={isGenerating}
                        />

                        {isAnalyzing && (
                            <div className="text-center py-12">
                                <div
                                    className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue mb-4"></div>
                                <p className="text-text-secondary">Analysiere Website SEO...</p>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="text-center py-12">
                                <div
                                    className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue mb-4"></div>
                                <p className="text-text-secondary">Generiere
                                    SEO-Verbesserungsvorschläge
                                    mit
                                    ChatGPT...</p>
                            </div>
                        )}

                        {results && !isAnalyzing && (
                            <div>
                                {/* Tabs für die verschiedenen Funktionen */}
                                <div className="flex border-b border-bg-darker mt-6 mb-6">
                                    <button
                                        onClick={() => setActiveTab('analysis')}
                                        className={`flex items-center px-4 py-2 font-medium text-sm mr-4 ${activeTab === 'analysis' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                                    >
                                        <Search size={16} className="mr-2"/> SEO-Analyse
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('ai')}
                                        className={`flex items-center px-4 py-2 font-medium text-sm mr-4 ${activeTab === 'ai' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                                    >
                                        <Sparkles size={16} className="mr-2"/> AI-Empfehlungen
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('competitors')}
                                        className={`flex items-center px-4 py-2 font-medium text-sm ${activeTab === 'competitors' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                                    >
                                        <Users size={16} className="mr-2"/> Konkurrenzanalyse
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('crawling')}
                                        onKeyDown={handleKeyDown}
                                        className={`flex items-center px-4 py-2 font-medium text-sm ${activeTab === 'crawling' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                                    >
                                        <Layers size={16} className="mr-2"/> Erw. Crawling
                                    </button>
                                </div>

                                {/* SEO-Analyse Tab */}
                                {activeTab === 'analysis' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-text-primary">SEO
                                                Analyse: {results.url}</h3>
                                            <div className="flex items-center">
                                            <span
                                                className="text-sm text-text-secondary mr-2">Gesamt-Score:</span>
                                                <span
                                                    className={`text-2xl font-bold ${getScoreColor(results.score)}`}>
                                                {results.score}/100
                                            </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Meta Title */}
                                            <div className="bg-bg-dark p-4 rounded-xl">
                                                <div className="flex items-start">
                                                    <FileText
                                                        className="text-accent-blue mr-3 mt-1"
                                                        size={20}/>
                                                    <div>
                                                        <div
                                                            className="flex items-center justify-between w-full">
                                                            <h4 className="font-medium text-text-primary">Meta
                                                                Title</h4>
                                                            <span
                                                                className={`font-medium ${getScoreColor(results.metaTitle.score)}`}>
                                                            {results.metaTitle.score}/100
                                                        </span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary mt-1">{results.metaTitle.message}</p>
                                                        <p className="text-xs text-text-secondary mt-1">Länge: {results.metaTitle.length} Zeichen</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Meta Description */}
                                            <div className="bg-bg-dark p-4 rounded-xl">
                                                <div className="flex items-start">
                                                    <FileText
                                                        className="text-accent-blue mr-3 mt-1"
                                                        size={20}/>
                                                    <div>
                                                        <div
                                                            className="flex items-center justify-between w-full">
                                                            <h4 className="font-medium text-text-primary">Meta
                                                                Description</h4>
                                                            <span
                                                                className={`font-medium ${getScoreColor(results.metaDescription.score)}`}>
                                                            {results.metaDescription.score}/100
                                                        </span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary mt-1">{results.metaDescription.message}</p>
                                                        <p className="text-xs text-text-secondary mt-1">Länge: {results.metaDescription.length} Zeichen</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Headings */}
                                            <div className="bg-bg-dark p-4 rounded-xl">
                                                <div className="flex items-start">
                                                    <FileText
                                                        className="text-accent-blue mr-3 mt-1"
                                                        size={20}/>
                                                    <div>
                                                        <div
                                                            className="flex items-center justify-between w-full">
                                                            <h4 className="font-medium text-text-primary">Überschriften</h4>
                                                            <span
                                                                className={`font-medium ${getScoreColor(results.headings.score)}`}>
                                                            {results.headings.score}/100
                                                        </span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary mt-1">{results.headings.message}</p>
                                                        <p className="text-xs text-text-secondary mt-1">H1: {results.headings.h1Count}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Images */}
                                            <div className="bg-bg-dark p-4 rounded-xl">
                                                <div className="flex items-start">
                                                    <FileText
                                                        className="text-accent-blue mr-3 mt-1"
                                                        size={20}/>
                                                    <div>
                                                        <div
                                                            className="flex items-center justify-between w-full">
                                                            <h4 className="font-medium text-text-primary">Bilder</h4>
                                                            <span
                                                                className={`font-medium ${getScoreColor(results.images.score)}`}>
                                                            {results.images.score}/100
                                                        </span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary mt-1">{results.images.message}</p>
                                                        <p className="text-xs text-text-secondary mt-1">Mit
                                                            Alt-Text: {results.images.withAlt}/{results.images.withAlt + results.images.withoutAlt}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content Analysis */}
                                            <div className="bg-bg-dark p-4 rounded-xl">
                                                <div className="flex items-start">
                                                    <FileText
                                                        className="text-accent-blue mr-3 mt-1"
                                                        size={20}/>
                                                    <div>
                                                        <div
                                                            className="flex items-center justify-between w-full">
                                                            <h4 className="font-medium text-text-primary">Inhalt</h4>
                                                            <span
                                                                className={`font-medium ${getScoreColor(results.contentAnalysis.score)}`}>
                                                            {results.contentAnalysis.score}/100
                                                        </span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary mt-1">{results.contentAnalysis.message}</p>
                                                        <p className="text-xs text-text-secondary mt-1">Wortanzahl: {results.contentAnalysis.wordCount}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Load Speed */}
                                            <div className="bg-bg-dark p-4 rounded-xl">
                                                <div className="flex items-start">
                                                    <Clock className="text-accent-blue mr-3 mt-1"
                                                           size={20}/>
                                                    <div>
                                                        <div
                                                            className="flex items-center justify-between w-full">
                                                            <h4 className="font-medium text-text-primary">Ladezeit</h4>
                                                            <span
                                                                className={`font-medium ${getScoreColor(results.loadSpeed.score)}`}>
                                                            {results.loadSpeed.score}/100
                                                        </span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary mt-1">{results.loadSpeed.message}</p>
                                                        <p className="text-xs text-text-secondary mt-1">Zeit: {results.loadSpeed.time}s</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Optimization */}
                                            <div className="bg-bg-dark p-4 rounded-xl">
                                                <div className="flex items-start">
                                                    <Smartphone
                                                        className="text-accent-blue mr-3 mt-1"
                                                        size={20}/>
                                                    <div>
                                                        <div
                                                            className="flex items-center justify-between w-full">
                                                            <h4 className="font-medium text-text-primary">Mobile
                                                                Optimierung</h4>
                                                            <span
                                                                className={`font-medium ${getScoreColor(results.mobileOptimization.score)}`}>
                                                            {results.mobileOptimization.score}/100
                                                        </span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary mt-1">{results.mobileOptimization.message}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sitemap - NEU */}
                                            <div className="bg-bg-dark p-4 rounded-xl">
                                                <div className="flex items-start">
                                                    <FileCheck
                                                        className="text-accent-blue mr-3 mt-1"
                                                        size={20}/>
                                                    <div>
                                                        <div
                                                            className="flex items-center justify-between w-full">
                                                            <h4 className="font-medium text-text-primary">Sitemap</h4>
                                                            <span
                                                                className={`font-medium ${getScoreColor(results.sitemap.score)}`}>
                                                                {results.sitemap.score}/100
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary mt-1">{results.sitemap.message}</p>
                                                        {results.sitemap.exists && (
                                                            <p className="text-xs text-text-secondary mt-1">
                                                                {results.sitemap.details.isSitemapIndex
                                                                    ? `Sitemap-Index mit ${results.sitemap.details.childSitemapCount} Sitemaps`
                                                                    : `${results.sitemap.details.urlCount} URLs in der Sitemap`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* KI-Empfehlungen Button */}
                                        <div className="flex mt-6">
                                            <button
                                                onClick={generateSuggestions}
                                                disabled={isGenerating || !apiKey}
                                                className={`px-6 py-3 bg-accent-blue text-white rounded-xl hover:bg-opacity-90 flex items-center w-full justify-center ${(isGenerating || !apiKey) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {isGenerating ? (
                                                    <>Generiere SEO-Vorschläge<span
                                                        className="ml-2 animate-pulse">...</span></>
                                                ) : (
                                                    <>KI-Empfehlungen generieren <Sparkles
                                                        size={18} className="ml-2"/></>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* KI-Empfehlungen Tab */}
                                {activeTab === 'ai' && (
                                    <div className="text-text-primary">
                                        {!suggestions && !isGenerating && (
                                            <div className="text-center py-8">
                                                <Sparkles size={36}
                                                          className="mx-auto mb-4 text-accent-blue"/>
                                                <h3 className="text-lg font-semibold mb-2">KI-Empfehlungen</h3>
                                                <p className="text-text-secondary mb-4">Lass
                                                    unsere KI individuelle
                                                    SEO-Verbesserungsvorschläge für deine Website
                                                    generieren.</p>
                                                <button
                                                    onClick={generateSuggestions}
                                                    disabled={!apiKey}
                                                    className={`px-6 py-3 bg-accent-blue text-white rounded-xl hover:bg-opacity-90 inline-flex items-center ${!apiKey ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                >
                                                    Empfehlungen generieren <Sparkles size={18}
                                                                                      className="ml-2"/>
                                                </button>
                                                {!apiKey && (
                                                    <p className="text-sm text-accent-red mt-2">Bitte
                                                        gib einen API-Schlüssel ein, um
                                                        diese Funktion zu nutzen</p>
                                                )}
                                            </div>
                                        )}

                                        {isGenerating && (
                                            <div className="text-center py-8">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue mb-4"></div>
                                                <p className="text-text-secondary">KI-Empfehlungen werden generiert...</p>
                                            </div>
                                        )}

                                        {/* Anzeige der KI-Empfehlungen */}
                                        {suggestions && !isGenerating && (
                                            <div className="space-y-6">
                                                {/* Meta Tags Empfehlungen */}
                                                {suggestions.metaTags && (
                                                    <div className="bg-bg-dark p-4 rounded-xl">
                                                        <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                                                            <FileText size={18} className="mr-2 text-accent-blue"/> Empfohlene Meta-Tags
                                                        </h3>

                                                        {suggestions.metaTags.title && (
                                                            <div className="mb-4">
                                                                <div className="font-medium text-text-primary mb-1">Meta-Title</div>
                                                                <div className="p-3 bg-card-bg rounded-lg border border-bg-darker">
                                                                    <p className="text-text-primary">{suggestions.metaTags.title}</p>
                                                                    <p className="text-xs text-text-secondary mt-1">
                                                                        {suggestions.metaTags.title.length} Zeichen (Optimal: 50-60)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {suggestions.metaTags.description && (
                                                            <div className="mb-4">
                                                                <div className="font-medium text-text-primary mb-1">Meta-Description</div>
                                                                <div className="p-3 bg-card-bg rounded-lg border border-bg-darker">
                                                                    <p className="text-text-primary">{suggestions.metaTags.description}</p>
                                                                    <p className="text-xs text-text-secondary mt-1">
                                                                        {suggestions.metaTags.description.length} Zeichen (Optimal: 150-160)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {suggestions.metaTags.additionalTags && suggestions.metaTags.additionalTags.length > 0 && (
                                                            <div>
                                                                <div className="font-medium text-text-primary mb-1">Weitere Meta-Tags</div>
                                                                {suggestions.metaTags.additionalTags.map((tag, index) => (
                                                                    <div key={index} className="p-3 bg-card-bg rounded-lg border border-bg-darker mb-2">
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium text-accent-blue">{tag.name}</span>
                                                                            <span className="text-text-secondary text-sm">{tag.content.length} Zeichen</span>
                                                                        </div>
                                                                        <p className="text-text-primary mt-1">{tag.content}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="mt-3">
                                                            <button className="text-accent-blue hover:underline text-sm flex items-center">
                                                                <Copy size={14} className="mr-1"/> Alle Meta-Tags kopieren
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Überschriften Empfehlungen */}
                                                {suggestions.headings && (
                                                    <div className="bg-bg-dark p-4 rounded-xl">
                                                        <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                                                            <Heading size={18} className="mr-2 text-accent-blue"/> Empfohlene Überschriften
                                                        </h3>

                                                        {suggestions.headings.h1Suggestion && (
                                                            <div className="mb-4">
                                                                <div className="font-medium text-text-primary mb-1">H1-Überschrift</div>
                                                                <div className="p-3 bg-card-bg rounded-lg border border-bg-darker">
                                                                    <p className="text-text-primary font-medium">{suggestions.headings.h1Suggestion}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {suggestions.headings.headingStructure && (
                                                            <div>
                                                                <div className="font-medium text-text-primary mb-1">Überschriftenstruktur</div>
                                                                <div className="p-3 bg-card-bg rounded-lg border border-bg-darker">
                                                                    <p className="text-text-primary whitespace-pre-line">{suggestions.headings.headingStructure}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Content Empfehlungen */}
                                                {suggestions.content && (
                                                    <div className="bg-bg-dark p-4 rounded-xl">
                                                        <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                                                            <FileText size={18} className="mr-2 text-accent-blue"/> Inhaltsverbesserungen
                                                        </h3>

                                                        {suggestions.content.suggestions && (
                                                            <div className="mb-4">
                                                                <div className="font-medium text-text-primary mb-1">Content-Vorschläge</div>
                                                                <div className="p-3 bg-card-bg rounded-lg border border-bg-darker">
                                                                    <p className="text-text-primary whitespace-pre-line">{suggestions.content.suggestions}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {suggestions.content.keywordOptimization && (
                                                            <div>
                                                                <div className="font-medium text-text-primary mb-1">Keyword-Optimierung</div>
                                                                <div className="p-3 bg-card-bg rounded-lg border border-bg-darker">
                                                                    <p className="text-text-primary whitespace-pre-line">{suggestions.content.keywordOptimization}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Technische Empfehlungen */}
                                                {suggestions.technical && (
                                                    <div className="bg-bg-dark p-4 rounded-xl">
                                                        <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                                                            <Code size={18} className="mr-2 text-accent-blue"/> Technische Verbesserungen
                                                        </h3>

                                                        {suggestions.technical.performanceTips && (
                                                            <div className="mb-4">
                                                                <div className="font-medium text-text-primary mb-1">Performance-Tipps</div>
                                                                <div className="p-3 bg-card-bg rounded-lg border border-bg-darker">
                                                                    <p className="text-text-primary whitespace-pre-line">{suggestions.technical.performanceTips}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {suggestions.technical.codeSnippets && suggestions.technical.codeSnippets.length > 0 && (
                                                            <div>
                                                                <div className="font-medium text-text-primary mb-1">Code-Snippets</div>
                                                                {suggestions.technical.codeSnippets.map((snippet, index) => (
                                                                    <div key={index} className="mb-3">
                                                                        <div className="text-sm text-text-primary mb-1">{snippet.description}</div>
                                                                        <div className="p-3 bg-card-bg rounded-lg border border-bg-darker font-mono text-sm overflow-x-auto">
                                                                            <pre className="text-text-primary">{snippet.code}</pre>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Neuen Vorschlag generieren Button */}
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={generateSuggestions}
                                                        className="px-6 py-3 bg-accent-blue text-white rounded-xl hover:bg-opacity-90 flex items-center transition-all duration-300"
                                                    >
                                                        Neue Empfehlungen generieren <Sparkles size={18} className="ml-2"/>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Fallback für den Fall, dass suggestions keine bekannte Struktur hat */}
                                        {suggestions && !isGenerating && !suggestions.metaTags && !suggestions.headings && !suggestions.content && !suggestions.technical && (
                                            <div className="bg-bg-dark p-4 rounded-xl">
                                                <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                                                    <FileText size={18} className="mr-2 text-accent-blue"/> KI-Empfehlungen
                                                </h3>
                                                <div className="p-3 bg-card-bg rounded-lg border border-bg-darker">
                                                    <pre className="text-text-primary whitespace-pre-wrap">
                                                        {suggestions.rawResponse ? suggestions.rawResponse : JSON.stringify(suggestions, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'competitors' && (
                                    <CompetitorAnalysis apiUrl={apiBaseUrl}
                                                        mainSiteData={results}/>
                                )}

                                {activeTab === 'crawling' && (
                                    <AdvancedCrawling
                                        apiUrl={apiBaseUrl}
                                        onError={handleApiError}
                                        initialUrl={results?.url}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Content Feature */}
                {mainFeatureTab === 'content' && (
                    <ContentGenerator apiKey={apiKey} apiUrl={apiBaseUrl}
                                      onError={handleApiError}/>
                )}

                {/* Keywords Feature */}
                {mainFeatureTab === 'keywords' && (
                    <KeywordResearch apiKey={apiKey} apiUrl={apiBaseUrl} mainSiteData={results}
                                     onError={handleApiError}/>
                )}

                {/* Dashboard Feature */}
                {mainFeatureTab === 'dashboard' && (
                    <DashboardView websiteUrl={results?.url}/>
                )}
            </main>

            <footer className="bg-bg-darker text-text-secondary py-3 px-6">
                <div className="container mx-auto text-center text-sm">
                    <div className="flex justify-between items-center">
                        <div>Made with ❤️ by Martin Pfeffer</div>
                        <div className="flex items-center text-xs">
                            <span className="mr-4">Version 2.0</span>
                            <a href="#"
                               className="hover:underline mr-4 text-accent-blue">Impressum</a>
                            <a href="#" className="hover:underline text-accent-blue">Datenschutz</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;