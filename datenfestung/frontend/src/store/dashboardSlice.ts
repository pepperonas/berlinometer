import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardState, DashboardStats, DashboardWidget, Notification } from '../types/dashboard.types';

const initialState: DashboardState = {
  stats: null,
  widgets: [],
  recentActivities: [],
  notifications: [],
  upcomingDeadlines: [],
  complianceMetrics: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
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
    setStats: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setWidgets: (state, action: PayloadAction<DashboardWidget[]>) => {
      state.widgets = action.payload;
    },
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
    },
    markNotificationAsRead: (state, action: PayloadAction<number>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.isRead = true;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setStats,
  setWidgets,
  setNotifications,
  markNotificationAsRead,
  clearError,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;