let recognition;
let isRecording = false;
let finalTranscript = '';
let audioContext;
let analyser;
let dataArray;
let source;
let animationId;
let canvas;
let canvasCtx;
let userStoppedRecording = false;

// Initialize canvas
canvas = document.getElementById('spectrum');
canvasCtx = canvas.getContext('2d');

// Enhanced browser and mobile support check with detailed debugging
function checkSpeechRecognitionSupport() {
    const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window;
    const hasSpeechRecognition = 'SpeechRecognition' in window;
    const userAgent = navigator.userAgent;
    
    // Improved mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /Android/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent) && !/Edg|OPR/i.test(userAgent);
    const isSamsung = /SamsungBrowser/i.test(userAgent);
    
    console.log('Browser detection:', {
        hasWebkitSpeechRecognition,
        hasSpeechRecognition,
        isAndroid,
        isChrome,
        isSamsung,
        userAgent: navigator.userAgent
    });
    
    // Force detection for known Android browsers
    if (!isAndroid && userAgent.includes('Android')) {
        console.warn('Android not detected properly, forcing detection');
    }
    
    if (!hasWebkitSpeechRecognition && !hasSpeechRecognition) {
        let errorMsg = '❌ Spracherkennung wird von diesem Browser nicht unterstützt';
        
        if (isMobile) {
            if (isIOS) {
                errorMsg += '<br>📱 Auf iOS: Verwende Safari Browser';
            } else if (isAndroid) {
                if (isSamsung) {
                    errorMsg += '<br>📱 Samsung Browser erkannt - verwende Google Chrome';
                } else {
                    errorMsg += '<br>📱 Auf Android: Verwende Google Chrome Browser';
                }
            } else {
                errorMsg += '<br>📱 Verwende Chrome oder Safari';
            }
        } else {
            errorMsg += '<br>💻 Verwende Chrome, Edge oder Safari';
        }
        
        document.getElementById('status').innerHTML = errorMsg;
        document.getElementById('status').className = 'status error';
        document.getElementById('startBtn').disabled = true;
        return false;
    }
    
    // Android-specific browser warnings
    if (isAndroid) {
        if (isSamsung) {
            document.getElementById('status').innerHTML = '⚠️ Samsung Browser erkannt - für beste Ergebnisse verwende Google Chrome';
            document.getElementById('status').className = 'status';
        } else if (!isChrome) {
            document.getElementById('status').innerHTML = '⚠️ Für beste Android-Kompatibilität verwende Google Chrome';
            document.getElementById('status').className = 'status';
        } else {
            document.getElementById('status').innerHTML = '✅ Chrome auf Android erkannt - bereit für Aufnahme';
            document.getElementById('status').className = 'status';
        }
    }
    
    return true;
}

if (checkSpeechRecognitionSupport()) {
    // Skip initializeRecognition for Android compatibility
    initializeAudioVisualization();
    
    // Initialize UI state
    updateUI();
    
    // Set initial status
    document.getElementById('status').innerHTML = 'Bereit zur Aufnahme';
    document.getElementById('status').className = 'status';
}


// Shared debug info function
function showDebugInfo() {
    const info = {
        'User Agent': navigator.userAgent,
        'Speech Recognition': !!(window.SpeechRecognition || window.webkitSpeechRecognition),
        'MediaDevices': !!navigator.mediaDevices,
        'getUserMedia': !!navigator.mediaDevices?.getUserMedia,
        'Is Recording': isRecording,
        'Recognition Object': !!recognition,
        'Current Language': document.getElementById('language').value,
        'Continuous Mode': document.getElementById('continuous').value,
        'Protocol': window.location.protocol,
        'Host': window.location.host,
        'Browser': getBrowserInfo(),
        'Platform': navigator.platform || 'Unknown'
    };
    
    let debugText = 'DEBUG INFORMATIONEN:\n\n';
    for (const [key, value] of Object.entries(info)) {
        debugText += `${key}: ${value}\n`;
    }
    
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.className = 'debug-overlay';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'debug-dialog';
    
    // Create dialog content
    dialog.innerHTML = `
        <div class="debug-header">
            <h3>🔍 Debug Informationen</h3>
            <button class="debug-close" type="button">×</button>
        </div>
        <div class="debug-content">${debugText}</div>
        <div class="debug-actions">
            <button class="debug-button-action debug-cancel" type="button">Schließen</button>
            <button class="debug-button-action debug-copy" type="button">📋 Kopieren</button>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Add event listeners
    const closeBtn = dialog.querySelector('.debug-close');
    const cancelBtn = dialog.querySelector('.debug-cancel');
    const copyBtn = dialog.querySelector('.debug-copy');
    
    function closeDialog() {
        document.body.removeChild(overlay);
    }
    
    // Close button handlers
    closeBtn.addEventListener('click', closeDialog);
    cancelBtn.addEventListener('click', closeDialog);
    
    // Click outside to close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeDialog();
        }
    });
    
    // ESC key to close
    function handleKeyPress(e) {
        if (e.key === 'Escape') {
            closeDialog();
            document.removeEventListener('keydown', handleKeyPress);
        }
    }
    document.addEventListener('keydown', handleKeyPress);
    
    // Copy button handler
    copyBtn.addEventListener('click', function() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(debugText)
                .then(() => {
                    copyBtn.innerHTML = '✅ Kopiert!';
                    copyBtn.style.background = 'var(--accent-green)';
                    setTimeout(() => {
                        copyBtn.innerHTML = '📋 Kopieren';
                        copyBtn.style.background = 'var(--accent-blue)';
                    }, 2000);
                })
                .catch((err) => {
                    console.error('Clipboard error:', err);
                    fallbackCopy();
                });
        } else {
            fallbackCopy();
        }
        
        function fallbackCopy() {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = debugText;
            textArea.style.position = 'fixed';
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                copyBtn.innerHTML = '✅ Kopiert!';
                copyBtn.style.background = 'var(--accent-green)';
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 Kopieren';
                    copyBtn.style.background = 'var(--accent-blue)';
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
                copyBtn.innerHTML = '❌ Fehler';
                copyBtn.style.background = 'var(--accent-red)';
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 Kopieren';
                    copyBtn.style.background = 'var(--accent-blue)';
                }, 2000);
            }
            
            document.body.removeChild(textArea);
        }
    });
    
    // Log to console as well
    console.log(debugText);
}

function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
    return 'Unknown';
}

// Store previous transcript for comparison
let previousFinalTranscript = '';

// Update transcript with letter-by-letter typewriter animation
function updateTranscriptWithAnimation(element, finalText, interimText) {
    // Remove placeholder if present
    const placeholder = element.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    // Find new text
    const newText = finalText.substring(previousFinalTranscript.length);
    
    if (newText) {
        // Type new text letter by letter
        typeText(element, newText, () => {
            // After typing is complete, add interim text
            if (interimText) {
                const interimSpan = document.createElement('span');
                interimSpan.className = 'interim-text';
                interimSpan.textContent = interimText;
                element.appendChild(interimSpan);
            }
        });
    } else if (interimText) {
        // Only update interim text
        // Remove old interim text
        const oldInterim = element.querySelector('.interim-text');
        if (oldInterim) {
            oldInterim.remove();
        }
        
        // Add new interim text
        const interimSpan = document.createElement('span');
        interimSpan.className = 'interim-text';
        interimSpan.textContent = interimText;
        element.appendChild(interimSpan);
    }
    
    // Update previous transcript
    if (finalText.length > previousFinalTranscript.length) {
        previousFinalTranscript = finalText;
    }
}

// Type text letter by letter like a typewriter
function typeText(element, text, callback) {
    if (!text) {
        if (callback) callback();
        return;
    }
    
    // Remove old interim text first
    const oldInterim = element.querySelector('.interim-text');
    if (oldInterim) {
        oldInterim.remove();
    }
    
    // Remove cursor if present
    const oldCursor = element.querySelector('.cursor');
    if (oldCursor) {
        oldCursor.remove();
    }
    
    // Create typing container
    const typingContainer = document.createElement('span');
    typingContainer.className = 'typing-word';
    
    // Add cursor
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    
    element.appendChild(typingContainer);
    element.appendChild(cursor);
    
    // Type each character
    let charIndex = 0;
    const typeSpeed = 50; // ms per character
    
    const typeInterval = setInterval(() => {
        if (charIndex < text.length) {
            const char = text[charIndex];
            const letterSpan = document.createElement('span');
            letterSpan.className = 'typing-letter';
            letterSpan.textContent = char;
            letterSpan.style.animationDelay = '0ms';
            
            typingContainer.appendChild(letterSpan);
            charIndex++;
            
            // Scroll to bottom
            element.scrollTop = element.scrollHeight;
        } else {
            // Typing complete
            clearInterval(typeInterval);
            
            // Remove cursor
            cursor.remove();
            
            // Replace typing spans with plain text
            typingContainer.innerHTML = text;
            typingContainer.className = '';
            
            if (callback) callback();
        }
    }, typeSpeed);
}

// Clear typing intervals when stopping
let currentTypingInterval = null;

function stopAllTyping() {
    if (currentTypingInterval) {
        clearInterval(currentTypingInterval);
        currentTypingInterval = null;
    }
}


function initializeRecognition() {
    // Don't initialize here for Android - do it fresh each time in startRecognition
    console.log('initializeRecognition called - skipping for Android compatibility');
    // All initialization moved to startRecognition function
}

function initializeAudioVisualization() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        console.log('Audio visualization initialized');
    } catch (e) {
        console.log('Audio visualization not supported:', e);
    }
}


// Add debug functionality to mobile button
document.getElementById('mobile-debug-btn').addEventListener('click', function() {
    showDebugInfo();
});

function startVisualization() {
    if (!audioContext || !analyser) {
        // Fallback: simple animated pulse without microphone access
        drawSimplePulse();
        return;
    }
    
    // Try to get microphone access for real spectrum
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            drawSpectrum();
        })
        .catch(err => {
            console.log('Microphone access denied for visualization, using simple pulse');
            // Fallback to simple pulse animation
            drawSimplePulse();
        });
}

function stopVisualization() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (source) {
        source.disconnect();
        source = null;
    }
    clearCanvas();
}

function drawSpectrum() {
    if (!isRecording) return;
    
    animationId = requestAnimationFrame(drawSpectrum);
    
    analyser.getByteFrequencyData(dataArray);
    
    // Clear with very subtle background
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = Math.max(2, canvas.width / dataArray.length);
    let x = 0;
    
    // Draw only lower frequencies for cleaner look
    const maxBars = Math.min(64, dataArray.length);
    
    for (let i = 0; i < maxBars; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.3; // Very subtle height
        
        // Very subtle single color
        const intensity = dataArray[i] / 255;
        const alpha = Math.max(0.05, intensity * 0.2); // Very low opacity
        
        // Single soft blue color
        canvasCtx.fillStyle = `rgba(104, 141, 177, ${alpha})`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth;
    }
}

function drawSimplePulse() {
    if (!isRecording) return;
    
    animationId = requestAnimationFrame(drawSimplePulse);
    
    // Clear canvas
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Simple animated bars to show recording activity
    const time = Date.now() * 0.003;
    const centerY = canvas.height / 2;
    const barCount = 20;
    const barWidth = canvas.width / barCount;
    
    for (let i = 0; i < barCount; i++) {
        // Create wave-like animation
        const wave = Math.sin(time + i * 0.3) * 0.5 + 0.5;
        const barHeight = wave * canvas.height * 0.2; // Very subtle
        
        // Very subtle single color
        const alpha = 0.1 + wave * 0.1;
        canvasCtx.fillStyle = `rgba(104, 141, 177, ${alpha})`;
        
        const x = i * barWidth;
        canvasCtx.fillRect(x, centerY - barHeight/2, barWidth - 1, barHeight);
    }
}

function clearCanvas() {
    canvasCtx.fillStyle = 'rgba(43, 46, 59, 1)'; // Match background
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

function startRecognition() {
    console.log('=== startRecognition called ===');
    
    // Check HTTPS requirement on mobile
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        document.getElementById('status').innerHTML = '❌ HTTPS erforderlich! Speech Recognition funktioniert auf mobilen Geräten nur über HTTPS.';
        document.getElementById('status').className = 'status error';
        return;
    }
    
    const statusEl = document.getElementById('status');
    const transcriptEl = document.getElementById('transcript');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
        // Check if API exists
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            statusEl.innerHTML = '❌ Speech Recognition API nicht verfügbar';
            statusEl.className = 'status error';
            return;
        }
        
        // Use simple mode for mobile, full mode for desktop
        if (isMobile) {
            // MOBILE: Ultra-simple mode (exact copy of working test)
            userStoppedRecording = false; // Add stop flag for mobile too
            
            recognition = new SpeechRecognition();
            recognition.lang = 'de-DE';
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            
            // Minimal handlers (exact copy of working test)
            recognition.onresult = function(event) {
                console.log('=== SUCCESS: Result received ===', event);
                const result = event.results[0][0].transcript;
                statusEl.innerHTML = '✅ Erkannt: "' + result + '"';
                statusEl.className = 'status';
                
                // Clear placeholder
                if (transcriptEl.innerHTML.includes('placeholder')) {
                    transcriptEl.innerHTML = '';
                }
                transcriptEl.innerHTML += result + ' ';
            };
            
            recognition.onerror = function(event) {
                console.log('=== ERROR ===', event.error, event);
                statusEl.innerHTML = '❌ Fehler: ' + event.error;
                statusEl.className = 'status error';
                // Reset UI state on error
                isRecording = false;
                updateUI();
            };
            
            recognition.onstart = function() {
                console.log('=== Recognition started ===');
                statusEl.innerHTML = '🎤 Sprich jetzt!';
                statusEl.className = 'status listening';
            };
            
            recognition.onend = function() {
                console.log('=== Recognition ended ===');
                
                // Auto-restart for continuous listening on mobile (only if not manually stopped)
                const continuousMode = document.getElementById('continuous').value === 'true';
                if (continuousMode && !userStoppedRecording) {
                    console.log('=== Mobile auto-restart ===');
                    setTimeout(() => {
                        try {
                            if (!userStoppedRecording) { // Double-check
                                statusEl.innerHTML = '🔄 Neustart...';
                                recognition.start();
                            }
                        } catch (e) {
                            console.error('Mobile auto-restart failed:', e);
                            statusEl.innerHTML = '✅ Aufnahme beendet';
                            statusEl.className = 'status';
                            // Reset UI state on failure
                            isRecording = false;
                            updateUI();
                        }
                    }, 500); // Längere Pause für mobile
                } else {
                    // End recording - update UI
                    statusEl.innerHTML = '✅ Aufnahme beendet';
                    statusEl.className = 'status';
                    isRecording = false;
                    updateUI();
                }
            };
            
        } else {
            // DESKTOP: Full featured mode
            userStoppedRecording = false;
            
            recognition = new SpeechRecognition();
            recognition.lang = document.getElementById('language').value || 'de-DE';
            recognition.continuous = document.getElementById('continuous').value === 'true';
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            
            isRecording = true;
            updateUI();
            startVisualization();
            document.querySelector('.spectrum-container').classList.add('active');
            
            // Full desktop handlers with animations
            recognition.onresult = function(event) {
                console.log('Desktop result received:', event);
                
                let interimTranscript = '';
                let finalText = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalText += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (finalText) {
                    finalTranscript += finalText;
                    updateTranscriptWithAnimation(transcriptEl, finalTranscript, interimTranscript);
                    statusEl.innerHTML = '🎤 Höre zu... (zum Stoppen klicken Sie "Stoppen")';
                    statusEl.className = 'status listening';
                } else if (interimTranscript) {
                    updateTranscriptWithAnimation(transcriptEl, finalTranscript, interimTranscript);
                }
            };
            
            recognition.onerror = function(event) {
                console.error('Desktop recognition error:', event.error, event);
                
                if (event.error === 'aborted' && userStoppedRecording) {
                    console.log('Recognition aborted by user - this is expected');
                    return;
                }
                
                statusEl.innerHTML = '❌ Fehler: ' + event.error;
                statusEl.className = 'status error';
                
                isRecording = false;
                updateUI();
                stopVisualization();
                document.querySelector('.spectrum-container').classList.remove('active');
            };
            
            recognition.onstart = function() {
                console.log('Desktop recognition started successfully');
                statusEl.innerHTML = '🎤 Höre zu... (zum Stoppen klicken Sie "Stoppen")';
                statusEl.className = 'status listening';
            };
            
            recognition.onend = function() {
                console.log('Desktop recognition ended');
                
                if (isRecording && !userStoppedRecording && document.getElementById('continuous').value === 'true') {
                    console.log('Auto-restarting for continuous mode');
                    setTimeout(() => {
                        if (isRecording && !userStoppedRecording) {
                            try {
                                recognition.start();
                            } catch (e) {
                                console.error('Auto-restart failed:', e);
                                isRecording = false;
                                updateUI();
                            }
                        }
                    }, 100);
                } else {
                    isRecording = false;
                    updateUI();
                    stopVisualization();
                    document.querySelector('.spectrum-container').classList.remove('active');
                    
                    if (!userStoppedRecording) {
                        statusEl.innerHTML = '✅ Aufnahme beendet';
                        statusEl.className = 'status';
                    }
                }
            };
        }
        
        // Start recognition
        if (isMobile) {
            // Mobile: Ultra-simple start with UI update
            isRecording = true;
            updateUI();
            statusEl.innerHTML = '🔄 Starte...';
            statusEl.className = 'status';
            console.log('=== Calling recognition.start() ===');
            recognition.start();
        } else {
            // Desktop: Full start
            statusEl.innerHTML = '🔄 Starte Spracherkennung...';
            statusEl.className = 'status';
            console.log('Starting speech recognition (desktop mode)');
            recognition.start();
        }
        
    } catch (error) {
        console.error('Start recognition error:', error);
        statusEl.innerHTML = '❌ Fehler beim Starten: ' + error.message;
        statusEl.className = 'status error';
        
        // Reset state on error for both mobile and desktop
        isRecording = false;
        updateUI();
    }
}

function stopRecognition() {
    console.log('stopRecognition called, isRecording:', isRecording);
    
    // Mark that user intentionally stopped recording
    userStoppedRecording = true;
    
    // Force stop recording state immediately
    isRecording = false;
    
    if (recognition) {
        try {
            console.log('Calling recognition.stop()');
            recognition.stop();
            recognition.abort(); // Force abort as backup
        } catch (e) {
            console.error('Error stopping recognition:', e);
        }
    }
    
    // Clean up visualization
    stopVisualization();
    
    // Update UI immediately
    updateUI();
    
    // Update status
    document.getElementById('status').innerHTML = '⏹️ Aufnahme gestoppt';
    document.getElementById('status').className = 'status';
    
    // Hide spectrum container
    document.querySelector('.spectrum-container').classList.remove('active');
    
    console.log('Stop recognition completed, isRecording:', isRecording);
}

function clearTranscript() {
    finalTranscript = '';
    previousFinalTranscript = '';
    stopAllTyping();
    
    const transcriptElement = document.getElementById('transcript');
    transcriptElement.innerHTML = '<span class="placeholder">Hier erscheint dein gesprochener Text...</span>';
    
    document.getElementById('status').innerHTML = '🗑️ Text gelöscht';
    document.getElementById('status').className = 'status';
    
    // Fade out spectrum
    document.querySelector('.spectrum-container').classList.remove('active');
}

function copyToClipboard() {
    const text = document.getElementById('transcript').textContent;
    if (text && text !== 'Hier erscheint dein gesprochener Text...') {
        navigator.clipboard.writeText(text).then(() => {
            const statusElement = document.getElementById('status');
            statusElement.innerHTML = '📋 Text in Zwischenablage kopiert';
            statusElement.className = 'status fade-in';
            
            // Add success animation
            setTimeout(() => {
                statusElement.classList.remove('fade-in');
            }, 300);
        });
    }
}

function updateUI() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const languageSelect = document.getElementById('language');
    const continuousSelect = document.getElementById('continuous');

    console.log('Updating UI, isRecording:', isRecording);

    if (isRecording) {
        // Recording state
        startBtn.disabled = true;
        stopBtn.disabled = false;
        startBtn.classList.add('recording-active');
        startBtn.innerHTML = '<span class="mic-icon">🔴</span><span>Aufnahme läuft...</span>';
        
        // Disable settings during recording
        languageSelect.disabled = true;
        continuousSelect.disabled = true;
        
        // Visual feedback for disabled selects
        languageSelect.style.opacity = '0.5';
        continuousSelect.style.opacity = '0.5';
        languageSelect.title = 'Sprache kann nur geändert werden, wenn Aufnahme pausiert ist';
        continuousSelect.title = 'Modus kann nur geändert werden, wenn Aufnahme pausiert ist';
    } else {
        // Stopped state
        startBtn.disabled = false;
        stopBtn.disabled = true;
        startBtn.classList.remove('recording-active');
        startBtn.innerHTML = '<span class="mic-icon">🎤</span><span>Aufnahme starten</span>';
        
        // Enable settings when not recording
        languageSelect.disabled = false;
        continuousSelect.disabled = false;
        
        // Reset visual feedback
        languageSelect.style.opacity = '1';
        continuousSelect.style.opacity = '1';
        languageSelect.title = '';
        continuousSelect.title = '';
    }
}

// Update recognition settings when changed (only when not recording)
document.getElementById('language').addEventListener('change', function () {
    if (isRecording) {
        // Prevent change during recording
        console.log('Language change blocked during recording');
        return;
    }
    
    console.log('Language changed to:', this.value);
    document.getElementById('status').innerHTML = `🌐 Sprache geändert zu: ${this.options[this.selectedIndex].text}`;
    document.getElementById('status').className = 'status';
});

document.getElementById('continuous').addEventListener('change', function () {
    if (isRecording) {
        // Prevent change during recording
        console.log('Mode change blocked during recording');
        return;
    }
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const modeName = this.value === 'true' ? 'Kontinuierlich' : 'Einzelne Sätze';
    
    console.log('Mode changed to:', modeName);
    document.getElementById('status').innerHTML = `🔁 Modus geändert zu: ${modeName}`;
    document.getElementById('status').className = 'status';
    
    // Show mobile notice
    if (isMobile && this.value === 'true') {
        document.getElementById('status').innerHTML = `📱 ${modeName} (auf Mobile durch Auto-Restart simuliert)`;
    }
});

// Add event listeners for buttons with mobile optimization
document.getElementById('startBtn').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('=== Start button CLICKED ===');
    
    // Check HTTPS requirement on mobile
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        document.getElementById('status').innerHTML = '❌ HTTPS erforderlich! Speech Recognition funktioniert auf mobilen Geräten nur über HTTPS.';
        document.getElementById('status').className = 'status error';
        return;
    }
    
    startRecognition();
});

// Also add touch event for mobile with passive option
document.getElementById('startBtn').addEventListener('touchstart', function(e) {
    e.preventDefault();
    console.log('Start button touched');
}, { passive: false });

// Add touchend event for better mobile support
document.getElementById('startBtn').addEventListener('touchend', function(e) {
    e.preventDefault();
    console.log('=== Start button TOUCH END ===');
    
    // Check HTTPS requirement on mobile
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        document.getElementById('status').innerHTML = '❌ HTTPS erforderlich! Speech Recognition funktioniert auf mobilen Geräten nur über HTTPS.';
        document.getElementById('status').className = 'status error';
        return;
    }
    
    // Small delay to prevent double triggering
    setTimeout(() => {
        startRecognition();
    }, 100);
}, { passive: false });

document.getElementById('stopBtn').addEventListener('click', function(e) {
    e.preventDefault();
    stopRecognition();
});

document.getElementById('clearBtn').addEventListener('click', function(e) {
    e.preventDefault();
    clearTranscript();
});

document.getElementById('copyBtn').addEventListener('click', function(e) {
    e.preventDefault();
    copyToClipboard();
});

// Mobile-specific optimizations
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);

if (isMobile) {
    // Prevent zoom on double tap for buttons
    document.querySelectorAll('button').forEach(button => {
        button.style.touchAction = 'manipulation';
        button.addEventListener('touchend', function(e) {
            // Don't prevent default here as it can interfere with click events
        });
    });
    
    // Show mobile-specific instructions with debugging
    setTimeout(() => {
        const statusElement = document.getElementById('status');
        if (statusElement.textContent.includes('Klicke auf') || statusElement.textContent.includes('bereit')) {
            if (isAndroid) {
                statusElement.innerHTML = '📱 Android erkannt: Tippe "Aufnahme starten" und erlaube Mikrofon-Zugriff wenn gefragt';
            } else {
                statusElement.innerHTML = '📱 Mobile erkannt: Tippe "Aufnahme starten" und erlaube Mikrofon-Zugriff';
            }
        }
    }, 1500);
    
    // Debug info for Android
    if (isAndroid) {
        console.log('Android device detected');
        console.log('User agent:', navigator.userAgent);
        console.log('MediaDevices available:', !!navigator.mediaDevices);
        console.log('getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
    }
}