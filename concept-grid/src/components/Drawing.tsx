import React from 'react';
import { Line } from 'react-konva';

interface DrawingProps {
  id: string;
  x?: number;
  y?: number;
  points: number[];
  stroke: string;
  strokeWidth: number;
  tool: 'pen' | 'marker' | 'eraser';
  onContextMenu: (id: string, e: any) => void;
}

const Drawing: React.FC<DrawingProps> = ({
  id,
  x = 0,
  y = 0,
  points,
  stroke,
  strokeWidth,
  tool,
  onContextMenu
}) => {
  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
    onContextMenu(id, e);
  };

  const getStrokeProps = () => {
    switch (tool) {
      case 'pen':
        return {
          stroke,
          strokeWidth,
          lineCap: 'round' as const,
          lineJoin: 'round' as const,
        };
      case 'marker':
        return {
          stroke,
          strokeWidth: strokeWidth * 2,
          lineCap: 'round' as const,
          lineJoin: 'round' as const,
          opacity: 0.7,
        };
      case 'eraser':
        return {
          stroke: 'white',
          strokeWidth: strokeWidth * 3,
          lineCap: 'round' as const,
          lineJoin: 'round' as const,
          globalCompositeOperation: 'destination-out' as const,
        };
      default:
        return {
          stroke,
          strokeWidth,
          lineCap: 'round' as const,
          lineJoin: 'round' as const,
        };
    }
  };

  return (
    <Line
      x={x}
      y={y}
      points={points}
      {...getStrokeProps()}
      onContextMenu={handleContextMenu}
    />
  );
};

export default Drawing;