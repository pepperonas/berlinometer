import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import dashboardReducer from './dashboardSlice';
import processingActivitiesReducer from './processingActivitiesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    processingActivities: processingActivitiesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;