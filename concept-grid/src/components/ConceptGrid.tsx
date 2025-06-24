import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import StickyNote from './StickyNote';
import Shape from './Shape';
import TextField from './TextField';
import Drawing from './Drawing';
import ContextMenu from './ContextMenu';
import { CanvasElement, StickyNoteData, ShapeData, TextFieldData, DrawingData, ContextMenuState } from '../types/canvas';
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

  const handleElementDragEnd = useCallback((id: string, x: number, y: number) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        if (el.type === 'drawing') {
          const drawingEl = el as DrawingData;
          return { ...drawingEl, x, y };
        } else {
          const regularEl = el as StickyNoteData | ShapeData | TextFieldData | ImageData;
          return { ...regularEl, x, y };
        }
      }
      return el;
    }));
  }, []);

  const handleTextChange = useCallback((id: string, text: string) => {
    setElements(prev => prev.map(el => 
      el.id === id && el.type === 'sticky-note' 
        ? { ...el, text } 
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
    
    switch (action) {
      case 'delete':
        setElements(prev => prev.filter(el => el.id !== contextMenu.targetId));
        break;
      case 'duplicate':
        const elementToDuplicate = elements.find(el => el.id === contextMenu.targetId);
        if (elementToDuplicate) {
          let newElement: CanvasElement;
          
          if (elementToDuplicate.type === 'drawing') {
            const drawingEl = elementToDuplicate as DrawingData;
            newElement = { 
              ...drawingEl, 
              id: Date.now().toString(),
              x: drawingEl.x + 20,
              y: drawingEl.y + 20
            };
          } else {
            const regularEl = elementToDuplicate as StickyNoteData | ShapeData | TextFieldData | ImageData;
            newElement = { 
              ...regularEl, 
              id: Date.now().toString(),
              x: regularEl.x + 20,
              y: regularEl.y + 20
            };
          }
          
          setElements(prev => [...prev, newElement]);
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
          text: 'New Note',
          color: '#ffeb3b'
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
          fill: '#e3f2fd',
          stroke: '#2196f3',
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
            const regularEl = el as StickyNoteData | ShapeData | TextFieldData | ImageData;
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
    }
  }, [selectedTool, stagePos, stageScale]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isDrawing || selectedTool !== 'pen') return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const adjustedPoint = [
      (point.x - stagePos.x) / stageScale,
      (point.y - stagePos.y) / stageScale
    ];
    setCurrentPath(prev => [...prev, ...adjustedPoint]);
  }, [isDrawing, selectedTool, stagePos, stageScale]);

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
    setIsDrawing(false);
  }, [isDrawing, selectedTool, currentPath]);

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
        <button 
          className={`toolbar-btn ${selectedTool === 'select' ? 'active' : ''}`}
          onClick={() => setSelectedTool('select')}
        >
          Select
        </button>
        <button 
          className={`toolbar-btn ${selectedTool === 'sticky-note' ? 'active' : ''}`}
          onClick={() => setSelectedTool('sticky-note')}
        >
          Sticky Note
        </button>
        <button 
          className={`toolbar-btn ${selectedTool === 'rectangle' ? 'active' : ''}`}
          onClick={() => setSelectedTool('rectangle')}
        >
          Rectangle
        </button>
        <button 
          className={`toolbar-btn ${selectedTool === 'circle' ? 'active' : ''}`}
          onClick={() => setSelectedTool('circle')}
        >
          Circle
        </button>
        <button 
          className={`toolbar-btn ${selectedTool === 'triangle' ? 'active' : ''}`}
          onClick={() => setSelectedTool('triangle')}
        >
          Triangle
        </button>
        <button 
          className={`toolbar-btn ${selectedTool === 'text' ? 'active' : ''}`}
          onClick={() => setSelectedTool('text')}
        >
          Text
        </button>
        <button 
          className={`toolbar-btn ${selectedTool === 'pen' ? 'active' : ''}`}
          onClick={() => setSelectedTool('pen')}
        >
          Pen
        </button>
        <button className="toolbar-btn" onClick={exportAsImage}>
          Export PNG
        </button>
        <button className="toolbar-btn" onClick={exportAsJSON}>
          Export JSON
        </button>
      </div>
      
      <button className="theme-toggle" onClick={toggleDarkMode}>
        {darkMode ? '☀️' : '🌙'}
      </button>
      
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
                  onDragEnd={handleElementDragEnd}
                  onTextChange={handleTextChange}
                  onContextMenu={handleContextMenu}
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
    </div>
  );
};

export default ConceptGrid;