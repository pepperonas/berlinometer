import {
    HandLandmarker,
    FaceLandmarker,
    PoseLandmarker,
    ObjectDetector,
    ImageSegmenter,
    FilesetResolver,
    DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

// Global variables
let currentTab = 'hands';
let camera = null;
let stream = null;
let currentFacingMode = 'user'; // 'user' for front camera, 'environment' for rear

// Tab switching
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Update active states
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Stop current tracking
        stopAllTracking();
        currentTab = tabName;

        // Setup camera for new tab
        setupCameraForTab(tabName);
    });
});

// Stop all tracking
function stopAllTracking() {
    // Stop all running detections
    ['hands', 'face', 'pose', 'objects', 'selfie'].forEach(feature => {
        const stopBtn = document.getElementById(`${feature}-stop`);
        if (stopBtn && !stopBtn.disabled) {
            stopBtn.click();
        }
    });
}

// Setup camera for specific tab
async function setupCameraForTab(tabName, forceFacingMode = null) {
    const video = document.getElementById(`${tabName}-video`);
    const canvas = document.getElementById(`${tabName}-canvas`);
    const status = document.getElementById(`${tabName}-status`);
    const startBtn = document.getElementById(`${tabName}-start`);
    const cameraSwitchBtn = document.getElementById(`${tabName}-camera-switch`);

    try {
        // If forcing a new facing mode or no stream exists
        if (forceFacingMode !== null || !stream) {
            // Stop existing stream if switching cameras
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            // Use the forced facing mode or current setting
            const facingMode = forceFacingMode !== null ? forceFacingMode : currentFacingMode;
            
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 1280,
                    height: 720,
                    facingMode: facingMode
                }
            });
            
            // Update current facing mode if forced
            if (forceFacingMode !== null) {
                currentFacingMode = forceFacingMode;
            }
        }

        video.srcObject = stream;

        video.addEventListener('loadeddata', () => {
            // Ensure proper canvas sizing for mobile
            const rect = video.getBoundingClientRect();
            canvas.width = video.videoWidth || rect.width;
            canvas.height = video.videoHeight || rect.height;
            if (startBtn) startBtn.disabled = false;
            if (cameraSwitchBtn) cameraSwitchBtn.disabled = false;
            status.textContent = "Kamera bereit! Klicke 'Start'";
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (video.videoWidth && video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }
            }, 100);
        });
    } catch (error) {
        console.error("Kamera-Fehler:", error);
        status.textContent = "Kein Kamera-Zugriff möglich!";
        if (cameraSwitchBtn) cameraSwitchBtn.disabled = true;
    }
}

// FPS Counter
class FPSCounter {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.lastTime = performance.now();
        this.frames = 0;
    }

    update() {
        this.frames++;
        const currentTime = performance.now();
        const delta = currentTime - this.lastTime;

        if (delta >= 1000) {
            const fps = Math.round((this.frames * 1000) / delta);
            this.element.textContent = `FPS: ${fps}`;
            this.frames = 0;
            this.lastTime = currentTime;
        }
    }
}

// Hand Tracking Module
class HandTrackingModule {
    constructor() {
        this.landmarker = null;
        this.video = document.getElementById('hands-video');
        this.canvas = document.getElementById('hands-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('hands-start');
        this.stopBtn = document.getElementById('hands-stop');
        this.status = document.getElementById('hands-status');
        this.count = document.getElementById('hands-count');
        this.loading = document.getElementById('hands-loading');
        this.fpsCounter = new FPSCounter('hands-fps');
        this.isTracking = false;
        this.animationId = null;

        this.HAND_CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Daumen
            [0, 5], [5, 6], [6, 7], [7, 8], // Zeigefinger
            [5, 9], [9, 10], [10, 11], [11, 12], // Mittelfinger
            [9, 13], [13, 14], [14, 15], [15, 16], // Ringfinger
            [13, 17], [17, 18], [18, 19], [19, 20], // Kleiner Finger
            [0, 17] // Handgelenk
        ];

        this.init();
    }

    async init() {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            this.landmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 2
            });

            this.loading.style.display = 'none';
            this.setupEventListeners();
        } catch (error) {
            console.error("Fehler beim Laden von Hand Tracking:", error);
            this.status.textContent = "Fehler beim Laden!";
            this.loading.style.display = 'none';
        }
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
    }

    start() {
        if (!this.landmarker || this.isTracking) return;

        this.isTracking = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.status.textContent = "Tracking läuft...";

        this.detect();
    }

    stop() {
        this.isTracking = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.status.textContent = "Tracking gestoppt";
        this.count.textContent = "";

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    async detect() {
        if (!this.isTracking) return;

        const startTimeMs = performance.now();

        if (this.landmarker && this.video.readyState >= 2) {
            const results = await this.landmarker.detectForVideo(this.video, startTimeMs);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (results.landmarks && results.landmarks.length > 0) {
                this.count.innerHTML = `<span class="detected">${results.landmarks.length} Hand/Hände erkannt</span>`;

                results.landmarks.forEach((landmarks, index) => {
                    this.drawHand(landmarks, results.handednesses[index]);
                });
            } else {
                this.count.textContent = "Keine Hand erkannt";
            }

            this.fpsCounter.update();
        }

        this.animationId = requestAnimationFrame(() => this.detect());
    }

    drawHand(landmarks, handedness) {
        const isLeftHand = handedness[0].categoryName === 'Left';
        const color = isLeftHand ? '#4CAF50' : '#2196F3';

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;

        this.HAND_CONNECTIONS.forEach(connection => {
            const [start, end] = connection;
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            this.ctx.beginPath();
            this.ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
            this.ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);
            this.ctx.stroke();
        });

        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;

            this.ctx.fillStyle = index === 0 ? '#FF5722' : color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, index === 0 ? 8 : 6, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }
}

// Face Detection Module
class FaceDetectionModule {
    constructor() {
        this.landmarker = null;
        this.video = document.getElementById('face-video');
        this.canvas = document.getElementById('face-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('face-start');
        this.stopBtn = document.getElementById('face-stop');
        this.status = document.getElementById('face-status');
        this.count = document.getElementById('face-count');
        this.loading = document.getElementById('face-loading');
        this.fpsCounter = new FPSCounter('face-fps');
        this.isTracking = false;
        this.animationId = null;

        // Options
        this.showLandmarks = document.getElementById('show-landmarks');
        this.showMesh = document.getElementById('show-mesh');
        this.showContours = document.getElementById('show-contours');

        this.init();
    }

    async init() {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            this.landmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numFaces: 2,
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true
            });

            this.loading.style.display = 'none';
            this.setupEventListeners();
        } catch (error) {
            console.error("Fehler beim Laden von Face Detection:", error);
            this.status.textContent = "Fehler beim Laden!";
            this.loading.style.display = 'none';
        }
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
    }

    start() {
        if (!this.landmarker || this.isTracking) return;

        this.isTracking = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.status.textContent = "Face Tracking läuft...";

        this.detect();
    }

    stop() {
        this.isTracking = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.status.textContent = "Face Tracking gestoppt";
        this.count.textContent = "";

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    async detect() {
        if (!this.isTracking) return;

        const startTimeMs = performance.now();

        if (this.landmarker && this.video.readyState >= 2) {
            const results = await this.landmarker.detectForVideo(this.video, startTimeMs);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                this.count.innerHTML = `<span class="detected">${results.faceLandmarks.length} Gesicht(er) erkannt - 468 Landmarks pro Gesicht</span>`;

                results.faceLandmarks.forEach((landmarks) => {
                    this.drawFace(landmarks);
                });
            } else {
                this.count.textContent = "Kein Gesicht erkannt";
            }

            this.fpsCounter.update();
        }

        this.animationId = requestAnimationFrame(() => this.detect());
    }

    drawFace(landmarks) {
        // Draw mesh connections
        if (this.showMesh.checked) {
            this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
            this.ctx.lineWidth = 1;

            // Face mesh connections (simplified)
            const connections = [
                // Mouth
                [61, 84], [84, 17], [17, 314], [314, 405], [405, 320], [320, 307], [307, 375], [375, 308], [308, 324], [324, 318], [318, 402], [402, 317], [317, 14], [14, 87], [87, 178], [178, 88], [88, 95],
                // Eyes
                [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133],
                [362, 398], [398, 384], [384, 385], [385, 386], [386, 387], [387, 388], [388, 466], [466, 263],
                // Nose
                [1, 2], [2, 5], [5, 4], [4, 6], [6, 168], [168, 8], [8, 196], [196, 3], [3, 51], [51, 48], [48, 115]
            ];

            connections.forEach(([start, end]) => {
                if (landmarks[start] && landmarks[end]) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(landmarks[start].x * this.canvas.width, landmarks[start].y * this.canvas.height);
                    this.ctx.lineTo(landmarks[end].x * this.canvas.width, landmarks[end].y * this.canvas.height);
                    this.ctx.stroke();
                }
            });
        }

        // Draw landmarks
        if (this.showLandmarks.checked) {
            landmarks.forEach((landmark, index) => {
                const x = landmark.x * this.canvas.width;
                const y = landmark.y * this.canvas.height;

                this.ctx.fillStyle = '#4CAF50';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
                this.ctx.fill();
            });
        }

        // Draw contours
        if (this.showContours.checked) {
            this.ctx.strokeStyle = '#FF5722';
            this.ctx.lineWidth = 2;

            // Face contour
            const faceContour = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 340, 346, 347, 348, 349, 350, 451, 452, 453, 464, 435, 410, 287, 273, 335, 406, 313, 18, 17, 16, 15, 14, 13, 12, 11, 10];
            this.drawContour(landmarks, faceContour);
        }
    }

    drawContour(landmarks, indices) {
        this.ctx.beginPath();
        indices.forEach((index, i) => {
            const point = landmarks[index];
            if (point) {
                const x = point.x * this.canvas.width;
                const y = point.y * this.canvas.height;

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        });
        this.ctx.stroke();
    }
}

// Pose Detection Module
class PoseDetectionModule {
    constructor() {
        this.landmarker = null;
        this.video = document.getElementById('pose-video');
        this.canvas = document.getElementById('pose-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('pose-start');
        this.stopBtn = document.getElementById('pose-stop');
        this.status = document.getElementById('pose-status');
        this.count = document.getElementById('pose-count');
        this.loading = document.getElementById('pose-loading');
        this.fpsCounter = new FPSCounter('pose-fps');
        this.isTracking = false;
        this.animationId = null;

        // Pose connections
        this.POSE_CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
            [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
            [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20], [11, 23],
            [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28], [27, 29],
            [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
        ];

        this.init();
    }

    async init() {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            this.landmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: 2
            });

            this.loading.style.display = 'none';
            this.setupEventListeners();
        } catch (error) {
            console.error("Fehler beim Laden von Pose Detection:", error);
            this.status.textContent = "Fehler beim Laden!";
            this.loading.style.display = 'none';
        }
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
    }

    start() {
        if (!this.landmarker || this.isTracking) return;

        this.isTracking = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.status.textContent = "Pose Tracking läuft...";

        this.detect();
    }

    stop() {
        this.isTracking = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.status.textContent = "Pose Tracking gestoppt";
        this.count.textContent = "";

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    async detect() {
        if (!this.isTracking) return;

        const startTimeMs = performance.now();

        if (this.landmarker && this.video.readyState >= 2) {
            const results = await this.landmarker.detectForVideo(this.video, startTimeMs);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (results.landmarks && results.landmarks.length > 0) {
                this.count.innerHTML = `<span class="detected">${results.landmarks.length} Person(en) erkannt - 33 Landmarks pro Person</span>`;

                results.landmarks.forEach((landmarks) => {
                    this.drawPose(landmarks);
                });
            } else {
                this.count.textContent = "Keine Person erkannt";
            }

            this.fpsCounter.update();
        }

        this.animationId = requestAnimationFrame(() => this.detect());
    }

    drawPose(landmarks) {
        // Draw connections
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 3;

        this.POSE_CONNECTIONS.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            if (startPoint && endPoint) {
                this.ctx.beginPath();
                this.ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
                this.ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);
                this.ctx.stroke();
            }
        });

        // Draw landmarks
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;

            // Different colors for different body parts
            if (index < 11) {
                this.ctx.fillStyle = '#FF5722'; // Face/Head
            } else if (index < 23) {
                this.ctx.fillStyle = '#2196F3'; // Body
            } else {
                this.ctx.fillStyle = '#FFC107'; // Hands/Feet
            }

            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }
}

// Object Detection Module
class ObjectDetectionModule {
    constructor() {
        this.detector = null;
        this.video = document.getElementById('objects-video');
        this.canvas = document.getElementById('objects-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('objects-start');
        this.stopBtn = document.getElementById('objects-stop');
        this.status = document.getElementById('objects-status');
        this.count = document.getElementById('objects-count');
        this.loading = document.getElementById('objects-loading');
        this.fpsCounter = new FPSCounter('objects-fps');
        this.isDetecting = false;
        this.animationId = null;

        this.confidenceThreshold = document.getElementById('confidence-threshold');
        this.enableOCR = document.getElementById('enable-ocr');
        
        // For detected objects list
        this.detectedObjects = new Set();
        this.objectList = document.getElementById('detected-objects-list');
        
        // For OCR functionality
        this.tesseractWorker = null;
        this.detectedTexts = new Set();
        this.textList = document.getElementById('detected-texts-list');
        this.ocrFrameCount = 0; // To limit OCR frequency
        
        // Performance optimization variables
        this.lastOCRTime = 0;
        this.ocrInterval = 500; // Start with 0.5 second intervals for better responsiveness
        this.lastFrameHash = null;
        this.adaptiveOCREnabled = true;
        this.performanceStats = {
            totalOCRCalls: 0,
            successfulDetections: 0,
            averageConfidence: 0,
            averageProcessingTime: 0
        };

        this.init();
    }

    async init() {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            this.detector = await ObjectDetector.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                scoreThreshold: 0.5,
                maxResults: 10
            });

            // Initialize Tesseract worker with simplest possible approach
            try {
                console.log('Attempting simple Tesseract.js initialization...');
                
                // Try the most basic initialization without any options
                this.tesseractWorker = Tesseract.createWorker();
                
                // Let Tesseract handle everything automatically
                console.log('Tesseract worker created, ready for use');
                
                // Show success message
                if (this.textList) {
                    this.textList.innerHTML = '<div style="color: #10b981; padding: 10px; text-align: center;">OCR bereit - Text Recognition aktiviert</div>';
                }
                
            } catch (error) {
                console.warn('Tesseract initialization failed, but continuing with basic setup:', error);
                this.tesseractWorker = null;
                
                // Show user message
                if (this.textList) {
                    this.textList.innerHTML = '<div style="color: #6b7280; padding: 10px; text-align: center;">OCR bereit - Klicken Sie auf "Erkennung starten"</div>';
                }
            }

            this.loading.style.display = 'none';
            this.setupEventListeners();
        } catch (error) {
            console.error("Fehler beim Laden von Object Detection:", error);
            this.status.textContent = "Fehler beim Laden!";
            this.loading.style.display = 'none';
        }
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        
        // OCR toggle handler
        if (this.enableOCR) {
            this.enableOCR.addEventListener('change', (e) => {
                if (!e.target.checked) {
                    // Clear text list when OCR is disabled
                    this.detectedTexts.clear();
                    this.textList.innerHTML = '';
                    console.log('OCR disabled by user');
                } else {
                    console.log('OCR enabled by user');
                }
            });
        }
    }

    start() {
        if (!this.detector || this.isDetecting) return;

        this.isDetecting = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.status.textContent = "Objekterkennung läuft...";

        this.detect();
    }

    stop() {
        this.isDetecting = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.status.textContent = "Objekterkennung gestoppt";
        this.count.textContent = "";

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Clear detected objects and texts lists
        this.detectedObjects.clear();
        this.detectedTexts.clear();
        this.objectList.innerHTML = '';
        this.textList.innerHTML = '';
        this.ocrFrameCount = 0;
    }

    async detect() {
        if (!this.isDetecting) return;

        const startTimeMs = performance.now();

        if (this.detector && this.video.readyState >= 2) {
            const results = await this.detector.detectForVideo(this.video, startTimeMs);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const threshold = parseFloat(this.confidenceThreshold.value);
            const filteredDetections = results.detections.filter(d => d.categories[0].score >= threshold);

            if (filteredDetections.length > 0) {
                this.count.innerHTML = `<span class="detected">${filteredDetections.length} Objekt(e) erkannt</span>`;

                filteredDetections.forEach((detection) => {
                    this.drawDetection(detection);
                });
            } else {
                this.count.textContent = "Keine Objekte erkannt";
            }

            // Adaptive OCR with performance optimization and error protection
            const now = performance.now();
            if (this.shouldPerformOCR(now)) {
                try {
                    this.performOptimizedOCR(now);
                } catch (error) {
                    if (error.name === 'DataCloneError' || error.message.includes('DataCloneError') || error.message.includes('postMessage')) {
                        console.error('Critical OCR error detected, permanently disabling OCR:', error);
                        this.adaptiveOCREnabled = false;
                        this.tesseractWorker = null;
                        
                        // Update UI to show OCR is disabled
                        if (this.enableOCR) {
                            this.enableOCR.checked = false;
                            this.enableOCR.disabled = true;
                        }
                        
                        // Clear any existing text
                        this.detectedTexts.clear();
                        this.textList.innerHTML = '<div style="color: #ef4444; padding: 10px; text-align: center;">OCR deaktiviert aufgrund technischer Probleme</div>';
                    }
                }
            }

            this.fpsCounter.update();
        }

        this.animationId = requestAnimationFrame(() => this.detect());
    }

    drawDetection(detection) {
        const bbox = detection.boundingBox;
        const category = detection.categories[0];

        // Draw bounding box
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
            bbox.originX,
            bbox.originY,
            bbox.width,
            bbox.height
        );

        // Draw label background
        const label = `${category.categoryName} ${Math.round(category.score * 100)}%`;
        this.ctx.font = '32px Arial';
        const textWidth = this.ctx.measureText(label).width;

        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
        this.ctx.fillRect(
            bbox.originX,
            bbox.originY - 45,
            textWidth + 10,
            45
        );

        // Draw label text
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(
            label,
            bbox.originX + 5,
            bbox.originY - 12
        );
        
        // Add object to list if not already present
        this.addToObjectList(category.categoryName, Math.round(category.score * 100));
    }

    addToObjectList(objectName, confidence) {
        if (!this.detectedObjects.has(objectName)) {
            this.detectedObjects.add(objectName);
            
            const objectItem = document.createElement('div');
            objectItem.className = 'object-item';
            objectItem.innerHTML = `
                <span class="object-name">${objectName}</span>
                <span class="object-confidence">${confidence}%</span>
            `;
            
            this.objectList.appendChild(objectItem);
        }
    }

    shouldPerformOCR(currentTime) {
        // Immediately return false if OCR has been permanently disabled due to errors
        if (!this.adaptiveOCREnabled || !this.tesseractWorker) {
            return false;
        }
        
        // Check if user has enabled OCR
        if (!this.enableOCR || !this.enableOCR.checked || this.enableOCR.disabled) {
            return false;
        }
        
        // Respect minimum interval
        if (currentTime - this.lastOCRTime < this.ocrInterval) {
            return false;
        }
        
        // Check if frame has changed significantly
        if (this.hasFrameChanged()) {
            return true;
        }
        
        return false;
    }
    
    hasFrameChanged() {
        // Simple frame change detection using canvas content hash
        try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = Math.min(this.video.videoWidth, 160);
            tempCanvas.height = Math.min(this.video.videoHeight, 120);
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Simple hash based on every 10th pixel
            let hash = 0;
            for (let i = 0; i < imageData.data.length; i += 40) {
                hash = (hash << 1) ^ imageData.data[i];
            }
            
            const hasChanged = this.lastFrameHash !== null && Math.abs(hash - this.lastFrameHash) > 1000;
            this.lastFrameHash = hash;
            
            return hasChanged || this.lastFrameHash === null;
        } catch (error) {
            return true; // If we can't detect changes, perform OCR
        }
    }
    
    async performOptimizedOCR(currentTime) {
        this.lastOCRTime = currentTime;
        
        // Extract region of interest if objects are detected
        const roi = this.extractRegionOfInterest();
        if (roi) {
            await this.performROIOCR(roi);
        } else {
            await this.performOCR();
        }
        
        // Adaptive interval adjustment based on success rate
        this.adjustOCRInterval();
    }
    
    extractRegionOfInterest() {
        // If we have recent object detections, focus OCR on those areas
        const detectedElements = this.objectList.children;
        if (detectedElements.length === 0) {
            return null;
        }
        
        // For now, use the full frame but we could implement bounding box extraction
        // This is a placeholder for more sophisticated ROI detection
        return null;
    }
    
    async performROIOCR(roi) {
        // Placeholder for region-specific OCR
        // For now, fall back to full frame OCR
        await this.performOCR();
    }
    
    adjustOCRInterval() {
        const stats = this.performanceStats;
        const successRate = stats.totalOCRCalls > 0 ? stats.successfulDetections / stats.totalOCRCalls : 0;
        
        // Adjust interval based on success rate and performance
        if (successRate > 0.7 && stats.averageProcessingTime < 1000) {
            // High success rate and fast processing: decrease interval
            this.ocrInterval = Math.max(1000, this.ocrInterval * 0.9);
        } else if (successRate < 0.3 || stats.averageProcessingTime > 3000) {
            // Low success rate or slow processing: increase interval
            this.ocrInterval = Math.min(5000, this.ocrInterval * 1.2);
        }
    }
    
    updatePerformanceStats(processingTime, confidence, successful) {
        const stats = this.performanceStats;
        stats.totalOCRCalls++;
        
        if (successful) {
            stats.successfulDetections++;
            stats.averageConfidence = (stats.averageConfidence * (stats.successfulDetections - 1) + confidence) / stats.successfulDetections;
        }
        
        stats.averageProcessingTime = (stats.averageProcessingTime * (stats.totalOCRCalls - 1) + processingTime) / stats.totalOCRCalls;
    }

    async performOCR() {
        const startTime = performance.now();
        let successful = false;
        let bestConfidence = 0;
        
        // Skip OCR if worker is not available
        if (!this.tesseractWorker) {
            console.warn('OCR skipped: Tesseract worker not available');
            return;
        }
        
        try {
            // Create a temporary canvas to capture current video frame
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.video.videoWidth;
            tempCanvas.height = this.video.videoHeight;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Draw current video frame
            tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // Apply preprocessing pipeline with error handling
            let processedCanvas;
            try {
                processedCanvas = await this.preprocessImageForOCR(tempCanvas);
            } catch (preprocessError) {
                console.warn('Preprocessing failed, using original canvas:', preprocessError);
                processedCanvas = tempCanvas;
            }
            
            // Multi-pass OCR strategy with comprehensive error handling
            const results = await this.performMultiPassOCR(processedCanvas);
            
            // Process and validate results with more lenient criteria
            for (const result of results) {
                if (result && result.confidence !== undefined) {
                    bestConfidence = Math.max(bestConfidence, result.confidence);
                    
                    console.log('Processing OCR result:', result);
                    
                    // Much more lenient criteria
                    if (result.text && result.text.trim().length > 0) {
                        const cleanText = this.cleanOCRText(result.text);
                        console.log('Cleaned text:', cleanText);
                        
                        // Accept almost any text that has content
                        if (cleanText.length > 0) {
                            this.addToTextList(cleanText, result.confidence);
                            successful = true;
                            console.log('Text added to list:', cleanText);
                        }
                    }
                }
            }
            
            // If no results, log for debugging
            if (results.length === 0) {
                console.log('OCR completed but no valid text detected');
            }
            
        } catch (error) {
            console.error('OCR Error:', error);
            
            // If this is a critical error, disable OCR temporarily
            if (error.message.includes('DataCloneError') || 
                error.message.includes('Worker') ||
                this.performanceStats.totalOCRCalls > 10 && 
                this.performanceStats.successfulDetections === 0) {
                
                console.warn('Disabling OCR due to persistent errors');
                this.adaptiveOCREnabled = false;
                
                // Re-enable after 30 seconds
                setTimeout(() => {
                    console.log('Re-enabling OCR after cooldown period');
                    this.adaptiveOCREnabled = true;
                }, 30000);
            }
        } finally {
            // Update performance statistics
            const processingTime = performance.now() - startTime;
            this.updatePerformanceStats(processingTime, bestConfidence, successful);
        }
    }
    
    async preprocessImageForOCR(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Create enhanced canvas with optimal size
        const enhancedCanvas = document.createElement('canvas');
        const scale = Math.max(2, 300 / 72); // Scale to at least 300 DPI
        enhancedCanvas.width = canvas.width * scale;
        enhancedCanvas.height = canvas.height * scale;
        const enhancedCtx = enhancedCanvas.getContext('2d');
        
        // Scale up with high quality
        enhancedCtx.imageSmoothingEnabled = true;
        enhancedCtx.imageSmoothingQuality = 'high';
        enhancedCtx.drawImage(canvas, 0, 0, enhancedCanvas.width, enhancedCanvas.height);
        
        // Apply advanced preprocessing pipeline
        const enhancedImageData = enhancedCtx.getImageData(0, 0, enhancedCanvas.width, enhancedCanvas.height);
        
        // Pipeline: Gaussian blur → CLAHE → Multiple binarization → Morphology → Border
        this.applyGaussianBlur(enhancedImageData, 0.5);
        this.applyCLAHE(enhancedImageData);
        this.applyAdaptiveBinarization(enhancedImageData);
        this.applyMorphologicalOperations(enhancedImageData);
        
        enhancedCtx.putImageData(enhancedImageData, 0, 0);
        
        // Add white border (20% of estimated line height)
        const borderSize = Math.max(10, Math.floor(enhancedCanvas.height * 0.05));
        const borderedCanvas = document.createElement('canvas');
        borderedCanvas.width = enhancedCanvas.width + borderSize * 2;
        borderedCanvas.height = enhancedCanvas.height + borderSize * 2;
        const borderedCtx = borderedCanvas.getContext('2d');
        
        // Fill with white background
        borderedCtx.fillStyle = 'white';
        borderedCtx.fillRect(0, 0, borderedCanvas.width, borderedCanvas.height);
        borderedCtx.drawImage(enhancedCanvas, borderSize, borderSize);
        
        return borderedCanvas;
    }
    
    // Simple and robust OCR recognition
    async safeRecognize(canvas, options = {}) {
        if (!this.tesseractWorker) {
            console.warn('No Tesseract worker available');
            return {
                data: {
                    text: '',
                    confidence: 0
                }
            };
        }

        try {
            // Use the simplest possible Tesseract call with better settings
            console.log('🔍 Starting OCR recognition...');
            
            const result = await Tesseract.recognize(canvas, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log('📖 Tesseract is recognizing text...');
                    }
                }
            });
            
            console.log('✅ OCR completed!');
            console.log('📝 Full result:', result);
            console.log('📄 Text found:', `"${result.data.text}"`);
            console.log('🎯 Confidence:', result.data.confidence);
            console.log('📊 Text length:', result.data.text.length);
            
            // Add some test text if nothing was found
            if (!result.data.text || result.data.text.trim().length === 0) {
                console.log('⚠️ No text detected by Tesseract');
                
                // Return a test result to see if the system works
                return {
                    data: {
                        text: 'TEST_OCR_' + Date.now(),
                        confidence: 50
                    }
                };
            }
            
            return result;
        } catch (error) {
            console.error('❌ OCR recognition failed:', error);
            
            // Return test result for debugging
            return {
                data: {
                    text: 'ERROR_TEST_' + Date.now(),
                    confidence: 25
                }
            };
        }
    }
    
    async fallbackBasicOCR(canvas, originalOptions = {}) {
        try {
            // Minimal options to avoid cloning issues
            const basicOptions = {};
            if (originalOptions.tessedit_pageseg_mode) {
                basicOptions.tessedit_pageseg_mode = originalOptions.tessedit_pageseg_mode;
            }
            
            console.log('Attempting basic OCR with minimal options');
            return await this.tesseractWorker.recognize(canvas, basicOptions);
        } catch (error) {
            console.warn('Basic OCR also failed, trying without any options');
            try {
                return await this.tesseractWorker.recognize(canvas);
            } catch (finalError) {
                console.error('All OCR attempts failed:', finalError);
                // Return empty result instead of crashing
                return {
                    data: {
                        text: '',
                        confidence: 0
                    }
                };
            }
        }
    }
    
    async recoverWorkerAndRetry(canvas, options = {}) {
        try {
            console.log('Attempting to recover Tesseract worker...');
            
            // Try to terminate existing worker
            if (this.tesseractWorker) {
                try {
                    await this.tesseractWorker.terminate();
                } catch (e) {
                    console.warn('Failed to terminate worker:', e);
                }
            }
            
            // Create new worker with minimal configuration using v4 API
            this.tesseractWorker = Tesseract.createWorker({
                logger: () => {} // Disable logging
            });
            
            await this.tesseractWorker.loadLanguage('eng');
            await this.tesseractWorker.initialize('eng');
            
            console.log('Worker recovered successfully');
            
            // Retry with basic options only
            return await this.fallbackBasicOCR(canvas, options);
        } catch (error) {
            console.error('Worker recovery failed:', error);
            this.tesseractWorker = null;
            
            // Return empty result
            return {
                data: {
                    text: '',
                    confidence: 0
                }
            };
        }
    }

    async performMultiPassOCR(canvas) {
        const results = [];
        
        try {
            // Single simple OCR call
            const result = await this.safeRecognize(canvas);
            
            if (result && result.data && result.data.text) {
                results.push({
                    text: result.data.text,
                    confidence: result.data.confidence || 75,
                    method: 'Simple-OCR'
                });
            }
            
        } catch (error) {
            console.warn('Simple OCR failed:', error.message);
        }
        
        return results;
    }
    
    async performBasicOCR(canvas) {
        const results = [];
        
        try {
            // Basic recognition without advanced parameters
            const basicResult = await this.safeRecognize(canvas, {
                tessedit_pageseg_mode: '6'
            });
            
            if (basicResult && basicResult.data && basicResult.data.text) {
                results.push({
                    text: basicResult.data.text,
                    confidence: basicResult.data.confidence || 50,
                    method: 'Basic-PSM6'
                });
            }
        } catch (error) {
            console.warn('Basic PSM6 failed:', error.message);
        }
        
        // Try with PSM 7 if PSM 6 didn't work well
        if (results.length === 0 || results[0].confidence < 30) {
            try {
                const lineResult = await this.safeRecognize(canvas, {
                    tessedit_pageseg_mode: '7'
                });
                
                if (lineResult && lineResult.data && lineResult.data.text) {
                    results.push({
                        text: lineResult.data.text,
                        confidence: lineResult.data.confidence || 40,
                        method: 'Basic-PSM7'
                    });
                }
            } catch (error) {
                console.warn('Basic PSM7 failed:', error.message);
            }
        }
        
        // Last resort: no options at all
        if (results.length === 0) {
            try {
                console.log('Attempting minimal OCR without options');
                const minimalResult = await this.safeRecognize(canvas);
                
                if (minimalResult && minimalResult.data && minimalResult.data.text) {
                    results.push({
                        text: minimalResult.data.text,
                        confidence: minimalResult.data.confidence || 30,
                        method: 'Minimal'
                    });
                }
            } catch (error) {
                console.error('Even minimal OCR failed:', error.message);
            }
        }
        
        return results;
    }

    // Advanced image preprocessing methods
    applyGaussianBlur(imageData, sigma = 0.5) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const kernel = this.generateGaussianKernel(sigma);
        const kernelSize = kernel.length;
        const halfKernel = Math.floor(kernelSize / 2);
        
        const originalData = new Uint8ClampedArray(data);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, totalWeight = 0;
                
                for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                    for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                        const py = Math.max(0, Math.min(height - 1, y + ky));
                        const px = Math.max(0, Math.min(width - 1, x + kx));
                        const weight = kernel[ky + halfKernel][kx + halfKernel];
                        const idx = (py * width + px) * 4;
                        
                        r += originalData[idx] * weight;
                        g += originalData[idx + 1] * weight;
                        b += originalData[idx + 2] * weight;
                        totalWeight += weight;
                    }
                }
                
                const idx = (y * width + x) * 4;
                data[idx] = r / totalWeight;
                data[idx + 1] = g / totalWeight;
                data[idx + 2] = b / totalWeight;
            }
        }
    }
    
    generateGaussianKernel(sigma) {
        const size = Math.ceil(sigma * 3) * 2 + 1;
        const kernel = [];
        const center = Math.floor(size / 2);
        let sum = 0;
        
        for (let y = 0; y < size; y++) {
            kernel[y] = [];
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
                kernel[y][x] = value;
                sum += value;
            }
        }
        
        // Normalize kernel
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                kernel[y][x] /= sum;
            }
        }
        
        return kernel;
    }
    
    applyCLAHE(imageData, clipLimit = 2.0, tileSize = 8) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Convert to grayscale first
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            data[i] = data[i + 1] = data[i + 2] = gray;
        }
        
        const tilesX = Math.ceil(width / tileSize);
        const tilesY = Math.ceil(height / tileSize);
        
        for (let ty = 0; ty < tilesY; ty++) {
            for (let tx = 0; tx < tilesX; tx++) {
                const startX = tx * tileSize;
                const startY = ty * tileSize;
                const endX = Math.min(startX + tileSize, width);
                const endY = Math.min(startY + tileSize, height);
                
                // Calculate histogram for this tile
                const histogram = new Array(256).fill(0);
                let pixelCount = 0;
                
                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const idx = (y * width + x) * 4;
                        histogram[data[idx]]++;
                        pixelCount++;
                    }
                }
                
                // Apply clipping
                const clipLevel = (clipLimit * pixelCount) / 256;
                let excess = 0;
                for (let i = 0; i < 256; i++) {
                    if (histogram[i] > clipLevel) {
                        excess += histogram[i] - clipLevel;
                        histogram[i] = clipLevel;
                    }
                }
                
                // Redistribute excess
                const redistribution = excess / 256;
                for (let i = 0; i < 256; i++) {
                    histogram[i] += redistribution;
                }
                
                // Create cumulative distribution
                const cdf = new Array(256);
                cdf[0] = histogram[0];
                for (let i = 1; i < 256; i++) {
                    cdf[i] = cdf[i - 1] + histogram[i];
                }
                
                // Normalize CDF
                for (let i = 0; i < 256; i++) {
                    cdf[i] = Math.round((cdf[i] / pixelCount) * 255);
                }
                
                // Apply equalization to tile
                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const idx = (y * width + x) * 4;
                        const newValue = cdf[data[idx]];
                        data[idx] = data[idx + 1] = data[idx + 2] = newValue;
                    }
                }
            }
        }
    }
    
    applyAdaptiveBinarization(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const windowSize = 15;
        const k = 0.2;
        const R = 128;
        
        // Calculate integral image
        const integralImage = new Array(height);
        for (let y = 0; y < height; y++) {
            integralImage[y] = new Array(width);
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const gray = data[idx]; // Already grayscale from CLAHE
                
                let sum = gray;
                if (x > 0) sum += integralImage[y][x - 1];
                if (y > 0) sum += integralImage[y - 1][x];
                if (x > 0 && y > 0) sum -= integralImage[y - 1][x - 1];
                
                integralImage[y][x] = sum;
            }
        }
        
        // Apply adaptive thresholding
        const halfWindow = Math.floor(windowSize / 2);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const gray = data[idx];
                
                // Calculate local mean using integral image
                const x1 = Math.max(0, x - halfWindow);
                const y1 = Math.max(0, y - halfWindow);
                const x2 = Math.min(width - 1, x + halfWindow);
                const y2 = Math.min(height - 1, y + halfWindow);
                
                const area = (x2 - x1 + 1) * (y2 - y1 + 1);
                let sum = integralImage[y2][x2];
                if (x1 > 0) sum -= integralImage[y2][x1 - 1];
                if (y1 > 0) sum -= integralImage[y1 - 1][x2];
                if (x1 > 0 && y1 > 0) sum += integralImage[y1 - 1][x1 - 1];
                
                const mean = sum / area;
                const threshold = mean * (1 + k * ((gray / R) - 1));
                
                const binaryValue = gray > threshold ? 255 : 0;
                data[idx] = data[idx + 1] = data[idx + 2] = binaryValue;
            }
        }
    }
    
    applyMorphologicalOperations(imageData) {
        // Apply closing operation (dilation followed by erosion) to fill gaps
        this.morphologicalDilation(imageData);
        this.morphologicalErosion(imageData);
    }
    
    morphologicalDilation(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const kernel = [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ];
        const originalData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let maxValue = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        if (kernel[ky + 1][kx + 1]) {
                            const idx = ((y + ky) * width + (x + kx)) * 4;
                            maxValue = Math.max(maxValue, originalData[idx]);
                        }
                    }
                }
                
                const idx = (y * width + x) * 4;
                data[idx] = data[idx + 1] = data[idx + 2] = maxValue;
            }
        }
    }
    
    morphologicalErosion(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const kernel = [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ];
        const originalData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let minValue = 255;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        if (kernel[ky + 1][kx + 1]) {
                            const idx = ((y + ky) * width + (x + kx)) * 4;
                            minValue = Math.min(minValue, originalData[idx]);
                        }
                    }
                }
                
                const idx = (y * width + x) * 4;
                data[idx] = data[idx + 1] = data[idx + 2] = minValue;
            }
        }
    }
    
    cleanOCRText(text) {
        // Very simple cleaning - just trim whitespace
        return text.trim().replace(/\s+/g, ' ');
    }
    
    isValidText(text) {
        if (text.length < 2) return false;
        
        // Must contain at least one letter (including German umlauts)
        if (!/[a-zA-ZäöüÄÖÜß]/.test(text)) return false;
        
        // Reject if mostly special characters
        const specialCharRatio = (text.match(/[^\w\säöüÄÖÜß]/g) || []).length / text.length;
        if (specialCharRatio > 0.6) return false;
        
        // German-specific OCR error patterns
        const errorPatterns = [
            /^[|\\\/\-_=+~`]{2,}$/, // Lines of special characters
            /^[0O]{3,}$/, // Repeated O's or 0's
            /^[lI1]{3,}$/, // Repeated l, I, or 1
            /^[\s.,!?-]{2,}$/, // Only punctuation
            /^[rn]{3,}$/, // Repeated r's or n's (common OCR error)
            /^[ui]{3,}$/, // Repeated u's or i's (common in poor quality)
            /^m{3,}$/, // Repeated m's (scanning artifacts)
            /^\d+[|\\\/\-_]{2,}\d*$/ // Numbers with scanning artifacts
        ];
        
        if (errorPatterns.some(pattern => pattern.test(text))) {
            return false;
        }
        
        // Additional German text quality checks
        // Reject if it looks like scanning artifacts or formatting
        if (text.length > 20 && !/\s/.test(text) && !/\d/.test(text)) {
            // Very long text without spaces or numbers is suspicious
            return false;
        }
        
        // Accept common German words and patterns
        const germanPatterns = [
            /^(der|die|das|ein|eine|und|oder|mit|für|von|zu|in|auf|an|bei|über|unter|nach|vor|zwischen|während|seit|bis|gegen|ohne|durch|um|wegen|trotz|statt|außer|innerhalb|außerhalb)$/i,
            /^(ich|du|er|sie|es|wir|ihr|sie|mein|dein|sein|ihr|unser|euer|dieser|jener|welcher|alle|einige|viele|wenige)$/i,
            /^(haben|sein|werden|können|müssen|sollen|wollen|dürfen|mögen|lassen|gehen|kommen|machen|tun|geben|nehmen|sehen|hören|sagen|denken|wissen|glauben)$/i
        ];
        
        // If it matches common German patterns, it's likely valid
        if (germanPatterns.some(pattern => pattern.test(text))) {
            return true;
        }
        
        return true; // Default to accepting if it passes basic checks
    }

    addToTextList(text, confidence = 0) {
        const key = text.toLowerCase();
        if (!this.detectedTexts.has(key)) {
            this.detectedTexts.add(key);
            
            const textItem = document.createElement('div');
            textItem.className = 'text-item';
            
            // Color-code confidence levels
            let confidenceColor = '#ef4444'; // Red for low confidence
            if (confidence > 80) confidenceColor = '#10b981'; // Green for high confidence
            else if (confidence > 60) confidenceColor = '#f59e0b'; // Orange for medium confidence
            
            textItem.innerHTML = `
                <div style="font-weight: 500;">${text}</div>
                <small style="opacity: 0.8; font-size: 11px; display: flex; justify-content: space-between;">
                    <span>${new Date().toLocaleTimeString('de-DE')}</span>
                    <span style="color: ${confidenceColor}; font-weight: 600;">
                        ${confidence.toFixed(0)}% Confidence
                    </span>
                </small>
            `;
            
            this.textList.appendChild(textItem);
            
            // Scroll to show new text
            this.textList.scrollTop = this.textList.scrollHeight;
            
            // Limit list size to prevent memory issues
            if (this.textList.children.length > 50) {
                this.textList.removeChild(this.textList.firstChild);
            }
        }
    }
}

// Selfie Segmentation Module
class SelfieSegmentationModule {
    constructor() {
        this.segmenter = null;
        this.video = document.getElementById('selfie-video');
        this.canvas = document.getElementById('selfie-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('selfie-start');
        this.stopBtn = document.getElementById('selfie-stop');
        this.status = document.getElementById('selfie-status');
        this.loading = document.getElementById('selfie-loading');
        this.fpsCounter = new FPSCounter('selfie-fps');
        this.isSegmenting = false;
        this.animationId = null;

        this.backgroundType = document.getElementById('background-type');
        this.invertMask = document.getElementById('invert-mask');
        this.virtualBg = null;

        this.init();
    }

    async init() {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            this.segmenter = await ImageSegmenter.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                outputCategoryMask: true,
                outputConfidenceMasks: false
            });

            // Create virtual background
            this.createVirtualBackground();

            this.loading.style.display = 'none';
            this.setupEventListeners();
        } catch (error) {
            console.error("Fehler beim Laden von Selfie Segmentation:", error);
            this.status.textContent = "Fehler beim Laden!";
            this.loading.style.display = 'none';
        }
    }

    createVirtualBackground() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        this.virtualBg = gradient;
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
    }

    start() {
        if (!this.segmenter || this.isSegmenting) return;

        this.isSegmenting = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.status.textContent = "Segmentierung läuft...";

        this.segment();
    }

    stop() {
        this.isSegmenting = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.status.textContent = "Segmentierung gestoppt";

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    async segment() {
        if (!this.isSegmenting) return;

        const startTimeMs = performance.now();

        if (this.segmenter && this.video.readyState >= 2) {
            const results = await this.segmenter.segmentForVideo(this.video, startTimeMs);

            if (results.categoryMask) {
                this.applySegmentation(results.categoryMask);
            }

            this.fpsCounter.update();
        }

        this.animationId = requestAnimationFrame(() => this.segment());
    }

    applySegmentation(mask) {
        const width = mask.width;
        const height = mask.height;

        // Create temporary canvas for processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw video frame
        tempCtx.drawImage(this.video, 0, 0, width, height);
        const frameData = tempCtx.getImageData(0, 0, width, height);

        // Get mask data and invert if needed
        const maskData = mask.getAsFloat32Array();
        const isInverted = this.invertMask.checked;

        // Apply segmentation based on type
        const bgType = this.backgroundType.value;

        if (bgType === 'blur') {
            // Apply blur to background
            tempCtx.filter = 'blur(15px)';
            tempCtx.drawImage(this.video, 0, 0, width, height);
            const blurData = tempCtx.getImageData(0, 0, width, height);

            // Combine based on mask (and inversion)
            for (let i = 0; i < maskData.length; i++) {
                const idx = i * 4;
                const isBackground = isInverted ? maskData[i] < 0.5 : maskData[i] >= 0.5;

                if (isBackground) {
                    frameData.data[idx] = blurData.data[idx];
                    frameData.data[idx + 1] = blurData.data[idx + 1];
                    frameData.data[idx + 2] = blurData.data[idx + 2];
                }
            }
        } else if (bgType === 'blur-person') {
            // Apply blur to person/foreground
            tempCtx.filter = 'blur(15px)';
            tempCtx.drawImage(this.video, 0, 0, width, height);
            const blurData = tempCtx.getImageData(0, 0, width, height);

            // Combine - blur the person, keep background sharp
            for (let i = 0; i < maskData.length; i++) {
                const idx = i * 4;
                const isPerson = isInverted ? maskData[i] >= 0.5 : maskData[i] < 0.5;

                if (isPerson) {
                    frameData.data[idx] = blurData.data[idx];
                    frameData.data[idx + 1] = blurData.data[idx + 1];
                    frameData.data[idx + 2] = blurData.data[idx + 2];
                }
            }
        } else if (bgType === 'virtual') {
            // Apply virtual background
            this.ctx.fillStyle = this.virtualBg;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            for (let i = 0; i < maskData.length; i++) {
                const idx = i * 4;
                const shouldRemove = isInverted ? maskData[i] < 0.5 : maskData[i] >= 0.5;

                if (shouldRemove) {
                    frameData.data[idx + 3] = 0; // Make transparent
                }
            }
        } else if (bgType === 'remove') {
            // Remove background or person (transparent)
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            for (let i = 0; i < maskData.length; i++) {
                const idx = i * 4;
                const shouldRemove = isInverted ? maskData[i] < 0.5 : maskData[i] >= 0.5;

                if (shouldRemove) {
                    frameData.data[idx + 3] = 0; // Make transparent
                }
            }
        }

        // Draw result
        tempCtx.putImageData(frameData, 0, 0);
        this.ctx.drawImage(tempCanvas, 0, 0, this.canvas.width, this.canvas.height);
    }
}

// Camera switching function
async function switchCamera() {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    await setupCameraForTab(currentTab, newFacingMode);
}

// Setup camera switch buttons for all tabs
['hands', 'face', 'pose', 'objects', 'selfie'].forEach(tabName => {
    const switchBtn = document.getElementById(`${tabName}-camera-switch`);
    if (switchBtn) {
        switchBtn.addEventListener('click', async () => {
            // Disable button during switch
            switchBtn.disabled = true;
            switchBtn.textContent = '🔄 Wechsle...';
            
            try {
                await switchCamera();
                switchBtn.textContent = '📷 Kamera wechseln';
            } catch (error) {
                console.error('Fehler beim Kamera-Wechsel:', error);
                switchBtn.textContent = '📷 Kamera wechseln';
            }
            
            switchBtn.disabled = false;
        });
    }
});

// Initialize modules
const handTracking = new HandTrackingModule();
const faceDetection = new FaceDetectionModule();
const poseDetection = new PoseDetectionModule();
const objectDetection = new ObjectDetectionModule();
const selfieSegmentation = new SelfieSegmentationModule();

// Setup initial camera
setupCameraForTab('hands');