import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import spaceReducer from './slices/spaceSlice';
import tariffReducer from './slices/tariffSlice';
import userReducer from './slices/userSlice';
import reportReducer from './slices/reportSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';
import settingsReducer from './slices/settingsSlice'; // Добавляем

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookingReducer,
    spaces: spaceReducer,
    tariffs: tariffReducer,
    users: userReducer,
    reports: reportReducer,
    ui: uiReducer,
    notifications: notificationReducer,
    settings: settingsReducer, // Добавляем
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
