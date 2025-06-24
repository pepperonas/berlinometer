import React, { useState, useRef, useEffect } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';

interface StickyNoteProps {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  color?: string;
  isSelected?: boolean;
  shouldEdit?: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string) => void;
  onContextMenu: (id: string, e: any) => void;
  onResize?: (id: string, width: number, height: number) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  x,
  y,
  width = 200,
  height = 150,
  text,
  color = '#ffeb3b',
  isSelected = false,
  shouldEdit = false,
  onDragEnd,
  onTextChange,
  onContextMenu,
  onResize
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const textRef = useRef<any>(null);
  const groupRef = useRef<any>(null);

  // Watch for shouldEdit prop to trigger editing from context menu
  useEffect(() => {
    if (shouldEdit && !isEditing) {
      handleDblClick();
    }
  }, [shouldEdit]);

  const handleDblClick = () => {
    setIsEditing(true);
    
    // Create textarea for better text editing
    const stage = textRef.current?.getStage();
    if (stage) {
      const stageContainer = stage.container();
      const textPosition = textRef.current?.getAbsolutePosition();
      
      // Create textarea element
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'absolute';
      textarea.style.left = `${textPosition.x + 12}px`;
      textarea.style.top = `${textPosition.y + 12}px`;
      textarea.style.width = `${width - 24}px`;
      textarea.style.height = `${height - 24}px`;
      textarea.style.fontSize = '14px';
      textarea.style.fontFamily = 'Arial';
      textarea.style.color = '#333';
      textarea.style.background = 'rgba(255,255,255,0.9)';
      textarea.style.border = '2px solid #007bff';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.zIndex = '1000';
      textarea.style.borderRadius = '4px';
      textarea.style.padding = '4px';
      
      stageContainer.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      textarea.onblur = () => {
        onTextChange(id, textarea.value);
        stageContainer.removeChild(textarea);
        setIsEditing(false);
      };
      
      textarea.onkeydown = (e) => {
        if (e.key === 'Escape') {
          stageContainer.removeChild(textarea);
          setIsEditing(false);
        }
        // Allow Ctrl+Enter to save
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          textarea.blur();
        }
      };
    }
  };

  const handleTextEdit = () => {
    setIsEditing(false);
  };

  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
    onContextMenu(id, e);
  };

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable
      onDragEnd={(e) => {
        e.cancelBubble = true;
        // Get the absolute position
        const pos = e.target.getAbsolutePosition();
        onDragEnd(id, pos.x, pos.y);
      }}
      onDragStart={(e) => {
        e.cancelBubble = true;
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
      }}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Rect
        width={width}
        height={height}
        fill={color}
        stroke={isSelected ? "#007bff" : (isHovered ? "#999" : "#ddd")}
        strokeWidth={isSelected ? 3 : (isHovered ? 2 : 1)}
        cornerRadius={8}
        shadowColor="black"
        shadowBlur={isHovered || isSelected ? 8 : 5}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={isHovered || isSelected ? 0.3 : 0.2}
      />
      
      <Text
        ref={textRef}
        x={12}
        y={12}
        width={width - 24}
        height={height - 24}
        text={text}
        fontSize={14}
        fontFamily="Arial"
        fill="#333"
        wrap="word"
        listening={!isEditing}
        onDblClick={handleDblClick}
        verticalAlign="top"
      />
      
      {/* Resize handle */}
      {(isSelected || isHovered) && onResize && (
        <Circle
          x={width - 8}
          y={height - 8}
          radius={6}
          fill="#007bff"
          stroke="white"
          strokeWidth={2}
          draggable
          onDragMove={(e) => {
            const newWidth = Math.max(100, e.target.x() + 8);
            const newHeight = Math.max(80, e.target.y() + 8);
            onResize(id, newWidth, newHeight);
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'nw-resize';
            }
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'default';
            }
          }}
        />
      )}
    </Group>
  );
};

export default StickyNote;