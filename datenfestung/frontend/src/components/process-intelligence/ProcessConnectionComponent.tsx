import React from 'react';
import { Box, Typography } from '@mui/material';
import { ProcessConnection, ProcessNode, ConnectionType } from '../../types/process-intelligence.types';

interface ProcessConnectionComponentProps {
  connection: ProcessConnection;
  nodes: ProcessNode[];
  isSelected: boolean;
  onClick: (event: React.MouseEvent) => void;
  readonly?: boolean;
}

const CONNECTION_STYLES: Record<ConnectionType, { 
  stroke: string; 
  strokeWidth: number; 
  strokeDasharray?: string;
  markerEnd: string;
}> = {
  sequence: { 
    stroke: '#666', 
    strokeWidth: 2, 
    markerEnd: 'url(#arrowhead)'
  },
  conditional: { 
    stroke: '#ff9800', 
    strokeWidth: 2, 
    strokeDasharray: '5,5',
    markerEnd: 'url(#arrowhead-conditional)'
  },
  data_flow: { 
    stroke: '#2196f3', 
    strokeWidth: 3, 
    strokeDasharray: '10,5',
    markerEnd: 'url(#arrowhead-data)'
  },
  message_flow: { 
    stroke: '#9c27b0', 
    strokeWidth: 2, 
    strokeDasharray: '8,4',
    markerEnd: 'url(#arrowhead-message)'
  },
  association: { 
    stroke: '#757575', 
    strokeWidth: 1, 
    strokeDasharray: '3,3',
    markerEnd: 'none'
  },
};

export const ProcessConnectionComponent: React.FC<ProcessConnectionComponentProps> = ({
  connection,
  nodes,
  isSelected,
  onClick,
  readonly = false
}) => {
  const sourceNode = nodes.find(n => n.id === connection.sourceId);
  const targetNode = nodes.find(n => n.id === connection.targetId);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Calculate connection points
  const getNodeCenter = (node: ProcessNode) => {
    // Assume standard node dimensions
    const width = node.type === 'start' || node.type === 'end' ? 60 : 
                 node.type === 'decision' ? 120 : 140;
    const height = node.type === 'start' || node.type === 'end' ? 60 : 80;
    
    return {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2
    };
  };

  const getConnectionPoints = (source: ProcessNode, target: ProcessNode) => {
    const sourceCenter = getNodeCenter(source);
    const targetCenter = getNodeCenter(target);
    
    // Calculate direction
    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { start: sourceCenter, end: targetCenter };
    
    // Normalize direction
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // Node dimensions for edge calculation
    const sourceWidth = source.type === 'start' || source.type === 'end' ? 60 : 
                       source.type === 'decision' ? 120 : 140;
    const sourceHeight = source.type === 'start' || source.type === 'end' ? 60 : 80;
    
    const targetWidth = target.type === 'start' || target.type === 'end' ? 60 : 
                       target.type === 'decision' ? 120 : 140;
    const targetHeight = target.type === 'start' || target.type === 'end' ? 60 : 80;
    
    // Calculate edge points
    const sourceRadius = Math.max(sourceWidth, sourceHeight) / 2;
    const targetRadius = Math.max(targetWidth, targetHeight) / 2;
    
    const start = {
      x: sourceCenter.x + dirX * sourceRadius * 0.8,
      y: sourceCenter.y + dirY * sourceRadius * 0.8
    };
    
    const end = {
      x: targetCenter.x - dirX * targetRadius * 0.8,
      y: targetCenter.y - dirY * targetRadius * 0.8
    };
    
    return { start, end };
  };

  const { start, end } = getConnectionPoints(sourceNode, targetNode);
  const style = CONNECTION_STYLES[connection.type];

  // Calculate path - using bezier curve for smoother connections
  const controlPointOffset = Math.min(100, Math.abs(end.x - start.x) / 3);
  const pathData = `M ${start.x} ${start.y} C ${start.x + controlPointOffset} ${start.y}, ${end.x - controlPointOffset} ${end.y}, ${end.x} ${end.y}`;

  // Calculate label position (midpoint of path)
  const labelX = (start.x + end.x) / 2;
  const labelY = (start.y + end.y) / 2;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: isSelected ? 5 : 1
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
      >
        {/* Arrow markers */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
          
          <marker
            id="arrowhead-conditional"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#ff9800" />
          </marker>
          
          <marker
            id="arrowhead-data"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#2196f3" />
          </marker>
          
          <marker
            id="arrowhead-message"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#9c27b0" />
          </marker>
        </defs>

        {/* Connection path */}
        <path
          d={pathData}
          stroke={isSelected ? '#1976d2' : style.stroke}
          strokeWidth={isSelected ? style.strokeWidth + 2 : style.strokeWidth}
          strokeDasharray={style.strokeDasharray}
          fill="none"
          markerEnd={style.markerEnd}
          style={{
            pointerEvents: readonly ? 'none' : 'stroke',
            cursor: readonly ? 'default' : 'pointer'
          }}
          onClick={onClick}
        />

        {/* Invisible wider path for easier clicking */}
        {!readonly && (
          <path
            d={pathData}
            stroke="transparent"
            strokeWidth={style.strokeWidth + 10}
            fill="none"
            style={{
              pointerEvents: 'stroke',
              cursor: 'pointer'
            }}
            onClick={onClick}
          />
        )}

        {/* Connection label */}
        {connection.label && (
          <g>
            <rect
              x={labelX - connection.label.length * 3}
              y={labelY - 8}
              width={connection.label.length * 6}
              height={16}
              fill="white"
              stroke={style.stroke}
              strokeWidth="1"
              rx="3"
            />
            <text
              x={labelX}
              y={labelY + 3}
              textAnchor="middle"
              fontSize="10"
              fill={style.stroke}
              fontFamily="Roboto, sans-serif"
            >
              {connection.label}
            </text>
          </g>
        )}

        {/* Data flow indicators */}
        {connection.type === 'data_flow' && connection.dataFlow && (
          <g>
            {/* Data sensitivity indicator */}
            <circle
              cx={labelX + 20}
              cy={labelY}
              r="8"
              fill={
                connection.dataFlow.sensitivity === 'restricted' ? '#f44336' :
                connection.dataFlow.sensitivity === 'confidential' ? '#ff9800' :
                connection.dataFlow.sensitivity === 'internal' ? '#2196f3' : '#4caf50'
              }
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={labelX + 20}
              y={labelY + 3}
              textAnchor="middle"
              fontSize="8"
              fill="white"
              fontWeight="bold"
            >
              {connection.dataFlow.sensitivity.charAt(0).toUpperCase()}
            </text>
          </g>
        )}

        {/* Conditional indicators */}
        {connection.type === 'conditional' && connection.conditions && (
          <g>
            <polygon
              points={`${labelX - 8},${labelY - 8} ${labelX + 8},${labelY - 8} ${labelX + 8},${labelY + 8} ${labelX - 8},${labelY + 8}`}
              fill="#fff3e0"
              stroke="#ff9800"
              strokeWidth="2"
            />
            <text
              x={labelX}
              y={labelY + 2}
              textAnchor="middle"
              fontSize="8"
              fill="#ef6c00"
              fontWeight="bold"
            >
              ?
            </text>
          </g>
        )}
      </svg>

      {/* Floating label for detailed information */}
      {isSelected && connection.label && (
        <Box
          sx={{
            position: 'absolute',
            left: labelX + 30,
            top: labelY - 20,
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            boxShadow: 2,
            zIndex: 10,
            minWidth: 200
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {connection.label}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Type: {connection.type.replace('_', ' ')}
          </Typography>
          {connection.dataFlow && (
            <Typography variant="caption" display="block" color="text.secondary">
              Data: {connection.dataFlow.dataTypes.join(', ')} ({connection.dataFlow.sensitivity})
            </Typography>
          )}
          {connection.conditions && connection.conditions.length > 0 && (
            <Typography variant="caption" display="block" color="text.secondary">
              Conditions: {connection.conditions.length} rule(s)
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};