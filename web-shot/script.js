let stream = null;
let photos = [];

const video = document.getElementById('video');
const hiddenVideo = document.getElementById('hiddenVideo');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const photoBtn = document.getElementById('photoBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const photosSection = document.getElementById('photosSection');
const photosGrid = document.getElementById('photosGrid');
const filterSection = document.getElementById('filterSection');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const backgroundSection = document.getElementById('backgroundSection');
const uploadSection = document.getElementById('uploadSection');
const backgroundUpload = document.getElementById('backgroundUpload');
const backgroundPreview = document.getElementById('backgroundPreview');
const previewImage = document.getElementById('previewImage');

// Filter state
let currentFilters = {
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0
};

// Filter presets
const filterPresets = {
    normal: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0 },
    vintage: { blur: 0, brightness: 110, contrast: 90, saturate: 70, grayscale: 0, sepia: 40 },
    blackwhite: { blur: 0, brightness: 100, contrast: 120, saturate: 0, grayscale: 100, sepia: 0 },
    warm: { blur: 0, brightness: 110, contrast: 100, saturate: 130, grayscale: 0, sepia: 20 },
    cold: { blur: 0, brightness: 100, contrast: 110, saturate: 80, grayscale: 10, sepia: 0 },
    dramatic: { blur: 0, brightness: 90, contrast: 140, saturate: 110, grayscale: 0, sepia: 0 },
    blur: { blur: 8, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0 },
    bokeh: { blur: 0, brightness: 105, contrast: 95, saturate: 110, grayscale: 0, sepia: 0 }
};

// Get all filter elements
const filterSliders = {
    blur: document.getElementById('blurSlider'),
    brightness: document.getElementById('brightnessSlider'),
    contrast: document.getElementById('contrastSlider'),
    saturate: document.getElementById('saturateSlider'),
    grayscale: document.getElementById('grayscaleSlider'),
    sepia: document.getElementById('sepiaSlider')
};

const filterValues = {
    blur: document.getElementById('blurValue'),
    brightness: document.getElementById('brightnessValue'),
    contrast: document.getElementById('contrastValue'),
    saturate: document.getElementById('saturateValue'),
    grayscale: document.getElementById('grayscaleValue'),
    sepia: document.getElementById('sepiaValue')
};

// Background state
let backgroundMode = 'none'; // none, blur, custom
let customBackgroundImage = null;
let segmentationActive = false;
let selfieSegmentation = null;
let segmentationResults = null;

// Background presets
const backgroundPresets = {
    code: 'backgrounds/code.png',
    kitchen: 'backgrounds/ktichen.jpeg',
    prison: 'backgrounds/prison.jpeg',
    startrek: 'backgrounds/star-treck.jpeg'
};

// Initialize MediaPipe SelfieSegmentation
async function initializeMediaPipe() {
    try {
        console.log('Initializing MediaPipe SelfieSegmentation...');
        
        selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1632777926/${file}`;
            }
        });

        selfieSegmentation.setOptions({
            modelSelection: 0,
            selfieMode: false,
            effectSelection: 1
        });

        selfieSegmentation.onResults(onSegmentationResults);
        
        console.log('✅ MediaPipe SelfieSegmentation initialized');
        return true;
        
    } catch (error) {
        console.error('❌ MediaPipe initialization failed:', error);
        return false;
    }
}

// Handle segmentation results from MediaPipe
function onSegmentationResults(results) {
    if (!segmentationActive) return;
    
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (backgroundMode === 'blur') {
            // Create temp canvas for blurred background
            const blurCanvas = document.createElement('canvas');
            blurCanvas.width = canvas.width;
            blurCanvas.height = canvas.height;
            const blurCtx = blurCanvas.getContext('2d');
            
            // Draw blurred background
            blurCtx.filter = 'blur(20px)';
            blurCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            ctx.drawImage(blurCanvas, 0, 0);
            
        } else if (backgroundMode === 'custom' && customBackgroundImage) {
            // Draw custom background with proper aspect ratio
            const imgAspect = customBackgroundImage.width / customBackgroundImage.height;
            const canvasAspect = canvas.width / canvas.height;
            
            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
            
            if (imgAspect > canvasAspect) {
                drawHeight = canvas.height;
                drawWidth = drawHeight * imgAspect;
                offsetX = (canvas.width - drawWidth) / 2;
            } else {
                drawWidth = canvas.width;
                drawHeight = drawWidth / imgAspect;
                offsetY = (canvas.height - drawHeight) / 2;
            }
            
            // Draw the custom background
            ctx.drawImage(customBackgroundImage, offsetX, offsetY, drawWidth, drawHeight);
            
        } else {
            // No background effect, just draw the original video
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            return; // No need for person mask overlay
        }
        
        // Create mask canvas for person overlay
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        
        // Draw original image
        maskCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        
        // Apply segmentation mask
        maskCtx.globalCompositeOperation = 'destination-in';
        maskCtx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
        
        // Draw person on top of background
        ctx.drawImage(maskCanvas, 0, 0);
        
    } catch (error) {
        console.error('Segmentation error:', error);
        // Fallback: just draw the video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
}

// Draw the segmented image with background effects
function drawSegmentedImage() {
    if (!segmentationResults || !segmentationResults.segmentationMask) {
        console.log('No segmentation results or mask available');
        return;
    }

    try {
        console.log('Drawing segmented image, canvas size:', canvas.width, 'x', canvas.height);
        console.log('segmentationResults.image:', segmentationResults.image);
        console.log('segmentationResults.segmentationMask:', segmentationResults.segmentationMask);
        
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (backgroundMode === 'blur') {
            console.log('Testing MediaPipe ImageBitmap drawing...');
            
            try {
                // TEST: Debug hiddenVideo state before drawing
                console.log('Testing direct hiddenVideo draw...');
                console.log('hiddenVideo.videoWidth:', hiddenVideo.videoWidth);
                console.log('hiddenVideo.videoHeight:', hiddenVideo.videoHeight);  
                console.log('hiddenVideo.readyState:', hiddenVideo.readyState);
                console.log('hiddenVideo.srcObject:', hiddenVideo.srcObject);
                
                // Draw the video frame
                if (hiddenVideo.videoWidth > 0 && hiddenVideo.videoHeight > 0) {
                    ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
                    console.log('✅ Video frame drawn successfully');
                    
                    // Apply background blur if MediaPipe segmentation is available
                    if (segmentationResults && segmentationResults.segmentationMask) {
                        applyBackgroundBlurWithSegmentation();
                    } else {
                        // Apply simple blur effect to entire frame
                        applySimpleBackgroundBlur();
                    }
                } else {
                    console.log('❌ hiddenVideo not ready - using main video instead');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    applySimpleBackgroundBlur();
                }
            } catch (error) {
                console.error('❌ Error drawing hiddenVideo:', error);
                
                // Try MediaPipe image with different approach
                try {
                    console.log('Trying MediaPipe image with createImageBitmap...');
                    
                    // Draw MediaPipe image directly
                    ctx.drawImage(segmentationResults.image, 0, 0, canvas.width, canvas.height);
                    console.log('✅ MediaPipe image drawn with fallback!');
                    
                } catch (error2) {
                    console.error('❌ MediaPipe drawing failed completely:', error2);
                    // Draw test pattern to show failure
                    ctx.fillStyle = 'red';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    console.log('Drew red error background');
                }
            }
            
        } else if (backgroundMode === 'custom' && customBackgroundImage) {
            console.log('Applying custom background with person segmentation...');
            
            // Step 1: Draw custom background with proper aspect ratio
            const imgAspect = customBackgroundImage.width / customBackgroundImage.height;
            const canvasAspect = canvas.width / canvas.height;
            
            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
            
            if (imgAspect > canvasAspect) {
                drawHeight = canvas.height;
                drawWidth = drawHeight * imgAspect;
                offsetX = (canvas.width - drawWidth) / 2;
            } else {
                drawWidth = canvas.width;
                drawHeight = drawWidth / imgAspect;
                offsetY = (canvas.height - drawHeight) / 2;
            }
            
            // Draw the custom background
            ctx.drawImage(customBackgroundImage, offsetX, offsetY, drawWidth, drawHeight);
            
            // Step 2: Create person-only layer using segmentation
            const personCanvas = document.createElement('canvas');
            personCanvas.width = canvas.width;
            personCanvas.height = canvas.height;
            const personCtx = personCanvas.getContext('2d');
            
            // Draw the original sharp image
            personCtx.drawImage(segmentationResults.image, 0, 0, canvas.width, canvas.height);
            
            // Apply segmentation mask to keep only the person
            personCtx.globalCompositeOperation = 'destination-in';
            personCtx.drawImage(segmentationResults.segmentationMask, 0, 0, canvas.width, canvas.height);
            
            // Step 3: Overlay person on custom background
            ctx.drawImage(personCanvas, 0, 0);
            
            console.log('Custom background with person segmentation applied successfully');
        }

        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';

        // Apply additional filters if any
        if (video.style.filter && video.style.filter !== 'none') {
            const filterCanvas = document.createElement('canvas');
            filterCanvas.width = canvas.width;
            filterCanvas.height = canvas.height;
            const filterCtx = filterCanvas.getContext('2d');
            
            filterCtx.filter = video.style.filter;
            filterCtx.drawImage(canvas, 0, 0);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(filterCanvas, 0, 0);
        }

        ctx.restore();
    } catch (error) {
        console.error('Segmentation drawing error:', error);
        fallbackToSimpleBlur();
    }
}

// Apply background blur with person segmentation
function applyBackgroundBlurWithSegmentation() {
    try {
        console.log('Applying background blur with person segmentation...');
        
        // Get current frame data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Create blurred version of the frame
        const blurredCanvas = document.createElement('canvas');
        blurredCanvas.width = canvas.width;
        blurredCanvas.height = canvas.height;
        const blurredCtx = blurredCanvas.getContext('2d');
        
        // Draw video to blur canvas
        blurredCtx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
        blurredCtx.filter = 'blur(15px)';
        blurredCtx.drawImage(blurredCanvas, 0, 0);
        
        // Apply segmentation mask to composite person over blurred background
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        
        // Draw blurred background
        ctx.drawImage(blurredCanvas, 0, 0);
        
        // Draw person using segmentation mask
        // This is a simplified approach - would need proper mask processing for perfect results
        ctx.globalCompositeOperation = 'source-atop';
        if (segmentationResults && segmentationResults.image) {
            ctx.drawImage(segmentationResults.image, 0, 0, canvas.width, canvas.height);
        }
        
        ctx.restore();
        console.log('✅ Background blur with segmentation applied');
        
    } catch (error) {
        console.error('❌ Segmentation blur failed:', error);
        applySimpleBackgroundBlur();
    }
}

// Apply simple background blur (fallback)
function applySimpleBackgroundBlur() {
    try {
        console.log('Applying simple background blur...');
        
        // Apply CSS filter blur effect
        ctx.save();
        ctx.filter = 'blur(8px)';
        ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        console.log('✅ Simple background blur applied');
        
    } catch (error) {
        console.error('❌ Simple blur failed:', error);
    }
}

function showStatus(message, type = 'success') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');

    setTimeout(() => {
        status.classList.add('hidden');
    }, 3000);
}

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: {ideal: 1280},
                height: {ideal: 720}
            },
            audio: false
        });

        video.srcObject = stream;

        // UI aktualisieren
        startBtn.classList.add('hidden');
        photoBtn.classList.remove('hidden');
        stopBtn.classList.remove('hidden');
        photoBtn.disabled = false;
        filterSection.classList.remove('hidden');
        backgroundSection.classList.remove('hidden');

        // Always initialize MediaPipe fresh for each camera start
        console.log('Initializing MediaPipe for new camera session...');
        await initializeMediaPipe();

        // Set up video for MediaPipe
        hiddenVideo.srcObject = stream;
        console.log('Stream assigned to hiddenVideo:', stream);
        console.log('HiddenVideo dimensions:', hiddenVideo.videoWidth, 'x', hiddenVideo.videoHeight);

        // Canvas and MediaPipe setup complete

        showStatus('Kamera erfolgreich gestartet!');

    } catch (error) {
        console.error('Fehler beim Zugriff auf Kamera:', error);
        showStatus('Fehler beim Zugriff auf die Kamera. Berechtigung erteilt?', 'error');
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
        hiddenVideo.srcObject = null;
    }

    // UI zurücksetzen
    startBtn.classList.remove('hidden');
    photoBtn.classList.add('hidden');
    stopBtn.classList.add('hidden');
    photoBtn.disabled = true;

    showStatus('Kamera gestoppt');
    filterSection.classList.add('hidden');
    backgroundSection.classList.add('hidden');
    
    // Reset all background states
    segmentationActive = false;
    backgroundMode = 'none';
    
    // Reset canvas and video visibility
    canvas.classList.add('hidden');
    video.classList.remove('hidden');
    canvas.style.display = '';
    video.style.display = '';
    
    // Clear canvas
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Reset MediaPipe
    selfieSegmentation = null;
    segmentationResults = null;
    
    // Reset UI states
    document.querySelectorAll('.background-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector('[data-background="none"]').classList.add('active');
    uploadSection.classList.add('hidden');
}

// Background functions
async function startBackgroundProcessing() {
    console.log('Starting MediaPipe background processing...');
    console.log('Stream available:', !!stream);
    
    if (!stream || !selfieSegmentation) {
        console.error('Missing stream or MediaPipe not initialized');
        showStatus('Hintergrund-Verarbeitung nicht verfügbar', 'error');
        return;
    }

    segmentationActive = true;
    
    // Wait for video to be ready
    const waitForVideo = () => {
        console.log('Waiting for video... Current dimensions:', hiddenVideo.videoWidth, 'x', hiddenVideo.videoHeight);
        
        if (hiddenVideo.videoWidth > 0 && hiddenVideo.videoHeight > 0) {
            console.log('Video ready, setting canvas dimensions:', hiddenVideo.videoWidth, 'x', hiddenVideo.videoHeight);
            
            // Set canvas dimensions to match video
            canvas.width = hiddenVideo.videoWidth;
            canvas.height = hiddenVideo.videoHeight;
            
            // Calculate display size to maintain aspect ratio
            const aspectRatio = hiddenVideo.videoWidth / hiddenVideo.videoHeight;
            const maxWidth = 640;
            let displayWidth = hiddenVideo.videoWidth;
            let displayHeight = hiddenVideo.videoHeight;
            
            if (displayWidth > maxWidth) {
                displayWidth = maxWidth;
                displayHeight = maxWidth / aspectRatio;
            }
            
            // Set CSS display dimensions to match video element
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
            canvas.style.aspectRatio = aspectRatio;
            
            // Show canvas and hide video using CSS classes
            canvas.classList.remove('hidden');
            video.classList.add('hidden');
            
            console.log('Canvas configured - Display size:', displayWidth + 'x' + displayHeight, 'Internal size:', canvas.width + 'x' + canvas.height);
            console.log('Canvas visibility:', !canvas.classList.contains('hidden'), 'Video visibility:', !video.classList.contains('hidden'));
            
            showStatus('MediaPipe Hintergrund-Effekt aktiv', 'success');
            
            // Process frames using MediaPipe
            // Create MediaPipe Camera for continuous processing
            const camera = new Camera(hiddenVideo, {
                onFrame: async () => {
                    if (segmentationActive && selfieSegmentation) {
                        await selfieSegmentation.send({image: hiddenVideo});
                    }
                },
                width: 1280,
                height: 720
            });
            
            camera.start().catch(error => {
                console.error('Camera start error:', error);
                fallbackToSimpleBlur();
            });
        } else {
            setTimeout(waitForVideo, 100);
        }
    };
    
    waitForVideo();
}

function stopBackgroundProcessing() {
    console.log('Stopping background processing and resetting states...');
    
    segmentationActive = false;
    
    // Reset canvas and video visibility
    canvas.classList.add('hidden');
    video.classList.remove('hidden');
    video.style.filter = 'none';
    
    // Clear canvas completely
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Reset canvas display style
    canvas.style.display = '';
    video.style.display = '';
    
    console.log('✅ Background processing stopped and states reset');
}

// Fallback function for simple blur without segmentation
function fallbackToSimpleBlur() {
    console.log('Starting continuous background blur rendering...');
    
    if (backgroundMode === 'blur') {
        showStatus('Hintergrund-Blur aktiv (Live-Video)', 'success');
        
        // Ensure we have a fresh animation loop
        let animationId = null;
        
        const renderLiveBlurFrame = () => {
            if (segmentationActive && backgroundMode === 'blur') {
                // Clear entire canvas first
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Step 1: Draw full blurred background
                ctx.save();
                ctx.filter = 'blur(15px)';
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                ctx.restore();
                
                // Step 2: Draw sharp person area on top
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2 - canvas.height * 0.05; // Slightly up for head
                const personWidth = canvas.width * 0.4;
                const personHeight = canvas.height * 0.8;
                
                // Create smooth mask for person area
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                
                // Create elliptical clipping path for person
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, personWidth/2, personHeight/2, 0, 0, 2 * Math.PI);
                ctx.clip();
                
                // Draw sharp person
                ctx.filter = 'none';
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                ctx.restore();
                
                // Continue animation
                animationId = requestAnimationFrame(renderLiveBlurFrame);
            }
        };
        
        // Cancel any existing animation
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        console.log('✅ Starting live blur rendering...');
        renderLiveBlurFrame();
        
    } else {
        // Not blur mode, hide canvas and show video
        segmentationActive = false;
        canvas.classList.add('hidden');
        video.classList.remove('hidden');
    }
}

function setBackgroundMode(mode) {
    console.log('Setting background mode to:', mode);
    backgroundMode = mode;

    // Update UI
    document.querySelectorAll('.background-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-background="${mode}"]`).classList.add('active');

    if (mode === 'none') {
        stopBackgroundProcessing();
        uploadSection.classList.add('hidden');
    } else {
        // Always check if camera is running first
        if (!stream) {
            showStatus('Kamera muss zuerst gestartet werden', 'error');
            return;
        }
        
        // Initialize MediaPipe if needed before starting
        if (!selfieSegmentation) {
            console.log('MediaPipe not initialized, initializing now...');
            initializeMediaPipe().then(() => {
                setTimeout(() => {
                    startBackgroundProcessing();
                }, 500);
            });
        } else {
            console.log('MediaPipe already initialized, starting processing...');
            startBackgroundProcessing();
        }
        
        // Add timeout fallback in case processing fails
        setTimeout(() => {
            if ((backgroundMode === 'blur' || backgroundMode === 'custom') && canvas.style.display === 'none') {
                console.log('MediaPipe processing timeout, using fallback');
                fallbackToSimpleBlur();
            }
        }, 3000);
        
        if (mode === 'custom') {
            uploadSection.classList.remove('hidden');
        } else {
            uploadSection.classList.add('hidden');
        }
    }

    showStatus(`Hintergrund: ${mode === 'none' ? 'Original' : mode === 'blur' ? 'Unschärfe mit MediaPipe' : 'Eigenes Bild'}`);
}

function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Remove active state from presets when uploading custom image
    document.querySelectorAll('.preset-item').forEach(item => {
        item.classList.remove('active');
    });

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            customBackgroundImage = img;
            showBackgroundPreview(img.src);
            showStatus('Eigenes Hintergrundbild geladen');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Filter functions
function updateFilterValues() {
    filterValues.blur.textContent = currentFilters.blur + 'px';
    filterValues.brightness.textContent = currentFilters.brightness + '%';
    filterValues.contrast.textContent = currentFilters.contrast + '%';
    filterValues.saturate.textContent = currentFilters.saturate + '%';
    filterValues.grayscale.textContent = currentFilters.grayscale + '%';
    filterValues.sepia.textContent = currentFilters.sepia + '%';
}

function applyFiltersToVideo() {
    const filterString = `
        blur(${currentFilters.blur}px)
        brightness(${currentFilters.brightness}%)
        contrast(${currentFilters.contrast}%)
        saturate(${currentFilters.saturate}%)
        grayscale(${currentFilters.grayscale}%)
        sepia(${currentFilters.sepia}%)
    `;
    video.style.filter = filterString;
}

function applyFiltersToCanvas(imageData) {
    // Apply filters to canvas for photo capture
    ctx.filter = `
        blur(${currentFilters.blur}px)
        brightness(${currentFilters.brightness}%)
        contrast(${currentFilters.contrast}%)
        saturate(${currentFilters.saturate}%)
        grayscale(${currentFilters.grayscale}%)
        sepia(${currentFilters.sepia}%)
    `;
}

function applyPreset(presetName) {
    const preset = filterPresets[presetName];
    if (!preset) return;

    currentFilters = { ...preset };
    
    // Update sliders
    Object.keys(filterSliders).forEach(key => {
        filterSliders[key].value = currentFilters[key];
    });

    updateFilterValues();
    applyFiltersToVideo();

    // Update active preset button
    document.querySelectorAll('.filter-preset').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-preset="${presetName}"]`).classList.add('active');
}

function resetFilters() {
    applyPreset('normal');
    showStatus('Filter zurückgesetzt');
}

// Special bokeh effect implementation
function applyBokehEffect(ctx, canvas) {
    // Create a radial gradient for depth simulation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.4;
    
    // Save current state
    ctx.save();
    
    // Create temporary canvas for the blurred background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw blurred version
    tempCtx.filter = 'blur(15px)';
    tempCtx.drawImage(canvas, 0, 0);
    
    // Clear original canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw blurred background
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Create radial gradient mask
    ctx.globalCompositeOperation = 'destination-out';
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.8)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw sharp center
    ctx.globalCompositeOperation = 'destination-over';
    ctx.filter = 'none';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Restore state
    ctx.restore();
}

function takePhoto() {
    if (!stream) return;

    // Create temporary canvas for photo
    const photoCanvas = document.createElement('canvas');
    photoCanvas.width = video.videoWidth;
    photoCanvas.height = video.videoHeight;
    const photoCtx = photoCanvas.getContext('2d');

    // If background processing is active, copy from main canvas
    if (segmentationActive && backgroundMode !== 'none' && canvas.style.display !== 'none') {
        photoCtx.drawImage(canvas, 0, 0);
    } else {
        // Check if bokeh effect is active
        const isBokeh = document.querySelector('[data-preset="bokeh"]').classList.contains('active');
        
        if (isBokeh) {
            // First draw the video without filters
            photoCtx.filter = 'none';
            photoCtx.drawImage(video, 0, 0);
            // Then apply bokeh effect
            applyBokehEffect(photoCtx, photoCanvas);
        } else {
            // Apply regular filters
            photoCtx.filter = `
                blur(${currentFilters.blur}px)
                brightness(${currentFilters.brightness}%)
                contrast(${currentFilters.contrast}%)
                saturate(${currentFilters.saturate}%)
                grayscale(${currentFilters.grayscale}%)
                sepia(${currentFilters.sepia}%)
            `;
            // Video-Frame auf Canvas zeichnen
            photoCtx.drawImage(video, 0, 0);
        }
    }

    // Foto als Data URL erstellen
    const photoDataUrl = photoCanvas.toDataURL('image/jpeg', 0.9);

    // Foto zur Liste hinzufügen
    const timestamp = new Date().toLocaleString('de-DE');
    const photo = {
        id: Date.now(),
        dataUrl: photoDataUrl,
        timestamp: timestamp
    };

    photos.unshift(photo); // Am Anfang hinzufügen
    updatePhotosGrid();

    showStatus(`Foto aufgenommen! (${photos.length} Fotos gespeichert)`);
}

function updatePhotosGrid() {
    if (photos.length === 0) {
        photosSection.classList.add('hidden');
        return;
    }

    photosSection.classList.remove('hidden');
    photosGrid.innerHTML = '';

    photos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
                <img src="${photo.dataUrl}" alt="Foto vom ${photo.timestamp}">
                <div class="timestamp">${photo.timestamp}</div>
                <button class="btn btn-primary" onclick="downloadPhoto('${photo.dataUrl}', '${photo.timestamp}')">
                    💾 Herunterladen
                </button>
            `;
        photosGrid.appendChild(photoItem);
    });
}

function downloadPhoto(dataUrl, timestamp) {
    const link = document.createElement('a');
    link.download = `foto_${timestamp.replace(/[\/\s:]/g, '_')}.jpg`;
    link.href = dataUrl;
    link.click();
}

// Function to select a background preset
function selectBackgroundPreset(presetName) {
    console.log(`Selecting background preset: ${presetName}`);
    
    // Remove active class from all presets
    document.querySelectorAll('.preset-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected preset
    document.querySelector(`[data-preset="${presetName}"]`).classList.add('active');
    
    // Load the preset image
    const presetPath = backgroundPresets[presetName];
    if (presetPath) {
        const img = new Image();
        img.onload = () => {
            customBackgroundImage = img;
            showBackgroundPreview(img.src);
            console.log(`✅ Background preset "${presetName}" loaded successfully`);
            
            // If custom background mode is already active, apply immediately
            if (backgroundMode === 'custom') {
                // Refresh the background processing
                if (segmentationActive) {
                    console.log('Refreshing background with new preset...');
                }
            }
        };
        img.onerror = () => {
            console.error(`❌ Failed to load background preset: ${presetPath}`);
            showStatus('Fehler beim Laden des Hintergrunds', 'error');
        };
        img.src = presetPath;
    }
}

// Function to show background preview
function showBackgroundPreview(imageSrc) {
    const previewImage = document.getElementById('previewImage');
    const backgroundPreview = document.getElementById('backgroundPreview');
    
    previewImage.src = imageSrc;
    backgroundPreview.style.display = 'block';
}

// Event Listeners
startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);
photoBtn.addEventListener('click', takePhoto);
resetFiltersBtn.addEventListener('click', resetFilters);
backgroundUpload.addEventListener('change', handleBackgroundUpload);

// Filter preset listeners
document.querySelectorAll('.filter-preset').forEach(preset => {
    preset.addEventListener('click', (e) => {
        const presetName = e.target.dataset.preset;
        applyPreset(presetName);
    });
});

// Filter slider listeners
Object.keys(filterSliders).forEach(key => {
    filterSliders[key].addEventListener('input', (e) => {
        currentFilters[key] = parseFloat(e.target.value);
        updateFilterValues();
        applyFiltersToVideo();
        
        // Remove active state from presets when manually adjusting
        document.querySelectorAll('.filter-preset').forEach(btn => {
            btn.classList.remove('active');
        });
    });
});

// Background option listeners
document.querySelectorAll('.background-option').forEach(option => {
    option.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.background;
        setBackgroundMode(mode);
    });
});

// Background preset gallery listeners
document.querySelectorAll('.preset-item').forEach(preset => {
    preset.addEventListener('click', (e) => {
        const presetName = e.currentTarget.dataset.preset;
        selectBackgroundPreset(presetName);
    });
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !photoBtn.classList.contains('hidden') && !photoBtn.disabled) {
        e.preventDefault();
        takePhoto();
    }
});