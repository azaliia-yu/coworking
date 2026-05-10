import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Получение списка отчетов
export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки отчетов');
    }
  }
);

// Получение одного отчета
export const fetchReport = createAsyncThunk(
  'reports/fetchReport',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reports/${id}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки отчета');
    }
  }
);

// Создание нового отчета
export const createReport = createAsyncThunk(
  'reports/createReport',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/reports/create_report/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка создания отчета');
    }
  }
);

// Скачивание отчета
export const downloadReport = createAsyncThunk(
  'reports/downloadReport',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reports/${id}/download/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка скачивания отчета');
    }
  }
);

// Удаление отчета
export const deleteReport = createAsyncThunk(
  'reports/deleteReport',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/reports/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка удаления отчета');
    }
  }
);

// Получение типов отчетов
export const fetchReportTypes = createAsyncThunk(
  'reports/fetchReportTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/types/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки типов отчетов');
    }
  }
);

// Отчет по загрузке (синхронный для дашборда)
export const fetchOccupancyReport = createAsyncThunk(
  'reports/occupancy',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/occupancy/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки отчёта по загрузке');
    }
  }
);

// Отчет по доходам (синхронный для дашборда)
export const fetchRevenueReport = createAsyncThunk(
  'reports/revenue',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/revenue/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки отчёта по доходам');
    }
  }
);

// Отчет по клиентам (синхронный для дашборда)
export const fetchClientsReport = createAsyncThunk(
  'reports/clients',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/clients/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки отчёта по клиентам');
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    reports: [],
    currentReport: null,
    reportTypes: [],
    occupancy: null,
    revenue: null,
    clients: null,
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {
    clearReports: (state) => {
      state.occupancy = null;
      state.revenue = null;
      state.clients = null;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reports
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload.results || action.payload;
        state.total = action.payload.count || action.payload.length;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch single report
      .addCase(fetchReport.fulfilled, (state, action) => {
        state.currentReport = action.payload;
      })
      
      // Create report
      .addCase(createReport.fulfilled, (state, action) => {
        state.reports.unshift(action.payload);
        state.total += 1;
      })
      
      // Delete report
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.reports = state.reports.filter(r => r.id !== action.payload);
        state.total -= 1;
      })
      
      // Fetch report types
      .addCase(fetchReportTypes.fulfilled, (state, action) => {
        state.reportTypes = action.payload.types || [];
      })
      
      // Occupancy report
      .addCase(fetchOccupancyReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOccupancyReport.fulfilled, (state, action) => {
        state.loading = false;
        state.occupancy = action.payload;
      })
      .addCase(fetchOccupancyReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Revenue report
      .addCase(fetchRevenueReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRevenueReport.fulfilled, (state, action) => {
        state.loading = false;
        state.revenue = action.payload;
      })
      .addCase(fetchRevenueReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Clients report
      .addCase(fetchClientsReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClientsReport.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClientsReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReports, clearCurrentReport } = reportSlice.actions;
export default reportSlice.reducer;

