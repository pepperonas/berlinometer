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
        
        // For detected objects list
        this.detectedObjects = new Set();
        this.objectList = document.getElementById('detected-objects-list');

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