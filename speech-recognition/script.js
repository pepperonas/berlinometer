let recognition;
let isRecording = false;
let finalTranscript = '';
let userStoppedRecording = false;
let recordingStartTime = null;
let timestampsEnabled = true;

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

// Timestamp functionality
function formatTimestamp(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function addTimestamp(text) {
    if (!recordingStartTime) {
        return text + ' ';
    }
    
    const currentTime = Date.now();
    const elapsed = currentTime - recordingStartTime;
    const timestamp = formatTimestamp(elapsed);
    
    return `[${timestamp}] ${text}\n`;
}

function addTimestampToElement(element, text) {
    // Remove placeholder if present
    const placeholder = element.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    if (!recordingStartTime || !areTimestampsEnabled()) {
        // Add text without timestamp
        const textNode = document.createTextNode(text + ' ');
        element.appendChild(textNode);
        return;
    }
    
    const currentTime = Date.now();
    const elapsed = currentTime - recordingStartTime;
    const timestamp = formatTimestamp(elapsed);
    
    // Create line container
    const lineDiv = document.createElement('div');
    lineDiv.className = 'transcript-line';
    
    // Create timestamp span
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'timestamp';
    timestampSpan.textContent = timestamp;
    
    // Create text span
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    
    // Append to line
    lineDiv.appendChild(timestampSpan);
    lineDiv.appendChild(textSpan);
    
    // Append line to element
    element.appendChild(lineDiv);
    
    // Auto-scroll to bottom
    element.scrollTop = element.scrollHeight;
}

function displayInterimText(element, interimText) {
    // Remove old interim text
    const oldInterim = element.querySelector('.interim-text');
    if (oldInterim) {
        oldInterim.remove();
    }
    
    if (interimText) {
        // Add new interim text
        const interimSpan = document.createElement('span');
        interimSpan.className = 'interim-text';
        interimSpan.textContent = interimText;
        element.appendChild(interimSpan);
    }
    
    // Auto-scroll to bottom
    element.scrollTop = element.scrollHeight;
}

// Check if timestamps are enabled
function areTimestampsEnabled() {
    return document.getElementById('timestamps').value === 'true';
}

// Audio Visualization
let audioContext;
let analyser;
let microphone;
let dataArray;
let bufferLength;
let canvas;
let canvasCtx;
let animationId;
let isVisualizationActive = false;

function initAudioVisualization() {
    canvas = document.getElementById('audioCanvas');
    canvasCtx = canvas.getContext('2d');
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Set canvas style size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
}

async function startAudioVisualization() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported');
        showStatus('❌ Audio-Visualisierung nicht unterstützt');
        return;
    }
    
    try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        // Configure analyser
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Connect microphone to analyser
        microphone.connect(analyser);
        
        isVisualizationActive = true;
        document.querySelector('.audio-viz-section').classList.add('active');
        document.getElementById('vizToggle').classList.add('active');
        
        // Start animation loop
        drawVisualization();
        
        console.log('Audio visualization started');
        
    } catch (error) {
        console.error('Error starting audio visualization:', error);
        showStatus('❌ Mikrofon-Zugriff für Visualisierung fehlgeschlagen');
    }
}

function stopAudioVisualization() {
    isVisualizationActive = false;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }
    
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    document.querySelector('.audio-viz-section').classList.remove('active');
    document.getElementById('vizToggle').classList.remove('active');
    
    // Clear canvas
    if (canvasCtx) {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Reset volume meter
    document.getElementById('volumeFill').style.width = '0%';
    document.getElementById('volumeLevel').textContent = '0%';
    
    console.log('Audio visualization stopped');
}

function drawVisualization() {
    if (!isVisualizationActive) return;
    
    animationId = requestAnimationFrame(drawVisualization);
    
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas
    canvasCtx.fillStyle = 'rgba(43, 46, 59, 0.3)';
    canvasCtx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
    
    // Calculate bar width
    const barWidth = (canvas.width / window.devicePixelRatio) / bufferLength * 2.5;
    let barHeight;
    let x = 0;
    
    // Calculate volume level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const volume = Math.round((average / 255) * 100);
    
    // Update volume meter
    document.getElementById('volumeFill').style.width = volume + '%';
    document.getElementById('volumeLevel').textContent = volume + '%';
    
    // Draw frequency bars
    for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * (canvas.height / window.devicePixelRatio);
        
        // Create gradient based on frequency
        const hue = (i / bufferLength) * 360;
        canvasCtx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        
        canvasCtx.fillRect(x, (canvas.height / window.devicePixelRatio) - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
    }
}

function toggleAudioVisualization() {
    const visualizer = document.getElementById('audioVisualizer');
    const button = document.getElementById('vizToggle');
    
    if (visualizer.classList.contains('show')) {
        // Hide and stop visualization
        visualizer.classList.remove('show');
        button.classList.remove('active');
        stopAudioVisualization();
    } else {
        // Show and start visualization
        visualizer.classList.add('show');
        initAudioVisualization();
        if (isRecording) {
            startAudioVisualization();
        }
    }
}




// Add debug functionality to mobile button
document.getElementById('mobile-debug-btn').addEventListener('click', function() {
    showDebugInfo();
});


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
            recognition.lang = document.getElementById('language').value || 'de-DE';
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            
            // Minimal handlers (exact copy of working test)
            recognition.onresult = function(event) {
                console.log('=== MOBILE SUCCESS: Result received ===', event);
                console.log('=== Results array length:', event.results.length);
                console.log('=== First result:', event.results[0]);
                
                const result = event.results[0][0].transcript;
                console.log('=== Extracted text:', result);
                
                statusEl.innerHTML = '✅ Erkannt: "' + result + '"';
                statusEl.className = 'status';
                
                // Simple text insertion for Android stability
                console.log('=== Current transcript content:', transcriptEl.textContent);
                
                // Clear placeholder if present
                if (transcriptEl.textContent.includes('Hier erscheint dein gesprochener Text')) {
                    console.log('=== Clearing placeholder');
                    transcriptEl.textContent = '';
                }
                
                // Add text with proper timestamp formatting
                addTimestampToElement(transcriptEl, result);
                console.log('=== Text added with timestamp formatting');
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
                recordingStartTime = Date.now();
                statusEl.innerHTML = '🎤 Sprich jetzt!';
                statusEl.className = 'status listening';
            };
            
            recognition.onend = function() {
                console.log('=== Recognition ended ===', 'isRecording:', isRecording, 'userStopped:', userStoppedRecording);
                
                // Auto-restart for continuous listening on mobile (only if not manually stopped)
                const continuousMode = document.getElementById('continuous').value === 'true';
                if (continuousMode && !userStoppedRecording && isRecording) {
                    console.log('=== Mobile auto-restart ===');
                    setTimeout(() => {
                        try {
                            // Triple-check: still recording, not user stopped, and recognition is not already running
                            if (!userStoppedRecording && isRecording && recognition.readyState !== 'running') {
                                console.log('Restarting speech recognition...');
                                statusEl.innerHTML = '🔄 Neustart...';
                                recognition.start();
                            } else {
                                console.log('Skip restart - conditions not met');
                                isRecording = false;
                                updateUI();
                            }
                        } catch (e) {
                            console.error('Mobile auto-restart failed:', e);
                            statusEl.innerHTML = '✅ Aufnahme beendet';
                            statusEl.className = 'status';
                            // Reset UI state on failure
                            isRecording = false;
                            updateUI();
                            stopAudioVisualization();
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
                    // Add final text with timestamp
                    addTimestampToElement(transcriptEl, finalText.trim());
                    finalTranscript += finalText;
                    
                    statusEl.innerHTML = '🎤 Höre zu... (zum Stoppen klicken Sie "Stoppen")';
                    statusEl.className = 'status listening';
                } else if (interimTranscript) {
                    // Show interim text without adding to final transcript
                    displayInterimText(transcriptEl, interimTranscript);
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
            };
            
            recognition.onstart = function() {
                console.log('Desktop recognition started successfully');
                recordingStartTime = Date.now();
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
                    
                    if (!userStoppedRecording) {
                        statusEl.innerHTML = '✅ Aufnahme beendet';
                        statusEl.className = 'status';
                    }
                }
            };
        }
        
        // Start recognition
        if (isMobile) {
            // Mobile: Ultra-simple start
            isRecording = true;
            updateUI();
            statusEl.innerHTML = '🔄 Starte...';
            statusEl.className = 'status';
            console.log('=== Calling recognition.start() ===');
            recognition.start();
            
            // Start audio visualization if enabled
            if (document.getElementById('audioVisualizer').classList.contains('show')) {
                startAudioVisualization();
            }
        } else {
            // Desktop: Full start
            isRecording = true;
            updateUI();
            statusEl.innerHTML = '🔄 Starte Spracherkennung...';
            statusEl.className = 'status';
            console.log('Starting speech recognition (desktop mode)');
            recognition.start();
            
            // Start audio visualization if enabled
            if (document.getElementById('audioVisualizer').classList.contains('show')) {
                startAudioVisualization();
            }
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
    
    // Update UI immediately
    updateUI();
    
    // Stop audio visualization
    stopAudioVisualization();
    
    // Update status
    document.getElementById('status').innerHTML = '⏹️ Aufnahme gestoppt';
    document.getElementById('status').className = 'status';
    
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
}

function copyToClipboard() {
    const transcriptElement = document.getElementById('transcript');
    let text = '';
    
    // Extract text from transcript lines, preserving timestamps if present
    const lines = transcriptElement.querySelectorAll('.transcript-line');
    if (lines.length > 0) {
        lines.forEach(line => {
            const timestamp = line.querySelector('.timestamp');
            const content = line.textContent;
            text += content + '\n';
        });
        
        // Also get any remaining text content (interim text, etc.)
        const remainingText = transcriptElement.textContent;
        if (remainingText && !remainingText.includes('Hier erscheint dein gesprochener Text')) {
            // If we don't have structured lines, use the full text content
            if (lines.length === 0) {
                text = remainingText;
            }
        }
    } else {
        // Fallback to textContent if no structured lines
        text = transcriptElement.textContent;
    }
    
    if (text && text.trim() !== '' && !text.includes('Hier erscheint dein gesprochener Text...')) {
        navigator.clipboard.writeText(text.trim()).then(() => {
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

// Export menu functions
function toggleExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.classList.toggle('show');
}

function hideExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.classList.remove('show');
}

function exportTranscript(format) {
    const transcriptElement = document.getElementById('transcript');
    let text = '';
    
    // Extract text from transcript lines, preserving timestamps if present
    const lines = transcriptElement.querySelectorAll('.transcript-line');
    if (lines.length > 0) {
        console.log('Exporting', lines.length, 'structured lines');
        lines.forEach((line, index) => {
            const timestampElement = line.querySelector('.timestamp');
            const textElement = line.querySelector('span:not(.timestamp)');
            
            if (timestampElement && textElement) {
                // Format as [MM:SS] text (same as save function)
                const timestamp = timestampElement.textContent;
                const content = textElement.textContent;
                text += `[${timestamp}] ${content}\n`;
                console.log(`Export Line ${index}: [${timestamp}] ${content}`);
            } else {
                // Line without timestamp structure
                text += line.textContent + '\n';
                console.log(`Export Line ${index}:`, line.textContent);
            }
        });
    } else {
        // Fallback to textContent if no structured lines
        console.log('No structured lines found for export, using textContent');
        text = transcriptElement.textContent;
    }
    
    if (!text || text.trim() === '' || text.includes('Hier erscheint dein gesprochener Text...')) {
        showStatus('❌ Kein Text zum Exportieren vorhanden');
        return;
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `spracherkennung_${timestamp}`;
    
    console.log('Exporting text preview:', text.substring(0, 100) + '...');
    
    switch (format) {
        case 'txt':
            exportAsTXT(text.trim(), filename);
            break;
        case 'pdf':
            exportAsPDF(text.trim(), filename);
            break;
        case 'docx':
            exportAsDOCX(text.trim(), filename);
            break;
        default:
            showStatus('❌ Unbekanntes Export-Format');
    }
}

function exportAsTXT(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadFile(blob, `${filename}.txt`);
    showStatus('📄 TXT-Datei exportiert');
}

function exportAsPDF(text, filename) {
    // Simple PDF generation using jsPDF-like approach
    try {
        // Create a simple PDF-like structure
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${text.length + 100}
>>
stream
BT
/F1 12 Tf
50 750 Td
(Spracherkennung Transkript) Tj
0 -20 Td
(${text.replace(/\n/g, ') Tj 0 -15 Td (')}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000456 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
553
%%EOF`;
        
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        downloadFile(blob, `${filename}.pdf`);
        showStatus('📕 PDF-Datei exportiert');
    } catch (error) {
        console.error('PDF export error:', error);
        showStatus('❌ PDF-Export fehlgeschlagen');
    }
}

function exportAsDOCX(text, filename) {
    // Simple DOCX generation (basic XML structure)
    const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p>
            <w:r>
                <w:t>Spracherkennung Transkript</w:t>
            </w:r>
        </w:p>
        <w:p>
            <w:r>
                <w:t>${text.replace(/\n/g, '</w:t></w:r></w:p><w:p><w:r><w:t>')}</w:t>
            </w:r>
        </w:p>
    </w:body>
</w:document>`;
    
    const blob = new Blob([docxContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    downloadFile(blob, `${filename}.docx`);
    showStatus('📘 DOCX-Datei exportiert');
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showStatus(message) {
    const statusElement = document.getElementById('status');
    statusElement.innerHTML = message;
    statusElement.className = 'status fade-in';
    
    setTimeout(() => {
        statusElement.classList.remove('fade-in');
    }, 300);
}

// IndexedDB für Transkript-Verlauf
let db;
const DB_NAME = 'SpeechRecognitionDB';
const DB_VERSION = 1;
const STORE_NAME = 'transcripts';

// IndexedDB initialisieren
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB initialized successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // Create object store für Transkripte
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                // Indizes erstellen
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('language', 'language', { unique: false });
                
                console.log('Object store created');
            }
        };
    });
}

// Transkript speichern
function saveTranscript() {
    const transcriptElement = document.getElementById('transcript');
    let text = '';
    
    // Extract text from transcript lines, preserving timestamps if present
    const lines = transcriptElement.querySelectorAll('.transcript-line');
    if (lines.length > 0) {
        console.log('Saving', lines.length, 'structured lines');
        lines.forEach((line, index) => {
            const timestampElement = line.querySelector('.timestamp');
            const textElement = line.querySelector('span:not(.timestamp)');
            
            if (timestampElement && textElement) {
                // Format as [MM:SS] text
                const timestamp = timestampElement.textContent;
                const content = textElement.textContent;
                text += `[${timestamp}] ${content}\n`;
                console.log(`Line ${index}: [${timestamp}] ${content}`);
            } else {
                // Line without timestamp structure
                text += line.textContent + '\n';
                console.log(`Line ${index}:`, line.textContent);
            }
        });
    } else {
        // Fallback to textContent if no structured lines
        console.log('No structured lines found, using textContent');
        text = transcriptElement.textContent;
    }
    
    if (!text || text.trim() === '' || text.includes('Hier erscheint dein gesprochener Text...')) {
        showStatus('❌ Kein Text zum Speichern vorhanden');
        return;
    }
    
    if (!db) {
        showStatus('❌ Datenbank nicht verfügbar');
        return;
    }
    
    const cleanText = text.trim();
    console.log('Saving transcript text:', cleanText.substring(0, 100) + '...');
    
    const transcript = {
        text: cleanText,
        timestamp: new Date().toISOString(),
        language: document.getElementById('language').value,
        wordCount: cleanText.split(' ').filter(word => word.length > 0).length,
        createdAt: new Date().toLocaleString('de-DE')
    };
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(transcript);
    
    request.onsuccess = () => {
        showStatus('💾 Transkript gespeichert');
        console.log('Transcript saved with ID:', request.result, 'Text preview:', cleanText.substring(0, 50));
    };
    
    request.onerror = () => {
        showStatus('❌ Fehler beim Speichern');
        console.error('Save error:', request.error);
    };
}

// Transkript-Verlauf anzeigen
function showTranscriptHistory() {
    if (!db) {
        showStatus('❌ Datenbank nicht verfügbar');
        return;
    }
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
        const transcripts = request.result;
        displayHistoryModal(transcripts);
    };
    
    request.onerror = () => {
        showStatus('❌ Fehler beim Laden des Verlaufs');
        console.error('Load error:', request.error);
    };
}

// History Modal anzeigen
function displayHistoryModal(transcripts) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'history-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'history-modal';
    
    let historyContent = '';
    if (transcripts.length === 0) {
        historyContent = '<div class="no-history">📝 Noch keine Transkripte gespeichert</div>';
    } else {
        // Sortiere nach Datum (neueste zuerst)
        transcripts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        historyContent = transcripts.map(transcript => `
            <div class="history-item" data-id="${transcript.id}">
                <div class="history-item-header">
                    <span class="history-date">${transcript.createdAt}</span>
                    <span class="history-language">${transcript.language}</span>
                    <span class="history-words">${transcript.wordCount} Wörter</span>
                </div>
                <div class="history-text">${transcript.text.substring(0, 100)}${transcript.text.length > 100 ? '...' : ''}</div>
                <div class="history-actions">
                    <button class="history-btn load-btn" data-id="${transcript.id}">📝 Laden</button>
                    <button class="history-btn export-btn" data-id="${transcript.id}">📄 Export</button>
                    <button class="history-btn delete-btn" data-id="${transcript.id}">🗑️ Löschen</button>
                </div>
            </div>
        `).join('');
    }
    
    modal.innerHTML = `
        <div class="history-header">
            <h3>📚 Transkript-Verlauf</h3>
            <button class="history-close" type="button">×</button>
        </div>
        <div class="history-content">
            ${historyContent}
        </div>
        <div class="history-footer">
            <button class="history-btn-action history-clear-all" type="button">🗑️ Alle löschen</button>
            <button class="history-btn-action history-cancel" type="button">Schließen</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event listeners
    const closeBtn = modal.querySelector('.history-close');
    const cancelBtn = modal.querySelector('.history-cancel');
    const clearAllBtn = modal.querySelector('.history-clear-all');
    
    function closeModal() {
        document.body.removeChild(overlay);
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Click outside to close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeModal();
        }
    });
    
    // ESC key to close
    function handleKeyPress(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleKeyPress);
        }
    }
    document.addEventListener('keydown', handleKeyPress);
    
    // Clear all button
    clearAllBtn.addEventListener('click', function() {
        if (confirm('Wirklich alle Transkripte löschen?')) {
            clearAllTranscripts().then(() => {
                closeModal();
                showStatus('🗑️ Alle Transkripte gelöscht');
            });
        }
    });
    
    // Individual item actions
    modal.querySelectorAll('.load-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            loadTranscript(id).then(() => {
                closeModal();
                showStatus('📝 Transkript geladen');
            });
        });
    });
    
    modal.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            if (confirm('Transkript wirklich löschen?')) {
                deleteTranscript(id).then(() => {
                    showTranscriptHistory(); // Reload modal
                    showStatus('🗑️ Transkript gelöscht');
                });
            }
        });
    });
    
    modal.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            exportTranscriptFromHistory(id);
        });
    });
}

// Transkript laden
function loadTranscript(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => {
            const transcript = request.result;
            if (transcript) {
                // Lade Text in das Transkript-Feld
                const transcriptEl = document.getElementById('transcript');
                const placeholder = transcriptEl.querySelector('.placeholder');
                if (placeholder) {
                    placeholder.remove();
                }
                
                // Clear existing content
                transcriptEl.innerHTML = '';
                
                // Parse and restore the transcript structure
                const rawText = transcript.text;
                const showTimestamps = areTimestampsEnabled();
                
                console.log('Loading transcript:', {
                    rawText: rawText.substring(0, 100) + '...',
                    showTimestamps: showTimestamps
                });
                
                // Split by lines and process each line
                const lines = rawText.split('\n');
                let hasStructuredContent = false;
                
                lines.forEach(line => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return;
                    
                    // More flexible timestamp regex to catch various formats
                    const timestampMatch = trimmedLine.match(/^(\d{1,2}:\d{2})\s+(.+)$/) || 
                                         trimmedLine.match(/^\[(\d{1,2}:\d{2})\]\s*(.+)$/) ||
                                         trimmedLine.match(/^(\d{1,2}:\d{2}:\d{2})\s+(.+)$/) ||
                                         trimmedLine.match(/^\[(\d{1,2}:\d{2}:\d{2})\]\s*(.+)$/);
                    
                    if (timestampMatch) {
                        hasStructuredContent = true;
                        const timestampText = timestampMatch[1];
                        const contentText = timestampMatch[2];
                        
                        console.log('Found timestamp line:', { timestamp: timestampText, content: contentText.substring(0, 50) });
                        
                        if (showTimestamps) {
                            // Create properly structured line
                            const lineDiv = document.createElement('div');
                            lineDiv.className = 'transcript-line';
                            
                            const timestampSpan = document.createElement('span');
                            timestampSpan.className = 'timestamp';
                            timestampSpan.textContent = timestampText;
                            
                            const textSpan = document.createElement('span');
                            textSpan.textContent = contentText;
                            
                            lineDiv.appendChild(timestampSpan);
                            lineDiv.appendChild(textSpan);
                            transcriptEl.appendChild(lineDiv);
                        } else {
                            // Show only content without timestamp, but keep line structure
                            const lineDiv = document.createElement('div');
                            lineDiv.className = 'transcript-line';
                            lineDiv.textContent = contentText;
                            transcriptEl.appendChild(lineDiv);
                        }
                    } else {
                        // Line without timestamp - could be continuation
                        if (hasStructuredContent) {
                            // Add as continuation of previous line or new line
                            const lineDiv = document.createElement('div');
                            lineDiv.className = 'transcript-line';
                            lineDiv.textContent = trimmedLine;
                            transcriptEl.appendChild(lineDiv);
                        } else {
                            // First line without timestamp - add as plain text
                            const textNode = document.createTextNode(trimmedLine + ' ');
                            transcriptEl.appendChild(textNode);
                        }
                    }
                });
                
                // If no structured content was created, fall back to plain text
                if (!hasStructuredContent) {
                    transcriptEl.textContent = rawText;
                }
                
                console.log('Transcript loaded - structured lines:', transcriptEl.querySelectorAll('.transcript-line').length);
                
                finalTranscript = transcript.text;
                previousFinalTranscript = transcript.text;
                
                // Setze Sprache
                document.getElementById('language').value = transcript.language;
                
                resolve();
            } else {
                reject('Transkript nicht gefunden');
            }
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Transkript löschen
function deleteTranscript(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Alle Transkripte löschen
function clearAllTranscripts() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Transkript aus Verlauf exportieren
function exportTranscriptFromHistory(id) {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => {
        const transcript = request.result;
        if (transcript) {
            const timestamp = new Date(transcript.timestamp).toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `spracherkennung_${timestamp}`;
            exportAsTXT(transcript.text, filename);
            showStatus('📄 Transkript exportiert');
        }
    };
}

function updateUI() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const languageSelect = document.getElementById('language');
    const continuousSelect = document.getElementById('continuous');
    const timestampSelect = document.getElementById('timestamps');
    const themeSelect = document.getElementById('theme');

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
        timestampSelect.disabled = true;
        themeSelect.disabled = true;
        
        // Visual feedback for disabled selects
        languageSelect.style.opacity = '0.5';
        continuousSelect.style.opacity = '0.5';
        timestampSelect.style.opacity = '0.5';
        themeSelect.style.opacity = '0.5';
        languageSelect.title = 'Sprache kann nur geändert werden, wenn Aufnahme pausiert ist';
        continuousSelect.title = 'Modus kann nur geändert werden, wenn Aufnahme pausiert ist';
        timestampSelect.title = 'Zeitstempel können nur geändert werden, wenn Aufnahme pausiert ist';
        themeSelect.title = 'Theme kann nur geändert werden, wenn Aufnahme pausiert ist';
    } else {
        // Stopped state
        startBtn.disabled = false;
        stopBtn.disabled = true;
        startBtn.classList.remove('recording-active');
        startBtn.innerHTML = '<span class="mic-icon">🎤</span><span>Aufnahme starten</span>';
        
        // Enable settings when not recording
        languageSelect.disabled = false;
        continuousSelect.disabled = false;
        timestampSelect.disabled = false;
        themeSelect.disabled = false;
        
        // Reset visual feedback
        languageSelect.style.opacity = '1';
        continuousSelect.style.opacity = '1';
        timestampSelect.style.opacity = '1';
        themeSelect.style.opacity = '1';
        languageSelect.title = '';
        continuousSelect.title = '';
        timestampSelect.title = '';
        themeSelect.title = '';
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

document.getElementById('timestamps').addEventListener('change', function () {
    if (isRecording) {
        // Prevent change during recording
        console.log('Timestamp change blocked during recording');
        return;
    }
    
    const timestampName = this.value === 'true' ? 'Aktiviert' : 'Deaktiviert';
    timestampsEnabled = this.value === 'true';
    
    console.log('Timestamps changed to:', timestampName);
    document.getElementById('status').innerHTML = `⏰ Zeitstempel ${timestampName}`;
    document.getElementById('status').className = 'status';
});

// Theme switching
document.getElementById('theme').addEventListener('change', function () {
    const theme = this.value;
    setTheme(theme);
    
    const themeName = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    console.log('Theme changed to:', themeName);
    document.getElementById('status').innerHTML = `🎨 Theme: ${themeName}`;
    document.getElementById('status').className = 'status';
    
    // Save theme preference
    localStorage.setItem('speechRecognitionTheme', theme);
});

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update theme selector
    document.getElementById('theme').value = theme;
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const colors = {
        dark: '#2B2E3B',
        light: '#f8fafc'
    };
    
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', colors[theme]);
    }
}

// Load saved theme on page load
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('speechRecognitionTheme') || 'dark';
    setTheme(savedTheme);
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Don't trigger shortcuts when typing in input/textarea/select elements
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }
        
        // Prevent shortcuts during recording (except stop)
        if (isRecording && !(e.ctrlKey && e.key === 'q')) {
            return;
        }
        
        // Handle keyboard shortcuts
        switch (true) {
            case e.ctrlKey && e.key === 'r':
            case e.key === ' ' || e.key === 'Spacebar':
                e.preventDefault();
                if (!isRecording) {
                    startRecognition();
                    showStatus('⌨️ Aufnahme per Tastatur gestartet');
                }
                break;
                
            case e.ctrlKey && e.key === 'q':
            case e.key === 'Escape':
                e.preventDefault();
                if (isRecording) {
                    stopRecognition();
                    showStatus('⌨️ Aufnahme per Tastatur gestoppt');
                }
                break;
                
            case e.ctrlKey && e.key === 'c':
                e.preventDefault();
                copyToClipboard();
                break;
                
            case e.ctrlKey && e.key === 'd':
                e.preventDefault();
                clearTranscript();
                break;
                
            case e.ctrlKey && e.key === 's':
                e.preventDefault();
                saveTranscript();
                break;
                
            case e.ctrlKey && e.key === 'h':
                e.preventDefault();
                showTranscriptHistory();
                break;
                
            case e.ctrlKey && e.key === 'e':
                e.preventDefault();
                toggleExportMenu();
                break;
                
            case e.ctrlKey && e.key === 'v':
                e.preventDefault();
                toggleAudioVisualization();
                break;
                
            case e.ctrlKey && e.key === 't':
                e.preventDefault();
                toggleTheme();
                break;
                
            case e.key === 'F1':
                e.preventDefault();
                showKeyboardShortcuts();
                break;
        }
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('speechRecognitionTheme', newTheme);
    
    const themeName = newTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
    showStatus(`🎨 Theme: ${themeName}`);
}

function showKeyboardShortcuts() {
    const shortcuts = [
        { key: 'Leertaste / Strg+R', action: 'Aufnahme starten' },
        { key: 'Escape / Strg+Q', action: 'Aufnahme stoppen' },
        { key: 'Strg+C', action: 'Text kopieren' },
        { key: 'Strg+D', action: 'Text löschen' },
        { key: 'Strg+S', action: 'Transkript speichern' },
        { key: 'Strg+H', action: 'Verlauf anzeigen' },
        { key: 'Strg+E', action: 'Export-Menü öffnen' },
        { key: 'Strg+V', action: 'Audio-Visualisierung umschalten' },
        { key: 'Strg+T', action: 'Theme umschalten' },
        { key: 'F1', action: 'Diese Hilfe anzeigen' }
    ];
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'shortcuts-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    
    const shortcutsContent = shortcuts.map(shortcut => `
        <div class="shortcut-item">
            <kbd class="shortcut-key">${shortcut.key}</kbd>
            <span class="shortcut-action">${shortcut.action}</span>
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div class="shortcuts-header">
            <h3>⌨️ Tastenkombinationen</h3>
            <button class="shortcuts-close" type="button">×</button>
        </div>
        <div class="shortcuts-content">
            ${shortcutsContent}
        </div>
        <div class="shortcuts-footer">
            <button class="shortcuts-btn-action shortcuts-cancel" type="button">Schließen</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event listeners
    const closeBtn = modal.querySelector('.shortcuts-close');
    const cancelBtn = modal.querySelector('.shortcuts-cancel');
    
    function closeModal() {
        document.body.removeChild(overlay);
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Click outside to close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeModal();
        }
    });
    
    // ESC key to close
    function handleKeyPress(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleKeyPress);
        }
    }
    document.addEventListener('keydown', handleKeyPress);
}

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

// Export functionality
document.getElementById('exportBtn').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleExportMenu();
});

// Export menu options
document.querySelectorAll('.export-option').forEach(option => {
    option.addEventListener('click', function(e) {
        e.preventDefault();
        const format = this.dataset.format;
        exportTranscript(format);
        hideExportMenu();
    });
});

// Close export menu when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.export-dropdown')) {
        hideExportMenu();
    }
});

// History functionality
document.getElementById('saveBtn').addEventListener('click', function(e) {
    e.preventDefault();
    saveTranscript();
});

document.getElementById('historyBtn').addEventListener('click', function(e) {
    e.preventDefault();
    showTranscriptHistory();
});

// Audio visualization toggle
document.getElementById('vizToggle').addEventListener('click', function(e) {
    e.preventDefault();
    toggleAudioVisualization();
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

// Initialize IndexedDB, theme and keyboard shortcuts when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load saved theme
    loadSavedTheme();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Initialize IndexedDB
    initDB().then(() => {
        console.log('IndexedDB ready for transcript history');
    }).catch(error => {
        console.error('IndexedDB initialization failed:', error);
        showStatus('⚠️ Verlauf-Funktion nicht verfügbar');
    });
});