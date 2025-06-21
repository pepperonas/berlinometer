class PixelMonitor {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = document.getElementById('preview');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true, alpha: false });
        this.monitoring = false;
        this.intervalId = null;
        this.monitorAreas = new Map();
        this.currentScanMode = 'auto';
        this.hoveredAreaId = null;
        this.activeTrackings = new Map();
        this.trackingIdCounter = 0;
        this.canvasClickHandler = null;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.scanModeSelect = document.getElementById('scanMode');
        this.xInput = document.getElementById('xPos');
        this.yInput = document.getElementById('yPos');
        this.intervalInput = document.getElementById('interval');
        this.thresholdInput = document.getElementById('threshold');
        this.sensitivitySelect = document.getElementById('sensitivity');
        this.logEntries = document.getElementById('logEntries');
        this.placeholder = document.getElementById('placeholder');
        this.activeAreas = document.getElementById('activeAreas');
        this.manualControls = document.getElementById('manualControls');
        this.manualControls2 = document.getElementById('manualControls2');
        this.trackingSection = document.getElementById('trackingSection');
        this.trackingList = document.getElementById('trackingList');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.startMonitoring());
        this.stopBtn.addEventListener('click', () => this.stopMonitoring());
        this.scanModeSelect.addEventListener('change', () => {
            this.currentScanMode = this.scanModeSelect.value;
            this.updateManualControls();
            if (this.monitoring) {
                this.setupMonitoringAreas();
            }
        });
        this.setupCanvasClickHandler();
        this.setupCanvasHoverHandler();
    }

    setupCanvasClickHandler() {
        if (this.canvasClickHandler) {
            this.canvas.removeEventListener('click', this.canvasClickHandler);
        }
        this.canvasClickHandler = (e) => {
            if (!this.monitoring) return;
            e.preventDefault();
            e.stopPropagation();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const clickX = Math.floor((e.clientX - rect.left) * scaleX);
            const clickY = Math.floor((e.clientY - rect.top) * scaleY);
            let closestArea = null;
            let minDistance = 30;
            this.monitorAreas.forEach((area, id) => {
                const distance = Math.sqrt(Math.pow(clickX - area.x, 2) + Math.pow(clickY - area.y, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    closestArea = { id: id, x: area.x, y: area.y };
                }
            });
            if (closestArea) {
                this.showTrackingDialog(closestArea);
                this.logEntry(`Tracking-Dialog für Bereich (${closestArea.x}, ${closestArea.y}) geöffnet`, false);
            } else if (this.currentScanMode === 'manual') {
                this.xInput.value = clickX;
                this.yInput.value = clickY;
                this.setupMonitoringAreas();
                this.logEntry(`Position geändert: (${clickX}, ${clickY})`, false);
            } else {
                this.showTrackingDialog({ id: 'new', x: clickX, y: clickY });
                this.logEntry(`Tracking-Dialog für neue Position (${clickX}, ${clickY}) geöffnet`, false);
            }
        };
        this.canvas.addEventListener('click', this.canvasClickHandler);
    }

    setupCanvasHoverHandler() {
        this.mousePosition = { x: -1, y: -1, active: false };
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.monitoring) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mousePosition.x = (e.clientX - rect.left) * scaleX;
            this.mousePosition.y = (e.clientY - rect.top) * scaleY;
            this.mousePosition.active = true;
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.mousePosition.active = false;
        });
        this.canvas.addEventListener('mouseenter', () => {
            if (this.monitoring) {
                this.mousePosition.active = true;
            }
        });
    }

    updateManualControls() {
        const isManual = this.currentScanMode === 'manual';
        this.manualControls.style.display = isManual ? 'flex' : 'none';
        this.manualControls2.style.display = isManual ? 'flex' : 'none';
    }

    async startMonitoring() {
        try {
            console.log('Starte Screen Capture...');
            this.stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });
            console.log('Stream erhalten:', this.stream);
            console.log('Video Tracks:', this.stream.getVideoTracks());
            const track = this.stream.getVideoTracks()[0];
            if (track) {
                const settings = track.getSettings();
                console.log('Track Settings:', settings);
            }
            this.video = document.createElement('video');
            this.video.style.display = 'none';
            document.body.appendChild(this.video);
            this.video.srcObject = this.stream;
            this.video.muted = true;
            this.video.playsInline = true;
            await new Promise(resolve => setTimeout(resolve, 100));
            this.video.play().then(() => {
                console.log('Video läuft!');
                console.log('Video muted:', this.video.muted);
            }).catch(err => {
                console.error('Video-Fehler:', err);
                this.startBtn.click();
            });
            let canvasSetup = false;
            const setupCanvas = () => {
                if (canvasSetup) return;
                console.log('Video bereit - Setup Canvas');
                console.log(`Video Dimensionen: ${this.video.videoWidth}x${this.video.videoHeight}`);
                if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
                    console.error('Video hat keine gültigen Dimensionen!');
                    setTimeout(setupCanvas, 100);
                    return;
                }
                console.log('Video readyState:', this.video.readyState);
                console.log('Video paused:', this.video.paused);
                console.log('Video currentTime:', this.video.currentTime);
                canvasSetup = true;
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.canvas.style.display = 'block';
                this.placeholder.style.display = 'none';
                this.activeAreas.style.display = 'block';
                document.getElementById('liveIndicator').style.display = 'inline-block';
                console.log(`Canvas-Größe: ${this.canvas.width}x${this.canvas.height}`);
                this.logEntry(`Bildschirm: ${this.canvas.width}x${this.canvas.height}px`, false);
                this.monitoring = true;
                this.startBtn.disabled = true;
                this.stopBtn.disabled = false;
                this.logEntry('Monitoring gestartet', false);
                console.log('Monitoring gestartet - Überwache Pixel-Änderungen...');
                this.ctx.drawImage(this.video, 0, 0);
                this.startFrameUpdate();
                setTimeout(() => {
                    console.log('Test-Draw nach 500ms');
                    try {
                        this.ctx.drawImage(this.video, 0, 0);
                        const testData = this.ctx.getImageData(100, 100, 1, 1).data;
                        console.log('Test-Pixel:', testData);
                        console.log('Canvas ist NICHT tainted - Pixel-Lesen funktioniert!');
                    } catch (err) {
                        if (err.name === 'SecurityError') {
                            console.error('SICHERHEITSFEHLER: Canvas ist "tainted" - kann keine Pixel lesen!');
                            console.error('Mögliche Ursache: Cross-Origin Content oder Tab-Sharing statt Screen-Sharing');
                        } else {
                            console.error('Anderer Fehler:', err);
                        }
                    }
                }, 500);
                this.setupMonitoringAreas();
                this.intervalId = setInterval(() => this.monitorAllAreas(), parseInt(this.intervalInput.value));
            };
            this.video.addEventListener('loadedmetadata', setupCanvas);
            this.video.addEventListener('loadeddata', setupCanvas);
            setTimeout(() => {
                if (!this.monitoring) {
                    console.log('Fallback: Versuche Canvas-Setup direkt');
                    setupCanvas();
                }
            }, 1000);
            this.stream.getVideoTracks()[0].addEventListener('ended', () => {
                this.stopMonitoring();
            });
        } catch (error) {
            console.error('Fehler beim Starten:', error);
            alert('Bildschirmfreigabe wurde abgelehnt oder ist nicht verfügbar.');
        }
    }

    startFrameUpdate() {
        if (!this.monitoring || !this.video) return;
        const updateLoop = () => {
            if (!this.monitoring || !this.video) return;
            try {
                this.ctx.drawImage(this.video, 0, 0);
                this.drawAllCrosshairs();
            } catch (err) {
                console.error('Frame-Update Fehler:', err);
            }
            requestAnimationFrame(updateLoop);
        };
        requestAnimationFrame(updateLoop);
    }

    stopMonitoring() {
        this.monitoring = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.pause();
            if (this.video.parentNode) {
                this.video.parentNode.removeChild(this.video);
            }
            this.video = null;
        }
        this.canvas.style.display = 'none';
        this.placeholder.style.display = 'block';
        this.activeAreas.style.display = 'none';
        document.getElementById('liveIndicator').style.display = 'none';
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.logEntry('Monitoring gestoppt', false);
    }

    setupMonitoringAreas() {
        this.monitorAreas.clear();
        this.activeAreas.innerHTML = '<h3 style="position: absolute; top: 10px; left: 10px; z-index: 1000; color: #ffffff; margin: 0; font-size: 16px; pointer-events: none;">🕵️‍♂️ Aktive Überwachungsbereiche</h3>';
        if (!this.canvas.width || !this.canvas.height) return;
        let areas = [];
        switch (this.currentScanMode) {
            case 'auto':
                const gridSize = 12;
                for (let i = 1; i < gridSize - 1; i++) {
                    for (let j = 1; j < gridSize - 1; j++) {
                        const x = Math.floor((i / (gridSize - 1)) * this.canvas.width);
                        const y = Math.floor((j / (gridSize - 1)) * this.canvas.height);
                        areas.push({ x, y, id: `auto_${i}_${j}` });
                    }
                }
                break;
            case 'grid':
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < 9; j++) {
                        const x = Math.floor((i / 8) * this.canvas.width);
                        const y = Math.floor((j / 8) * this.canvas.height);
                        areas.push({ x, y, id: `grid_${i}_${j}` });
                    }
                }
                break;
            case 'center':
                const centerX = Math.floor(this.canvas.width / 2);
                const centerY = Math.floor(this.canvas.height / 2);
                areas.push({ x: centerX, y: centerY, id: 'center' });
                break;
            case 'manual':
                const x = Math.max(0, Math.min(parseInt(this.xInput.value), this.canvas.width - 1));
                const y = Math.max(0, Math.min(parseInt(this.yInput.value), this.canvas.height - 1));
                areas.push({ x, y, id: 'manual' });
                break;
        }
        areas.forEach(area => {
            this.monitorAreas.set(area.id, {
                x: area.x,
                y: area.y,
                lastColor: null,
                element: this.createAreaElement(area)
            });
        });
        this.positionAreaCards();
        this.setupCanvasClickHandler();
        console.log(`${areas.length} Bereiche für ${this.currentScanMode}-Modus erstellt`);
        this.logEntry(`${areas.length} Bereiche werden überwacht (${this.currentScanMode})`, false);
    }

    createAreaElement(area) {
        const card = document.createElement('div');
        card.className = 'area-card';
        card.dataset.areaId = area.id;
        card.innerHTML = `<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
                            <div class="area-color" id="color_${area.id}" style="width:14px;height:14px;border-radius:3px;border:1px solid #404252;flex-shrink:0;"></div>
                            <div style="font-family:'Courier New',monospace;font-size:9px;color:#7289DA;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${area.x},${area.y}</div>
                          </div>
                          <div class="area-change" id="change_${area.id}" style="font-family:'Courier New',monospace;font-size:9px;color:#F0B232;text-align:center;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Warte...</div>`;
        card.addEventListener('mouseenter', () => {
            this.hoveredAreaId = area.id;
            card.style.zIndex = '10';
        });
        card.addEventListener('mouseleave', () => {
            this.hoveredAreaId = null;
            card.style.zIndex = '1';
        });
        card.addEventListener('click', () => {
            this.showTrackingDialog(area);
        });
        return card;
    }

    positionAreaCards() {
        if (!this.canvas.width || !this.canvas.height) return;
        const cardsArray = Array.from(this.monitorAreas.values());
        const numCards = cardsArray.length;
        if (numCards === 0) return;
        const yGroups = new Map();
        cardsArray.forEach(area => {
            if (!yGroups.has(area.y)) {
                yGroups.set(area.y, []);
            }
            yGroups.get(area.y).push(area);
        });
        const sortedYs = Array.from(yGroups.keys()).sort((a, b) => a - b);
        sortedYs.forEach(y => {
            const areasAtY = yGroups.get(y);
            areasAtY.sort((a, b) => a.x - b.x);
        });
        this.activeAreas.innerHTML = '<h3 style="color:#ffffff;margin-bottom:15px;font-size:16px;">🕵️‍♂️ Aktive Überwachungsbereiche</h3>';
        sortedYs.forEach((y, rowIndex) => {
            const areasAtY = yGroups.get(y);
            console.log(`Row ${rowIndex + 1}: Y=${y} has ${areasAtY.length} cards - X positions: ${areasAtY.map(a => a.x).join(', ')}`);
            const rowDiv = document.createElement('div');
            rowDiv.className = 'area-row';
            rowDiv.style.display = 'flex';
            rowDiv.style.flexWrap = 'wrap';
            rowDiv.style.gap = '5px';
            rowDiv.style.marginBottom = '10px';
            rowDiv.style.alignItems = 'flex-start';
            areasAtY.forEach(area => {
                rowDiv.appendChild(area.element);
            });
            this.activeAreas.appendChild(rowDiv);
        });
        console.log(`Positioned ${numCards} cards in ${sortedYs.length} rows using exact Y-position matching with flexbox rows`);
    }

    monitorAllAreas() {
        if (!this.monitoring || !this.video || this.monitorAreas.size === 0) return;
        try {
            this.ctx.drawImage(this.video, 0, 0);
        } catch (drawError) {
            console.error('Fehler beim Zeichnen des Video-Frames:', drawError);
            return;
        }
        const threshold = this.getThresholdValue();
        let activeChanges = 0;
        this.monitorAreas.forEach((area, id) => {
            try {
                const x = Math.max(0, Math.min(area.x, this.canvas.width - 1));
                const y = Math.max(0, Math.min(area.y, this.canvas.height - 1));
                const imageData = this.ctx.getImageData(x, y, 1, 1);
                if (!imageData || !imageData.data || imageData.data.length < 4) {
                    console.error(`Ungültige ImageData für Bereich ${id}:`, imageData);
                    return;
                }
                let r = imageData.data[0];
                let g = imageData.data[1];
                let b = imageData.data[2];
                let a = imageData.data[3];
                if (r === undefined || g === undefined || b === undefined || a === undefined) {
                    console.error(`Undefined Pixelwerte für Bereich ${id}: [${r},${g},${b},${a}]`);
                    r = r || 0;
                    g = g || 0;
                    b = b || 0;
                    a = a || 255;
                }
                if (a === 0) {
                    console.warn(`Transparenter Pixel bei ${id}: Alpha=${a}`);
                    r = g = b = 255;
                }
                console.log(`FIXED: Area ${id} (${x},${y}) - RGBA: [${r},${g},${b},${a}] - Hex: ${this.rgbToHex(r, g, b)}`);
                const colorElement = document.getElementById(`color_${id}`);
                const changeElement = document.getElementById(`change_${id}`);
                if (colorElement) {
                    colorElement.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                }
                if (area.lastColor) {
                    const diffR = Math.abs(r - area.lastColor.r);
                    const diffG = Math.abs(g - area.lastColor.g);
                    const diffB = Math.abs(b - area.lastColor.b);
                    const totalDiff = diffR + diffG + diffB;
                    if (totalDiff > threshold) {
                        activeChanges++;
                        area.element.classList.add('active');
                        if (changeElement) {
                            changeElement.textContent = `Δ${totalDiff} ${this.rgbToHex(r, g, b)}`;
                        }
                        this.logEntry(`Bereich (${area.x},${area.y}): ${this.rgbToHex(r, g, b)} - Diff: ${totalDiff}`, true);
                        setTimeout(() => {
                            area.element.classList.remove('active');
                        }, 2000);
                    } else if (changeElement) {
                        changeElement.textContent = this.rgbToHex(r, g, b);
                    }
                } else if (changeElement) {
                    changeElement.textContent = this.rgbToHex(r, g, b);
                }
                area.lastColor = { r, g, b };
            } catch (error) {
                console.error(`Fehler beim Lesen von Bereich ${id}:`, error);
                const changeElement = document.getElementById(`change_${id}`);
                if (changeElement) {
                    changeElement.textContent = 'ERROR';
                }
            }
        });
    }

    getThresholdValue() {
        const sensitivity = this.sensitivitySelect.value;
        const baseThreshold = parseInt(this.thresholdInput.value);
        switch (sensitivity) {
            case 'low':
                return baseThreshold * 3;
            case 'high':
                return Math.max(1, Math.floor(baseThreshold / 2));
            default:
                return baseThreshold;
        }
    }

    drawAllCrosshairs() {
        if (!this.monitoring || this.monitorAreas.size === 0) return;
        this.monitorAreas.forEach((area, id) => {
            const isActive = area.element.classList.contains('active');
            const isHovered = this.hoveredAreaId === id;
            this.drawCrosshair(area.x, area.y, isActive, isHovered);
        });
        if (this.mousePosition && this.mousePosition.active) {
            this.drawFlame(this.mousePosition.x, this.mousePosition.y);
        }
    }

    rgbToHex(r, g, b) {
        if (r === undefined || g === undefined || b === undefined) {
            console.error('rgbToHex: undefined values:', r, g, b);
            return '#000000';
        }
        return '#' + [r, g, b].map(x => {
            const hex = Math.floor(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    drawCrosshair(x, y, isActive = false, isHovered = false) {
        this.ctx.save();
        let color, size, lineWidth, alpha, animationScale = 1;
        if (isHovered) {
            color = '#FF4444';
            size = 35;
            lineWidth = 12;
            alpha = 1.0;
            const time = Date.now() * 0.004;
            animationScale = 1.0 + Math.sin(time) * 0.6;
        } else if (isActive) {
            color = '#F0B232';
            size = 8;
            lineWidth = 3;
            alpha = 1.0;
        } else {
            color = '#7289DA';
            size = 4;
            lineWidth = 1;
            alpha = 0.6;
        }
        const finalSize = size * animationScale;
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.globalAlpha = alpha * (isHovered ? Math.abs(Math.sin(Date.now() * 0.006)) * 0.4 + 0.6 : 1.0);
        this.ctx.beginPath();
        this.ctx.arc(x, y, finalSize, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(x, y, finalSize / 2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawFlame(x, y) {
        this.ctx.save();
        const time = Date.now() * 0.008;
        const particles = [];
        const baseHeight = 40;
        const baseWidth = 25;
        for (let i = 0; i < 18; i++) {
            const heightRatio = i / 17;
            const waveOffset = Math.sin(time * 2 + i * 0.3) * 8;
            const flickerX = Math.sin(time * 5 + i) * 3;
            const particleX = x + flickerX + waveOffset * (1 - heightRatio * 0.7);
            const particleY = y - heightRatio * baseHeight - Math.sin(time * 3 + i) * 5;
            const sizeVariation = 1 + Math.sin(time * 4 + i) * 0.4;
            const baseSize = 20 * (1 - heightRatio * 0.6) * sizeVariation;
            particles.push({ x: particleX, y: particleY, size: baseSize, alpha: (1 - heightRatio * 0.8), layer: i });
        }
        for (let layer = 0; layer < 3; layer++) {
            particles.forEach((particle, index) => {
                if (particle.layer % 3 !== layer) return;
                const flicker = 1 + Math.sin(time * 6 + index) * 0.6;
                const finalSize = particle.size * flicker;
                const intensity = particle.alpha * 0.9;
                let color;
                const heightFactor = particle.layer / 17;
                if (heightFactor < 0.2) {
                    color = `rgba(255,255,255,${intensity})`;
                } else if (heightFactor < 0.5) {
                    color = `rgba(255,240,100,${intensity})`;
                } else if (heightFactor < 0.8) {
                    color = `rgba(255,160,40,${intensity})`;
                } else {
                    color = `rgba(255,80,20,${intensity * 0.7})`;
                }
                this.ctx.globalAlpha = intensity;
                this.ctx.fillStyle = color;
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = finalSize * 1.2;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, finalSize, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, finalSize * 0.7, 0, 2 * Math.PI);
                this.ctx.fill();
            });
        }
        this.ctx.shadowBlur = 0;
        const coreFlicker = 1 + Math.sin(time * 8) * 0.5;
        const coreSize = 8 * coreFlicker;
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = 'rgba(255,255,255,1.0)';
        this.ctx.shadowColor = 'rgba(255,255,0,0.9)';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(x, y, coreSize, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    updateCrosshair(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        this.canvas.style.cursor = 'crosshair';
    }

    logEntry(message, isChange = false) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${isChange ? 'change' : ''}`;
        const timestamp = new Date().toLocaleTimeString('de-DE');
        entry.innerHTML = `<span>${message}</span><span class="timestamp">${timestamp}</span>`;
        this.logEntries.insertBefore(entry, this.logEntries.firstChild);
        while (this.logEntries.children.length > 50) {
            this.logEntries.removeChild(this.logEntries.lastChild);
        }
    }

    showTrackingDialog(area) {
        const dialogHtml = `<div class="dialog-overlay" id="trackingDialog">
                            <div class="dialog">
                                <h2>📊 Tracking für Bereich (${area.x}, ${area.y}) erstellen</h2>
                                <div class="dialog-form">
                                    <div class="input-group">
                                        <label for="trackingTitle">Titel</label>
                                        <input type="text" id="trackingTitle" placeholder="z.B. Button-Zustand, Ladebalken..." value="Bereich ${area.x},${area.y}">
                                    </div>
                                    <div class="input-group">
                                        <label for="trackingInterval">Aufzeichnungsintervall (Sekunden)</label>
                                        <input type="number" id="trackingInterval" value="5" min="1" max="3600" step="1">
                                    </div>
                                    <div class="input-group">
                                        <label for="trackingDuration">Maximale Aufzeichnungsdauer (Minuten, 0 = unbegrenzt)</label>
                                        <input type="number" id="trackingDuration" value="30" min="0" max="1440" step="1">
                                    </div>
                                </div>
                                <div class="dialog-buttons">
                                    <button class="btn-cancel" onclick="monitor.closeTrackingDialog()">Abbrechen</button>
                                    <button class="btn-track" onclick="monitor.createTracking('${area.id}', ${area.x}, ${area.y})">Tracking starten</button>
                                </div>
                            </div>
                           </div>`;
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
        document.addEventListener('keydown', this.handleDialogEscape.bind(this));
        const overlay = document.getElementById('trackingDialog');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeTrackingDialog();
            }
        });
    }

    handleDialogEscape(e) {
        if (e.key === 'Escape') {
            this.closeTrackingDialog();
        }
    }

    closeTrackingDialog() {
        const dialog = document.getElementById('trackingDialog');
        if (dialog) {
            dialog.remove();
            document.removeEventListener('keydown', this.handleDialogEscape);
        }
    }

    showHelpDialog() {
        const helpHtml = `<div class="dialog-overlay" id="helpDialog">
                          <div class="dialog" style="max-width:700px;max-height:80vh;overflow-y:auto;">
                              <h2>📖 Pixel Color Monitor - Anleitung</h2>
                              <div style="color:#e0e0e0;line-height:1.6;">
                                  <h3 style="color:#5865F2;margin:20px 0 10px 0;">🚀 Schnellstart</h3>
                                  <ol style="margin-left:20px;">
                                      <li><strong>Monitor starten:</strong> Klicke auf "Monitor starten" und wähle deinen Bildschirm aus</li>
                                      <li><strong>Bereiche überwachen:</strong> Das Tool überwacht automatisch mehrere Bereiche auf Farbveränderungen</li>
                                      <li><strong>Interaktion:</strong> Klicke auf Bereiche oder Punkte im Preview für individuelle Trackings</li>
                                  </ol>
                                  <h3 style="color:#5865F2;margin:20px 0 10px 0;">⚙️ Scan-Modi</h3>
                                  <ul style="margin-left:20px;">
                                      <li><strong>Automatisch:</strong> Überwacht 100+ Bereiche gleichmäßig verteilt über den Bildschirm</li>
                                      <li><strong>Grid (9x9):</strong> Überwacht 81 Punkte in einem gleichmäßigen Raster</li>
                                      <li><strong>Bildschirm-Zentrum:</strong> Überwacht nur die Bildschirmmitte</li>
                                      <li><strong>Manuelle Position:</strong> Überwacht einen selbst gewählten Punkt (X/Y-Eingabe)</li>
                                  </ul>
                                  <h3 style="color:#5865F2;margin:20px 0 10px 0;">🕵️‍♂️ Überwachungsfeatures</h3>
                                  <ul style="margin-left:20px;">
                                      <li><strong>Echtzeit-Farbmessung:</strong> Zeigt Hex-Farbwerte aller überwachten Bereiche</li>
                                      <li><strong>Änderungserkennung:</strong> Bereiche leuchten gelb auf bei Farbveränderungen</li>
                                      <li><strong>Hover-Animation:</strong> Rote Punkte pulsieren beim Überfahren der Bereichskarten</li>
                                      <li><strong>Empfindlichkeitseinstellung:</strong> Niedrig/Mittel/Hoch für verschiedene Anwendungen</li>
                                  </ul>
                                  <h3 style="color:#5865F2;margin:20px 0 10px 0;">📊 Tracking-System</h3>
                                  <ul style="margin-left:20px;">
                                      <li><strong>Individuelles Tracking:</strong> Klicke auf Preview-Bereiche oder Bereichskarten</li>
                                      <li><strong>Konfigurierbar:</strong> Titel, Intervall (1-3600s), Dauer (0-1440min)</li>
                                      <li><strong>Live-Statistiken:</strong> Anzahl Messungen, Veränderungen und Quote in %</li>
                                      <li><strong>Verlaufshistorie:</strong> Letzte 20 Messungen mit Zeitstempel und Farbwerten</li>
                                      <li><strong>Export-Funktion:</strong> JSON-Export aller Tracking-Daten für Analyse</li>
                                  </ul>
                                  <h3 style="color:#5865F2;margin:20px 0 10px 0;">🔧 Einstellungen</h3>
                                  <ul style="margin-left:20px;">
                                      <li><strong>Intervall:</strong> 50-5000ms - Wie oft gemessen wird</li>
                                      <li><strong>Schwellwert:</strong> 0-255 - Ab welcher Farbdifferenz Änderungen erkannt werden</li>
                                      <li><strong>Empfindlichkeit:</strong> Multipliziert den Schwellwert (Niedrig x3, Hoch ÷2)</li>
                                  </ul>
                                  <h3 style="color:#5865F2;margin:20px 0 10px 0;">💡 Anwendungsbeispiele</h3>
                                  <ul style="margin-left:20px;">
                                      <li><strong>Software-Testing:</strong> Überwachung von Button-Zuständen, Ladebalken, Status-Indikatoren</li>
                                      <li><strong>System-Monitoring:</strong> Änderungen in Dashboards, Monitoring-Tools</li>
                                      <li><strong>Spiele-Analyse:</strong> Überwachung von Spiel-UI-Elementen, Health-Bars</li>
                                      <li><strong>Bildschirm-Automatisierung:</strong> Erkennung bestimmter Farbzustände für Workflows</li>
                                  </ul>
                                  <h3 style="color:#5865F2;margin:20px 0 10px 0;">⚡ Tipps & Tricks</h3>
                                  <ul style="margin-left:20px;">
                                      <li><strong>Performance:</strong> Verwende höhere Intervalle (500ms+) für bessere Performance</li>
                                      <li><strong>Präzision:</strong> Nutze "Manuelle Position" für spezifische Pixel-Überwachung</li>
                                      <li><strong>Batch-Tracking:</strong> Erstelle mehrere Trackings für verschiedene UI-Elemente</li>
                                      <li><strong>Export-Analyse:</strong> Nutze die JSON-Exports für detaillierte Datenanalyse</li>
                                  </ul>
                                  <h3 style="color:#ED4245;margin:20px 0 10px 0;">⚠️ Wichtige Hinweise</h3>
                                  <ul style="margin-left:20px;">
                                      <li><strong>Bildschirmfreigabe erforderlich:</strong> Funktioniert nur mit Screen Capture API</li>
                                      <li><strong>Nur für Testzwecke:</strong> Nicht für Überwachung privater Inhalte verwenden</li>
                                      <li><strong>Browser-Kompatibilität:</strong> Benötigt moderne Browser mit Screen Capture Support</li>
                                      <li><strong>Performance:</strong> Viele aktive Trackings können die Performance beeinträchtigen</li>
                                  </ul>
                              </div>
                              <div class="dialog-buttons" style="margin-top:30px;">
                                  <button class="btn-track" onclick="monitor.closeHelpDialog()" style="background-color:#5865F2;">Verstanden</button>
                              </div>
                          </div>
                         </div>`;
        document.body.insertAdjacentHTML('beforeend', helpHtml);
        document.addEventListener('keydown', this.handleHelpDialogEscape.bind(this));
        const overlay = document.getElementById('helpDialog');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeHelpDialog();
            }
        });
    }

    handleHelpDialogEscape(e) {
        if (e.key === 'Escape') {
            this.closeHelpDialog();
        }
    }

    closeHelpDialog() {
        const dialog = document.getElementById('helpDialog');
        if (dialog) {
            dialog.remove();
            document.removeEventListener('keydown', this.handleHelpDialogEscape);
        }
    }

    createTracking(areaId, x, y) {
        const title = document.getElementById('trackingTitle').value.trim();
        const interval = parseInt(document.getElementById('trackingInterval').value) * 1000;
        const duration = parseInt(document.getElementById('trackingDuration').value) * 60 * 1000;
        if (!title) {
            alert('Bitte geben Sie einen Titel ein!');
            return;
        }
        const trackingId = `tracking_${++this.trackingIdCounter}`;
        const tracking = {
            id: trackingId,
            title: title,
            x: x,
            y: y,
            areaId: areaId,
            interval: interval,
            duration: duration,
            startTime: Date.now(),
            endTime: duration > 0 ? Date.now() + duration : null,
            active: true,
            history: [],
            lastColor: null,
            intervalHandle: null
        };
        this.startTracking(tracking);
        this.activeTrackings.set(trackingId, tracking);
        this.updateTrackingUI();
        this.trackingSection.style.display = 'block';
        this.closeTrackingDialog();
        this.logEntry(`Tracking "${title}" gestartet`, false);
    }

    startTracking(tracking) {
        tracking.intervalHandle = setInterval(() => {
            if (!this.monitoring || !tracking.active) return;
            if (tracking.endTime && Date.now() > tracking.endTime) {
                this.stopTracking(tracking.id);
                return;
            }
            try {
                this.ctx.drawImage(this.video, 0, 0);
                const x = Math.max(0, Math.min(tracking.x, this.canvas.width - 1));
                const y = Math.max(0, Math.min(tracking.y, this.canvas.height - 1));
                const imageData = this.ctx.getImageData(x, y, 1, 1);
                if (!imageData || !imageData.data || imageData.data.length < 4) {
                    console.error(`Tracking: Ungültige ImageData für ${tracking.title}:`, imageData);
                    return;
                }
                let r = imageData.data[0];
                let g = imageData.data[1];
                let b = imageData.data[2];
                let a = imageData.data[3];
                if (r === undefined || g === undefined || b === undefined || a === undefined) {
                    console.error(`Tracking: Undefined Pixelwerte für ${tracking.title}: [${r},${g},${b},${a}]`);
                    r = r || 0;
                    g = g || 0;
                    b = b || 0;
                    a = a || 255;
                }
                if (a === 0) {
                    console.warn(`Tracking: Transparenter Pixel bei ${tracking.title}: Alpha=${a}`);
                    r = g = b = 255;
                }
                const currentColor = { r, g, b };
                let hasChanged = false;
                if (tracking.lastColor) {
                    const threshold = this.getThresholdValue();
                    const diffR = Math.abs(r - tracking.lastColor.r);
                    const diffG = Math.abs(g - tracking.lastColor.g);
                    const diffB = Math.abs(b - tracking.lastColor.b);
                    const totalDiff = diffR + diffG + diffB;
                    hasChanged = totalDiff > threshold;
                }
                const entry = {
                    timestamp: Date.now(),
                    color: currentColor,
                    changed: hasChanged,
                    diff: tracking.lastColor ? Math.abs(r - tracking.lastColor.r) + Math.abs(g - tracking.lastColor.g) + Math.abs(b - tracking.lastColor.b) : 0
                };
                tracking.history.push(entry);
                tracking.lastColor = currentColor;
                if (tracking.history.length > 1000) {
                    tracking.history.shift();
                }
                this.updateTrackingHistoryUI(tracking.id);
                this.updateTrackingStatistics(tracking.id);
            } catch (error) {
                console.error(`Tracking-Fehler für ${tracking.title}:`, error);
            }
        }, tracking.interval);
    }

    stopTracking(trackingId) {
        const tracking = this.activeTrackings.get(trackingId);
        if (!tracking) return;
        tracking.active = false;
        if (tracking.intervalHandle) {
            clearInterval(tracking.intervalHandle);
            tracking.intervalHandle = null;
        }
        this.updateTrackingUI();
        this.logEntry(`Tracking "${tracking.title}" gestoppt`, false);
    }

    updateTrackingUI() {
        this.trackingList.innerHTML = '';
        this.activeTrackings.forEach((tracking, id) => {
            const trackingElement = this.createTrackingElement(tracking);
            this.trackingList.appendChild(trackingElement);
        });
        if (this.activeTrackings.size === 0) {
            this.trackingSection.style.display = 'none';
        }
    }

    createTrackingElement(tracking) {
        const div = document.createElement('div');
        div.className = 'tracking-item';
        const totalEntries = tracking.history.length;
        const changedEntries = tracking.history.filter(e => e.changed).length;
        const unchangedEntries = totalEntries - changedEntries;
        const changeQuote = totalEntries > 0 ? (changedEntries / totalEntries * 100).toFixed(1) : 0;
        div.dataset.trackingId = tracking.id;
        div.innerHTML = `<div class="tracking-header">
                            <div class="tracking-title">${tracking.title}</div>
                            <div class="tracking-status ${tracking.active ? 'active' : 'inactive'}">${tracking.active ? 'AKTIV' : 'GESTOPPT'}</div>
                         </div>
                         <div class="tracking-info">Position: (${tracking.x}, ${tracking.y}) | Intervall: ${tracking.interval / 1000}s | Gestartet: ${new Date(tracking.startTime).toLocaleTimeString('de-DE')}</div>
                         <div class="tracking-info tracking-stats" style="margin-top:5px;color:#F0B232;">📊 Messungen: ${totalEntries} | Unverändert: ${unchangedEntries} | Verändert: ${changedEntries} | Quote: ${changeQuote}%</div>
                         <div class="tracking-history" id="history_${tracking.id}"></div>
                         <div class="tracking-controls">
                             ${tracking.active ? `<button class="btn-stop" onclick="monitor.stopTracking('${tracking.id}')">Stoppen</button>` : `<button class="btn-start" onclick="monitor.resumeTracking('${tracking.id}')">Fortsetzen</button>`}
                             <button class="btn-cancel" onclick="monitor.deleteTracking('${tracking.id}')">Löschen</button>
                             <button class="btn-track" onclick="monitor.exportTracking('${tracking.id}')">Exportieren</button>
                         </div>`;
        return div;
    }

    updateTrackingHistoryUI(trackingId) {
        const tracking = this.activeTrackings.get(trackingId);
        if (!tracking) return;
        const historyContainer = document.getElementById(`history_${trackingId}`);
        if (!historyContainer) return;
        const recentEntries = tracking.history.slice(-20);
        historyContainer.innerHTML = recentEntries.map(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString('de-DE');
            const colorStr = this.rgbToHex(entry.color.r, entry.color.g, entry.color.b);
            const status = entry.changed ? 'GEÄNDERT' : 'UNVERÄNDERT';
            return `<div class="history-entry ${entry.changed ? 'changed' : 'unchanged'}">
                        <span>${time} - ${status}</span>
                        <span>${colorStr} ${entry.changed ? `(Δ${entry.diff})` : ''}</span>
                    </div>`;
        }).join('');
        historyContainer.scrollTop = historyContainer.scrollHeight;
    }

    updateTrackingStatistics(trackingId) {
        const tracking = this.activeTrackings.get(trackingId);
        if (!tracking) return;
        const trackingElement = document.querySelector(`[data-tracking-id="${trackingId}"]`);
        if (!trackingElement) return;
        const totalEntries = tracking.history.length;
        const changedEntries = tracking.history.filter(e => e.changed).length;
        const unchangedEntries = totalEntries - changedEntries;
        const changeQuote = totalEntries > 0 ? (changedEntries / totalEntries * 100).toFixed(1) : 0;
        const statsElement = trackingElement.querySelector('.tracking-stats');
        if (statsElement) {
            statsElement.innerHTML = `📊 Messungen: ${totalEntries} | Unverändert: ${unchangedEntries} | Verändert: ${changedEntries} | Quote: ${changeQuote}%`;
        }
    }

    resumeTracking(trackingId) {
        const tracking = this.activeTrackings.get(trackingId);
        if (!tracking) return;
        tracking.active = true;
        this.startTracking(tracking);
        this.updateTrackingUI();
        this.logEntry(`Tracking "${tracking.title}" fortgesetzt`, false);
    }

    deleteTracking(trackingId) {
        if (!confirm('Tracking wirklich löschen? Die Historie geht verloren.')) return;
        const tracking = this.activeTrackings.get(trackingId);
        if (tracking && tracking.intervalHandle) {
            clearInterval(tracking.intervalHandle);
        }
        this.activeTrackings.delete(trackingId);
        this.updateTrackingUI();
        if (tracking) {
            this.logEntry(`Tracking "${tracking.title}" gelöscht`, false);
        }
    }

    exportTracking(trackingId) {
        const tracking = this.activeTrackings.get(trackingId);
        if (!tracking) return;
        const data = {
            title: tracking.title,
            position: { x: tracking.x, y: tracking.y },
            startTime: tracking.startTime,
            endTime: tracking.endTime,
            interval: tracking.interval,
            totalEntries: tracking.history.length,
            changedEntries: tracking.history.filter(e => e.changed).length,
            history: tracking.history.map(entry => ({
                timestamp: entry.timestamp,
                time: new Date(entry.timestamp).toISOString(),
                color: entry.color,
                changed: entry.changed,
                diff: entry.diff
            }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tracking_${tracking.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.logEntry(`Tracking "${tracking.title}" exportiert`, false);
    }
}

const monitor = new PixelMonitor();
window.monitor = monitor;

window.testDraw = function() {
    if (monitor.video && monitor.ctx) {
        console.log('Manueller Frame-Draw Test...');
        try {
            monitor.ctx.drawImage(monitor.video, 0, 0);
            const testPixel = monitor.ctx.getImageData(100, 100, 1, 1).data;
            console.log('Test-Pixel nach manuellem Draw:', testPixel, 'HEX:', monitor.rgbToHex(testPixel[0], testPixel[1], testPixel[2]));
            monitor.ctx.fillStyle = 'green';
            monitor.ctx.fillRect(100, 100, 20, 20);
            console.log('Grünes Rechteck bei (100,100) gezeichnet');
        } catch (err) {
            console.error('Fehler beim Test-Draw:', err);
        }
    } else {
        console.log('Video oder Canvas nicht bereit');
    }
};

window.scanPixels = function() {
    if (!monitor.monitoring || !monitor.ctx) {
        console.log('Monitor muss aktiv sein!');
        return;
    }
    const centerX = parseInt(monitor.xInput.value);
    const centerY = parseInt(monitor.yInput.value);
    console.log('=== PIXEL SCAN 5x5 um Position (' + centerX + ',' + centerY + ') ===');
    for (let dy = -2; dy <= 2; dy++) {
        let row = '';
        for (let dx = -2; dx <= 2; dx++) {
            const x = centerX + dx * 20;
            const y = centerY + dy * 20;
            try {
                const pixel = monitor.ctx.getImageData(x, y, 1, 1).data;
                const color = monitor.rgbToHex(pixel[0], pixel[1], pixel[2]);
                row += `(${x},${y}): ${color} | `;
            } catch (e) {
                row += `(${x},${y}): ERROR | `;
            }
        }
        console.log(row);
    }
    console.log('=== SCAN ENDE ===');
    monitor.logEntry('Pixel-Scan durchgeführt (siehe Konsole)', false);
};

window.findActiveArea = function() {
    if (!monitor.monitoring || !monitor.ctx || !monitor.video) {
        console.log('Monitor muss aktiv sein!');
        return;
    }
    console.log('Suche nach aktivem Bereich...');
    monitor.logEntry('Suche aktiven Bereich...', false);
    const width = monitor.canvas.width;
    const height = monitor.canvas.height;
    const samples = 10;
    let maxDiff = 0;
    let bestX = width / 2;
    let bestY = height / 2;
    const frame1Data = monitor.ctx.getImageData(0, 0, width, height);
    setTimeout(() => {
        monitor.ctx.drawImage(monitor.video, 0, 0);
        const frame2Data = monitor.ctx.getImageData(0, 0, width, height);
        for (let i = 0; i < samples; i++) {
            for (let j = 0; j < samples; j++) {
                const x = Math.floor((i + 0.5) * width / samples);
                const y = Math.floor((j + 0.5) * height / samples);
                const idx = (y * width + x) * 4;
                const diff = Math.abs(frame1Data.data[idx] - frame2Data.data[idx]) +
                    Math.abs(frame1Data.data[idx + 1] - frame2Data.data[idx + 1]) +
                    Math.abs(frame1Data.data[idx + 2] - frame2Data.data[idx + 2]);
                if (diff > maxDiff) {
                    maxDiff = diff;
                    bestX = x;
                    bestY = y;
                }
            }
        }
        if (maxDiff > 0) {
            console.log(`Aktivster Bereich gefunden bei (${bestX}, ${bestY}) mit Differenz: ${maxDiff}`);
            monitor.xInput.value = bestX;
            monitor.yInput.value = bestY;
            monitor.logEntry(`Aktiver Bereich: (${bestX}, ${bestY})`, true);
            monitor.setupMonitoringAreas();
        } else {
            console.log('Kein aktiver Bereich gefunden - Bild scheint statisch zu sein');
            monitor.logEntry('Kein aktiver Bereich gefunden', false);
        }
    }, 500);
};