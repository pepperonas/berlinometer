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
  onDragEnd,
  onTextChange,
  onContextMenu,
  onResize
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const textRef = useRef<any>(null);
  const groupRef = useRef<any>(null);

  const handleDblClick = () => {
    setIsEditing(true);
  };

  const handleTextEdit = () => {
    const node = textRef.current;
    if (node) {
      const newText = node.text();
      onTextChange(id, newText);
      setIsEditing(false);
    }
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
        editable={isEditing}
        onDblClick={handleDblClick}
        onBlur={handleTextEdit}
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