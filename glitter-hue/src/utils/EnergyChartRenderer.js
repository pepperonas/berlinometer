// src/utils/EnergyChartRenderer.js - Robustes Chart-Rendering mit Fallback für das Energie-Dashboard

/**
 * Klasse zum sicheren Rendering von Energie-Charts auf Canvas-Elementen
 * Bietet Fallback-Methoden für Browser ohne Canvas-Unterstützung
 */
export class EnergyChartRenderer {
    /**
     * Erstellt einen neuen Chart-Renderer
     * @param {HTMLCanvasElement|null} canvas - Das Canvas-Element oder null für Fallback
     * @param {Object} options - Konfigurationsoptionen
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas ? this.getCanvasContext(canvas) : null;
        this.options = {
            padding: { left: 50, right: 20, top: 20, bottom: 50 },
            colors: {
                primary: '#7d83ff',
                primaryLight: '#9fa4ff',
                secondary: '#ffad33',
                background: '#2C2E3B',
                surface: '#353748',
                text: '#ffffff',
                textSecondary: 'rgba(255, 255, 255, 0.7)',
                grid: 'rgba(255, 255, 255, 0.1)',
                axis: 'rgba(255, 255, 255, 0.2)'
            },
            animation: true,
            animationDuration: 500,
            ...options
        };

        this.fallbackMode = !this.isCanvasSupported();
        this.data = [];
        this.chartType = 'line';
        this.chartWidth = 0;
        this.chartHeight = 0;
        this.maxY = 0;
        this.minY = 0;
        this.isDrawing = false;
        this.animationFrame = null;
    }

    /**
     * Prüft, ob Canvas und 2D-Kontext unterstützt werden
     * @returns {boolean} - true wenn Canvas unterstützt wird
     */
    isCanvasSupported() {
        try {
            if (!this.canvas) return false;

            const ctx = this.canvas.getContext('2d');
            return !!ctx;
        } catch (error) {
            console.error('Canvas wird nicht unterstützt:', error);
            return false;
        }
    }

    /**
     * Holt den 2D-Kontext vom Canvas mit Fehlerbehandlung
     * @param {HTMLCanvasElement} canvas - Das Canvas-Element
     * @returns {CanvasRenderingContext2D|null} - 2D-Kontext oder null
     */
    getCanvasContext(canvas) {
        try {
            return canvas.getContext('2d');
        } catch (error) {
            console.error('Fehler beim Abrufen des Canvas-Kontexts:', error);
            this.fallbackMode = true;
            return null;
        }
    }

    /**
     * Aktualisiert die Canvas-Größe basierend auf dem Container
     */
    updateCanvasSize() {
        if (!this.canvas) return;

        try {
            const container = this.canvas.parentElement;
            if (container) {
                this.canvas.width = container.clientWidth;
                this.canvas.height = container.clientHeight;

                // Bereich für das eigentliche Diagramm berechnen
                const padding = this.options.padding;
                this.chartWidth = this.canvas.width - padding.left - padding.right;
                this.chartHeight = this.canvas.height - padding.top - padding.bottom;
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Canvas-Größe:', error);
        }
    }

    /**
     * Zeichnet den Chart mit den angegebenen Daten
     * @param {Array} data - Die darzustellenden Daten
     * @param {string} type - Typ des Charts ('line', 'bar', 'area')
     * @param {Object} options - Zusätzliche Optionen für diesen Chart
     */
    drawChart(data, type = 'line', options = {}) {
        // Bereinige vorherige Animation
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        this.data = data || [];
        this.chartType = type;
        this.options = { ...this.options, ...options };

        // Wenn keine Daten vorhanden oder Fallback-Modus aktiv ist
        if (this.data.length === 0 || this.fallbackMode) {
            this.renderFallback();
            return;
        }

        // Canvas-Größe aktualisieren und mit dem Zeichnen beginnen
        this.updateCanvasSize();
        this.clearCanvas();

        // Daten analysieren
        this.analyzeData();

        // Chart-Komponenten zeichnen
        this.drawAxes();
        this.drawGrid();
        this.drawAxisLabels();

        // Zeichne den eigentlichen Chart basierend auf Typ
        switch (this.chartType) {
            case 'bar':
                this.drawBarChart();
                break;
            case 'area':
                this.drawAreaChart();
                break;
            case 'line':
            default:
                this.drawLineChart();
                break;
        }
    }

    /**
     * Analysiert die Daten für die Darstellung
     */
    analyzeData() {
        if (!this.data || this.data.length === 0) {
            this.maxY = 10;
            this.minY = 0;
            return;
        }

        // Extrahiere y-Werte
        const yValues = this.data.map(item => {
            if (typeof item === 'number') return item;
            if (item.y !== undefined) return item.y;
            if (item.value !== undefined) return item.value;
            return 0;
        });

        // Bestimme Min/Max mit Sicherheitsabfragen
        this.maxY = !isNaN(Math.max(...yValues)) ? Math.max(...yValues, 0.1) : 10;
        this.minY = !isNaN(Math.min(...yValues)) ? Math.min(...yValues, 0) : 0;

        // Für bessere Skalierung
        const range = this.maxY - this.minY;
        this.maxY += range * 0.1; // 10% Abstand nach oben
    }

    /**
     * Löscht den Canvas-Inhalt
     */
    clearCanvas() {
        if (!this.ctx || !this.canvas) return;

        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } catch (error) {
            console.error('Fehler beim Löschen des Canvas:', error);
            this.fallbackMode = true;
        }
    }

    /**
     * Zeichnet die Achsen
     */
    drawAxes() {
        if (!this.ctx) return;

        try {
            const padding = this.options.padding;
            const colors = this.options.colors;

            // Y-Achse
            this.ctx.beginPath();
            this.ctx.moveTo(padding.left, padding.top);
            this.ctx.lineTo(padding.left, this.canvas.height - padding.bottom);
            this.ctx.strokeStyle = colors.axis;
            this.ctx.stroke();

            // X-Achse
            this.ctx.beginPath();
            this.ctx.moveTo(padding.left, this.canvas.height - padding.bottom);
            this.ctx.lineTo(this.canvas.width - padding.right, this.canvas.height - padding.bottom);
            this.ctx.strokeStyle = colors.axis;
            this.ctx.stroke();
        } catch (error) {
            console.error('Fehler beim Zeichnen der Achsen:', error);
        }
    }

    /**
     * Zeichnet das Raster
     */
    drawGrid() {
        if (!this.ctx) return;

        try {
            const padding = this.options.padding;
            const colors = this.options.colors;

            // Y-Achsen-Raster
            const ySteps = 5;
            for (let i = 0; i <= ySteps; i++) {
                const y = padding.top + this.chartHeight * (1 - i / ySteps);

                // Horizontale Hilfslinien
                this.ctx.beginPath();
                this.ctx.moveTo(padding.left, y);
                this.ctx.lineTo(padding.left + this.chartWidth, y);
                this.ctx.strokeStyle = colors.grid;
                this.ctx.stroke();
            }

            // X-Achsen-Raster für mehr als 1 Datenpunkt
            if (this.data.length > 1) {
                const xStep = this.chartWidth / (this.data.length - 1);
                const xSteps = Math.min(this.data.length - 1, 10); // Max. 10 Rasterlinien
                const interval = Math.max(1, Math.floor((this.data.length - 1) / xSteps));

                for (let i = 0; i < this.data.length; i += interval) {
                    const x = padding.left + (i / (this.data.length - 1)) * this.chartWidth;

                    // Vertikale Hilfslinien
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, padding.top);
                    this.ctx.lineTo(x, this.canvas.height - padding.bottom);
                    this.ctx.strokeStyle = colors.grid;
                    this.ctx.stroke();
                }
            }
        } catch (error) {
            console.error('Fehler beim Zeichnen des Rasters:', error);
        }
    }

    /**
     * Zeichnet die Achsenbeschriftungen
     */
    drawAxisLabels() {
        if (!this.ctx) return;

        try {
            const padding = this.options.padding;
            const colors = this.options.colors;

            // Y-Achsenbeschriftung
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = colors.textSecondary;
            this.ctx.font = '12px var(--font-family, sans-serif)';

            const ySteps = 5;
            for (let i = 0; i <= ySteps; i++) {
                const y = padding.top + this.chartHeight * (1 - i / ySteps);
                const value = (this.minY + (this.maxY - this.minY) * i / ySteps).toFixed(1);

                // Y-Wert beschriften
                this.ctx.fillText(value, padding.left - 10, y);
            }

            // Y-Achsen-Titel
            this.ctx.save();
            this.ctx.translate(15, padding.top + this.chartHeight / 2);
            this.ctx.rotate(-Math.PI / 2);
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = colors.textSecondary;
            this.ctx.font = '14px var(--font-family, sans-serif)';

            const yAxisLabel = this.options.yAxisLabel || 'Wert';
            this.ctx.fillText(yAxisLabel, 0, 0);
            this.ctx.restore();

            // X-Achsenbeschriftung
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillStyle = colors.textSecondary;
            this.ctx.font = '12px var(--font-family, sans-serif)';

            // X-Werte beschriften
            const xLabelInterval = Math.ceil(this.data.length / 10); // Max. 10 Labels

            this.data.forEach((item, index) => {
                // Nur jeden xLabelInterval-ten Wert beschriften
                if (index % xLabelInterval === 0 || index === this.data.length - 1) {
                    const x = padding.left + (index / (this.data.length - 1 || 1)) * this.chartWidth;
                    let label = '';

                    // Label aus Daten extrahieren
                    if (typeof item === 'object') {
                        if (item.label) label = item.label;
                        else if (item.x) label = item.x;
                        else if (item.hour) label = `${item.hour}:00`;
                        else if (item.timestamp) {
                            const date = new Date(item.timestamp);
                            label = this.options.timeFormat === 'hour' ?
                                `${date.getHours()}:00` :
                                date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                        }
                    } else {
                        label = item.toString();
                    }

                    this.ctx.fillText(label, x, this.canvas.height - padding.bottom + 10);
                }
            });

            // X-Achsen-Titel
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = colors.textSecondary;
            this.ctx.font = '14px var(--font-family, sans-serif)';

            const xAxisLabel = this.options.xAxisLabel || 'Zeit';
            this.ctx.fillText(xAxisLabel, padding.left + this.chartWidth / 2, this.canvas.height - 15);
        } catch (error) {
            console.error('Fehler beim Zeichnen der Achsenbeschriftungen:', error);
        }
    }

    /**
     * Zeichnet einen Linien-Chart
     */
    drawLineChart() {
        if (!this.ctx || this.data.length === 0) return;

        try {
            const padding = this.options.padding;
            const colors = this.options.colors;

            // Bereite die Datenpunkte vor
            const points = this._prepareDataPoints();

            // Zeichne die Linie
            this.ctx.beginPath();
            points.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });

            this.ctx.strokeStyle = colors.primary;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Zeichne die Datenpunkte
            points.forEach(point => {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = colors.primaryLight;
                this.ctx.fill();
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = colors.surface;
                this.ctx.stroke();
            });
        } catch (error) {
            console.error('Fehler beim Zeichnen des Linien-Charts:', error);
        }
    }

    /**
     * Zeichnet einen Flächen-Chart
     */
    drawAreaChart() {
        if (!this.ctx || this.data.length === 0) return;

        try {
            const padding = this.options.padding;
            const colors = this.options.colors;

            // Bereite die Datenpunkte vor
            const points = this._prepareDataPoints();

            // Erstelle Gradient für die Fläche unter der Linie
            let gradient;
            try {
                gradient = this.ctx.createLinearGradient(0, padding.top, 0, this.canvas.height - padding.bottom);
                gradient.addColorStop(0, `${colors.primary}99`); // 60% Opazität
                gradient.addColorStop(1, `${colors.primary}1A`); // 10% Opazität
            } catch (error) {
                console.error('Fehler beim Erstellen des Gradienten:', error);
                gradient = `${colors.primary}33`; // Fallback: 20% Opazität
            }

            // Zeichne Fläche unter der Linie
            this.ctx.beginPath();

            // Startpunkt unten links
            this.ctx.moveTo(padding.left, this.canvas.height - padding.bottom);

            // Zeichne Datenpunkte
            points.forEach(point => {
                this.ctx.lineTo(point.x, point.y);
            });

            // Schließe den Pfad zur unteren rechten Ecke
            this.ctx.lineTo(padding.left + this.chartWidth, this.canvas.height - padding.bottom);
            this.ctx.closePath();

            // Fülle die Fläche mit Gradient
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Zeichne die Linie selbst
            this.ctx.beginPath();
            points.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });

            this.ctx.strokeStyle = colors.primary;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Optional: Datenpunkte hervorheben
            if (this.options.showDataPoints) {
                points.forEach(point => {
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                    this.ctx.fillStyle = colors.primaryLight;
                    this.ctx.fill();
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeStyle = colors.surface;
                    this.ctx.stroke();
                });
            }
        } catch (error) {
            console.error('Fehler beim Zeichnen des Flächen-Charts:', error);
        }
    }

    /**
     * Zeichnet einen Balken-Chart
     */
    drawBarChart() {
        if (!this.ctx || this.data.length === 0) return;

        try {
            const padding = this.options.padding;
            const colors = this.options.colors;

            // Berechne Balkenbreite und -abstand
            const barWidth = Math.min(40, this.chartWidth / this.data.length * 0.7);
            const barSpacing = this.chartWidth / this.data.length;

            // Zeichne für jeden Datenpunkt einen Balken
            this.data.forEach((item, index) => {
                // Y-Wert aus den Daten extrahieren
                let yValue;
                if (typeof item === 'number') {
                    yValue = item;
                } else if (typeof item === 'object') {
                    if (item.y !== undefined) yValue = item.y;
                    else if (item.value !== undefined) yValue = item.value;
                    else yValue = 0;
                } else {
                    yValue = 0;
                }

                // Normalisiere den Y-Wert
                const normalizedY = (yValue - this.minY) / (this.maxY - this.minY);

                // Berechne Balkenposition und -höhe
                const barHeight = this.chartHeight * normalizedY;
                const x = padding.left + (index * barSpacing) + (barSpacing - barWidth) / 2;
                const y = this.canvas.height - padding.bottom - barHeight;

                // Zeichne den Balken
                this.ctx.fillStyle = colors.primary;
                this.ctx.fillRect(x, y, barWidth, barHeight);

                // Füge einen leichten Schatten hinzu
                this.ctx.fillStyle = `${colors.primary}33`; // 20% Opazität
                this.ctx.fillRect(x, y, barWidth, 3);

                // Wert über dem Balken anzeigen
                if (barHeight > 30) { // Nur anzeigen, wenn genug Platz ist
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'bottom';
                    this.ctx.fillStyle = colors.text;
                    this.ctx.font = '12px var(--font-family, sans-serif)';
                    this.ctx.fillText(yValue.toFixed(1), x + barWidth / 2, y - 5);
                }
            });
        } catch (error) {
            console.error('Fehler beim Zeichnen des Balken-Charts:', error);
        }
    }

    /**
     * Bereitet Datenpunkte für das Zeichnen vor
     * @returns {Array} - Vorbereitete Datenpunkte mit x,y-Koordinaten
     */
    _prepareDataPoints() {
        const padding = this.options.padding;
        const points = [];

        // Für jeden Datenpunkt
        this.data.forEach((item, index) => {
            // X-Koordinate berechnen
            const x = padding.left + (index / (this.data.length - 1 || 1)) * this.chartWidth;

            // Y-Wert aus den Daten extrahieren
            let yValue;
            if (typeof item === 'number') {
                yValue = item;
            } else if (typeof item === 'object') {
                if (item.y !== undefined) yValue = item.y;
                else if (item.value !== undefined) yValue = item.value;
                else yValue = 0;
            } else {
                yValue = 0;
            }

            // Normalisiere den Y-Wert
            const normalizedY = (yValue - this.minY) / (this.maxY - this.minY) || 0;

            // Y-Koordinate berechnen (invertiert, da Canvas y-Achse von oben nach unten geht)
            const y = padding.top + this.chartHeight * (1 - normalizedY);

            points.push({ x, y, value: yValue });
        });

        return points;
    }

    /**
     * Rendert eine Fallback-Ansicht wenn Canvas nicht verfügbar ist
     */
    renderFallback() {
        if (!this.canvas) return;

        // Versuche es mit einem einfachen Text-Fallback im Canvas
        try {
            if (this.ctx) {
                this.ctx.fillStyle = this.options.colors.background;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                this.ctx.font = '16px sans-serif';
                this.ctx.fillStyle = this.options.colors.text;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                if (this.data.length === 0) {
                    this.ctx.fillText('Keine Daten verfügbar', this.canvas.width / 2, this.canvas.height / 2);
                } else {
                    this.ctx.fillText('Chart kann nicht dargestellt werden', this.canvas.width / 2, this.canvas.height / 2);
                }
            }
        } catch (error) {
            console.error('Fehler beim Fallback-Rendering:', error);

            // Wenn selbst das fehlschlägt, füge einen DOM-basierten Fallback hinzu
            const container = this.canvas.parentElement;
            if (container) {
                const fallbackDiv = document.createElement('div');
                fallbackDiv.style.width = '100%';
                fallbackDiv.style.height = '100%';
                fallbackDiv.style.display = 'flex';
                fallbackDiv.style.alignItems = 'center';
                fallbackDiv.style.justifyContent = 'center';
                fallbackDiv.style.backgroundColor = this.options.colors.background;
                fallbackDiv.style.color = this.options.colors.text;
                fallbackDiv.style.textAlign = 'center';

                if (this.data.length === 0) {
                    fallbackDiv.textContent = 'Keine Daten verfügbar';
                } else {
                    fallbackDiv.textContent = 'Chart kann nicht dargestellt werden';
                }

                // Canvas ausblenden und Fallback hinzufügen
                this.canvas.style.display = 'none';
                container.appendChild(fallbackDiv);
            }
        }
    }

    /**
     * Generiert eine SVG-Repräsentation des aktuellen Charts (Fallback)
     * @returns {string} - SVG-Markup
     */
    generateSVG() {
        const width = this.canvas ? this.canvas.width : 600;
        const height = this.canvas ? this.canvas.height : 400;
        const padding = this.options.padding;
        const colors = this.options.colors;

        // SVG-Header
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

        // Hintergrund
        svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="${colors.background}" />`;

        // Wenn keine Daten vorhanden sind
        if (!this.data || this.data.length === 0) {
            svg += `<text x="${width/2}" y="${height/2}" font-family="sans-serif" font-size="16" fill="${colors.text}" text-anchor="middle">Keine Daten verfügbar</text>`;
            svg += '</svg>';
            return svg;
        }

        // Analysiere die Daten (falls nicht schon geschehen)
        if (!this.maxY) this.analyzeData();

        // Zeichenbereich
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Achsen
        svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="${colors.axis}" />`;
        svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="${colors.axis}" />`;

        // Y-Achsen-Raster und Beschriftungen
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = padding.top + chartHeight * (1 - i / ySteps);
            const value = (this.minY + (this.maxY - this.minY) * i / ySteps).toFixed(1);

            // Horizontale Hilfslinie
            svg += `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="${colors.grid}" />`;

            // Y-Achsenbeschriftung
            svg += `<text x="${padding.left - 10}" y="${y}" font-family="sans-serif" font-size="12" fill="${colors.textSecondary}" text-anchor="end" dominant-baseline="middle">${value}</text>`;
        }

        // Y-Achsen-Titel
        svg += `<text x="${15}" y="${padding.top + chartHeight / 2}" font-family="sans-serif" font-size="14" fill="${colors.textSecondary}" text-anchor="middle" transform="rotate(-90, 15, ${padding.top + chartHeight / 2})">${this.options.yAxisLabel || 'Wert'}</text>`;

        // Je nach Charttyp unterschiedliche Darstellung
        if (this.chartType === 'line' || this.chartType === 'area') {
            // Bereite die Datenpunkte vor
            const points = [];
            this.data.forEach((item, index) => {
                const x = padding.left + (index / (this.data.length - 1 || 1)) * chartWidth;

                // Y-Wert aus den Daten extrahieren
                let yValue;
                if (typeof item === 'number') {
                    yValue = item;
                } else if (typeof item === 'object') {
                    if (item.y !== undefined) yValue = item.y;
                    else if (item.value !== undefined) yValue = item.value;
                    else yValue = 0;
                } else {
                    yValue = 0;
                }

                // Normalisiere den Y-Wert
                const normalizedY = (yValue - this.minY) / (this.maxY - this.minY) || 0;

                // Y-Koordinate berechnen
                const y = padding.top + chartHeight * (1 - normalizedY);

                points.push({ x, y, value: yValue });

                // X-Achsenbeschriftung für ausgewählte Punkte
                if (index % Math.ceil(this.data.length / 10) === 0 || index === this.data.length - 1) {
                    let label = '';

                    // Label aus Daten extrahieren
                    if (typeof item === 'object') {
                        if (item.label) label = item.label;
                        else if (item.x) label = item.x;
                        else if (item.hour) label = `${item.hour}:00`;
                        else if (item.timestamp) {
                            const date = new Date(item.timestamp);
                            label = this.options.timeFormat === 'hour' ?
                                `${date.getHours()}:00` :
                                date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                        }
                    } else {
                        label = item.toString();
                    }

                    svg += `<text x="${x}" y="${height - padding.bottom + 20}" font-family="sans-serif" font-size="12" fill="${colors.textSecondary}" text-anchor="middle">${label}</text>`;
                }
            });

            // Zeichne Flächenchart
            if (this.chartType === 'area' && points.length > 0) {
                let pathData = `M${points[0].x},${height - padding.bottom} `;

                // Linienpunkte
                points.forEach(point => {
                    pathData += `L${point.x},${point.y} `;
                });

                // Schließe den Pfad
                pathData += `L${points[points.length - 1].x},${height - padding.bottom} Z`;

                // Fläche unter der Linie
                svg += `<path d="${pathData}" fill="${colors.primary}33" />`;
            }

            // Zeichne Linienchart
            if (points.length > 0) {
                let pathData = `M${points[0].x},${points[0].y} `;

                // Linienpunkte
                for (let i = 1; i < points.length; i++) {
                    pathData += `L${points[i].x},${points[i].y} `;
                }

                // Linie
                svg += `<path d="${pathData}" fill="none" stroke="${colors.primary}" stroke-width="2" />`;

                // Datenpunkte
                points.forEach(point => {
                    svg += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${colors.primaryLight}" stroke="${colors.surface}" stroke-width="1" />`;
                });
            }
        } else if (this.chartType === 'bar') {
            // Balkenbreite und -abstand berechnen
            const barWidth = Math.min(40, chartWidth / this.data.length * 0.7);
            const barSpacing = chartWidth / this.data.length;

            // Zeichne für jeden Datenpunkt einen Balken
            this.data.forEach((item, index) => {
                // Y-Wert aus den Daten extrahieren
                let yValue;
                if (typeof item === 'number') {
                    yValue = item;
                } else if (typeof item === 'object') {
                    if (item.y !== undefined) yValue = item.y;
                    else if (item.value !== undefined) yValue = item.value;
                    else yValue = 0;
                } else {
                    yValue = 0;
                }

                // Normalisiere den Y-Wert
                const normalizedY = (yValue - this.minY) / (this.maxY - this.minY);

                // Berechne Balkenposition und -höhe
                const barHeight = chartHeight * normalizedY;
                const x = padding.left + (index * barSpacing) + (barSpacing - barWidth) / 2;
                const y = height - padding.bottom - barHeight;

                // Zeichne den Balken
                svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${colors.primary}" />`;

                // Wert über dem Balken anzeigen
                if (barHeight > 30) {
                    svg += `<text x="${x + barWidth / 2}" y="${y - 5}" font-family="sans-serif" font-size="12" fill="${colors.text}" text-anchor="middle">${yValue.toFixed(1)}</text>`;
                }

                // X-Achsenbeschriftung für ausgewählte Balken
                if (index % Math.ceil(this.data.length / 10) === 0 || index === this.data.length - 1) {
                    let label = '';

                    // Label aus Daten extrahieren
                    if (typeof item === 'object') {
                        if (item.label) label = item.label;
                        else if (item.x) label = item.x;
                        else if (item.hour) label = `${item.hour}:00`;
                        else if (item.timestamp) {
                            const date = new Date(item.timestamp);
                            label = this.options.timeFormat === 'hour' ?
                                `${date.getHours()}:00` :
                                date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                        }
                    } else {
                        label = item.toString();
                    }

                    svg += `<text x="${x + barWidth / 2}" y="${height - padding.bottom + 20}" font-family="sans-serif" font-size="12" fill="${colors.textSecondary}" text-anchor="middle">${label}</text>`;
                }
            });
        }

        // X-Achsen-Titel
        svg += `<text x="${padding.left + chartWidth / 2}" y="${height - 5}" font-family="sans-serif" font-size="14" fill="${colors.textSecondary}" text-anchor="middle">${this.options.xAxisLabel || 'Zeit'}</text>`;

        // SVG abschließen
        svg += '</svg>';

        return svg;
    }

    /**
     * Exportiert das Chart als SVG
     * @param {string} filename - Dateiname für den Download
     */
    exportAsSVG(filename = 'chart.svg') {
        const svg = this.generateSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    }
}

/**
 * Erstellt und rendert einen Energy-Chart für die Stundenansicht
 * @param {HTMLCanvasElement} canvas - Das Canvas-Element
 * @param {Array} data - Die darzustellenden Stundendaten
 * @param {string} metricType - Art der Metrik ('watt', 'kwh', 'cost', 'co2')
 * @param {Object} options - Zusätzliche Optionen
 */
export const renderHourlyChart = (canvas, data, metricType = 'watt', options = {}) => {
    const chartRenderer = new EnergyChartRenderer(canvas, {
        timeFormat: 'hour',
        showDataPoints: true,
        ...options
    });

    // Y-Achsen-Label basierend auf der Metrik
    let yAxisLabel = 'Leistung (W)';
    if (metricType === 'kwh') yAxisLabel = 'Energie (kWh)';
    if (metricType === 'cost') yAxisLabel = 'Kosten (€)';
    if (metricType === 'co2') yAxisLabel = 'CO₂ (kg)';

    // Metrik-Werte extrahieren und formatieren
    const chartData = data.map(item => {
        let value = 0;

        if (metricType === 'watt') {
            value = item.value || 0;
        } else if (metricType === 'kwh') {
            value = ((item.value || 0) * 0.001); // Watt zu kWh
        } else if (metricType === 'cost') {
            const costPerKwh = options.energyCost || 0.32;
            value = ((item.value || 0) * 0.001 * costPerKwh); // Watt zu kWh zu Kosten
        } else if (metricType === 'co2') {
            const co2Factor = options.co2Factor || 400; // g/kWh
            value = ((item.value || 0) * 0.001 * co2Factor / 1000); // Watt zu kWh zu kg CO2
        }

        return {
            hour: item.hour,
            timestamp: item.timestamp,
            value: value
        };
    });

    // Chart rendern
    chartRenderer.drawChart(chartData, 'area', {
        yAxisLabel,
        xAxisLabel: 'Stunde',
        colors: {
            ...chartRenderer.options.colors,
            primary: metricType === 'watt' ? '#7d83ff' :
                metricType === 'kwh' ? '#4CAF50' :
                    metricType === 'cost' ? '#ffad33' :
                        metricType === 'co2' ? '#F44336' : '#7d83ff',
            primaryLight: metricType === 'watt' ? '#9fa4ff' :
                metricType === 'kwh' ? '#8eff93' :
                    metricType === 'cost' ? '#ffc266' :
                        metricType === 'co2' ? '#ff8a85' : '#9fa4ff'
        }
    });

    return chartRenderer;
};

/**
 * Erstellt und rendert einen Energy-Chart für die Tages-/Wochen-/Monatsansicht
 * @param {HTMLCanvasElement} canvas - Das Canvas-Element
 * @param {Array} data - Die darzustellenden Daten
 * @param {string} period - Zeitraum ('day', 'week', 'month')
 * @param {string} metricType - Art der Metrik ('watt', 'kwh', 'cost', 'co2')
 * @param {Object} options - Zusätzliche Optionen
 */
export const renderPeriodChart = (canvas, data, period = 'week', metricType = 'watt', options = {}) => {
    const chartRenderer = new EnergyChartRenderer(canvas, options);

    // Y-Achsen-Label basierend auf der Metrik
    let yAxisLabel = 'Leistung (W)';
    if (metricType === 'kwh') yAxisLabel = 'Energie (kWh)';
    if (metricType === 'cost') yAxisLabel = 'Kosten (€)';
    if (metricType === 'co2') yAxisLabel = 'CO₂ (kg)';

    // X-Achsen-Label basierend auf dem Zeitraum
    let xAxisLabel = 'Stunde';
    if (period === 'week') xAxisLabel = 'Tag';
    if (period === 'month') xAxisLabel = 'Datum';

    // Extrahiere Werte basierend auf der Metrik
    const chartData = data.map(item => {
        let value = 0;

        if (metricType === 'watt') {
            value = item.averageWatts || 0;
        } else if (metricType === 'kwh') {
            value = (item.totalWattHours || 0) / 1000;
        } else if (metricType === 'cost') {
            value = item.totalCost || 0;
        } else if (metricType === 'co2') {
            const co2Factor = options.co2Factor || 400; // g/kWh
            value = ((item.totalWattHours || 0) / 1000 * co2Factor / 1000);
        }

        // Label basierend auf dem Zeitraum
        let label = '';
        if (period === 'day') {
            label = item.hour || '0';
        } else if (period === 'week') {
            // Wochentag (kurz) für Wochenansicht
            const date = new Date(item.timestamp || Date.now());
            label = date.toLocaleDateString('de-DE', { weekday: 'short' });
        } else if (period === 'month') {
            // Tag des Monats für Monatsansicht
            label = item.date ? item.date.split('-')[2] : '0';
        }

        return {
            label,
            timestamp: item.timestamp,
            date: item.date,
            value
        };
    });

    // Chart-Typ basierend auf dem Zeitraum und Metrik
    let chartType = 'area';
    if (period === 'day' || (period === 'week' && (metricType === 'kwh' || metricType === 'cost'))) {
        chartType = 'bar';
    }

    // Chart rendern
    chartRenderer.drawChart(chartData, chartType, {
        yAxisLabel,
        xAxisLabel,
        colors: {
            ...chartRenderer.options.colors,
            primary: metricType === 'watt' ? '#7d83ff' :
                metricType === 'kwh' ? '#4CAF50' :
                    metricType === 'cost' ? '#ffad33' :
                        metricType === 'co2' ? '#F44336' : '#7d83ff',
            primaryLight: metricType === 'watt' ? '#9fa4ff' :
                metricType === 'kwh' ? '#8eff93' :
                    metricType === 'cost' ? '#ffc266' :
                        metricType === 'co2' ? '#ff8a85' : '#9fa4ff'
        }
    });

    return chartRenderer;
};