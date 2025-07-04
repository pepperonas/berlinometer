# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a German speech recognition web application that provides real-time speech-to-text conversion with audio visualization. The application features multi-language support, continuous and single-sentence modes, and extensive mobile optimization for cross-platform compatibility.

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Audio Processing**: Web Speech API (SpeechRecognition / webkitSpeechRecognition)
- **UI Framework**: Custom CSS Grid/Flexbox with responsive design
- **Browser Support**: Chrome, Safari, Edge (optimized for mobile browsers)

### File Structure
```
speech-recognition/
├── index.html          # Main HTML structure with semantic markup
├── script.js           # Core JavaScript functionality (~800 lines)
├── styles.css          # Comprehensive CSS with responsive design (~1100 lines)
├── speech-recognition.jpg  # Social media preview image
└── favicon files       # Complete favicon set for all platforms
```

## Key Features & Architecture

### Speech Recognition Engine
- **Desktop Mode**: Full-featured with interim results, continuous mode, and typewriter animations
- **Mobile Mode**: Simplified mode with auto-restart mechanism for continuous listening
- **Browser Detection**: Comprehensive browser compatibility checking with specific Android optimizations
- **HTTPS Enforcement**: Required for mobile speech recognition functionality

### UI Components
- **Control Section**: Start/stop buttons with visual feedback
- **Status Display**: Real-time status with animations (listening, error, ready states)
- **Transcript Area**: Live text display with typewriter animation and interim text preview
- **Settings Panel**: Language selection and continuous/single-sentence mode switching
- **Debug Dialog**: Comprehensive diagnostic information for troubleshooting

### Mobile Optimization
- **Touch-First Design**: Large touch targets, proper touch events, and mobile-specific UI scaling
- **Responsive Layout**: Breakpoints at 768px, 480px, 360px, and landscape orientation
- **Android-Specific**: Samsung Browser detection, Chrome recommendations, and simplified recording mode
- **Performance**: Reduced animations and optimized event handling for mobile devices

## Development Commands

Since this is a static web application, no build process is required:

```bash
# Development - Simply open in browser
open index.html

# Local server (recommended for testing speech recognition)
python -m http.server 8000
# or
npx serve .

# Testing on mobile (requires HTTPS)
ngrok http 8000
```

## Speech Recognition Implementation

### Browser Support Logic
- **Primary**: Chrome/Chromium-based browsers (desktop and mobile)
- **Secondary**: Safari on iOS, Edge on Windows
- **Fallback**: Comprehensive error messages with browser-specific recommendations

### Recognition Modes
- **Continuous Mode**: Auto-restart mechanism for uninterrupted listening
- **Single Sentence Mode**: One-shot recognition with manual restart
- **Mobile vs Desktop**: Different implementations optimized for each platform

### Key JavaScript Functions
- `startRecognition()`: Platform-specific initialization (lines 354-578)
- `stopRecognition()`: Graceful shutdown with state management (lines 580-607)
- `checkSpeechRecognitionSupport()`: Browser compatibility detection (lines 7-73)
- `updateTranscriptWithAnimation()`: Live text display with typewriter effects (lines 230-270)
- `showDebugInfo()`: Diagnostic modal for troubleshooting (lines 86-215)

## CSS Architecture

### Design System
- **CSS Variables**: Centralized color scheme, spacing, and radius values
- **Component-Based**: Modular styles for buttons, cards, status indicators
- **Animation System**: Fade-in, typewriter, glow, and pulse animations
- **Responsive Grid**: Flexible layout adapting to all screen sizes

### Mobile-First Approach
- **Touch Targets**: Minimum 44px height for all interactive elements
- **Dynamic Viewport**: Uses `dvh` units for mobile browser compatibility
- **Hover Fallbacks**: Touch-specific interactions for mobile devices

## Common Development Tasks

### Testing Speech Recognition
```bash
# Local development with HTTPS (required for mobile)
mkcert localhost
python -m http.server 8000 --bind 127.0.0.1

# Mobile testing via ngrok
ngrok http 8000
```

### Browser Compatibility Testing
- **Desktop**: Chrome, Safari, Edge, Firefox
- **Mobile**: Chrome on Android, Safari on iOS, Samsung Browser
- **Debug**: Use built-in debug dialog for troubleshooting

### Debugging Speech Recognition Issues
1. Open debug dialog (🔍 Debug Info button)
2. Check browser compatibility and HTTPS status
3. Verify microphone permissions
4. Test in different browsers if issues persist

## Mobile-Specific Considerations

### Android Optimization
- **Samsung Browser**: Automatic Chrome recommendation
- **Touch Events**: Proper touchstart/touchend handling
- **Auto-Restart**: Simulated continuous mode through recognition restart
- **Performance**: Simplified animations and reduced DOM manipulation

### iOS Optimization
- **Safari Requirement**: Speech recognition only works in Safari
- **Touch Handling**: Proper touch event management
- **Viewport**: Dynamic viewport height for mobile browsers

## Security & Privacy

### HTTPS Requirement
- Speech recognition requires HTTPS on mobile devices
- Automatic detection and warning for non-HTTPS contexts
- Microphone permission handling

### Data Privacy
- No server-side processing - all speech recognition happens locally
- No data transmission or storage
- Real-time processing only

## Performance Optimization

### Animation Management
- **Typewriter Effect**: Optimized letter-by-letter animation
- **Mobile Reduction**: Simplified animations on touch devices
- **Memory Management**: Proper cleanup of animation intervals

### Event Handling
- **Debounced Events**: Prevent double-triggering on mobile
- **Passive Listeners**: Optimized scroll and touch performance
- **State Management**: Proper cleanup of speech recognition instances

## Troubleshooting

### Common Issues
1. **No Speech Recognition**: Check browser compatibility and HTTPS
2. **Mobile Not Working**: Ensure Chrome on Android or Safari on iOS
3. **Continuous Mode Issues**: Check auto-restart mechanism in mobile mode
4. **Audio Permissions**: Browser will prompt for microphone access

### Debug Information
The debug dialog provides comprehensive system information including:
- Browser type and version
- Speech recognition API availability
- Current settings and state
- Platform and protocol information