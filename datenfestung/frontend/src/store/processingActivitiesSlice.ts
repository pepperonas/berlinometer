import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProcessingActivityState, ProcessingActivity, ProcessingActivityFilter } from '../types/processing-activity.types';

const initialState: ProcessingActivityState = {
  activities: [],
  currentActivity: null,
  isLoading: false,
  error: null,
  filters: {},
  totalCount: 0,
  pageSize: 10,
  currentPage: 0,
};

const processingActivitiesSlice = createSlice({
  name: 'processingActivities',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setActivities: (state, action: PayloadAction<{ activities: ProcessingActivity[]; totalCount: number }>) => {
      state.activities = action.payload.activities;
      state.totalCount = action.payload.totalCount;
      state.isLoading = false;
      state.error = null;
    },
    setCurrentActivity: (state, action: PayloadAction<ProcessingActivity | null>) => {
      state.currentActivity = action.payload;
    },
    addActivity: (state, action: PayloadAction<ProcessingActivity>) => {
      state.activities.unshift(action.payload);
      state.totalCount += 1;
    },
    updateActivity: (state, action: PayloadAction<ProcessingActivity>) => {
      const index = state.activities.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.activities[index] = action.payload;
      }
      if (state.currentActivity?.id === action.payload.id) {
        state.currentActivity = action.payload;
      }
    },
    removeActivity: (state, action: PayloadAction<number>) => {
      state.activities = state.activities.filter(a => a.id !== action.payload);
      state.totalCount -= 1;
      if (state.currentActivity?.id === action.payload) {
        state.currentActivity = null;
      }
    },
    setFilters: (state, action: PayloadAction<ProcessingActivityFilter>) => {
      state.filters = action.payload;
      state.currentPage = 0; // Reset to first page when filters change
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.currentPage = 0; // Reset to first page when page size changes
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentActivity: (state) => {
      state.currentActivity = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setActivities,
  setCurrentActivity,
  addActivity,
  updateActivity,
  removeActivity,
  setFilters,
  setCurrentPage,
  setPageSize,
  clearError,
  clearCurrentActivity,
} = processingActivitiesSlice.actions;

export default processingActivitiesSlice.reducer;