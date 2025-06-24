import React, { useState, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';

interface StickyNoteProps {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  color?: string;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string) => void;
  onContextMenu: (id: string, e: any) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  x,
  y,
  width = 200,
  height = 150,
  text,
  color = '#ffeb3b',
  onDragEnd,
  onTextChange,
  onContextMenu
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<any>(null);

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
      x={x}
      y={y}
      draggable
      onDragEnd={(e) => {
        onDragEnd(id, e.target.x(), e.target.y());
      }}
      onContextMenu={handleContextMenu}
    >
      <Rect
        width={width}
        height={height}
        fill={color}
        stroke="#ddd"
        strokeWidth={1}
        cornerRadius={5}
        shadowColor="black"
        shadowBlur={5}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.2}
      />
      <Text
        ref={textRef}
        x={10}
        y={10}
        width={width - 20}
        height={height - 20}
        text={text}
        fontSize={14}
        fontFamily="Arial"
        fill="#333"
        wrap="word"
        editable={isEditing}
        onDblClick={handleDblClick}
        onBlur={handleTextEdit}
      />
    </Group>
  );
};

export default StickyNote;