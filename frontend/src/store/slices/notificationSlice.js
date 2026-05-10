import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Получение уведомлений
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки уведомлений');
    }
  }
);

// Отметить как прочитанное
export const markAsRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/notifications/${id}/mark_read/`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка');
    }
  }
);

// Отметить все как прочитанные
export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/notifications/mark_all_read/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка');
    }
  }
);

// Получить количество непрочитанных
export const fetchUnreadCount = createAsyncThunk(
  'notifications/unreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications/unread_count/');  // ← ИСПРАВЛЕНО: был unread-count, стало unread_count
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    loading: false,
    error: null,
    total: 0,
    unreadCount: 0,
  },
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.total = 0;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.results || action.payload;
        state.total = action.payload.count || action.payload.length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index].is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark all read
      .addCase(markAllRead.fulfilled, (state) => {
        state.notifications.forEach(n => { n.is_read = true; });
        state.unreadCount = 0;
      })
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unread_count;
      });
  },
});

export const { clearNotifications, incrementUnreadCount, decrementUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;

