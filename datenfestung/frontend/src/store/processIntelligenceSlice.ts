import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { processIntelligenceService } from '../services/process-intelligence.service';
import { 
  ProcessWorkflow,
  CreateProcessWorkflowRequest,
  UpdateProcessWorkflowRequest,
  ProcessWorkflowFilter,
  ProcessNode,
  ProcessConnection,
  EditorState,
  ExecutionStatus,
  WorkflowAnalytics
} from '../types/process-intelligence.types';

interface ProcessIntelligenceState {
  // Workflows
  workflows: ProcessWorkflow[];
  currentWorkflow: ProcessWorkflow | null;
  isLoading: boolean;
  error: string | null;
  filters: ProcessWorkflowFilter;
  totalCount: number;
  pageSize: number;
  currentPage: number;
  
  // Editor state
  editorState: EditorState;
  
  // Execution
  executions: Record<string, ExecutionStatus>;
  executionLogs: Record<string, any[]>;
  
  // Analytics
  analytics: WorkflowAnalytics | null;
  systemMetrics: any | null;
  
  // UI state
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  showProperties: boolean;
  showMinimap: boolean;
  showGrid: boolean;
}

const initialEditorState: EditorState = {
  mode: 'select',
  zoom: 1,
  pan: { x: 0, y: 0 },
  clipboard: [],
  history: [],
  historyIndex: -1
};

const initialState: ProcessIntelligenceState = {
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,
  filters: {},
  totalCount: 0,
  pageSize: 10,
  currentPage: 1,
  editorState: initialEditorState,
  executions: {},
  executionLogs: {},
  analytics: null,
  systemMetrics: null,
  selectedNodeId: null,
  selectedConnectionId: null,
  showProperties: true,
  showMinimap: true,
  showGrid: true
};

// Async thunks
export const fetchWorkflows = createAsyncThunk(
  'processIntelligence/fetchWorkflows',
  async ({ filters, page, pageSize }: { 
    filters?: ProcessWorkflowFilter; 
    page?: number; 
    pageSize?: number; 
  } = {}) => {
    const response = await processIntelligenceService.getWorkflows(filters, page, pageSize);
    return response.data;
  }
);

export const fetchWorkflowById = createAsyncThunk(
  'processIntelligence/fetchWorkflowById',
  async (id: string) => {
    return await processIntelligenceService.getWorkflowById(id);
  }
);

export const createWorkflow = createAsyncThunk(
  'processIntelligence/createWorkflow',
  async (workflow: CreateProcessWorkflowRequest) => {
    return await processIntelligenceService.createWorkflow(workflow);
  }
);

export const updateWorkflow = createAsyncThunk(
  'processIntelligence/updateWorkflow',
  async ({ id, workflow }: { id: string; workflow: UpdateProcessWorkflowRequest }) => {
    return await processIntelligenceService.updateWorkflow(id, workflow);
  }
);

export const deleteWorkflow = createAsyncThunk(
  'processIntelligence/deleteWorkflow',
  async (id: string) => {
    await processIntelligenceService.deleteWorkflow(id);
    return id;
  }
);

export const cloneWorkflow = createAsyncThunk(
  'processIntelligence/cloneWorkflow',
  async ({ id, name }: { id: string; name?: string }) => {
    return await processIntelligenceService.cloneWorkflow(id, name);
  }
);

export const addNode = createAsyncThunk(
  'processIntelligence/addNode',
  async ({ workflowId, node }: { workflowId: string; node: Omit<ProcessNode, 'id'> }) => {
    return await processIntelligenceService.addNode(workflowId, node);
  }
);

export const updateNode = createAsyncThunk(
  'processIntelligence/updateNode',
  async ({ workflowId, nodeId, node }: { 
    workflowId: string; 
    nodeId: string; 
    node: Partial<ProcessNode> 
  }) => {
    return await processIntelligenceService.updateNode(workflowId, nodeId, node);
  }
);

export const deleteNode = createAsyncThunk(
  'processIntelligence/deleteNode',
  async ({ workflowId, nodeId }: { workflowId: string; nodeId: string }) => {
    await processIntelligenceService.deleteNode(workflowId, nodeId);
    return nodeId;
  }
);

export const addConnection = createAsyncThunk(
  'processIntelligence/addConnection',
  async ({ workflowId, connection }: { 
    workflowId: string; 
    connection: Omit<ProcessConnection, 'id'> 
  }) => {
    return await processIntelligenceService.addConnection(workflowId, connection);
  }
);

export const updateConnection = createAsyncThunk(
  'processIntelligence/updateConnection',
  async ({ workflowId, connectionId, connection }: { 
    workflowId: string; 
    connectionId: string; 
    connection: Partial<ProcessConnection> 
  }) => {
    return await processIntelligenceService.updateConnection(workflowId, connectionId, connection);
  }
);

export const deleteConnection = createAsyncThunk(
  'processIntelligence/deleteConnection',
  async ({ workflowId, connectionId }: { workflowId: string; connectionId: string }) => {
    await processIntelligenceService.deleteConnection(workflowId, connectionId);
    return connectionId;
  }
);

export const executeWorkflow = createAsyncThunk(
  'processIntelligence/executeWorkflow',
  async (request: any) => {
    return await processIntelligenceService.executeWorkflow(request);
  }
);

export const fetchWorkflowAnalytics = createAsyncThunk(
  'processIntelligence/fetchAnalytics',
  async ({ workflowId, dateRange }: { 
    workflowId: string; 
    dateRange?: { start: string; end: string } 
  }) => {
    return await processIntelligenceService.getWorkflowAnalytics(workflowId, dateRange);
  }
);

export const validateWorkflow = createAsyncThunk(
  'processIntelligence/validateWorkflow',
  async (workflowId: string) => {
    return await processIntelligenceService.validateWorkflow(workflowId);
  }
);

// Slice
const processIntelligenceSlice = createSlice({
  name: 'processIntelligence',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ProcessWorkflowFilter>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
    clearCurrentWorkflow: (state) => {
      state.currentWorkflow = null;
      state.selectedNodeId = null;
      state.selectedConnectionId = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    
    // Editor actions
    setEditorMode: (state, action: PayloadAction<EditorState['mode']>) => {
      state.editorState.mode = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.editorState.zoom = Math.max(0.1, Math.min(5, action.payload));
    },
    setPan: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.editorState.pan = action.payload;
    },
    selectNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
      state.selectedConnectionId = null;
    },
    selectConnection: (state, action: PayloadAction<string | null>) => {
      state.selectedConnectionId = action.payload;
      state.selectedNodeId = null;
    },
    clearSelection: (state) => {
      state.selectedNodeId = null;
      state.selectedConnectionId = null;
    },
    
    // Node manipulation (optimistic updates)
    moveNodeOptimistic: (state, action: PayloadAction<{ nodeId: string; position: { x: number; y: number } }>) => {
      if (state.currentWorkflow) {
        const node = state.currentWorkflow.nodes.find(n => n.id === action.payload.nodeId);
        if (node) {
          node.position = action.payload.position;
        }
      }
    },
    
    updateNodeOptimistic: (state, action: PayloadAction<{ nodeId: string; updates: Partial<ProcessNode> }>) => {
      if (state.currentWorkflow) {
        const nodeIndex = state.currentWorkflow.nodes.findIndex(n => n.id === action.payload.nodeId);
        if (nodeIndex !== -1) {
          state.currentWorkflow.nodes[nodeIndex] = {
            ...state.currentWorkflow.nodes[nodeIndex],
            ...action.payload.updates
          };
        }
      }
    },
    
    // UI state
    toggleProperties: (state) => {
      state.showProperties = !state.showProperties;
    },
    toggleMinimap: (state) => {
      state.showMinimap = !state.showMinimap;
    },
    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },
    
    // History management
    addToHistory: (state, action: PayloadAction<{ action: string; data: any; description: string }>) => {
      const historyItem = {
        action: action.payload.action as any,
        timestamp: new Date().toISOString(),
        data: action.payload.data,
        description: action.payload.description
      };
      
      // Remove any future history if we're not at the end
      if (state.editorState.historyIndex < state.editorState.history.length - 1) {
        state.editorState.history = state.editorState.history.slice(0, state.editorState.historyIndex + 1);
      }
      
      state.editorState.history.push(historyItem);
      state.editorState.historyIndex = state.editorState.history.length - 1;
      
      // Limit history size
      if (state.editorState.history.length > 50) {
        state.editorState.history = state.editorState.history.slice(-50);
        state.editorState.historyIndex = state.editorState.history.length - 1;
      }
    },
    
    undo: (state) => {
      if (state.editorState.historyIndex > 0) {
        state.editorState.historyIndex -= 1;
        // Apply undo logic here
      }
    },
    
    redo: (state) => {
      if (state.editorState.historyIndex < state.editorState.history.length - 1) {
        state.editorState.historyIndex += 1;
        // Apply redo logic here
      }
    },
    
    // Clipboard operations
    copyToClipboard: (state, action: PayloadAction<{ type: 'node' | 'connection'; data: any }>) => {
      state.editorState.clipboard = [{
        type: action.payload.type,
        data: action.payload.data
      }];
    },
    
    clearClipboard: (state) => {
      state.editorState.clipboard = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch workflows
      .addCase(fetchWorkflows.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workflows = action.payload.workflows;
        state.totalCount = action.payload.totalCount;
        state.currentPage = action.payload.currentPage;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch workflows';
      })
      
      // Fetch workflow by ID
      .addCase(fetchWorkflowById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkflowById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWorkflow = action.payload;
      })
      .addCase(fetchWorkflowById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch workflow';
      })
      
      // Create workflow
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.workflows.unshift(action.payload);
        state.totalCount += 1;
        state.currentWorkflow = action.payload;
      })
      
      // Update workflow
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        const index = state.workflows.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.workflows[index] = action.payload;
        }
        if (state.currentWorkflow && state.currentWorkflow.id === action.payload.id) {
          state.currentWorkflow = action.payload;
        }
      })
      
      // Delete workflow
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter(w => w.id !== action.payload);
        state.totalCount -= 1;
        if (state.currentWorkflow && state.currentWorkflow.id === action.payload) {
          state.currentWorkflow = null;
        }
      })
      
      // Clone workflow
      .addCase(cloneWorkflow.fulfilled, (state, action) => {
        state.workflows.unshift(action.payload);
        state.totalCount += 1;
      })
      
      // Node operations
      .addCase(addNode.fulfilled, (state, action) => {
        if (state.currentWorkflow) {
          state.currentWorkflow.nodes.push(action.payload);
        }
      })
      
      .addCase(updateNode.fulfilled, (state, action) => {
        if (state.currentWorkflow) {
          const index = state.currentWorkflow.nodes.findIndex(n => n.id === action.payload.id);
          if (index !== -1) {
            state.currentWorkflow.nodes[index] = action.payload;
          }
        }
      })
      
      .addCase(deleteNode.fulfilled, (state, action) => {
        if (state.currentWorkflow) {
          state.currentWorkflow.nodes = state.currentWorkflow.nodes.filter(n => n.id !== action.payload);
          state.currentWorkflow.connections = state.currentWorkflow.connections.filter(
            c => c.sourceId !== action.payload && c.targetId !== action.payload
          );
        }
        if (state.selectedNodeId === action.payload) {
          state.selectedNodeId = null;
        }
      })
      
      // Connection operations
      .addCase(addConnection.fulfilled, (state, action) => {
        if (state.currentWorkflow) {
          state.currentWorkflow.connections.push(action.payload);
        }
      })
      
      .addCase(updateConnection.fulfilled, (state, action) => {
        if (state.currentWorkflow) {
          const index = state.currentWorkflow.connections.findIndex(c => c.id === action.payload.id);
          if (index !== -1) {
            state.currentWorkflow.connections[index] = action.payload;
          }
        }
      })
      
      .addCase(deleteConnection.fulfilled, (state, action) => {
        if (state.currentWorkflow) {
          state.currentWorkflow.connections = state.currentWorkflow.connections.filter(c => c.id !== action.payload);
        }
        if (state.selectedConnectionId === action.payload) {
          state.selectedConnectionId = null;
        }
      })
      
      // Analytics
      .addCase(fetchWorkflowAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  }
});

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  clearCurrentWorkflow,
  clearError,
  setEditorMode,
  setZoom,
  setPan,
  selectNode,
  selectConnection,
  clearSelection,
  moveNodeOptimistic,
  updateNodeOptimistic,
  toggleProperties,
  toggleMinimap,
  toggleGrid,
  addToHistory,
  undo,
  redo,
  copyToClipboard,
  clearClipboard
} = processIntelligenceSlice.actions;

export default processIntelligenceSlice.reducer;

// Selectors
export const selectWorkflows = (state: any) => state.processIntelligence.workflows;
export const selectCurrentWorkflow = (state: any) => state.processIntelligence.currentWorkflow;
export const selectIsLoading = (state: any) => state.processIntelligence.isLoading;
export const selectError = (state: any) => state.processIntelligence.error;
export const selectFilters = (state: any) => state.processIntelligence.filters;
export const selectEditorState = (state: any) => state.processIntelligence.editorState;
export const selectSelectedNodeId = (state: any) => state.processIntelligence.selectedNodeId;
export const selectSelectedConnectionId = (state: any) => state.processIntelligence.selectedConnectionId;
export const selectAnalytics = (state: any) => state.processIntelligence.analytics;

export const selectSelectedNode = (state: any) => {
  const workflow = selectCurrentWorkflow(state);
  const nodeId = selectSelectedNodeId(state);
  return workflow?.nodes.find((node: ProcessNode) => node.id === nodeId) || null;
};

export const selectSelectedConnection = (state: any) => {
  const workflow = selectCurrentWorkflow(state);
  const connectionId = selectSelectedConnectionId(state);
  return workflow?.connections.find((conn: ProcessConnection) => conn.id === connectionId) || null;
};