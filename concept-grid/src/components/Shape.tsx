import React from 'react';
import { Group, Rect, Circle, Line, RegularPolygon } from 'react-konva';

interface ShapeProps {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  fill: string;
  stroke: string;
  strokeWidth: number;
  onDragEnd: (id: string, x: number, y: number) => void;
  onContextMenu: (id: string, e: any) => void;
}

const Shape: React.FC<ShapeProps> = ({
  id,
  type,
  x,
  y,
  width = 100,
  height = 100,
  radius = 50,
  points,
  fill,
  stroke,
  strokeWidth,
  onDragEnd,
  onContextMenu
}) => {
  const handleDragEnd = (e: any) => {
    e.cancelBubble = true;
    const pos = e.target.getAbsolutePosition();
    onDragEnd(id, pos.x, pos.y);
  };

  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
    onContextMenu(id, e);
  };

  const renderShape = () => {
    switch (type) {
      case 'rectangle':
        return (
          <Rect
            width={width}
            height={height}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );
      case 'circle':
        return (
          <Circle
            radius={radius}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );
      case 'triangle':
        return (
          <RegularPolygon
            sides={3}
            radius={radius}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );
      case 'line':
        return (
          <Line
            points={points || [0, 0, 100, 0]}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );
      case 'arrow':
        return (
          <Line
            points={points || [0, 0, 100, 0]}
            stroke={stroke}
            strokeWidth={strokeWidth}
            lineCap="round"
            lineJoin="round"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragEnd={handleDragEnd}
      onDragStart={(e) => {
        e.cancelBubble = true;
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
      }}
      onContextMenu={handleContextMenu}
    >
      {renderShape()}
    </Group>
  );
};

export default Shape;