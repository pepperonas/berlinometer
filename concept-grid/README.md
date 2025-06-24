# ConceptGrid - Interactive Digital Whiteboard

ConceptGrid is a modern, interactive digital whiteboard and brainstorming tool built with React and Konva.js. It provides a seamless collaboration experience with intuitive interactions and a clean, minimalistic interface.

## 🚀 Features

### Core Functionality
- **Infinite Canvas**: Unlimited scrollable workspace for boundless creativity
- **Zoom & Pan**: Natural zooming (mouse wheel, pinch-to-zoom) and canvas navigation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between themes with a single click

### Drawing Tools
- **Sticky Notes**: Colorful, resizable notes with editable text
- **Shapes**: Rectangle, circle, triangle with customizable properties
- **Text Fields**: Free-form text with formatting options
- **Freehand Drawing**: Pen tool for natural drawing and sketching

### Interactions
- **Drag & Drop**: Intuitive movement of all elements
- **Right-Click Context Menus**: Element-specific actions (duplicate, delete, modify)
- **Multi-Selection**: Select multiple elements for bulk operations
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + C`: Copy selected elements
  - `Ctrl/Cmd + V`: Paste elements
  - `Delete/Backspace`: Delete selected elements

### Export Options
- **PNG Export**: High-quality image export of your canvas
- **JSON Export**: Save your work for later editing

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Canvas Rendering**: Konva.js and react-konva
- **Styling**: CSS3 with CSS Custom Properties
- **Build Tool**: Create React App

## 🚦 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## 🎯 How to Use

1. **Select Tools**: Use the toolbar to choose between different tools (Select, Sticky Note, Rectangle, Circle, Triangle, Text, Pen)

2. **Create Elements**: 
   - Click on the canvas while a tool is selected to create new elements
   - Use the toolbar buttons to switch between tools

3. **Edit Elements**:
   - Double-click text elements to edit content
   - Drag elements to move them around
   - Right-click for context menu options

4. **Navigate Canvas**:
   - Use mouse wheel to zoom in/out
   - Drag the canvas background to pan
   - Use keyboard shortcuts for common operations

5. **Export Work**:
   - Click "Export PNG" to save as image
   - Click "Export JSON" to save project data

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ConceptGrid.tsx      # Main whiteboard component
│   ├── StickyNote.tsx       # Sticky note component
│   ├── Shape.tsx            # Shape components (rectangle, circle, etc.)
│   ├── TextField.tsx        # Text field component
│   ├── Drawing.tsx          # Freehand drawing component
│   ├── ContextMenu.tsx      # Right-click menu component
│   └── *.css               # Component styles
├── types/
│   └── canvas.ts           # TypeScript type definitions
└── App.tsx                 # Root application component
```

## 🎨 Customization

### Adding New Tools
1. Define the tool type in `types/canvas.ts`
2. Create a new component in `components/`
3. Add the tool to the toolbar in `ConceptGrid.tsx`
4. Implement the tool logic in the main component

### Styling
The application uses CSS Custom Properties for theming. Modify the variables in `ConceptGrid.css` to customize colors and appearance.

## 🔮 Roadmap

- [ ] Real-time collaboration with WebSockets
- [ ] Advanced shape tools (arrows, lines, polygons)
- [ ] Image upload and insertion
- [ ] Undo/Redo functionality
- [ ] Layer management
- [ ] Advanced text formatting
- [ ] Board templates
- [ ] Collaborative cursors
- [ ] Voice notes integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License.

---

**ConceptGrid** - Transforming ideas into visual reality ✨