import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Toolbar,
  ButtonGroup,
  Tooltip,
  Menu,
  MenuItem,
  Zoom,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  FitScreen as FitScreenIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentWorkflow,
  selectEditorState,
  selectSelectedNodeId,
  selectSelectedConnectionId,
  setZoom,
  setPan,
  selectNode,
  selectConnection,
  clearSelection,
  setEditorMode,
  toggleGrid,
  undo,
  redo,
  addToHistory,
  updateNodeOptimistic
} from '../../store/processIntelligenceSlice';
import { ProcessNode, ProcessConnection, EditorMode } from '../../types/process-intelligence.types';
import { ProcessNodeComponent } from './ProcessNodeComponent';
import { ProcessConnectionComponent } from './ProcessConnectionComponent';
import { NodePalette } from './NodePalette';

interface WorkflowCanvasProps {
  onSave?: () => void;
  onExecute?: () => void;
  onStop?: () => void;
  readonly?: boolean;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  onSave,
  onExecute,
  onStop,
  readonly = false
}) => {
  const dispatch = useDispatch();
  const workflow = useSelector(selectCurrentWorkflow);
  const editorState = useSelector(selectEditorState);
  const selectedNodeId = useSelector(selectSelectedNodeId);
  const selectedConnectionId = useSelector(selectSelectedConnectionId);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'canvas' | 'node' | 'connection' } | null>(null);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [palettePosition, setPalettePosition] = useState({ x: 0, y: 0 });

  // Handle canvas interactions
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (readonly) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (event.button === 0) { // Left click
      if (editorState.mode === 'pan' || event.shiftKey) {
        setIsDragging(true);
        setDragStart({ x: event.clientX, y: event.clientY });
      } else {
        dispatch(clearSelection());
      }
    } else if (event.button === 2) { // Right click
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY, type: 'canvas' });
    }
  }, [readonly, editorState.mode, dispatch]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    dispatch(setPan({
      x: editorState.pan.x + deltaX,
      y: editorState.pan.y + deltaY
    }));

    setDragStart({ x: event.clientX, y: event.clientY });
  }, [isDragging, dragStart, editorState.pan, dispatch]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsConnecting(false);
    setConnectionStart(null);
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = editorState.zoom * zoomFactor;
    dispatch(setZoom(newZoom));
  }, [editorState.zoom, dispatch]);

  // Node interactions
  const handleNodeClick = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isConnecting && connectionStart && connectionStart !== nodeId) {
      // Create connection
      const newConnection: Omit<ProcessConnection, 'id'> = {
        sourceId: connectionStart,
        targetId: nodeId,
        type: 'sequence',
        dataFlow: {
          dataTypes: [],
          volume: 'low',
          sensitivity: 'internal',
          retention: {
            period: '1y',
            policy: 'automatic',
            autoDelete: true
          }
        }
      };
      
      // Dispatch add connection action
      dispatch(addToHistory({
        action: 'add_connection',
        data: newConnection,
        description: `Connected ${connectionStart} to ${nodeId}`
      }));
      
      setIsConnecting(false);
      setConnectionStart(null);
    } else {
      dispatch(selectNode(nodeId));
    }
  }, [isConnecting, connectionStart, dispatch]);

  const handleNodeDrag = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (readonly) return;
    
    // Optimistic update
    dispatch(updateNodeOptimistic({ nodeId, updates: { position } }));
    
    dispatch(addToHistory({
      action: 'move_node',
      data: { nodeId, position },
      description: `Moved node ${nodeId}`
    }));
  }, [readonly, dispatch]);

  const handleNodeContextMenu = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch(selectNode(nodeId));
    setContextMenu({ x: event.clientX, y: event.clientY, type: 'node' });
  }, [dispatch]);

  const handleConnectionClick = useCallback((connectionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(selectConnection(connectionId));
  }, [dispatch]);

  // Toolbar actions
  const handleZoomIn = () => dispatch(setZoom(editorState.zoom * 1.2));
  const handleZoomOut = () => dispatch(setZoom(editorState.zoom * 0.8));
  const handleFitToScreen = () => {
    // Calculate bounding box of all nodes and fit to screen
    if (!workflow?.nodes.length) return;
    
    const bounds = workflow.nodes.reduce(
      (acc: { minX: number; minY: number; maxX: number; maxY: number }, node: ProcessNode) => ({
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + 150), // Assume node width
        maxY: Math.max(acc.maxY, node.position.y + 100), // Assume node height
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const padding = 50;
    const contentWidth = bounds.maxX - bounds.minX + padding * 2;
    const contentHeight = bounds.maxY - bounds.minY + padding * 2;
    
    const zoomX = canvasRect.width / contentWidth;
    const zoomY = canvasRect.height / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, 1);
    
    dispatch(setZoom(newZoom));
    dispatch(setPan({
      x: (canvasRect.width - contentWidth * newZoom) / 2 - bounds.minX * newZoom + padding,
      y: (canvasRect.height - contentHeight * newZoom) / 2 - bounds.minY * newZoom + padding
    }));
  };

  const handleAddNode = (event: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (event.clientX - rect.left - editorState.pan.x) / editorState.zoom;
    const y = (event.clientY - rect.top - editorState.pan.y) / editorState.zoom;
    
    setPalettePosition({ x: event.clientX, y: event.clientY });
    setShowNodePalette(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (readonly) return;
      
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              dispatch(redo());
            } else {
              dispatch(undo());
            }
            break;
          case 's':
            event.preventDefault();
            onSave?.();
            break;
          case 'a':
            event.preventDefault();
            // Select all
            break;
          case 'c':
            if (selectedNodeId) {
              event.preventDefault();
              // Copy selected node
            }
            break;
          case 'v':
            event.preventDefault();
            // Paste
            break;
        }
      } else {
        switch (event.key) {
          case 'Delete':
          case 'Backspace':
            if (selectedNodeId || selectedConnectionId) {
              event.preventDefault();
              // Delete selected item
            }
            break;
          case 'Escape':
            dispatch(clearSelection());
            setIsConnecting(false);
            setConnectionStart(null);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readonly, selectedNodeId, selectedConnectionId, dispatch, onSave]);

  const canvasStyle = {
    transform: `scale(${editorState.zoom}) translate(${editorState.pan.x}px, ${editorState.pan.y}px)`,
    transformOrigin: '0 0',
    width: '100%',
    height: '100%',
    position: 'relative' as const,
    cursor: editorState.mode === 'pan' ? 'grab' : isDragging ? 'grabbing' : 'default'
  };

  const gridPattern = (
    <defs>
      <pattern
        id="grid"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 20 0 L 0 0 0 20"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="1"
          opacity="0.3"
        />
      </pattern>
    </defs>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Toolbar variant="dense" sx={{ minHeight: 48, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <ButtonGroup size="small" sx={{ mr: 2 }}>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut}>
              <RemoveIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fit to Screen">
            <IconButton onClick={handleFitToScreen}>
              <FitScreenIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Typography variant="body2" sx={{ mr: 2 }}>
          {Math.round(editorState.zoom * 100)}%
        </Typography>

        <ButtonGroup size="small" sx={{ mr: 2 }}>
          <Tooltip title="Toggle Grid">
            <IconButton onClick={() => dispatch(toggleGrid())}>
              {editorState.zoom > 0.5 ? <GridOnIcon /> : <GridOffIcon />}
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        {!readonly && (
          <>
            <ButtonGroup size="small" sx={{ mr: 2 }}>
              <Tooltip title="Undo">
                <IconButton 
                  onClick={() => dispatch(undo())}
                  disabled={editorState.historyIndex <= 0}
                >
                  <UndoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Redo">
                <IconButton 
                  onClick={() => dispatch(redo())}
                  disabled={editorState.historyIndex >= editorState.history.length - 1}
                >
                  <RedoIcon />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <ButtonGroup size="small" sx={{ mr: 2 }}>
              <Tooltip title="Save">
                <IconButton onClick={onSave}>
                  <SaveIcon />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
          </>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <ButtonGroup size="small">
          <Tooltip title="Execute Workflow">
            <IconButton onClick={onExecute} color="primary">
              <PlayIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Stop Execution">
            <IconButton onClick={onStop} color="error">
              <StopIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Toolbar>

      {/* Canvas */}
      <Paper
        ref={canvasRef}
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          cursor: editorState.mode === 'pan' ? 'grab' : 'default',
          backgroundColor: '#fafafa'
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        onDoubleClick={handleAddNode}
      >
        {/* Background Grid */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0
          }}
        >
          {gridPattern}
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Workflow Content */}
        <div style={canvasStyle}>
          {/* Connections */}
          {workflow?.connections.map((connection: ProcessConnection) => (
            <ProcessConnectionComponent
              key={connection.id}
              connection={connection}
              nodes={workflow.nodes}
              isSelected={selectedConnectionId === connection.id}
              onClick={(e) => handleConnectionClick(connection.id, e)}
              readonly={readonly}
            />
          ))}

          {/* Nodes */}
          {workflow?.nodes.map((node: ProcessNode) => (
            <ProcessNodeComponent
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onClick={(e) => handleNodeClick(node.id, e)}
              onDrag={(position) => handleNodeDrag(node.id, position)}
              onContextMenu={(e) => handleNodeContextMenu(node.id, e)}
              readonly={readonly}
            />
          ))}
        </div>

        {/* Context Menu */}
        <Menu
          open={Boolean(contextMenu)}
          onClose={() => setContextMenu(null)}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu
              ? { top: contextMenu.y, left: contextMenu.x }
              : undefined
          }
        >
          {contextMenu?.type === 'canvas' && (
            <MenuItem onClick={() => setShowNodePalette(true)}>
              Add Node
            </MenuItem>
          )}
          {contextMenu?.type === 'node' && [
            <MenuItem key="edit">Edit</MenuItem>,
            <MenuItem key="copy">Copy</MenuItem>,
            <MenuItem key="delete">Delete</MenuItem>
          ]}
          {contextMenu?.type === 'connection' && [
            <MenuItem key="edit">Edit</MenuItem>,
            <MenuItem key="delete">Delete</MenuItem>
          ]}
        </Menu>

        {/* Node Palette */}
        <NodePalette
          open={showNodePalette}
          anchorPosition={palettePosition}
          onClose={() => setShowNodePalette(false)}
          onAddNode={(nodeType, position) => {
            // Handle adding node
            setShowNodePalette(false);
          }}
        />
      </Paper>
    </Box>
  );
};