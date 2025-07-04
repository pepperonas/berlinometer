import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { templateService } from '../services/template.service';
import { 
  ProcessTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest, 
  TemplateFilter, 
  TemplateState 
} from '../types/template.types';

const initialState: TemplateState = {
  templates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,
  filters: {},
  totalCount: 0,
  pageSize: 10,
  currentPage: 1
};

// Async thunks
export const fetchTemplates = createAsyncThunk(
  'templates/fetchTemplates',
  async ({ filters, page, pageSize }: { 
    filters?: TemplateFilter; 
    page?: number; 
    pageSize?: number; 
  } = {}) => {
    const response = await templateService.getTemplates(filters, page, pageSize);
    return response.data;
  }
);

export const fetchTemplateById = createAsyncThunk(
  'templates/fetchTemplateById',
  async (id: number) => {
    return await templateService.getTemplateById(id);
  }
);

export const createTemplate = createAsyncThunk(
  'templates/createTemplate',
  async (template: CreateTemplateRequest) => {
    return await templateService.createTemplate(template);
  }
);

export const updateTemplate = createAsyncThunk(
  'templates/updateTemplate',
  async ({ id, template }: { id: number; template: UpdateTemplateRequest }) => {
    return await templateService.updateTemplate(id, template);
  }
);

export const deleteTemplate = createAsyncThunk(
  'templates/deleteTemplate',
  async (id: number) => {
    await templateService.deleteTemplate(id);
    return id;
  }
);

export const cloneTemplate = createAsyncThunk(
  'templates/cloneTemplate',
  async (id: number) => {
    return await templateService.cloneTemplate(id);
  }
);

export const applyTemplate = createAsyncThunk(
  'templates/applyTemplate',
  async ({ id, processName, customData }: { 
    id: number; 
    processName?: string; 
    customData?: any 
  }) => {
    return await templateService.applyTemplate(id, processName, customData);
  }
);

export const fetchTemplateStatistics = createAsyncThunk(
  'templates/fetchStatistics',
  async () => {
    return await templateService.getTemplateStatistics();
  }
);

export const searchPublicTemplates = createAsyncThunk(
  'templates/searchPublicTemplates',
  async ({ query, filters }: { query: string; filters?: TemplateFilter }) => {
    const response = await templateService.searchPublicTemplates(query, filters);
    return response.data;
  }
);

export const fetchFeaturedTemplates = createAsyncThunk(
  'templates/fetchFeaturedTemplates',
  async () => {
    const response = await templateService.getFeaturedTemplates();
    return response.data.templates;
  }
);

// Slice
const templateSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TemplateFilter>) => {
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
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateTemplateRating: (state, action: PayloadAction<{ id: number; rating: number }>) => {
      const template = state.templates.find(t => t.id === action.payload.id);
      if (template) {
        template.rating = action.payload.rating;
      }
      if (state.currentTemplate && state.currentTemplate.id === action.payload.id) {
        state.currentTemplate.rating = action.payload.rating;
      }
    },
    incrementDownloadCount: (state, action: PayloadAction<number>) => {
      const template = state.templates.find(t => t.id === action.payload);
      if (template) {
        template.downloadCount += 1;
      }
      if (state.currentTemplate && state.currentTemplate.id === action.payload) {
        state.currentTemplate.downloadCount += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch templates
      .addCase(fetchTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload.templates;
        state.totalCount = action.payload.totalCount;
        state.currentPage = action.payload.currentPage;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch templates';
      })
      
      // Fetch template by ID
      .addCase(fetchTemplateById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplateById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTemplate = action.payload;
      })
      .addCase(fetchTemplateById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch template';
      })
      
      // Create template
      .addCase(createTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create template';
      })
      
      // Update template
      .addCase(updateTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.templates.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        if (state.currentTemplate && state.currentTemplate.id === action.payload.id) {
          state.currentTemplate = action.payload;
        }
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update template';
      })
      
      // Delete template
      .addCase(deleteTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = state.templates.filter(t => t.id !== action.payload);
        state.totalCount -= 1;
        if (state.currentTemplate && state.currentTemplate.id === action.payload) {
          state.currentTemplate = null;
        }
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete template';
      })
      
      // Clone template
      .addCase(cloneTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cloneTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(cloneTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to clone template';
      })
      
      // Apply template
      .addCase(applyTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyTemplate.fulfilled, (state) => {
        state.isLoading = false;
        // Applied template creates a new process, so we just stop loading
      })
      .addCase(applyTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to apply template';
      })
      
      // Search public templates
      .addCase(searchPublicTemplates.fulfilled, (state, action) => {
        state.templates = action.payload.templates;
        state.totalCount = action.payload.totalCount;
        state.currentPage = action.payload.currentPage;
        state.pageSize = action.payload.pageSize;
      })
      
      // Fetch featured templates
      .addCase(fetchFeaturedTemplates.fulfilled, (state, action) => {
        // Could store featured templates separately if needed
        // For now, just replace templates array
        state.templates = action.payload;
      });
  }
});

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  clearCurrentTemplate,
  clearError,
  updateTemplateRating,
  incrementDownloadCount
} = templateSlice.actions;

export default templateSlice.reducer;

// Selectors
export const selectTemplates = (state: any) => state.templates.templates;
export const selectCurrentTemplate = (state: any) => state.templates.currentTemplate;
export const selectTemplatesLoading = (state: any) => state.templates.isLoading;
export const selectTemplatesError = (state: any) => state.templates.error;
export const selectTemplateFilters = (state: any) => state.templates.filters;
export const selectTemplatePagination = (state: any) => ({
  currentPage: state.templates.currentPage,
  pageSize: state.templates.pageSize,
  totalCount: state.templates.totalCount,
  totalPages: Math.ceil(state.templates.totalCount / state.templates.pageSize)
});

// Filter selectors
export const selectFilteredTemplates = (state: any) => {
  const templates = selectTemplates(state);
  const filters = selectTemplateFilters(state);
  
  if (!filters || Object.keys(filters).length === 0) {
    return templates;
  }
  
  return templates.filter((template: ProcessTemplate) => {
    if (filters.category && template.category !== filters.category) {
      return false;
    }
    
    if (filters.industry && template.industry !== filters.industry) {
      return false;
    }
    
    if (filters.isPublic !== undefined && template.isPublic !== filters.isPublic) {
      return false;
    }
    
    if (filters.isVerified !== undefined && template.isVerified !== filters.isVerified) {
      return false;
    }
    
    if (filters.minRating && template.rating < filters.minRating) {
      return false;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some((tag: string) => 
        template.tags.some((templateTag: string) => 
          templateTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesName = template.name.toLowerCase().includes(searchTerm);
      const matchesDescription = template.description.toLowerCase().includes(searchTerm);
      const matchesTags = template.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      
      if (!matchesName && !matchesDescription && !matchesTags) {
        return false;
      }
    }
    
    return true;
  });
};