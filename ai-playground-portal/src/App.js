import React, {useEffect, useState} from 'react';
import './App.css';
import {
    ChevronDown,
    ChevronRight,
    ExternalLink,
    FileText,
    Folder,
    Home,
    Menu,
    Moon,
    Search
} from 'lucide-react';

// TextScramble Effekt für Überschriften
const TextScramble = ({text}) => {
    const [displayText, setDisplayText] = useState('');
    const chars = '!<>-_\\/[]{}—=+*^?#________';

    useEffect(() => {
        let frame = 0;
        const frames = 20;
        const finalText = text;

        const updateText = () => {
            let output = '';
            const complete = Math.floor((frame / frames) * finalText.length);

            for (let i = 0; i < finalText.length; i++) {
                if (i <= complete) {
                    output += finalText[i];
                } else if (i === complete + 1) {
                    output += chars[Math.floor(Math.random() * chars.length)];
                } else {
                    output += '';
                }
            }

            setDisplayText(output);

            frame++;
            if (frame <= frames + finalText.length) {
                setTimeout(updateText, 30);
            }
        };

        updateText();
    }, [text]);

    return <span className="scrambling-text">{displayText}</span>;
};

// Dokument-Kategorie mit Vorschau-Komponente
const DocumentPreview = ({document}) => {
    return (
        <div className="document-preview">
            <div className="document-preview-header">
                <FileText size={18} className="preview-icon"/>
                <h3>{document.name}</h3>
            </div>
            <div className="document-preview-content">
                <p>{document.description}</p>
                <div className="document-meta">
                    <span className="document-category">{document.category}</span>
                    <span className="document-divider">•</span>
                    <span className="document-path">{document.path}</span>
                </div>
            </div>
        </div>
    );
};

// Breadcrumb-Navigation
const Breadcrumbs = ({items}) => {
    return (
        <div className="breadcrumbs">
            <Home size={14}/>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-item">{item}</span>
                </React.Fragment>
            ))}
        </div>
    );
};

// Dokumentenstruktur
const categoriesData = [
    {
        id: 'statistics',
        name: 'Statistiken',
        files: [
            {
                id: 'ai',
                name: 'KI in der Arbeitswelt',
                path: 'statistics/ai.html',
                description: 'Eine Analyse der kommenden Veränderungen durch Künstliche Intelligenz',
                category: 'Datenvisualisierung',
                tags: ['charts', 'statistik', 'visualisierung', 'ai']
            },
            {
                id: 'james-bond',
                name: 'James Bond Statistiken',
                path: 'statistics/james-bond-data.html',
                description: 'Visualisierung von Todesfällen in James Bond Filmen mit interaktiven Charts und Details zu allen 25 Filmen.',
                category: 'Datenvisualisierung',
                tags: ['charts', 'statistik', 'visualisierung', 'james bond']
            },
            {
                id: 'phonk-d',
                name: 'Phonk D Charts',
                path: 'statistics/phonk-d-charts.html',
                description: 'Analyse der musikalischen Entwicklung und Diskografie des Darmstädter Künstlers Phonk D.',
                category: 'Musikanalyse',
                tags: ['charts', 'musik', 'phonk d']
            },
            {
                id: 'sonnensystem',
                name: 'Sonnensystem',
                path: 'statistics/sonnensystem-visualisierung.html',
                description: 'Diese Visualisierung zeigt die Planeten unseres Sonnensystems mit ihren relativen Größen und Abständen zur Sonne.',
                category: 'Datenvisualisierung',
                tags: ['sonnensystem', 'statistik', 'planeten']
            },
            {
                id: 'os-distribution',
                name: 'OS Distribution',
                path: 'statistics/os-distribution.html',
                description: 'Marktanteile verschiedener Betriebssysteme im Desktop- und Mobile-Bereich von 2015 bis 2024.',
                category: 'Technologie',
                tags: ['betriebssysteme', 'charts', 'marktanalyse']
            },
            {
                id: 'war-report',
                name: 'Kriegsberichterstattung',
                path: 'statistics/war-report.html',
                description: 'Vergleichsanalyse der Kriegsberichterstattung zwischen öffentlich-rechtlichen und privaten Sendern.',
                category: 'Medienanalyse',
                tags: ['medien', 'analyse', 'vergleich']
            },
            {
                id: 'tech-report',
                name: 'Tech-Report',
                path: 'statistics/tech-report.html',
                description: 'Vergleichsanalyse der Technikberichterstattung in verschiedenen Medien mit interaktiven Visualisierungen.',
                category: 'Medienanalyse',
                tags: ['technologie', 'medien', 'analyse']
            }
        ]
    },
    {
        id: 'tech-demos',
        name: 'Tech Demos',
        files: [
            {
                id: 'ki-vergleich',
                name: 'KI-Vergleich',
                path: 'tech-demos/m5-cardputer-comparison.html',
                description: 'Vergleich von HTML-Implementierungen des M5 CardPuter durch verschiedene KI-Modelle.',
                category: 'Showcase',
                tags: ['ki', 'generierung', 'technik', 'simulation']
            },
            {
                id: 'mengenlehreuhr',
                name: 'Mengenlehreuhr',
                path: 'tech-demos/mengenlehreuhr.html',
                description: 'Eine interaktive Darstellung der berühmten Berliner Mengenlehreuhr mit Echtzeit-Simulation.',
                category: 'Interaktive Demo',
                tags: ['uhr', 'berlin', 'zeit', 'simulation']
            },
            {
                id: 'mandelbrot',
                name: 'Mandelbrot',
                path: 'tech-demos/mandelbrot.html',
                description: 'Erforsche die faszinierende Welt des Mandelbrot-Sets mit dieser interaktiven Visualisierung.',
                category: 'Mathematik',
                tags: ['fraktal', 'mathematik', 'visualisierung']
            },
            {
                id: 'story-code',
                name: 'Story Code',
                path: 'tech-demos/story-code.html',
                description: 'Eine ansprechende Animation zu den verschiedenen Skill-Sets moderner Entwickler.',
                category: 'Animation',
                tags: ['code', 'entwicklung', 'animation']
            },
            {
                id: 'material-transitions',
                name: 'Material Transitions',
                path: 'tech-demos/material-transitions.html',
                description: 'Moderne Material Design Transitionen und Animationseffekte für Webinterfaces.',
                category: 'UI/UX Demo',
                tags: ['material design', 'transitionen', 'animations', 'ui']
            }
        ]
    }
];

// Die Pfade für die Dokumente
const documentSources = {
    'ai': 'statistics/ai.html',
    'james-bond': 'statistics/james-bond-data.html',
    'phonk-d': 'statistics/phonk-d-charts.html',
    'os-distribution': 'statistics/os-distribution.html',
    'sonnensystem': 'statistics/sonnensystem-visualisierung.html',
    'war-report': 'statistics/war-report.html',
    'tech-report': 'statistics/tech-report.html',
    'ki-vergleich': 'tech-demos/m5-cardputer-comparison.html',
    'mengenlehreuhr': 'tech-demos/mengenlehreuhr.html',
    'mandelbrot': 'tech-demos/mandelbrot.html',
    'story-code': 'tech-demos/story-code.html',
    'material-transitions': 'tech-demos/material-transitions.html'
};

// Hauptkomponente
const AIPlaygroundPortal = () => {
    const [openFolders, setOpenFolders] = useState({});
    const [activeFile, setActiveFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [breadcrumbs, setBreadcrumbs] = useState(['AI-Playground']);
    const [showPreview, setShowPreview] = useState(true);
    const [iframeSrc, setIframeSrc] = useState('');
    const [darkMode, setDarkMode] = useState(true);

    // Ordner öffnen/schließen
    const toggleFolder = (folderId) => {
        setOpenFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

    // Datei auswählen und anzeigen
    const selectFile = (folder, file) => {
        setActiveFile(file);
        setBreadcrumbs([folder.name, file.name]);
        setShowPreview(false);

        // URL aktualisieren ohne Neuladen
        window.history.pushState(null, null, `?folder=${folder.id}&file=${file.id}`);

        // iframe-Quelle festlegen
        setIframeSrc(documentSources[file.id] || 'not-found.html');
    };

    // Zurück zur Vorschau
    const goToPreview = () => {
        setShowPreview(true);
        setActiveFile(null);
        setBreadcrumbs(['AI-Playground']);
        window.history.pushState(null, null, window.location.pathname);
        setIframeSrc('');
    };

    // Sidebar ein-/ausblenden
    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    // Dark/Light Mode umschalten
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    // Filterung der Dokumente nach Suchbegriff
    const getFilteredDocuments = () => {
        if (!searchTerm) return categoriesData;

        return categoriesData.map(folder => {
            const filteredFiles = folder.files.filter(file =>
                file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            return {
                ...folder,
                files: filteredFiles
            };
        }).filter(folder => folder.files.length > 0);
    };

    // Öffne in neuem Tab
    const openInNewTab = () => {
        if (activeFile) {
            window.open(documentSources[activeFile.id], '_blank');
        }
    };

    // Prüfen der URL-Parameter beim Laden
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const folderId = urlParams.get('folder');
        const fileId = urlParams.get('file');

        if (folderId && fileId) {
            const folder = categoriesData.find(f => f.id === folderId);
            if (folder) {
                setOpenFolders(prev => ({
                    ...prev,
                    [folderId]: true
                }));

                const file = folder.files.find(f => f.id === fileId);
                if (file) {
                    setActiveFile(file);
                    setBreadcrumbs([folder.name, file.name]);
                    setShowPreview(false);
                    setIframeSrc(documentSources[file.id] || 'not-found.html');
                }
            }
        } else {
            // Standard: ersten Ordner öffnen
            setOpenFolders(prev => ({
                ...prev,
                [categoriesData[0].id]: true
            }));
        }
    }, []);

    return (
        <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
            {/* Header-Bereich */}
            <header className="header">
                <div className="header-left">
                    <button className="toggle-sidebar" onClick={toggleSidebar}>
                        <Menu size={24}/>
                    </button>
                    <h1 className="site-title">AI-Playground <span
                        className="title-portal">Portal</span>
                    </h1>
                </div>
                <div className="header-right">
                    <button className="theme-button" onClick={toggleDarkMode}>
                        <Moon size={20}/>
                    </button>
                </div>
            </header>

            <div className="container">
                {/* Sidebar */}
                <aside className={`sidebar ${sidebarVisible ? 'visible' : 'hidden'}`}>
                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <Search size={18} className="search-icon"/>
                            <input
                                type="text"
                                placeholder="Suchen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <nav className="nav">
                        {getFilteredDocuments().map(folder => (
                            <div key={folder.id} className="nav-folder">
                                <div
                                    className="folder-header"
                                    onClick={() => toggleFolder(folder.id)}
                                >
                                    {openFolders[folder.id] ?
                                        <ChevronDown size={18} className="folder-icon"/> :
                                        <ChevronRight size={18} className="folder-icon"/>
                                    }
                                    <Folder size={18} className="folder-type-icon"/>
                                    <span className="folder-name">{folder.name}</span>
                                </div>

                                {openFolders[folder.id] && (
                                    <div className="folder-files">
                                        {folder.files.map(file => (
                                            <div
                                                key={file.id}
                                                className={`file-item ${activeFile && activeFile.id === file.id ? 'active' : ''}`}
                                                onClick={() => selectFile(folder, file)}
                                            >
                                                <FileText size={16} className="file-icon"/>
                                                <span className="file-name">{file.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Hauptinhalt */}
                <main className="main">
                    <div className="breadcrumb-container">
                        <Breadcrumbs items={breadcrumbs}/>
                    </div>

                    <div className="content-container">
                        {showPreview ? (
                            // Dokument-Vorschau
                            <div className="documents-preview">
                                <h2 className="preview-title">
                                    <TextScramble text="AI-Playground"/>
                                </h2>
                                <p className="preview-description">
                                    Wähle ein Dokument aus der Sidebar, um es anzuzeigen, oder
                                    durchsuche die verfügbaren Visualisierungen und Demos.
                                </p>

                                <div className="document-categories">
                                    {categoriesData.map(folder => (
                                        <div key={folder.id} className="category-section">
                                            <h3 className="category-title">
                                                <span className="category-icon-wrapper">
                                                    <Folder size={18} className="category-icon"/>
                                                </span>
                                                {folder.name}
                                            </h3>

                                            <div className="category-documents">
                                                {folder.files.map(file => (
                                                    <div
                                                        key={file.id}
                                                        className="document-item"
                                                        onClick={() => selectFile(folder, file)}
                                                    >
                                                        <DocumentPreview document={file}/>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Dokument-Ansicht im iframe
                            <div className="document-viewer">
                                <div className="document-actions">
                                    <button className="back-button" onClick={goToPreview}>
                                        Zurück zur Übersicht
                                    </button>
                                    <button className="external-link" onClick={openInNewTab}>
                                        <ExternalLink size={16}/>
                                        <span>In neuem Tab öffnen</span>
                                    </button>
                                </div>

                                <div className="document-frame-container">
                                    <iframe
                                        src={iframeSrc}
                                        className="document-frame"
                                        title={activeFile ? activeFile.name : 'Dokument'}
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        sandbox="allow-same-origin allow-scripts allow-forms"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <footer className="footer">
                <p>Made with ❤️ by Martin Pfeffer</p>
            </footer>
        </div>
    );
};

// App mit CSS Import
const App = () => {
    return <AIPlaygroundPortal/>;
};

export default App;