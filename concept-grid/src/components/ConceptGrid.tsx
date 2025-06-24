import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import StickyNote from './StickyNote';
import Shape from './Shape';
import TextField from './TextField';
import Drawing from './Drawing';
import ContextMenu from './ContextMenu';
import { CanvasElement, StickyNoteData, ShapeData, TextFieldData, ImageElementData, DrawingData, ContextMenuState } from '../types/canvas';
import './ConceptGrid.css';

const ConceptGrid: React.FC = () => {
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [currentColor, setCurrentColor] = useState('#ffeb3b');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [showHelp, setShowHelp] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetType: null
  });
  const stageRef = useRef<any>(null);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  }, []);

  const handleDragEnd = useCallback((e: any) => {
    setStagePos(e.target.position());
  }, []);

  const addStickyNote = useCallback(() => {
    const newNote: StickyNoteData = {
      id: Date.now().toString(),
      type: 'sticky-note',
      x: (window.innerWidth / 2 - stagePos.x) / stageScale - 100,
      y: (window.innerHeight / 2 - stagePos.y) / stageScale - 75,
      width: 200,
      height: 150,
      text: 'New Note',
      color: '#ffeb3b'
    };
    setElements(prev => [...prev, newNote]);
  }, [stagePos, stageScale]);

  const handleElementDragEnd = useCallback((id: string, absoluteX: number, absoluteY: number) => {
    // Convert absolute position back to canvas coordinates
    const canvasX = (absoluteX - stagePos.x) / stageScale;
    const canvasY = (absoluteY - stagePos.y) / stageScale;
    
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        // Only update the specific element that was dragged
        if (el.type === 'drawing') {
          return { ...el, x: canvasX, y: canvasY } as DrawingData;
        } else if (el.type === 'sticky-note') {
          return { ...el, x: canvasX, y: canvasY } as StickyNoteData;
        } else if (['rectangle', 'circle', 'triangle', 'line', 'arrow'].includes(el.type)) {
          return { ...el, x: canvasX, y: canvasY } as ShapeData;
        } else if (el.type === 'text') {
          return { ...el, x: canvasX, y: canvasY } as TextFieldData;
        }
      }
      return el;
    }));
  }, [stagePos, stageScale]);

  const handleTextChange = useCallback((id: string, text: string) => {
    setElements(prev => prev.map(el => 
      el.id === id && (el.type === 'sticky-note' || el.type === 'text')
        ? { ...el, text } 
        : el
    ));
  }, []);

  const handleResize = useCallback((id: string, width: number, height: number) => {
    setElements(prev => prev.map(el => 
      el.id === id && el.type === 'sticky-note' 
        ? { ...el, width, height } 
        : el
    ));
  }, []);

  const handleContextMenu = useCallback((id: string, e: any) => {
    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    
    setContextMenu({
      visible: true,
      x: pos.x,
      y: pos.y,
      targetId: id,
      targetType: elements.find(el => el.id === id)?.type || null
    });
  }, [elements]);

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu.targetId) return;
    
    const targetElement = elements.find(el => el.id === contextMenu.targetId);
    if (!targetElement) return;
    
    switch (action) {
      case 'delete':
        setElements(prev => prev.filter(el => el.id !== contextMenu.targetId));
        break;
      case 'duplicate':
        let newElement: CanvasElement;
        
        if (targetElement.type === 'drawing') {
          const drawingEl = targetElement as DrawingData;
          newElement = { 
            ...drawingEl, 
            id: Date.now().toString(),
            x: drawingEl.x + 20,
            y: drawingEl.y + 20
          };
        } else {
          const regularEl = targetElement as StickyNoteData | ShapeData | TextFieldData | ImageElementData;
          newElement = { 
            ...regularEl, 
            id: Date.now().toString(),
            x: regularEl.x + 20,
            y: regularEl.y + 20
          };
        }
        
        setElements(prev => [...prev, newElement]);
        break;
      case 'change-color':
        if (targetElement.type === 'sticky-note') {
          const colors = ['#ffeb3b', '#ff9800', '#4caf50', '#2196f3', '#9c27b0', '#f44336'];
          const currentColor = (targetElement as StickyNoteData).color;
          const currentIndex = colors.indexOf(currentColor);
          const nextColor = colors[(currentIndex + 1) % colors.length];
          setElements(prev => prev.map(el => 
            el.id === contextMenu.targetId && el.type === 'sticky-note'
              ? { ...el, color: nextColor }
              : el
          ));
        }
        break;
      case 'resize-small':
        if (targetElement.type === 'sticky-note') {
          setElements(prev => prev.map(el => {
            if (el.id === contextMenu.targetId && el.type === 'sticky-note') {
              const stickyEl = el as StickyNoteData;
              return { 
                ...stickyEl, 
                width: Math.max(100, stickyEl.width - 50), 
                height: Math.max(80, stickyEl.height - 30) 
              };
            }
            return el;
          }));
        }
        break;
      case 'resize-large':
        if (targetElement.type === 'sticky-note') {
          setElements(prev => prev.map(el => {
            if (el.id === contextMenu.targetId && el.type === 'sticky-note') {
              const stickyEl = el as StickyNoteData;
              return { 
                ...stickyEl, 
                width: stickyEl.width + 50, 
                height: stickyEl.height + 30 
              };
            }
            return el;
          }));
        }
        break;
      case 'bring-forward':
        // Move element to end of array (rendered on top)
        setElements(prev => {
          const filtered = prev.filter(el => el.id !== contextMenu.targetId);
          return [...filtered, targetElement];
        });
        break;
      case 'send-backward':
        // Move element to beginning of array (rendered behind)
        setElements(prev => {
          const filtered = prev.filter(el => el.id !== contextMenu.targetId);
          return [targetElement, ...filtered];
        });
        break;
      case 'font-larger':
        if (targetElement.type === 'text') {
          setElements(prev => prev.map(el => 
            el.id === contextMenu.targetId && el.type === 'text'
              ? { ...el, fontSize: Math.min(72, el.fontSize + 2) }
              : el
          ));
        }
        break;
      case 'font-smaller':
        if (targetElement.type === 'text') {
          setElements(prev => prev.map(el => 
            el.id === contextMenu.targetId && el.type === 'text'
              ? { ...el, fontSize: Math.max(8, el.fontSize - 2) }
              : el
          ));
        }
        break;
      case 'edit-text':
        // Trigger edit mode for the element
        if (targetElement.type === 'sticky-note' || targetElement.type === 'text') {
          setEditingElementId(contextMenu.targetId);
          // Clear after a brief moment to reset the trigger
          setTimeout(() => setEditingElementId(null), 100);
        }
        break;
    }
    hideContextMenu();
  };

  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      hideContextMenu();
      
      const pos = e.target.getStage().getPointerPosition();
      const baseX = (pos.x - stagePos.x) / stageScale;
      const baseY = (pos.y - stagePos.y) / stageScale;
      
      if (selectedTool === 'sticky-note') {
        const newNote: StickyNoteData = {
          id: Date.now().toString(),
          type: 'sticky-note',
          x: baseX,
          y: baseY,
          width: 200,
          height: 150,
          text: 'Neue Notiz',
          color: currentColor
        };
        setElements(prev => [...prev, newNote]);
      } else if (['rectangle', 'circle', 'triangle'].includes(selectedTool)) {
        const newShape: ShapeData = {
          id: Date.now().toString(),
          type: selectedTool as 'rectangle' | 'circle' | 'triangle',
          x: baseX,
          y: baseY,
          width: selectedTool === 'rectangle' ? 100 : undefined,
          height: selectedTool === 'rectangle' ? 100 : undefined,
          radius: selectedTool !== 'rectangle' ? 50 : undefined,
          fill: currentColor,
          stroke: '#333',
          strokeWidth: 2
        };
        setElements(prev => [...prev, newShape]);
      } else if (selectedTool === 'text') {
        const newTextField: TextFieldData = {
          id: Date.now().toString(),
          type: 'text',
          x: baseX,
          y: baseY,
          text: 'New Text',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#333'
        };
        setElements(prev => [...prev, newTextField]);
      }
    }
  }, [selectedTool, stagePos, stageScale]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      if (isCtrlOrCmd && e.key === 'c') {
        e.preventDefault();
        const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
        setClipboard(selectedElementsData);
      } else if (isCtrlOrCmd && e.key === 'v') {
        e.preventDefault();
        const newElements = clipboard.map(el => {
          if (el.type === 'drawing') {
            const drawingEl = el as DrawingData;
            return {
              ...drawingEl,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              x: drawingEl.x + 20,
              y: drawingEl.y + 20
            };
          } else {
            const regularEl = el as StickyNoteData | ShapeData | TextFieldData | ImageElementData;
            return {
              ...regularEl,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              x: regularEl.x + 20,
              y: regularEl.y + 20
            };
          }
        });
        setElements(prev => [...prev, ...newElements]);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setElements(prev => prev.filter(el => !selectedElements.includes(el.id)));
        setSelectedElements([]);
      } else if (isCtrlOrCmd && e.key === 'z') {
        e.preventDefault();
        // TODO: Implement undo functionality
      } else if (isCtrlOrCmd && e.key === 'y') {
        e.preventDefault();
        // TODO: Implement redo functionality
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setSelectedTool('select');
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setSelectedTool('sticky-note');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setSelectedTool('rectangle');
      } else if (e.key === 'c' || e.key === 'C') {
        if (!isCtrlOrCmd) {
          e.preventDefault();
          setSelectedTool('circle');
        }
      } else if (e.key === 't' || e.key === 'T') {
        if (!isCtrlOrCmd) {
          e.preventDefault();
          if (e.shiftKey) {
            setSelectedTool('triangle');
          } else {
            setSelectedTool('text');
          }
        }
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setSelectedTool('pen');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElements, elements, clipboard]);

  const handleMouseDown = useCallback((e: any) => {
    if (selectedTool === 'pen' && e.target === e.target.getStage()) {
      setIsDrawing(true);
      const pos = e.target.getStage().getPointerPosition();
      const adjustedPos = [
        (pos.x - stagePos.x) / stageScale,
        (pos.y - stagePos.y) / stageScale
      ];
      setCurrentPath(adjustedPos);
    } else if (selectedTool === 'select' && e.target === e.target.getStage()) {
      // Start selection rectangle only if clicking on stage background
      const pos = e.target.getStage().getPointerPosition();
      setIsSelecting(true);
      setSelectionStart({ x: pos.x, y: pos.y });
      setSelectionEnd({ x: pos.x, y: pos.y });
      
      // Clear current selection if not holding Ctrl/Cmd
      if (!e.evt.ctrlKey && !e.evt.metaKey) {
        setSelectedElements([]);
      }
    }
  }, [selectedTool, stagePos, stageScale]);

  const handleMouseMove = useCallback((e: any) => {
    if (isDrawing && selectedTool === 'pen') {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const adjustedPoint = [
        (point.x - stagePos.x) / stageScale,
        (point.y - stagePos.y) / stageScale
      ];
      setCurrentPath(prev => [...prev, ...adjustedPoint]);
    } else if (isSelecting && selectedTool === 'select') {
      const pos = e.target.getStage().getPointerPosition();
      setSelectionEnd({ x: pos.x, y: pos.y });
    }
  }, [isDrawing, isSelecting, selectedTool, stagePos, stageScale]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && selectedTool === 'pen' && currentPath.length > 0) {
      const newDrawing: DrawingData = {
        id: Date.now().toString(),
        type: 'drawing',
        x: 0,
        y: 0,
        points: currentPath,
        stroke: '#000000',
        strokeWidth: 2,
        tool: 'pen'
      };
      setElements(prev => [...prev, newDrawing]);
      setCurrentPath([]);
    }
    
    if (isSelecting && selectedTool === 'select') {
      // Calculate selection rectangle
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);
      
      // Convert to canvas coordinates
      const canvasMinX = (minX - stagePos.x) / stageScale;
      const canvasMaxX = (maxX - stagePos.x) / stageScale;
      const canvasMinY = (minY - stagePos.y) / stageScale;
      const canvasMaxY = (maxY - stagePos.y) / stageScale;
      
      // Find elements within selection
      const selectedElementIds = elements
        .filter(el => {
          if (el.type === 'drawing') {
            const drawingEl = el as DrawingData;
            return drawingEl.x >= canvasMinX && drawingEl.x <= canvasMaxX &&
                   drawingEl.y >= canvasMinY && drawingEl.y <= canvasMaxY;
          } else {
            const regularEl = el as StickyNoteData | ShapeData | TextFieldData | ImageElementData;
            return regularEl.x >= canvasMinX && regularEl.x <= canvasMaxX &&
                   regularEl.y >= canvasMinY && regularEl.y <= canvasMaxY;
          }
        })
        .map(el => el.id);
      
      setSelectedElements(prev => {
        const combined = [...prev, ...selectedElementIds];
        return Array.from(new Set(combined));
      });
    }
    
    setIsDrawing(false);
    setIsSelecting(false);
  }, [isDrawing, isSelecting, selectedTool, currentPath, selectionStart, selectionEnd, stagePos, stageScale, elements]);

  const exportAsImage = useCallback(() => {
    const stage = stageRef.current;
    if (stage) {
      const dataURL = stage.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `concept-grid-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const exportAsJSON = useCallback(() => {
    const data = {
      elements,
      metadata: {
        version: '1.0',
        created: new Date().toISOString(),
        canvasSize: { width: window.innerWidth, height: window.innerHeight }
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `concept-grid-${Date.now()}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [elements]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className={`concept-grid-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="toolbar">
        <div className="toolbar-section">
          <button 
            className={`toolbar-btn ${selectedTool === 'select' ? 'active' : ''}`}
            onClick={() => setSelectedTool('select')}
            title="Auswahl-Werkzeug (V)"
          >
            <span className="icon">🔲</span>
            Auswahl
            <span className="shortcut">V</span>
          </button>
        </div>

        <div className="toolbar-section">
          <button 
            className={`toolbar-btn ${selectedTool === 'sticky-note' ? 'active' : ''}`}
            onClick={() => setSelectedTool('sticky-note')}
            title="Haftnotiz erstellen (N)"
          >
            <span className="icon">📝</span>
            Notiz
            <span className="shortcut">N</span>
          </button>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="color-picker"
            title="Farbe wählen"
          />
        </div>

        <div className="toolbar-section">
          <button 
            className={`toolbar-btn ${selectedTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => setSelectedTool('rectangle')}
            title="Rechteck (R)"
          >
            <span className="icon">⬛</span>
            Rechteck
            <span className="shortcut">R</span>
          </button>
          <button 
            className={`toolbar-btn ${selectedTool === 'circle' ? 'active' : ''}`}
            onClick={() => setSelectedTool('circle')}
            title="Kreis (C)"
          >
            <span className="icon">⭕</span>
            Kreis
            <span className="shortcut">C</span>
          </button>
          <button 
            className={`toolbar-btn ${selectedTool === 'triangle' ? 'active' : ''}`}
            onClick={() => setSelectedTool('triangle')}
            title="Dreieck (T)"
          >
            <span className="icon">🔺</span>
            Dreieck
            <span className="shortcut">T</span>
          </button>
        </div>

        <div className="toolbar-section">
          <button 
            className={`toolbar-btn ${selectedTool === 'text' ? 'active' : ''}`}
            onClick={() => setSelectedTool('text')}
            title="Text (T)"
          >
            <span className="icon">📄</span>
            Text
            <span className="shortcut">T</span>
          </button>
          <button 
            className={`toolbar-btn ${selectedTool === 'pen' ? 'active' : ''}`}
            onClick={() => setSelectedTool('pen')}
            title="Stift (P)"
          >
            <span className="icon">✏️</span>
            Stift
            <span className="shortcut">P</span>
          </button>
        </div>

        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={exportAsImage} title="Als PNG exportieren">
            <span className="icon">📷</span>
            PNG
          </button>
          <button className="toolbar-btn" onClick={exportAsJSON} title="Als JSON exportieren">
            <span className="icon">💾</span>
            JSON
          </button>
        </div>
      </div>
      
      <button className="theme-toggle" onClick={toggleDarkMode}>
        {darkMode ? '☀️' : '🌙'}
      </button>
      
      {showHelp ? (
        <div className="help-panel">
          <div className="help-section">
            <h4>🔧 Werkzeuge</h4>
            <div className="help-shortcuts">
              <span className="help-key">V</span><span>Auswahl</span>
              <span className="help-key">N</span><span>Notiz</span>
              <span className="help-key">R</span><span>Rechteck</span>
              <span className="help-key">C</span><span>Kreis</span>
              <span className="help-key">T</span><span>Text</span>
              <span className="help-key">P</span><span>Stift</span>
            </div>
          </div>
          
          <div className="help-section">
            <h4>⌨️ Aktionen</h4>
            <div className="help-shortcuts">
              <span className="help-key">Ctrl+C</span><span>Kopieren</span>
              <span className="help-key">Ctrl+V</span><span>Einfügen</span>
              <span className="help-key">Del</span><span>Löschen</span>
              <span className="help-key">Mausrad</span><span>Zoomen</span>
            </div>
          </div>
          
          <div className="help-section">
            <h4>🖱️ Interaktionen</h4>
            <p>• Doppelklick zum Bearbeiten von Text</p>
            <p>• Rechtsklick für Kontextmenü</p>
            <p>• Ziehen für Auswahlrahmen</p>
            <p>• Resize-Handle an ausgewählten Elementen</p>
          </div>
        </div>
      ) : (
        <button className="help-toggle" onClick={() => setShowHelp(true)}>
          ❓
        </button>
      )}
      
      {showHelp && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'transparent',
            zIndex: 999
          }}
          onClick={() => setShowHelp(false)}
        />
      )}
      
      <Stage
        width={window.innerWidth}
        height={window.innerHeight - 60}
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={selectedTool === 'select'}
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {elements.map(element => {
            if (element.type === 'sticky-note') {
              return (
                <StickyNote
                  key={element.id}
                  id={element.id}
                  x={element.x}
                  y={element.y}
                  width={element.width}
                  height={element.height}
                  text={element.text}
                  color={element.color}
                  isSelected={selectedElements.includes(element.id)}
                  shouldEdit={editingElementId === element.id}
                  onDragEnd={handleElementDragEnd}
                  onTextChange={handleTextChange}
                  onContextMenu={handleContextMenu}
                  onResize={handleResize}
                />
              );
            } else if (['rectangle', 'circle', 'triangle', 'line', 'arrow'].includes(element.type)) {
              const shapeElement = element as ShapeData;
              return (
                <Shape
                  key={element.id}
                  id={element.id}
                  type={shapeElement.type}
                  x={element.x}
                  y={element.y}
                  width={shapeElement.width}
                  height={shapeElement.height}
                  radius={shapeElement.radius}
                  points={shapeElement.points}
                  fill={shapeElement.fill}
                  stroke={shapeElement.stroke}
                  strokeWidth={shapeElement.strokeWidth}
                  onDragEnd={handleElementDragEnd}
                  onContextMenu={handleContextMenu}
                />
              );
            } else if (element.type === 'text') {
              const textElement = element as TextFieldData;
              return (
                <TextField
                  key={element.id}
                  id={element.id}
                  x={element.x}
                  y={element.y}
                  text={textElement.text}
                  fontSize={textElement.fontSize}
                  fontFamily={textElement.fontFamily}
                  color={textElement.color}
                  shouldEdit={editingElementId === element.id}
                  onDragEnd={handleElementDragEnd}
                  onTextChange={handleTextChange}
                  onContextMenu={handleContextMenu}
                />
              );
            } else if (element.type === 'drawing') {
              const drawingElement = element as DrawingData;
              return (
                <Drawing
                  key={element.id}
                  id={element.id}
                  x={drawingElement.x}
                  y={drawingElement.y}
                  points={drawingElement.points}
                  stroke={drawingElement.stroke}
                  strokeWidth={drawingElement.strokeWidth}
                  tool={drawingElement.tool}
                  onContextMenu={handleContextMenu}
                />
              );
            }
            return null;
          })}
          
          {/* Current drawing path */}
          {isDrawing && currentPath.length > 0 && (
            <Drawing
              id="current-drawing"
              points={currentPath}
              stroke="#000000"
              strokeWidth={2}
              tool="pen"
              onContextMenu={() => {}}
            />
          )}
        </Layer>
      </Stage>
      
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAction={handleContextMenuAction}
          onClose={hideContextMenu}
          targetType={contextMenu.targetType}
        />
      )}
      
      {/* Selection Rectangle */}
      {isSelecting && (
        <div
          className="selection-box"
          style={{
            left: Math.min(selectionStart.x, selectionEnd.x),
            top: Math.min(selectionStart.y, selectionEnd.y),
            width: Math.abs(selectionEnd.x - selectionStart.x),
            height: Math.abs(selectionEnd.y - selectionStart.y),
          }}
        />
      )}
    </div>
  );
};

export default ConceptGrid;