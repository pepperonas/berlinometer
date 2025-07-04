import React from 'react';
import {
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
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
import { ProcessNodeType, PROCESS_NODE_TYPES } from '../../types/process-intelligence.types';

interface NodePaletteProps {
  open: boolean;
  anchorPosition: { x: number; y: number };
  onClose: () => void;
  onAddNode: (nodeType: ProcessNodeType, position: { x: number; y: number }) => void;
}

const NODE_CATEGORIES = [
  {
    title: 'Flow Control',
    nodes: [
      { type: 'start' as ProcessNodeType, icon: StartIcon, description: 'Start event' },
      { type: 'end' as ProcessNodeType, icon: EndIcon, description: 'End event' },
      { type: 'decision' as ProcessNodeType, icon: DecisionIcon, description: 'Decision gateway' },
      { type: 'parallel' as ProcessNodeType, icon: ParallelIcon, description: 'Parallel gateway' },
      { type: 'merge' as ProcessNodeType, icon: MergeIcon, description: 'Merge gateway' },
      { type: 'loop' as ProcessNodeType, icon: LoopIcon, description: 'Loop activity' },
    ]
  },
  {
    title: 'Activities',
    nodes: [
      { type: 'task' as ProcessNodeType, icon: TaskIcon, description: 'Manual or automated task' },
      { type: 'approval' as ProcessNodeType, icon: ApprovalIcon, description: 'Approval task' },
      { type: 'notification' as ProcessNodeType, icon: NotificationIcon, description: 'Send notification' },
      { type: 'delay' as ProcessNodeType, icon: DelayIcon, description: 'Wait/delay activity' },
      { type: 'subprocess' as ProcessNodeType, icon: SubprocessIcon, description: 'Call subprocess' },
    ]
  },
  {
    title: 'Data & Systems',
    nodes: [
      { type: 'data' as ProcessNodeType, icon: DataIcon, description: 'Data object' },
      { type: 'integration' as ProcessNodeType, icon: IntegrationIcon, description: 'System integration' },
      { type: 'compliance_check' as ProcessNodeType, icon: ComplianceIcon, description: 'Compliance validation' },
    ]
  }
];

export const NodePalette: React.FC<NodePaletteProps> = ({
  open,
  anchorPosition,
  onClose,
  onAddNode
}) => {
  const handleNodeSelect = (nodeType: ProcessNodeType) => {
    // Calculate position relative to the canvas
    const position = {
      x: anchorPosition.x - 100, // Offset to center the node
      y: anchorPosition.y - 50
    };
    
    onAddNode(nodeType, position);
    onClose();
  };

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ? { top: anchorPosition.y, left: anchorPosition.x } : undefined}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      PaperProps={{
        sx: {
          maxHeight: 400,
          width: 280,
          maxWidth: 280
        }
      }}
    >
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ p: 1, fontWeight: 600 }}>
          Add Process Node
        </Typography>
        
        {NODE_CATEGORIES.map((category, categoryIndex) => (
          <Box key={category.title}>
            {categoryIndex > 0 && <Divider sx={{ my: 1 }} />}
            
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ px: 1, py: 0.5, display: 'block', fontWeight: 500 }}
            >
              {category.title}
            </Typography>
            
            <List dense sx={{ py: 0 }}>
              {category.nodes.map((node) => {
                const IconComponent = node.icon;
                return (
                  <ListItem
                    key={node.type}
                    button
                    onClick={() => handleNodeSelect(node.type)}
                    sx={{
                      py: 0.5,
                      borderRadius: 1,
                      mx: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <IconComponent sx={{ fontSize: 20, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {PROCESS_NODE_TYPES[node.type]}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {node.description}
                        </Typography>
                      }
                      sx={{ my: 0 }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
        
        <Divider sx={{ my: 1 }} />
        
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ px: 1, py: 0.5, display: 'block', fontStyle: 'italic' }}
        >
          Double-click on canvas or drag from palette to add nodes
        </Typography>
      </Box>
    </Popover>
  );
};