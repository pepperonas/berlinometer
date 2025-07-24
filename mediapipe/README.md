# MediaPipe Multi-Feature Demo

A comprehensive web application showcasing Google MediaPipe's computer vision capabilities in real-time through the browser.

## 🚀 Features

### Hand Tracking
- Real-time hand detection and tracking
- 21 hand landmarks per hand
- Support for up to 2 hands simultaneously
- Visual representation of hand connections and key points
- Different colors for left (green) and right (blue) hands

### Face Detection & Analysis
- 468 facial landmarks detection
- Configurable display options:
  - Landmarks visualization
  - Face mesh connections
  - Face contours
- Real-time face tracking for up to 2 faces
- Face blendshapes and transformation matrices

### Pose Detection
- Full-body pose estimation
- 33 body landmarks per person
- Support for up to 2 people
- Color-coded body parts:
  - Red: Face/Head
  - Blue: Body/Torso
  - Yellow: Hands/Feet

### Object Detection
- Real-time object recognition
- Configurable confidence threshold (30%, 50%, 70%, 90%)
- Bounding boxes with labels and confidence scores
- Live object list with detected items
- Support for multiple objects simultaneously

### Selfie Segmentation
- Real-time background/person segmentation
- Multiple background effects:
  - Background blur
  - Person blur
  - Virtual background (gradient)
  - Background removal (transparency)
- Mask inversion option

## 🎥 Camera Features

- **Camera Switching**: Toggle between front and rear cameras
- **Real-time Processing**: All features work with live camera feed
- **FPS Counter**: Performance monitoring for each feature
- **Mobile Optimized**: Touch-friendly interface with responsive design

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Computer Vision**: Google MediaPipe Tasks Vision
- **Media**: WebRTC getUserMedia API
- **Graphics**: HTML5 Canvas for real-time drawing
- **Architecture**: Modular class-based structure

## 📁 Project Structure

```
mediapipe/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styles and responsive design
├── script.js           # JavaScript modules and MediaPipe integration
├── mediapipe.png       # Social media thumbnail
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser with WebRTC support
- Camera access permissions
- Stable internet connection (for MediaPipe models)

### Installation & Usage

1. **Clone or download** the project files
2. **Serve the files** using a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using Live Server (VS Code extension)
   # Right-click index.html → "Open with Live Server"
   ```
3. **Open browser** and navigate to `http://localhost:8000`
4. **Allow camera access** when prompted
5. **Select a feature tab** and click "Start" to begin tracking

### Direct Usage
Simply open `index.html` in a modern web browser. The application will automatically load MediaPipe models from CDN.

## 🎮 How to Use

1. **Select Feature**: Click on any tab (Hand Tracking, Face Detection, etc.)
2. **Grant Permissions**: Allow camera access when prompted
3. **Start Tracking**: Click the "Start" button for the selected feature
4. **Adjust Settings**: Use checkboxes and dropdowns to customize display
5. **Switch Camera**: Use the camera switch button to toggle between front/rear cameras
6. **Monitor Performance**: Check the FPS counter for real-time performance

## ⚙️ Configuration Options

### Face Detection
- **Show Landmarks**: Toggle 468 facial points
- **Show Mesh**: Display face mesh connections
- **Show Contours**: Highlight face outline

### Object Detection
- **Confidence Threshold**: Set minimum detection confidence (30-90%)
- **Live Object List**: View all detected objects with confidence scores

### Selfie Segmentation
- **Background Effects**: Choose from blur, virtual, or removal
- **Mask Inversion**: Flip the segmentation mask

## 🔧 Technical Details

### MediaPipe Models Used
- **Hand Landmarker**: `hand_landmarker.task` (Float16)
- **Face Landmarker**: `face_landmarker.task` (Float16)
- **Pose Landmarker**: `pose_landmarker_heavy.task` (Float16)
- **Object Detector**: `efficientdet_lite0.tflite` (Float16)
- **Selfie Segmenter**: `selfie_segmenter.tflite` (Float16)

### Performance Optimizations
- GPU acceleration when available
- Efficient canvas rendering
- Optimized video processing pipeline
- FPS monitoring and frame rate optimization

### Browser Compatibility
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 📱 Mobile Support

- **Responsive Design**: Adapts to different screen sizes
- **Touch Optimization**: Touch-friendly controls and interactions
- **Mobile Cameras**: Full support for mobile front/rear cameras
- **Performance Tuned**: Optimized for mobile GPU processing

## 🔒 Privacy & Security

- **Local Processing**: All computer vision processing happens locally in the browser
- **No Data Upload**: Camera feed never leaves your device
- **HTTPS Required**: Secure connection required for camera access
- **Permission Based**: Explicit camera permission required

## 🐛 Troubleshooting

### Common Issues

**Camera not working:**
- Ensure HTTPS connection (required for camera access)
- Check browser permissions for camera access
- Try refreshing the page
- Test camera switching functionality

**Performance issues:**
- Close other browser tabs using camera
- Ensure good lighting conditions
- Check if GPU acceleration is enabled
- Monitor FPS counter for performance metrics

**Model loading errors:**
- Check internet connection
- Ensure CDN access to MediaPipe models
- Try refreshing the page
- Check browser console for detailed errors

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for:
- Bug fixes
- Performance improvements
- New MediaPipe features
- UI/UX enhancements
- Documentation improvements

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Google MediaPipe Team** for the excellent computer vision library
- **WebRTC Community** for camera access standards
- **Open Source Contributors** for inspiration and code examples

## 🔗 Links

- [MediaPipe Documentation](https://developers.google.com/mediapipe)
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision/overview)
- [WebRTC getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

---

**Made with ❤️ by [Martin Pfeffer](https://github.com/pepperonas)**

*Experience the power of AI-driven computer vision directly in your browser!*