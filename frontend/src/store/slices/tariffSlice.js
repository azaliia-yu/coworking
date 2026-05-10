import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchTariffs = createAsyncThunk('tariffs/fetchTariffs', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/tariffs/', { params })
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка загрузки тарифов')
  }
})

export const createTariff = createAsyncThunk('tariffs/createTariff', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/tariffs/', data)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка создания тарифа')
  }
})

export const updateTariff = createAsyncThunk('tariffs/updateTariff', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/tariffs/${id}/`, data)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка обновления тарифа')
  }
})

export const deleteTariff = createAsyncThunk('tariffs/deleteTariff', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/tariffs/${id}/`)
    return id
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка удаления тарифа')
  }
})

const tariffSlice = createSlice({
  name: 'tariffs',
  initialState: {
    tariffs: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTariffs.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTariffs.fulfilled, (state, action) => {
        state.loading = false
        state.tariffs = action.payload.results || action.payload
      })
      .addCase(fetchTariffs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createTariff.fulfilled, (state, action) => {
        state.tariffs.unshift(action.payload)
      })
      .addCase(updateTariff.fulfilled, (state, action) => {
        const index = state.tariffs.findIndex((t) => t.id === action.payload.id)
        if (index !== -1) {
          state.tariffs[index] = action.payload
        }
      })
      .addCase(deleteTariff.fulfilled, (state, action) => {
        state.tariffs = state.tariffs.filter((t) => t.id !== action.payload)
      })
  },
})

export default tariffSlice.reducer
