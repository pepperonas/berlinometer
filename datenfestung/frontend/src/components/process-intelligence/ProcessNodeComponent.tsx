import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Icon,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as EndIcon,
  Assignment as TaskIcon,
  AccountTree as DecisionIcon,
  CallSplit as ParallelIcon,
  CallMerge as MergeIcon,
  Storage as DataIcon,
  Hub as IntegrationIcon,
  CheckCircle as ApprovalIcon,
  Notifications as NotificationIcon,
  Timer as DelayIcon,
  Loop as LoopIcon,
  Subtitles as SubprocessIcon,
  Security as ComplianceIcon,
} from '@mui/icons-material';
import { ProcessNode, ProcessNodeType } from '../../types/process-intelligence.types';

interface ProcessNodeComponentProps {
  node: ProcessNode;
  isSelected: boolean;
  onClick: (event: React.MouseEvent) => void;
  onDrag: (position: { x: number; y: number }) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  readonly?: boolean;
}

const NODE_ICONS: Record<ProcessNodeType, React.ComponentType> = {
  start: StartIcon,
  end: EndIcon,
  task: TaskIcon,
  decision: DecisionIcon,
  parallel: ParallelIcon,
  merge: MergeIcon,
  data: DataIcon,
  integration: IntegrationIcon,
  approval: ApprovalIcon,
  notification: NotificationIcon,
  delay: DelayIcon,
  loop: LoopIcon,
  subprocess: SubprocessIcon,
  compliance_check: ComplianceIcon,
};

const NODE_COLORS: Record<ProcessNodeType, { bg: string; border: string; text: string }> = {
  start: { bg: '#e8f5e8', border: '#4caf50', text: '#2e7d32' },
  end: { bg: '#ffebee', border: '#f44336', text: '#c62828' },
  task: { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
  decision: { bg: '#fff3e0', border: '#ff9800', text: '#ef6c00' },
  parallel: { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' },
  merge: { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' },
  data: { bg: '#e8eaf6', border: '#3f51b5', text: '#303f9f' },
  integration: { bg: '#e0f2f1', border: '#009688', text: '#00695c' },
  approval: { bg: '#fff8e1', border: '#ffc107', text: '#f57c00' },
  notification: { bg: '#e1f5fe', border: '#00bcd4', text: '#0097a7' },
  delay: { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' },
  loop: { bg: '#f1f8e9', border: '#8bc34a', text: '#689f38' },
  subprocess: { bg: '#e8eaf6', border: '#673ab7', text: '#512da8' },
  compliance_check: { bg: '#ffebee', border: '#ff5722', text: '#d84315' },
};

const RISK_COLORS: Record<string, string> = {
  very_low: '#4caf50',
  low: '#8bc34a',
  medium: '#ff9800',
  high: '#f44336',
  very_high: '#d32f2f',
};

export const ProcessNodeComponent: React.FC<ProcessNodeComponentProps> = ({
  node,
  isSelected,
  onClick,
  onDrag,
  onContextMenu,
  readonly = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const NodeIcon = NODE_ICONS[node.type];
  const colors = NODE_COLORS[node.type];

  const handleMouseDown = (event: React.MouseEvent) => {
    if (readonly) return;
    
    event.stopPropagation();
    
    if (event.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({
        x: event.clientX,
        y: event.clientY,
        nodeX: node.position.x,
        nodeY: node.position.y
      });
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = (event.clientX - dragStart.x);
    const deltaY = (event.clientY - dragStart.y);

    const newPosition = {
      x: Math.max(0, dragStart.nodeX + deltaX),
      y: Math.max(0, dragStart.nodeY + deltaY)
    };

    onDrag(newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, node.position]);

  const getNodeShape = (type: ProcessNodeType) => {
    switch (type) {
      case 'start':
      case 'end':
        return { borderRadius: '50%', width: 60, height: 60 };
      case 'decision':
        return { 
          borderRadius: '4px',
          width: 120,
          height: 80,
          transform: 'rotate(45deg)',
          transformOrigin: 'center'
        };
      case 'parallel':
      case 'merge':
        return { 
          borderRadius: '4px',
          width: 100,
          height: 60,
          clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)'
        };
      default:
        return { borderRadius: '8px', width: 140, height: 80 };
    }
  };

  const shape = getNodeShape(node.type);
  const riskColor = RISK_COLORS[node.metadata.riskLevel] || RISK_COLORS.medium;

  const nodeStyle = {
    position: 'absolute' as const,
    left: node.position.x,
    top: node.position.y,
    cursor: readonly ? 'default' : isDragging ? 'grabbing' : 'grab',
    zIndex: isSelected ? 10 : 1,
    ...shape
  };

  const paperStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
    backgroundColor: colors.bg,
    borderColor: isSelected ? '#1976d2' : colors.border,
    borderWidth: isSelected ? 3 : 2,
    borderStyle: 'solid',
    color: colors.text,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: readonly ? 'none' : 'scale(1.05)',
      boxShadow: 3
    }
  };

  return (
    <Box
      ref={nodeRef}
      style={nodeStyle}
      onMouseDown={handleMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <Paper sx={paperStyle} elevation={isSelected ? 8 : 2}>
        {/* Risk indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: riskColor,
            border: '2px solid white',
            zIndex: 2
          }}
        />

        {/* Node content */}
        {node.type === 'decision' ? (
          // Special layout for diamond-shaped decision nodes
          <Box
            sx={{
              transform: 'rotate(-45deg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%'
            }}
          >
            <Box component={NodeIcon} sx={{ fontSize: 20, mb: 0.5 }} />
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '10px',
                textAlign: 'center',
                lineHeight: 1,
                maxWidth: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {node.label}
            </Typography>
          </Box>
        ) : node.type === 'start' || node.type === 'end' ? (
          // Circular nodes
          <Box sx={{ textAlign: 'center' }}>
            <Box component={NodeIcon} sx={{ fontSize: 24 }} />
          </Box>
        ) : (
          // Regular rectangular nodes
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
              <Box component={NodeIcon} sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '11px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px'
                }}
              >
                {node.label}
              </Typography>
            </Box>
            
            {/* Description */}
            {node.description && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '9px',
                  color: 'text.secondary',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.2
                }}
              >
                {node.description}
              </Typography>
            )}
            
            {/* Priority indicator */}
            {node.data.priority !== 'medium' && (
              <Chip
                label={node.data.priority}
                size="small"
                color={
                  node.data.priority === 'high' || node.data.priority === 'critical' 
                    ? 'error' 
                    : 'default'
                }
                sx={{ 
                  fontSize: '8px',
                  height: 16,
                  mt: 0.5,
                  '& .MuiChip-label': {
                    px: 0.5
                  }
                }}
              />
            )}
            
            {/* Compliance flags */}
            {node.metadata.complianceFlags.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                <Icon 
                  sx={{ 
                    fontSize: 12, 
                    color: node.metadata.complianceFlags.some(f => f.severity === 'critical') 
                      ? 'error.main' 
                      : 'warning.main' 
                  }}
                >
                  warning
                </Icon>
              </Box>
            )}
          </Box>
        )}

        {/* Connection points */}
        {!readonly && (
          <>
            {/* Input connection point */}
            {node.type !== 'start' && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: 'background.paper',
                  border: `2px solid ${colors.border}`,
                  zIndex: 3,
                  cursor: 'crosshair',
                  '&:hover': {
                    backgroundColor: colors.border,
                    transform: 'translateX(-50%) scale(1.2)'
                  }
                }}
              />
            )}
            
            {/* Output connection point */}
            {node.type !== 'end' && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: 'background.paper',
                  border: `2px solid ${colors.border}`,
                  zIndex: 3,
                  cursor: 'crosshair',
                  '&:hover': {
                    backgroundColor: colors.border,
                    transform: 'translateX(-50%) scale(1.2)'
                  }
                }}
              />
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};