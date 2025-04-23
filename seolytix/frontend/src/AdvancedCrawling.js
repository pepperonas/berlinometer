// src/AdvancedCrawling.js - Komponente für benutzerdefinierte Crawling-Tiefe und erweiterte Website-Analyse
// Mit Dark Theme

import React, {useEffect, useState} from 'react';
import {
    AlertCircle,
    BarChart2,
    Check,
    Download,
    File,
    Layers,
    Link,
    Map,
    Plus,
    Search,
    Shuffle,
    Sliders,
    X
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const AdvancedCrawling = ({apiUrl, onError, initialUrl}) => {
    const [url, setUrl] = useState('');
    const [crawlOptions, setCrawlOptions] = useState({
        maxDepth: 2,
        maxUrls: 20,
        includeImages: true,
        includeExternalLinks: false,
        followRobotsTxt: true,
        onlyHtmlPages: true,
        excludeUrlPatterns: [],
        inclusionPaths: []
    });
    const [isCrawling, setIsCrawling] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [exclusionPattern, setExclusionPattern] = useState('');
    const [inclusionPath, setInclusionPath] = useState('');
    const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
    const [sitemap, setSitemap] = useState(null);

    useEffect(() => {
        // Setze die URL, wenn initialUrl vorhanden ist
        if (initialUrl) {
            setUrl(initialUrl);
        }
    }, [initialUrl]);

    // Crawling-Optionen aktualisieren
    const updateOption = (option, value) => {
        setCrawlOptions(prev => ({
            ...prev,
            [option]: value
        }));
    };

    // Ausschlussmuster hinzufügen
    const addExclusionPattern = () => {
        if (exclusionPattern && !crawlOptions.excludeUrlPatterns.includes(exclusionPattern)) {
            updateOption('excludeUrlPatterns', [...crawlOptions.excludeUrlPatterns, exclusionPattern]);
            setExclusionPattern('');
        }
    };

    // Ausschlussmuster entfernen
    const removeExclusionPattern = (pattern) => {
        updateOption('excludeUrlPatterns',
            crawlOptions.excludeUrlPatterns.filter(p => p !== pattern)
        );
    };

    // Inklusionspfad hinzufügen
    const addInclusionPath = () => {
        if (inclusionPath && !crawlOptions.inclusionPaths.includes(inclusionPath)) {
            updateOption('inclusionPaths', [...crawlOptions.inclusionPaths, inclusionPath]);
            setInclusionPath('');
        }
    };

    // Inklusionspfad entfernen
    const removeInclusionPath = (path) => {
        updateOption('inclusionPaths',
            crawlOptions.inclusionPaths.filter(p => p !== path)
        );
    };

    // Website crawlen
    const startCrawling = async () => {
        if (!url) {
            setError('Bitte gib eine URL ein');
            return;
        }

        setError('');
        setIsCrawling(true);
        setResults(null);
        setSitemap(null);

        // URL formatieren, falls noch kein Protokoll angegeben ist
        let formattedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            formattedUrl = 'https://' + url;
            setUrl(formattedUrl);
        }

        try {
            // URL-Format validieren
            new URL(formattedUrl);

            // Backend-API aufrufen
            const response = await fetch(`${apiUrl}/api/crawl/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: formattedUrl,
                    options: crawlOptions
                })
            });

            // Prüfe, ob die Antwort erfolgreich war (HTTP 200-299)
            if (!response.ok) {
                // Bei einem HTTP-Fehler versuchen wir den Fehlertext zu lesen
                let errorMessage;
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    // Wenn JSON zurückkommt, versuchen wir die Fehlermeldung zu extrahieren
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || `HTTP-Fehler: ${response.status}`;
                    } catch (e) {
                        errorMessage = `HTTP-Fehler: ${response.status}`;
                    }
                } else {
                    // Bei HTML oder anderen Formaten nur den Status-Code anzeigen
                    errorMessage = `HTTP-Fehler: ${response.status}`;
                }

                throw new Error(errorMessage);
            }

            // Versuche die JSON-Antwort zu parsen
            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Ungültiges Antwortformat vom Server (kein JSON)');
            }

            if (!data.success) {
                throw new Error(data.message || 'Fehler beim Crawling');
            }

            setResults(data.data);
            setActiveTab('overview');
        } catch (error) {
            console.error('Fehler beim Crawling:', error);
            let errorMessage;

            if (error.message === 'Failed to fetch') {
                errorMessage = 'Verbindung zum Server fehlgeschlagen. Bitte prüfe, ob der Backend-Server läuft.';
            } else if (error.message.includes('NetworkError') || error.message.includes('ECONNREFUSED')) {
                errorMessage = 'Netzwerkfehler: Server nicht erreichbar. Bitte prüfe deine Internetverbindung und den Backend-Server.';
            } else {
                errorMessage = `Fehler beim Crawling: ${error.message}`;
            }

            setError(errorMessage);

            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsCrawling(false);
        }
    };

    // Sitemap generieren
    const generateSitemap = async () => {
        if (!url) {
            setError('Bitte gib eine URL ein');
            return;
        }

        setError('');
        setIsGeneratingSitemap(true);

        // URL formatieren, falls noch kein Protokoll angegeben ist
        let formattedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            formattedUrl = 'https://' + url;
            setUrl(formattedUrl);
        }

        try {
            // URL-Format validieren
            new URL(formattedUrl);

            // Backend-API aufrufen
            const response = await fetch(`${apiUrl}/api/crawl/sitemap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: formattedUrl,
                    options: {
                        maxDepth: crawlOptions.maxDepth,
                        maxUrls: crawlOptions.maxUrls,
                        followRobotsTxt: crawlOptions.followRobotsTxt,
                        onlyHtmlPages: true
                    }
                })
            });

            // Prüfe, ob die Antwort erfolgreich war (HTTP 200-299)
            if (!response.ok) {
                // Bei einem HTTP-Fehler versuchen wir den Fehlertext zu lesen
                let errorMessage;
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    // Wenn JSON zurückkommt, versuchen wir die Fehlermeldung zu extrahieren
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || `HTTP-Fehler: ${response.status}`;
                    } catch (e) {
                        errorMessage = `HTTP-Fehler: ${response.status}`;
                    }
                } else {
                    // Bei HTML oder anderen Formaten nur den Status-Code anzeigen
                    errorMessage = `HTTP-Fehler: ${response.status}`;
                }

                throw new Error(errorMessage);
            }

            // Versuche die JSON-Antwort zu parsen
            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Ungültiges Antwortformat vom Server (kein JSON)');
            }

            if (!data.success) {
                throw new Error(data.message || 'Fehler bei der Sitemap-Generierung');
            }

            setSitemap(data.data);
        } catch (error) {
            console.error('Fehler bei der Sitemap-Generierung:', error);
            let errorMessage;

            if (error.message === 'Failed to fetch') {
                errorMessage = 'Verbindung zum Server fehlgeschlagen. Bitte prüfe, ob der Backend-Server läuft.';
            } else if (error.message.includes('NetworkError') || error.message.includes('ECONNREFUSED')) {
                errorMessage = 'Netzwerkfehler: Server nicht erreichbar. Bitte prüfe deine Internetverbindung und den Backend-Server.';
            } else {
                errorMessage = `Fehler bei der Sitemap-Generierung: ${error.message}`;
            }

            setError(errorMessage);

            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsGeneratingSitemap(false);
        }
    };

    // Sitemap herunterladen
    const downloadSitemap = () => {
        if (!sitemap) return;

        const element = document.createElement('a');
        const file = new Blob([sitemap.sitemap], {type: 'application/xml'});
        element.href = URL.createObjectURL(file);
        element.download = 'sitemap.xml';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Bestimmt die Farbe basierend auf dem Score
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-accent-green';
        if (score >= 60) return 'text-yellow-400';
        return 'text-accent-red';
    };

    // Formatiert ein Datum für die Anzeige
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Daten für Übersichtschart aufbereiten
    const prepareChartData = () => {
        if (!results || !results.crawledPages) return [];

        // Gruppieren nach Crawl-Tiefe
        const dataByDepth = {};

        results.crawledPages.forEach(page => {
            const depth = page.crawlDepth;
            if (!dataByDepth[depth]) {
                dataByDepth[depth] = {
                    depth: `Tiefe ${depth}`,
                    count: 0,
                    avgScore: 0,
                    totalScore: 0
                };
            }

            dataByDepth[depth].count += 1;
            dataByDepth[depth].totalScore += page.score || 0;
        });

        // Durchschnittliche Scores berechnen
        Object.values(dataByDepth).forEach(item => {
            item.avgScore = Math.round(item.totalScore / item.count);
        });

        return Object.values(dataByDepth);
    };

    // Chart-Farben für Dark Theme
    const chartColors = {
        bars: '#688db1',       // Accent-Blau
        scores: '#9cb68f',     // Accent-Grün
        grid: '#454855',       // Etwas heller als der Hintergrund
        text: '#d1d5db'        // Text-Primary
    };

    // Rendert die Übersichts-Tabelle
    const renderOverviewTab = () => {
        if (!results || !results.summary) return null;

        const {summary} = results;
        const chartData = prepareChartData();

        return (
            <div>
                <div className="mb-6 p-4 bg-bg-dark rounded-xl">
                    <h3 className="text-md font-semibold text-text-primary mb-4 flex items-center">
                        <BarChart2 size={18} className="mr-2 text-accent-blue"/> Crawling-Übersicht
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                            <div className="text-sm text-text-secondary">Gecrawlte Seiten</div>
                            <div
                                className="text-2xl font-bold text-text-primary">{summary.totalPages}</div>
                        </div>

                        <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                            <div className="text-sm text-text-secondary">Durchschnittlicher Score
                            </div>
                            <div
                                className={`text-2xl font-bold ${getScoreColor(summary.avgScore)}`}>
                                {summary.avgScore}/100
                            </div>
                        </div>

                        <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                            <div className="text-sm text-text-secondary">Fehler</div>
                            <div
                                className="text-2xl font-bold text-accent-red">{summary.totalErrors}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                            <div className="text-sm text-text-secondary mb-1">Crawling-Tiefe</div>
                            <div className="flex items-center">
                                <div
                                    className="text-xl font-bold text-text-primary">{summary.maxDepth}</div>
                                <div
                                    className="text-sm text-text-secondary ml-2">von {crawlOptions.maxDepth} konfiguriert
                                </div>
                            </div>
                        </div>

                        <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                            <div className="text-sm text-text-secondary mb-1">Crawling-Dauer</div>
                            <div
                                className="text-xl font-bold text-text-primary">{summary.duration.toFixed(2)} Sek.
                            </div>
                        </div>
                    </div>

                    {/* Seiten pro Tiefe Diagramm */}
                    <div className="h-60 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{top: 5, right: 30, left: 20, bottom: 5}}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid}/>
                                <XAxis dataKey="depth" stroke={chartColors.text}/>
                                <YAxis yAxisId="left" orientation="left" stroke={chartColors.bars}/>
                                <YAxis yAxisId="right" orientation="right"
                                       stroke={chartColors.scores}/>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#343845',
                                        borderColor: '#454855',
                                        color: '#d1d5db'
                                    }}
                                />
                                <Legend wrapperStyle={{color: chartColors.text}}/>
                                <Bar yAxisId="left" dataKey="count" name="Anzahl Seiten"
                                     fill={chartColors.bars}/>
                                <Bar yAxisId="right" dataKey="avgScore" name="Durchschn. Score"
                                     fill={chartColors.scores}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Probleme und Empfehlungen */}
                <div className="mb-6 p-4 bg-bg-dark rounded-xl">
                    <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center">
                        <AlertCircle size={18} className="mr-2 text-accent-blue"/> Gefundene
                        Probleme
                    </h3>

                    {/* Kritische Probleme */}
                    {summary.issues.critical.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-accent-red mb-2">Kritische
                                Probleme</h4>
                            <div className="space-y-2">
                                {summary.issues.critical.map((issue, index) => (
                                    <div
                                        key={index}
                                        className="p-2 border-l-4 border-accent-red bg-accent-red bg-opacity-10 rounded-r-lg"
                                    >
                                        <div
                                            className="text-sm font-medium text-text-primary">{issue.message}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Wichtige Probleme */}
                    {summary.issues.major.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-yellow-400 mb-2">Wichtige
                                Probleme</h4>
                            <div className="space-y-2">
                                {summary.issues.major.map((issue, index) => (
                                    <div
                                        key={index}
                                        className="p-2 border-l-4 border-yellow-400 bg-yellow-400 bg-opacity-10 rounded-r-lg"
                                    >
                                        <div
                                            className="text-sm font-medium text-text-primary">{issue.message}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Kleinere Probleme */}
                    {summary.issues.minor.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-accent-blue mb-2">Kleinere
                                Probleme</h4>
                            <div className="space-y-2">
                                {summary.issues.minor.map((issue, index) => (
                                    <div
                                        key={index}
                                        className="p-2 border-l-4 border-accent-blue bg-accent-blue bg-opacity-10 rounded-r-lg"
                                    >
                                        <div
                                            className="text-sm font-medium text-text-primary">{issue.message}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Keine Probleme gefunden */}
                    {summary.issues.critical.length === 0 &&
                        summary.issues.major.length === 0 &&
                        summary.issues.minor.length === 0 && (
                            <div className="p-4 text-center text-accent-green">
                                <Check size={32} className="mx-auto mb-2"/>
                                <p>Keine Probleme gefunden. Alles sieht gut aus!</p>
                            </div>
                        )}
                </div>
            </div>
        );
    };

    // Rendert den Pages-Tab
    const renderPagesTab = () => {
        if (!results || !results.crawledPages) return null;

        return (
            <div>
                <div className="mb-4 overflow-x-auto pr-1 custom-scrollbar">
                    <table className="min-w-full divide-y divide-bg-darker">
                        <thead className="bg-bg-darker">
                        <tr>
                            <th scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">URL
                            </th>
                            <th scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Tiefe
                            </th>
                            <th scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Score
                            </th>
                            <th scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Wörter
                            </th>
                            <th scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Links
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-card-bg divide-y divide-bg-darker">
                        {results.crawledPages.map((page, index) => (
                            <tr key={index}
                                className={page.error ? 'bg-accent-red bg-opacity-5' : index % 2 === 0 ? 'bg-card-bg' : 'bg-bg-dark'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                                    <div className="flex items-start">
                                        {page.error ? (
                                            <AlertCircle size={16}
                                                         className="text-accent-red mr-2 mt-1 flex-shrink-0"/>
                                        ) : (
                                            <File size={16}
                                                  className="text-text-secondary mr-2 mt-1 flex-shrink-0"/>
                                        )}
                                        <div className="truncate max-w-xs" title={page.url}>
                                            {page.url}
                                        </div>
                                    </div>
                                    {page.error && (
                                        <div
                                            className="text-xs text-accent-red mt-1">{page.error}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                                    {page.crawlDepth}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {page.error ? (
                                        <span className="text-accent-red">Fehler</span>
                                    ) : (
                                        <span
                                            className={getScoreColor(page.score)}>{page.score}/100</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                                    {page.wordCount || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                                    {!page.error && (
                                        <span>
                                            <span
                                                className="text-accent-blue">{page.internalLinksCount || 0}</span> /
                                            <span
                                                className="text-accent-green ml-1">{page.externalLinksCount || 0}</span>
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Rendert den Links-Tab
    const renderLinksTab = () => {
        if (!results || !results.crawledPages) return null;

        // Interne Links sammeln
        const internalLinks = [];
        const externalLinks = [];

        results.crawledPages.forEach(page => {
            if (page.internalLinks) {
                page.internalLinks.forEach(link => {
                    internalLinks.push({
                        from: page.url,
                        to: link.url,
                        text: link.text,
                        nofollow: link.nofollow
                    });
                });
            }

            if (page.externalLinks) {
                page.externalLinks.forEach(link => {
                    externalLinks.push({
                        from: page.url,
                        to: link.url,
                        text: link.text,
                        nofollow: link.nofollow
                    });
                });
            }
        });

        return (
            <div>
                <div className="mb-6 p-4 bg-bg-dark rounded-xl">
                    <h3 className="text-md font-semibold text-text-primary mb-2 flex items-center">
                        <Link size={18} className="mr-2 text-accent-blue"/> Link-Übersicht
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                            <div className="text-sm font-medium text-accent-blue mb-1">Interne
                                Links
                            </div>
                            <div
                                className="text-2xl font-bold text-text-primary">{internalLinks.length}</div>
                        </div>

                        <div className="bg-card-bg p-3 rounded-xl border border-bg-darker">
                            <div className="text-sm font-medium text-accent-green mb-1">Externe
                                Links
                            </div>
                            <div
                                className="text-2xl font-bold text-text-primary">{externalLinks.length}</div>
                        </div>
                    </div>
                </div>

                {/* Interne Links Tabelle */}
                <div className="mb-6">
                    <h3 className="text-md font-semibold text-text-primary mb-2 flex items-center">
                        <Shuffle size={18} className="mr-2 text-accent-blue"/> Interne Verlinkungen
                    </h3>

                    <div className="overflow-x-auto pr-1 custom-scrollbar">
                        <table className="min-w-full divide-y divide-bg-darker">
                            <thead className="bg-bg-darker">
                            <tr>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Von
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Zu
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Linktext
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nofollow
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-card-bg divide-y divide-bg-darker">
                            {internalLinks.slice(0, 10).map((link, index) => (
                                <tr key={index}
                                    className={index % 2 === 0 ? 'bg-card-bg' : 'bg-bg-dark'}>
                                    <td className="px-6 py-4 text-sm text-text-primary">
                                        <div className="truncate max-w-xs"
                                             title={link.from}>{link.from}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-primary">
                                        <div className="truncate max-w-xs"
                                             title={link.to}>{link.to}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-primary">
                                        <div className="truncate max-w-xs"
                                             title={link.text}>{link.text || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {link.nofollow ? (
                                            <span className="text-accent-red">Ja</span>
                                        ) : (
                                            <span className="text-accent-green">Nein</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {internalLinks.length > 10 && (
                        <div className="text-center mt-2 text-sm text-text-secondary">
                            Zeige 10 von {internalLinks.length} internen Links
                        </div>
                    )}
                </div>

                {/* Externe Links Tabelle */}
                <div>
                    <h3 className="text-md font-semibold text-text-primary mb-2 flex items-center">
                        <Link size={18} className="mr-2 text-accent-blue"/> Externe Verlinkungen
                    </h3>

                    <div className="overflow-x-auto pr-1 custom-scrollbar">
                        <table className="min-w-full divide-y divide-bg-darker">
                            <thead className="bg-bg-darker">
                            <tr>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Von
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Zu
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Linktext
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nofollow
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-card-bg divide-y divide-bg-darker">
                            {externalLinks.slice(0, 10).map((link, index) => (
                                <tr key={index}
                                    className={index % 2 === 0 ? 'bg-card-bg' : 'bg-bg-dark'}>
                                    <td className="px-6 py-4 text-sm text-text-primary">
                                        <div className="truncate max-w-xs"
                                             title={link.from}>{link.from}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-primary">
                                        <div className="truncate max-w-xs"
                                             title={link.to}>{link.to}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-primary">
                                        <div className="truncate max-w-xs"
                                             title={link.text}>{link.text || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {link.nofollow ? (
                                            <span className="text-accent-red">Ja</span>
                                        ) : (
                                            <span className="text-accent-green">Nein</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {externalLinks.length > 10 && (
                        <div className="text-center mt-2 text-sm text-text-secondary">
                            Zeige 10 von {externalLinks.length} externen Links
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Rendert den Sitemap-Tab
    const renderSitemapTab = () => {
        return (
            <div>
                {!sitemap ? (
                    <div className="text-center py-8">
                        <Map size={48} className="mx-auto mb-4 text-accent-blue opacity-70"/>
                        <h3 className="text-lg font-semibold mb-2 text-text-primary">XML-Sitemap
                            generieren</h3>
                        <p className="text-text-secondary mb-6 max-w-xl mx-auto">
                            Generiere eine XML-Sitemap basierend auf den gecrawlten Seiten.
                            Die Sitemap kann bei Suchmaschinen eingereicht werden, um die
                            Indexierung zu verbessern.
                        </p>

                        <button
                            onClick={generateSitemap}
                            disabled={isGeneratingSitemap || !results}
                            className={`px-6 py-3 bg-accent-blue text-white rounded-xl hover:bg-opacity-90 flex items-center mx-auto transition-all duration-300 ${(isGeneratingSitemap || !results) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isGeneratingSitemap ? (
                                <>Sitemap generieren<span
                                    className="ml-2 animate-pulse">...</span></>
                            ) : (
                                <>Sitemap generieren <Map size={18} className="ml-2"/></>
                            )}
                        </button>

                        {!results && (
                            <p className="text-sm text-yellow-400 mt-2">
                                Bitte führe zuerst ein Crawling durch.
                            </p>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-text-primary flex items-center">
                                <Map className="mr-2 text-accent-blue" size={20}/> Generierte
                                Sitemap
                            </h3>

                            <button
                                onClick={downloadSitemap}
                                className="px-4 py-2 bg-accent-blue text-white rounded-xl hover:bg-opacity-90 flex items-center transition-all duration-300"
                            >
                                Sitemap herunterladen <Download size={18} className="ml-2"/>
                            </button>
                        </div>

                        <div className="bg-bg-dark p-4 rounded-xl mb-4">
                            <div className="text-sm text-text-secondary mb-2">
                                <span
                                    className="font-medium text-text-primary">URLs in Sitemap:</span> {sitemap.stats.totalUrls}
                            </div>
                            {sitemap.stats.errors > 0 && (
                                <div className="text-sm text-accent-red mb-2">
                                    <span
                                        className="font-medium">Fehler:</span> {sitemap.stats.errors}
                                </div>
                            )}
                            <div className="text-sm text-text-secondary">
                                <span
                                    className="font-medium text-text-primary">Hinweis:</span> Reiche
                                diese Sitemap bei Google Search Console und anderen Suchmaschinen
                                ein.
                            </div>
                        </div>

                        <div className="bg-card-bg rounded-xl p-4 overflow-x-auto">
                            <pre
                                className="text-xs text-text-primary max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                                {sitemap.sitemap}
                            </pre>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => setSitemap(null)}
                                className="text-accent-blue hover:underline flex items-center transition-colors duration-300"
                            >
                                Sitemap neu generieren
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-text-primary flex items-center">
                <Layers className="mr-2 text-accent-blue" size={20}/> Erweiterte Website-Analyse
            </h2>

            <div className="bg-card-bg rounded-xl shadow-card p-6">
                <p className="text-text-secondary mb-4">
                    Analysiere deine Website mit anpassbarer Crawling-Tiefe und erhalte detaillierte
                    Einblicke.
                </p>

                {/* URL-Eingabe */}
                <div className="mb-6">
                    <div className="flex">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full p-3 pr-10 border border-bg-darker bg-bg-darker rounded-l-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-text-primary transition-all duration-300"
                            />
                            <div
                                className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-secondary">
                                <Link size={18}/>
                            </div>
                        </div>
                        <button
                            onClick={startCrawling}
                            disabled={isCrawling || !url.trim()}
                            className={`px-6 py-3 bg-accent-blue text-white rounded-r-xl hover:bg-opacity-90 flex items-center transition-all duration-300 ${(isCrawling || !url.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isCrawling ? (
                                <>Analysiere<span className="ml-2 animate-pulse">...</span></>
                            ) : (
                                <>Crawlen <Search size={18} className="ml-2"/></>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-2 text-accent-red text-sm flex items-center">
                            <AlertCircle size={16} className="mr-1"/> {error}
                        </div>
                    )}
                </div>

                {/* Crawling-Optionen */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-semibold text-text-primary flex items-center">
                            <Sliders size={18} className="mr-2 text-accent-blue"/> Crawling-Optionen
                        </h3>

                        <button
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                            className="text-sm text-accent-blue hover:underline transition-colors duration-300"
                        >
                            {showAdvancedOptions ? 'Erweiterte Optionen ausblenden' : 'Erweiterte Optionen einblenden'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">
                                Maximale Crawling-Tiefe
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={crawlOptions.maxDepth}
                                onChange={(e) => updateOption('maxDepth', parseInt(e.target.value))}
                                className="w-full h-2 bg-bg-darker rounded-xl appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-text-secondary mt-1">
                                <span>1</span>
                                <span>2</span>
                                <span>3</span>
                                <span>4</span>
                                <span>5</span>
                            </div>
                            <div className="text-center text-sm mt-1 text-text-secondary">
                                {crawlOptions.maxDepth} {crawlOptions.maxDepth === 1 ? 'Ebene' : 'Ebenen'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">
                                Maximale Anzahl URLs
                            </label>
                            <select
                                value={crawlOptions.maxUrls}
                                onChange={(e) => updateOption('maxUrls', parseInt(e.target.value))}
                                className="w-full p-3 border border-bg-darker bg-bg-darker rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-text-primary transition-all duration-300"
                            >
                                <option value="10">10 URLs</option>
                                <option value="20">20 URLs</option>
                                <option value="50">50 URLs</option>
                                <option value="100">100 URLs</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="includeImages"
                                checked={crawlOptions.includeImages}
                                onChange={(e) => updateOption('includeImages', e.target.checked)}
                                className="w-4 h-4 text-accent-blue border-bg-darker bg-bg-darker rounded focus:ring-accent-blue"
                            />
                            <label htmlFor="includeImages"
                                   className="ml-2 text-sm text-text-primary">
                                Bilder analysieren
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="includeExternalLinks"
                                checked={crawlOptions.includeExternalLinks}
                                onChange={(e) => updateOption('includeExternalLinks', e.target.checked)}
                                className="w-4 h-4 text-accent-blue border-bg-darker bg-bg-darker rounded focus:ring-accent-blue"
                            />
                            <label htmlFor="includeExternalLinks"
                                   className="ml-2 text-sm text-text-primary">
                                Externe Links crawlen
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="followRobotsTxt"
                                checked={crawlOptions.followRobotsTxt}
                                onChange={(e) => updateOption('followRobotsTxt', e.target.checked)}
                                className="w-4 h-4 text-accent-blue border-bg-darker bg-bg-darker rounded focus:ring-accent-blue"
                            />
                            <label htmlFor="followRobotsTxt"
                                   className="ml-2 text-sm text-text-primary">
                                robots.txt respektieren
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="onlyHtmlPages"
                                checked={crawlOptions.onlyHtmlPages}
                                onChange={(e) => updateOption('onlyHtmlPages', e.target.checked)}
                                className="w-4 h-4 text-accent-blue border-bg-darker bg-bg-darker rounded focus:ring-accent-blue"
                            />
                            <label htmlFor="onlyHtmlPages"
                                   className="ml-2 text-sm text-text-primary">
                                Nur HTML-Seiten
                            </label>
                        </div>
                    </div>

                    {/* Erweiterte Optionen */}
                    {showAdvancedOptions && (
                        <div className="bg-bg-dark p-4 rounded-xl">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    URL-Pfade ausschließen
                                </label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={exclusionPattern}
                                        onChange={(e) => setExclusionPattern(e.target.value)}
                                        placeholder="z.B. /admin/, /cart/, .pdf"
                                        className="flex-grow p-2 border border-bg-darker bg-bg-darker rounded-l-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-text-primary transition-all duration-300"
                                    />
                                    <button
                                        onClick={addExclusionPattern}
                                        disabled={!exclusionPattern.trim()}
                                        className={`px-3 py-2 bg-accent-blue text-white rounded-r-xl hover:bg-opacity-90 transition-all duration-300 ${!exclusionPattern.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Plus size={16}/>
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-2">
                                    {crawlOptions.excludeUrlPatterns.map((pattern, index) => (
                                        <div key={index}
                                             className="inline-flex items-center bg-card-bg rounded-full px-3 py-1 text-sm text-text-primary">
                                            <span>{pattern}</span>
                                            <button
                                                onClick={() => removeExclusionPattern(pattern)}
                                                className="ml-1 text-text-secondary hover:text-accent-red transition-colors duration-300"
                                            >
                                                <X size={14}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Bestimmte Pfade bevorzugt crawlen
                                </label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={inclusionPath}
                                        onChange={(e) => setInclusionPath(e.target.value)}
                                        placeholder="z.B. /blog/, /products/"
                                        className="flex-grow p-2 border border-bg-darker bg-bg-darker rounded-l-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-text-primary transition-all duration-300"
                                    />
                                    <button
                                        onClick={addInclusionPath}
                                        disabled={!inclusionPath.trim()}
                                        className={`px-3 py-2 bg-accent-blue text-white rounded-r-xl hover:bg-opacity-90 transition-all duration-300 ${!inclusionPath.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Plus size={16}/>
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-2">
                                    {crawlOptions.inclusionPaths.map((path, index) => (
                                        <div key={index}
                                             className="inline-flex items-center bg-card-bg rounded-full px-3 py-1 text-sm text-text-primary">
                                            <span>{path}</span>
                                            <button
                                                onClick={() => removeInclusionPath(path)}
                                                className="ml-1 text-text-secondary hover:text-accent-red transition-colors duration-300"
                                            >
                                                <X size={14}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isCrawling && (
                    <div className="text-center py-12">
                        <div
                            className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue mb-4"></div>
                        <p className="text-text-secondary">Website wird gecrawlt und
                            analysiert...</p>
                    </div>
                )}

                {results && !isCrawling && (
                    <div>
                        {/* Tabs */}
                        <div className="flex border-b border-bg-darker mb-6">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 font-medium text-sm mr-2 transition-colors duration-300 ${activeTab === 'overview' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                            >
                                Übersicht
                            </button>
                            <button
                                onClick={() => setActiveTab('pages')}
                                className={`px-4 py-2 font-medium text-sm mr-2 transition-colors duration-300 ${activeTab === 'pages' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                            >
                                Seiten
                            </button>
                            <button
                                onClick={() => setActiveTab('links')}
                                className={`px-4 py-2 font-medium text-sm mr-2 transition-colors duration-300 ${activeTab === 'links' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                            >
                                Links
                            </button>
                            <button
                                onClick={() => setActiveTab('sitemap')}
                                className={`px-4 py-2 font-medium text-sm transition-colors duration-300 ${activeTab === 'sitemap' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-accent-blue'}`}
                            >
                                Sitemap
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'overview' && renderOverviewTab()}
                        {activeTab === 'pages' && renderPagesTab()}
                        {activeTab === 'links' && renderLinksTab()}
                        {activeTab === 'sitemap' && renderSitemapTab()}

                        {/* Neue Analyse Button */}
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => {
                                    setResults(null);
                                    setSitemap(null);
                                }}
                                className="px-4 py-2 text-text-primary border border-text-secondary rounded-xl hover:bg-bg-dark transition-all duration-300"
                            >
                                Neue Analyse
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedCrawling;