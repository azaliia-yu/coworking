import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Настройки бронирования
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/booking-settings/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки настроек');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put('/booking-settings/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка обновления настроек');
    }
  }
);

// Рабочие часы
export const fetchWorkingHours = createAsyncThunk(
  'settings/fetchWorkingHours',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/working-hours/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки рабочих часов');
    }
  }
);

export const updateWorkingHours = createAsyncThunk(
  'settings/updateWorkingHours',
  async ({ day, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/working-hours/${day}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка обновления рабочих часов');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    settings: null,
    workingHours: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update settings
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      // Fetch working hours
      .addCase(fetchWorkingHours.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkingHours.fulfilled, (state, action) => {
        state.loading = false;
        state.workingHours = action.payload.results || action.payload;
      })
      .addCase(fetchWorkingHours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update working hours
      .addCase(updateWorkingHours.fulfilled, (state, action) => {
        const index = state.workingHours.findIndex(h => h.id === action.payload.id);
        if (index !== -1) {
          state.workingHours[index] = action.payload;
        }
      });
  },
});

export default settingsSlice.reducer;
