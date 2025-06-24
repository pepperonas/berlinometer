import React, { useState, useRef } from 'react';
import { Group, Text } from 'react-konva';

interface TextFieldProps {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string) => void;
  onContextMenu: (id: string, e: any) => void;
}

const TextField: React.FC<TextFieldProps> = ({
  id,
  x,
  y,
  text,
  fontSize,
  fontFamily,
  color,
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
      <Text
        ref={textRef}
        text={text}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={color}
        editable={isEditing}
        onDblClick={handleDblClick}
        onBlur={handleTextEdit}
        padding={5}
      />
    </Group>
  );
};

export default TextField;