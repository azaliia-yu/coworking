import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchSpaces = createAsyncThunk('spaces/fetchSpaces', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/spaces/', { params });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка загрузки помещений');
  }
});

export const fetchSpace = createAsyncThunk('spaces/fetchSpace', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/spaces/${id}/`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка загрузки помещения');
  }
});

export const createSpace = createAsyncThunk('spaces/createSpace',
  async (data, { rejectWithValue }) => {
    try {
      const formData = data instanceof FormData
        ? data
        : (() => {
            const fd = new FormData();
            Object.keys(data).forEach((key) => {
              if (data[key] !== null && data[key] !== undefined) {
                fd.append(key, data[key]);
              }
            });
            return fd;
          })();

      const response = await api.post('/spaces/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка создания помещения');
    }
  }
);

export const updateSpace = createAsyncThunk('spaces/updateSpace',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const formData = data instanceof FormData
        ? data
        : (() => {
            const fd = new FormData();
            Object.keys(data).forEach((key) => {
              if (data[key] !== null && data[key] !== undefined) {
                fd.append(key, data[key]);
              }
            });
            return fd;
          })();

      const response = await api.put(`/spaces/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка обновления помещения');
    }
  }
);

export const deleteSpace = createAsyncThunk('spaces/deleteSpace', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/spaces/${id}/`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка удаления помещения');
  }
});

export const fetchPlaces = createAsyncThunk('spaces/fetchPlaces', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/places/', { params });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка загрузки мест');
  }
});

export const fetchPlace = createAsyncThunk('spaces/fetchPlace', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/places/${id}/`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка загрузки места');
  }
});

export const createPlace = createAsyncThunk('spaces/createPlace', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/places/', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка создания места');
  }
});

export const updatePlace = createAsyncThunk('spaces/updatePlace', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/places/${id}/`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка обновления места');
  }
});

export const deletePlace = createAsyncThunk('spaces/deletePlace', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/places/${id}/`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка удаления места');
  }
});

const spaceSlice = createSlice({
  name: 'spaces',
  initialState: {
    spaces: [],
    currentSpace: null,
    places: [],
    currentPlace: null,
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {
    clearCurrentSpace: (state) => {
      state.currentSpace = null;
    },
    clearCurrentPlace: (state) => {
      state.currentPlace = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch spaces
      .addCase(fetchSpaces.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSpaces.fulfilled, (state, action) => {
        state.loading = false;
        state.spaces = action.payload.results || action.payload;
        state.total = action.payload.count || action.payload.length;
      })
      .addCase(fetchSpaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single space
      .addCase(fetchSpace.fulfilled, (state, action) => {
        state.currentSpace = action.payload;
      })
      // Create space
      .addCase(createSpace.fulfilled, (state, action) => {
        state.spaces.unshift(action.payload);
      })
      // Update space
      .addCase(updateSpace.fulfilled, (state, action) => {
        const index = state.spaces.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.spaces[index] = action.payload;
        }
        if (state.currentSpace?.id === action.payload.id) {
          state.currentSpace = action.payload;
        }
      })
      // Delete space
      .addCase(deleteSpace.fulfilled, (state, action) => {
        state.spaces = state.spaces.filter((s) => s.id !== action.payload);
        if (state.currentSpace?.id === action.payload) {
          state.currentSpace = null;
        }
      })
      // Fetch places
      .addCase(fetchPlaces.fulfilled, (state, action) => {
        state.places = action.payload.results || action.payload;
      })
      // ← ДОБАВИТЬ ОБРАБОТКУ fetchPlace
      .addCase(fetchPlace.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPlace.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPlace = action.payload;
      })
      .addCase(fetchPlace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create place
      .addCase(createPlace.fulfilled, (state, action) => {
        state.places.push(action.payload);
      })
      // Update place
      .addCase(updatePlace.fulfilled, (state, action) => {
        const index = state.places.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.places[index] = action.payload;
        }
        if (state.currentPlace?.id === action.payload.id) {
          state.currentPlace = action.payload;
        }
      })
      // Delete place
      .addCase(deletePlace.fulfilled, (state, action) => {
        state.places = state.places.filter((p) => p.id !== action.payload);
        if (state.currentPlace?.id === action.payload) {
          state.currentPlace = null;
        }
      });
  },
});

export const { clearCurrentSpace, clearCurrentPlace } = spaceSlice.actions;
export default spaceSlice.reducer;