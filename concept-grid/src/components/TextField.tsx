import React, { useState, useRef, useEffect } from 'react';
import { Group, Text } from 'react-konva';

interface TextFieldProps {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  shouldEdit?: boolean;
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
  shouldEdit = false,
  onDragEnd,
  onTextChange,
  onContextMenu
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<any>(null);

  // Watch for shouldEdit prop to trigger editing from context menu
  useEffect(() => {
    if (shouldEdit && !isEditing) {
      handleDblClick();
    }
  }, [shouldEdit]);

  const handleDblClick = () => {
    setIsEditing(true);
    
    // Create an invisible input field for text editing
    const stage = textRef.current?.getStage();
    if (stage) {
      const stageContainer = stage.container();
      const stagePosition = stage.getAbsolutePosition();
      const textPosition = textRef.current?.getAbsolutePosition();
      
      // Create input element
      const input = document.createElement('input');
      input.value = text;
      input.style.position = 'absolute';
      input.style.left = `${textPosition.x}px`;
      input.style.top = `${textPosition.y}px`;
      input.style.fontSize = `${fontSize}px`;
      input.style.fontFamily = fontFamily;
      input.style.color = color;
      input.style.background = 'transparent';
      input.style.border = '2px solid #007bff';
      input.style.outline = 'none';
      input.style.zIndex = '1000';
      input.style.minWidth = '100px';
      
      stageContainer.appendChild(input);
      input.focus();
      input.select();
      
      input.onblur = () => {
        onTextChange(id, input.value);
        stageContainer.removeChild(input);
        setIsEditing(false);
      };
      
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
        if (e.key === 'Escape') {
          stageContainer.removeChild(input);
          setIsEditing(false);
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
      x={x}
      y={y}
      draggable
      onDragEnd={(e) => {
        e.cancelBubble = true;
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
    >
      <Text
        ref={textRef}
        text={text}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={color}
        listening={!isEditing}
        onDblClick={handleDblClick}
        onBlur={handleTextEdit}
        padding={5}
      />
    </Group>
  );
};

export default TextField;