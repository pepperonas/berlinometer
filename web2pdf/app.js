const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');

const app = express();
const PORT = process.env.PORT || 5081;

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Serve static files (favicon, images, apple-touch-icon)
app.use(express.static(__dirname));

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// Clean old files (older than 1 hour)
setInterval(() => {
    const files = fs.readdirSync(downloadsDir);
    const now = Date.now();

    files.forEach(file => {
        const filePath = path.join(downloadsDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > 3600000) { // 1 hour
            fs.unlinkSync(filePath);
        }
    });
}, 300000); // Check every 5 minutes

// Main route - serve the HTML
app.get('/', (req, res) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web2PDF - Website zu PDF Converter</title>
    <meta name="description" content="Konvertieren Sie Webseiten in hochwertige PDF-Dateien. Mit erweiterten Optionen für Layout, Ränder und Inhaltsfilterung. Kostenlos und einfach zu bedienen.">
    <meta property="og:title" content="Web2PDF - Website zu PDF Converter">
    <meta property="og:description" content="Konvertieren Sie Webseiten in hochwertige PDF-Dateien mit erweiterten Anpassungsoptionen.">
    <meta property="og:image" content="https://mrx3k1.de/web2pdf/web2pdf.jpg">
    <meta property="og:type" content="website">
    <link rel="icon" type="image/x-icon" href="https://mrx3k1.de/web2pdf/favicon.ico">
    <link rel="apple-touch-icon" href="apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://mrx3k1.de/web2pdf/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://mrx3k1.de/web2pdf/favicon-16x16.png">
    <style>
        :root {
            /* Farben */
            --background-dark: #2B2E3B;
            --background-darker: #252830;
            --card-background: #343845;
            --accent-blue: #688db1;
            --accent-green: #9cb68f;
            --accent-red: #e16162;
            --text-primary: #d1d5db;
            --text-secondary: #9ca3af;
            
            /* Schatten */
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
            
            /* Abstände */
            --spacing-1: 0.25rem;
            --spacing-2: 0.5rem;
            --spacing-3: 0.75rem;
            --spacing-4: 1rem;
            --spacing-6: 1.5rem;
            --spacing-8: 2rem;
            --spacing-12: 3rem;
            --spacing-16: 4rem;
            
            /* Rundungen */
            --radius-sm: 0.375rem;
            --radius: 0.5rem;
            --radius-lg: 1rem;
            --radius-xl: 1.5rem;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                        sans-serif;
            background: var(--background-darker);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-4);
        }

        .container {
            background: var(--card-background);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            padding: var(--spacing-8);
            width: 100%;
            max-width: 800px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            margin-bottom: auto;
        }

        h1 {
            text-align: center;
            margin-bottom: var(--spacing-8);
            font-size: 2.5rem;
            color: var(--text-primary);
            font-weight: 700;
        }

        .form-group {
            margin-bottom: var(--spacing-6);
        }

        label {
            display: block;
            margin-bottom: var(--spacing-2);
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.875rem;
        }

        input[type="url"], input[type="number"], select, textarea, input[type="text"] {
            width: 100%;
            padding: var(--spacing-3) var(--spacing-4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: var(--radius);
            background: var(--background-darker);
            color: var(--text-primary);
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        input[type="url"]:focus, input[type="number"]:focus, select:focus, textarea:focus, input[type="text"]:focus {
            outline: none;
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 3px rgba(104, 141, 177, 0.2);
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .form-row-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: var(--spacing-3);
            margin-top: var(--spacing-3);
        }

        input[type="checkbox"] {
            width: 20px;
            height: 20px;
            accent-color: var(--accent-blue);
            cursor: pointer;
        }

        .advanced-section {
            background: var(--background-darker);
            border-radius: var(--radius);
            padding: var(--spacing-6);
            margin-top: var(--spacing-6);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .section-title {
            font-size: 1.2rem;
            margin-bottom: var(--spacing-4);
            color: var(--accent-blue);
            border-bottom: 1px solid rgba(104, 141, 177, 0.3);
            padding-bottom: var(--spacing-2);
        }

        textarea {
            resize: vertical;
            min-height: 80px;
            font-family: 'Courier New', monospace;
        }

        .btn {
            background: var(--accent-blue);
            color: white;
            padding: var(--spacing-4) var(--spacing-8);
            border: none;
            border-radius: var(--radius);
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            width: 100%;
            margin-top: var(--spacing-6);
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
            background: #5a7d9d;
        }

        .btn:active {
            transform: translateY(0);
        }

        .btn:disabled {
            background: var(--text-secondary);
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
            opacity: 0.5;
        }

        .progress {
            display: none;
            margin-top: 20px;
            text-align: center;
        }

        .spinner {
            border: 3px solid rgba(104, 141, 177, 0.3);
            border-top: 3px solid var(--accent-blue);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto var(--spacing-3);
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .result {
            margin-top: var(--spacing-6);
            padding: var(--spacing-4);
            border-radius: var(--radius);
            text-align: center;
            display: none;
        }

        .success {
            background: rgba(156, 182, 143, 0.2);
            border: 1px solid var(--accent-green);
            color: var(--accent-green);
        }

        .error {
            background: rgba(225, 97, 98, 0.2);
            border: 1px solid var(--accent-red);
            color: var(--accent-red);
        }

        .download-btn {
            background: var(--accent-green);
            margin-top: var(--spacing-3);
            padding: var(--spacing-3) var(--spacing-6);
            font-size: 0.875rem;
        }

        .download-btn:hover {
            background: #8ba77f;
            box-shadow: var(--shadow-lg);
        }

        #hideElementsList {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 10px;
        }

        .hide-element-item {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .hide-element-selector {
            flex: 1;
        }

        .remove-element-btn {
            background: rgba(225, 97, 98, 0.2);
            border: 1px solid var(--accent-red);
            color: var(--accent-red);
            width: 32px;
            height: 32px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .remove-element-btn:hover {
            background: rgba(225, 97, 98, 0.3);
        }

        .add-element-btn {
            background: rgba(104, 141, 177, 0.2);
            border: 1px solid var(--accent-blue);
            color: var(--accent-blue);
            padding: var(--spacing-2) var(--spacing-4);
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.3s ease;
        }

        .add-element-btn:hover {
            background: rgba(104, 141, 177, 0.3);
        }
        
        .footer {
            margin-top: auto;
            padding: var(--spacing-4) 0;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
        
        .footer a {
            color: var(--accent-blue);
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .footer a:hover {
            color: var(--text-primary);
        }
        
        .suggestion-chip {
            background: rgba(104, 141, 177, 0.2);
            border: 1px solid var(--accent-blue);
            color: var(--accent-blue);
            padding: var(--spacing-1) var(--spacing-3);
            border-radius: var(--radius-xl);
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-1);
        }
        
        .suggestion-chip:hover {
            background: rgba(104, 141, 177, 0.3);
            transform: translateY(-1px);
        }
        
        .suggestion-chip.added {
            background: rgba(156, 182, 143, 0.2);
            border-color: var(--accent-green);
            color: var(--accent-green);
        }

        @media (max-width: 768px) {
            .container {
                padding: var(--spacing-6);
                margin: var(--spacing-4);
            }

            .form-row, .form-row-3 {
                grid-template-columns: 1fr;
            }

            h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Website zu PDF Converter</h1>
        
        <form id="pdfForm">
            <div class="form-group">
                <label for="url">Website URL:</label>
                <input type="url" id="url" required placeholder="https://example.com">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="format">Format:</label>
                    <select id="format">
                        <option value="A4">A4</option>
                        <option value="A3">A3</option>
                        <option value="A5">A5</option>
                        <option value="Letter">Letter</option>
                        <option value="Legal">Legal</option>
                        <option value="Ledger">Ledger</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="orientation">Orientierung:</label>
                    <select id="orientation">
                        <option value="portrait">Hochformat</option>
                        <option value="landscape">Querformat</option>
                    </select>
                </div>
            </div>

            <div class="form-row-3">
                <div class="form-group">
                    <label for="scale">Skalierung:</label>
                    <input type="number" id="scale" min="0.1" max="2" step="0.1" value="1">
                </div>

                <div class="form-group">
                    <label for="timeout">Timeout (s):</label>
                    <input type="number" id="timeout" min="5" max="60" value="30">
                </div>

                <div class="form-group">
                    <label for="quality">Qualität:</label>
                    <select id="quality">
                        <option value="high">Hoch</option>
                        <option value="medium">Mittel</option>
                        <option value="low">Niedrig</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="marginTop">Rand Oben (mm):</label>
                    <input type="number" id="marginTop" min="0" value="20">
                </div>

                <div class="form-group">
                    <label for="marginBottom">Rand Unten (mm):</label>
                    <input type="number" id="marginBottom" min="0" value="20">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="marginLeft">Rand Links (mm):</label>
                    <input type="number" id="marginLeft" min="0" value="20">
                </div>

                <div class="form-group">
                    <label for="marginRight">Rand Rechts (mm):</label>
                    <input type="number" id="marginRight" min="0" value="20">
                </div>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="noMargins">
                <label for="noMargins">Keine Ränder</label>
            </div>
            
            <div class="checkbox-group">
                <input type="checkbox" id="printBackground" checked>
                <label for="printBackground">Hintergrundbilder drucken</label>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="displayHeaderFooter">
                <label for="displayHeaderFooter">Kopf-/Fußzeile anzeigen</label>
            </div>

            <div class="advanced-section">
                <div class="section-title">Erweiterte Einstellungen</div>
                
                <div class="form-group">
                    <label for="headerTemplate">Kopfzeile Template (HTML):</label>
                    <textarea id="headerTemplate" placeholder="<div style='font-size:10px; text-align:center; width:100%;'>Meine Kopfzeile</div>"></textarea>
                </div>

                <div class="form-group">
                    <label for="footerTemplate">Fußzeile Template (HTML):</label>
                    <textarea id="footerTemplate" placeholder="<div style='font-size:10px; text-align:center; width:100%;'>Seite <span class='pageNumber'></span> von <span class='totalPages'></span></div>"></textarea>
                </div>

                <div class="form-group">
                    <label for="customCSS">Zusätzliches CSS:</label>
                    <textarea id="customCSS" placeholder="body { font-size: 14px; }"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="waitForSelector">Warten auf Element:</label>
                        <input type="text" id="waitForSelector" placeholder=".content, #main">
                    </div>

                    <div class="form-group">
                        <label for="waitForTimeout">Wartezeit (ms):</label>
                        <input type="number" id="waitForTimeout" min="0" max="10000" value="0">
                    </div>
                </div>

                <div class="form-group">
                    <label>DOM Elemente ausblenden:</label>
                    <div id="elementSuggestions" style="display: none; margin-bottom: 1rem;">
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                            💡 Vorschläge basierend auf der URL:
                        </p>
                        <div id="suggestionsList" style="display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
                    </div>
                    <div id="hideElementsList">
                        <div class="hide-element-item">
                            <input type="text" class="hide-element-selector" placeholder="z.B. .back-to-top, class=nav-links, #cookie-banner">
                            <button type="button" class="remove-element-btn" onclick="removeHideElement(this)">✕</button>
                        </div>
                    </div>
                    <button type="button" class="add-element-btn" onclick="addHideElement()">+ Element hinzufügen</button>
                </div>
            </div>

            <button type="submit" class="btn" id="convertBtn">PDF Erstellen</button>
        </form>

        <div class="progress" id="progress">
            <div class="spinner"></div>
            <div>PDF wird erstellt...</div>
        </div>

        <div class="result" id="result"></div>
    </div>
    
    <footer class="footer">
        Made with ❤️ by <a href="https://mrx3k1.de" target="_blank">Martin Pfeffer</a>
    </footer>

    <script src="./static/app.js"></script>
</body>
</html>`;
    res.send(htmlContent);
});

// Serve JavaScript file separately
app.get('/static/app.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
// Common selectors for different types of websites
const commonSelectors = {
    'navigation': ['nav', '.navbar', '.navigation', '#navigation', '.header-nav', '.main-nav'],
    'footer': ['footer', '.footer', '#footer', '.site-footer'],
    'cookie': ['.cookie-banner', '#cookie-banner', '.cookie-notice', '.gdpr-notice', '.cookie-consent'],
    'social': ['.social-links', '.social-media', '.share-buttons', '.social-icons'],
    'ads': ['.ads', '.advertisement', '.banner-ad', '.google-ads', '[class*=ad-]'],
    'popup': ['.popup', '.modal', '.overlay', '[class*=popup]'],
    'chat': ['.chat-widget', '.intercom', '.crisp-client', '.tawk-widget', '#tidio-chat'],
    'floating': ['.back-to-top', '.scroll-to-top', '.fab', '.floating-button', '[class*=float]'],
    'sidebar': ['.sidebar', '#sidebar', '.side-panel', '.aside'],
    'comments': ['.comments', '#comments', '.disqus', '.comment-section']
};

// URL-specific suggestions
function getSuggestionsForURL(url) {
    const suggestions = [];
    
    // Add common elements
    suggestions.push({ selector: 'nav', description: 'Navigation' });
    suggestions.push({ selector: 'footer', description: 'Footer' });
    suggestions.push({ selector: '.back-to-top', description: 'Scroll-Button' });
    
    // Check URL patterns
    if (url.includes('github.com')) {
        suggestions.push({ selector: '.Header', description: 'GitHub Header' });
        suggestions.push({ selector: '.footer', description: 'GitHub Footer' });
        suggestions.push({ selector: '.js-header-wrapper', description: 'Navigation' });
    } else if (url.includes('wikipedia.org')) {
        suggestions.push({ selector: '#mw-navigation', description: 'Wiki Navigation' });
        suggestions.push({ selector: '.mw-footer', description: 'Wiki Footer' });
        suggestions.push({ selector: '#p-personal', description: 'User Tools' });
    } else if (url.includes('stackoverflow.com')) {
        suggestions.push({ selector: '.top-bar', description: 'Top Bar' });
        suggestions.push({ selector: '#sidebar', description: 'Sidebar' });
        suggestions.push({ selector: '.js-consent-banner', description: 'Cookie Banner' });
    }
    
    // Add cookie banners (common on most sites)
    suggestions.push({ selector: '[class*=cookie]', description: 'Cookie Banner' });
    suggestions.push({ selector: '[class*=consent]', description: 'Consent Dialog' });
    
    return suggestions;
}

// Update suggestions when URL changes
document.getElementById('url').addEventListener('input', function(e) {
    const url = e.target.value;
    if (url.length > 10) {
        updateSuggestions(url);
    }
});

function updateSuggestions(url) {
    const suggestionsContainer = document.getElementById('elementSuggestions');
    const suggestionsList = document.getElementById('suggestionsList');
    
    // Clear existing suggestions
    suggestionsList.innerHTML = '';
    
    // Get suggestions for URL
    const suggestions = getSuggestionsForURL(url);
    
    if (suggestions.length > 0) {
        suggestionsContainer.style.display = 'block';
        
        suggestions.forEach(suggestion => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'suggestion-chip';
            
            const span = document.createElement('span');
            span.textContent = suggestion.selector;
            chip.appendChild(span);
            
            const small = document.createElement('small');
            small.textContent = ' (' + suggestion.description + ')';
            chip.appendChild(small);
            
            chip.onclick = function() {
                addSelectorFromSuggestion(suggestion.selector);
                chip.classList.add('added');
            };
            suggestionsList.appendChild(chip);
        });
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

function addSelectorFromSuggestion(selector) {
    // Check if selector already exists
    const existingSelectors = Array.from(document.querySelectorAll('.hide-element-selector'))
        .map(input => input.value.trim())
        .filter(val => val.length > 0);
    
    if (!existingSelectors.includes(selector)) {
        // Find first empty input or add new one
        let emptyInput = Array.from(document.querySelectorAll('.hide-element-selector'))
            .find(input => input.value.trim() === '');
        
        if (!emptyInput) {
            addHideElement();
            emptyInput = Array.from(document.querySelectorAll('.hide-element-selector')).pop();
        }
        
        emptyInput.value = selector;
        emptyInput.focus();
    }
}

// Handle no margins checkbox
document.getElementById('noMargins').addEventListener('change', function(e) {
    const marginInputs = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'];
    if (e.target.checked) {
        marginInputs.forEach(id => {
            document.getElementById(id).value = 0;
            document.getElementById(id).disabled = true;
        });
    } else {
        marginInputs.forEach(id => {
            document.getElementById(id).value = 20;
            document.getElementById(id).disabled = false;
        });
    }
});

function addHideElement() {
    const list = document.getElementById('hideElementsList');
    const newItem = document.createElement('div');
    newItem.className = 'hide-element-item';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'hide-element-selector';
    input.placeholder = 'z.B. .back-to-top, class=nav-links, #cookie-banner';
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'remove-element-btn';
    button.textContent = '✕';
    button.onclick = function() { removeHideElement(this); };
    
    newItem.appendChild(input);
    newItem.appendChild(button);
    list.appendChild(newItem);
}

function removeHideElement(button) {
    button.closest('.hide-element-item').remove();
}

document.getElementById('pdfForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const convertBtn = document.getElementById('convertBtn');
    const progress = document.getElementById('progress');
    const result = document.getElementById('result');
    
    // UI Updates
    convertBtn.disabled = true;
    progress.style.display = 'block';
    result.style.display = 'none';
    
    // Collect form data
    const hideElementInputs = document.querySelectorAll('.hide-element-selector');
    const hideElements = [];
    for (let i = 0; i < hideElementInputs.length; i++) {
        const value = hideElementInputs[i].value.trim();
        if (value.length > 0) {
            hideElements.push(value);
        }
    }

    const formData = {
        url: document.getElementById('url').value,
        format: document.getElementById('format').value,
        orientation: document.getElementById('orientation').value,
        scale: parseFloat(document.getElementById('scale').value),
        timeout: parseInt(document.getElementById('timeout').value) * 1000,
        quality: document.getElementById('quality').value,
        margin: {
            top: document.getElementById('marginTop').value + 'mm',
            bottom: document.getElementById('marginBottom').value + 'mm',
            left: document.getElementById('marginLeft').value + 'mm',
            right: document.getElementById('marginRight').value + 'mm'
        },
        printBackground: document.getElementById('printBackground').checked,
        displayHeaderFooter: document.getElementById('displayHeaderFooter').checked,
        headerTemplate: document.getElementById('headerTemplate').value,
        footerTemplate: document.getElementById('footerTemplate').value,
        customCSS: document.getElementById('customCSS').value,
        waitForSelector: document.getElementById('waitForSelector').value,
        waitForTimeout: parseInt(document.getElementById('waitForTimeout').value),
        hideElements: hideElements
    };
    
    try {
        const response = await fetch('./convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            result.className = 'result success';
            result.innerHTML = '';
            
            const successDiv = document.createElement('div');
            successDiv.textContent = 'PDF erfolgreich erstellt!';
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn download-btn';
            downloadBtn.textContent = 'Download PDF';
            downloadBtn.onclick = function() { downloadFile(data.filename); };
            
            result.appendChild(successDiv);
            result.appendChild(downloadBtn);
        } else {
            throw new Error(data.error || 'Unbekannter Fehler');
        }
    } catch (error) {
        result.className = 'result error';
        result.innerHTML = '';
        
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Fehler: ' + error.message;
        result.appendChild(errorDiv);
    } finally {
        convertBtn.disabled = false;
        progress.style.display = 'none';
        result.style.display = 'block';
    }
});

function downloadFile(filename) {
    window.open('./download/' + filename, '_blank');
}
`);
});

// Convert endpoint
app.post('/convert', async (req, res) => {
    try {
        const {
            url,
            format = 'A4',
            orientation = 'portrait',
            scale = 1,
            timeout = 30000,
            quality = 'high',
            margin = {top: '20mm', bottom: '20mm', left: '20mm', right: '20mm'},
            printBackground = true,
            displayHeaderFooter = false,
            headerTemplate = '',
            footerTemplate = '',
            customCSS = '',
            waitForSelector = '',
            waitForTimeout = 0,
            hideElements = []
        } = req.body;

        if (!url) {
            return res.status(400).json({error: 'URL ist erforderlich'});
        }

        // Launch browser with maximum timeouts and minimal features
        const browser = await puppeteer.launch({
            headless: 'new',
            protocolTimeout: 300000, // 5 minutes timeout 
            timeout: 120000, // 2 minutes browser launch timeout
            slowMo: 100, // Add small delay between operations
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-web-security',
                '--font-render-hinting=none',
                '--enable-font-antialiasing',
                '--force-color-profile=srgb',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-extensions',
                '--disable-plugins',
                '--memory-pressure-off',
                '--max_old_space_size=4096',
                '--disable-logging',
                '--disable-background-networking'
            ]
        });

        const page = await browser.newPage();
        
        // Set maximum timeouts for page operations
        page.setDefaultTimeout(180000); // 3 minutes
        page.setDefaultNavigationTimeout(180000); // 3 minutes

        // Set viewport based on quality
        const viewportConfig = {
            high: {width: 1920, height: 1080, deviceScaleFactor: 2},
            medium: {width: 1366, height: 768, deviceScaleFactor: 1.5},
            low: {width: 1024, height: 768, deviceScaleFactor: 1}
        };

        await page.setViewport(viewportConfig[quality]);

        // Navigate to page
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: timeout
        });

        // Add Twemoji script to convert emojis to SVG images
        await page.addScriptTag({
            url: 'https://unpkg.com/twemoji@latest/dist/twemoji.min.js'
        });
        
        // Convert all emojis to SVG images using Twemoji - more aggressive approach
        await page.evaluate(() => {
            if (typeof twemoji !== 'undefined') {
                console.log('Twemoji is available, starting emoji conversion...');
                
                // Function to recursively find and convert all emojis
                function convertEmojisRecursively(element) {
                    // Convert emojis in the current element
                    twemoji.parse(element, {
                        folder: 'svg',
                        ext: '.svg',
                        callback: function(icon, options, variant) {
                            console.log('Converting emoji:', icon);
                            return 'https://unpkg.com/twemoji@latest/assets/svg/' + icon + '.svg';
                        }
                    });
                    
                    // Process all child elements
                    const children = element.children;
                    for (let i = 0; i < children.length; i++) {
                        convertEmojisRecursively(children[i]);
                    }
                }
                
                // Start recursive conversion from body
                convertEmojisRecursively(document.body);
                
                // Also try direct text node processing
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                const textNodes = [];
                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.trim()) {
                        textNodes.push(node);
                    }
                }
                
                textNodes.forEach(textNode => {
                    if (textNode.parentElement) {
                        twemoji.parse(textNode.parentElement, {
                            folder: 'svg',
                            ext: '.svg',
                            callback: function(icon, options, variant) {
                                console.log('Converting emoji from text node:', icon);
                                return 'https://unpkg.com/twemoji@latest/assets/svg/' + icon + '.svg';
                            }
                        });
                    }
                });
                
                console.log('Emoji conversion completed');
            } else {
                console.log('Twemoji not available');
            }
        });
        
        // Add custom CSS for emoji support and any user CSS
        const emojiCSS = `
            @import url('https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap');
            * {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif !important;
            }
            img.emoji {
                height: 1.2em !important;
                width: 1.2em !important;
                margin: 0 .05em 0 .1em !important;
                vertical-align: -0.1em !important;
                display: inline-block !important;
                min-height: 16px !important;
                min-width: 16px !important;
                max-height: 64px !important;
                max-width: 64px !important;
                object-fit: contain !important;
                border: none !important;
                background: none !important;
            }
            
            .profile-icon img.emoji {
                height: 2em !important;
                width: 2em !important;
                min-height: 32px !important;
                min-width: 32px !important;
            }
        `;
        await page.addStyleTag({content: emojiCSS});
        
        // Wait for fonts and images to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Force another round of emoji conversion after everything has loaded
        await page.evaluate(() => {
            if (typeof twemoji !== 'undefined') {
                console.log('Final emoji conversion round...');
                // One more aggressive parse of the entire document
                twemoji.parse(document.body, {
                    folder: 'svg',
                    ext: '.svg',
                    size: 'svg',
                    callback: function(icon, options, variant) {
                        console.log('Final conversion of emoji:', icon);
                        return 'https://unpkg.com/twemoji@latest/assets/svg/' + icon + '.svg';
                    }
                });
            }
        });
        
        // Add custom CSS if provided
        if (customCSS) {
            await page.addStyleTag({content: customCSS});
        }

        // Wait for specific selector if provided
        if (waitForSelector) {
            await page.waitForSelector(waitForSelector, {timeout: timeout});
        }

        // Additional wait time if specified
        if (waitForTimeout > 0) {
            await new Promise(resolve => setTimeout(resolve, waitForTimeout));
        }

        // Convert emojis BEFORE hiding elements to ensure they are processed first
        await page.evaluate(() => {
            if (typeof twemoji !== 'undefined') {
                console.log('Pre-hide emoji conversion...');
                // Force conversion before any elements are hidden
                twemoji.parse(document.body, {
                    folder: 'svg',
                    ext: '.svg',
                    callback: function(icon, options, variant) {
                        console.log('Pre-hide converting emoji:', icon);
                        return 'https://unpkg.com/twemoji@latest/assets/svg/' + icon + '.svg';
                    }
                });
            }
        });

        // Hide specified DOM elements
        if (hideElements && hideElements.length > 0) {
            await page.evaluate((selectors) => {
                selectors.forEach(selector => {
                    try {
                        // Check if selector is a class attribute like class="className"
                        const classMatch = selector.match(/^class\\s*=\\s*[\"'](.+?)[\"']$/);

                        if (classMatch) {
                            // Extract class name and hide elements with this exact class
                            const className = classMatch[1];
                            const elements = document.querySelectorAll('[class="' + className + '"]');
                            elements.forEach(el => {
                                el.style.display = 'none';
                            });
                        } else {
                            // Use as regular CSS selector
                            const elements = document.querySelectorAll(selector);
                            elements.forEach(el => {
                                el.style.display = 'none';
                            });
                        }
                    } catch (e) {
                        console.error('Failed to hide elements with selector: ' + selector, e);
                    }
                });
            }, hideElements);
        }
        
        // Convert emojis AFTER hiding elements as well to catch any that were missed
        await page.evaluate(() => {
            if (typeof twemoji !== 'undefined') {
                console.log('Post-hide emoji conversion...');
                // Convert any remaining emojis after elements are hidden
                twemoji.parse(document.body, {
                    folder: 'svg',
                    ext: '.svg',
                    callback: function(icon, options, variant) {
                        console.log('Post-hide converting emoji:', icon);
                        return 'https://unpkg.com/twemoji@latest/assets/svg/' + icon + '.svg';
                    }
                });
            }
        });

        // Generate filename based on URL
        let urlObj;
        try {
            urlObj = new URL(url);
        } catch (e) {
            urlObj = {hostname: 'unknown', pathname: '/'};
        }

        // Create a clean filename from the URL
        const domain = urlObj.hostname.replace(/^www\\./, '');
        const pathPart = urlObj.pathname.replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        const timestamp = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
        const filename = domain + pathPart + '_' + timestamp + '.pdf';
        const filepath = path.join(downloadsDir, filename);

        // PDF options
        const pdfOptions = {
            path: filepath,
            format: format,
            landscape: orientation === 'landscape',
            scale: scale,
            margin: margin,
            printBackground: printBackground,
            displayHeaderFooter: displayHeaderFooter
        };

        // Add header/footer templates if provided
        if (displayHeaderFooter) {
            if (headerTemplate) pdfOptions.headerTemplate = headerTemplate;
            if (footerTemplate) pdfOptions.footerTemplate = footerTemplate;
        }

        // Generate PDF
        await page.pdf(pdfOptions);
        await browser.close();

        res.json({
            success: true,
            filename: filename,
            message: 'PDF erfolgreich erstellt'
        });

    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({
            error: error.message || 'Fehler bei der PDF-Erstellung'
        });
    }
});

// Download endpoint
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(downloadsDir, filename);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({error: 'Datei nicht gefunden'});
    }

    res.download(filepath, (err) => {
        if (err) {
            console.error('Download error:', err);
            res.status(500).json({error: 'Download fehlgeschlagen'});
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({status: 'OK', timestamp: new Date().toISOString()});
});

// Start server
app.listen(PORT, () => {
    console.log('Server läuft auf http://localhost:' + PORT);
});

module.exports = app;