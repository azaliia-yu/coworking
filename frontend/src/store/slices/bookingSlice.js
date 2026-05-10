import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки бронирований')
    }
  }
)

export const fetchBooking = createAsyncThunk('bookings/fetchBooking', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/bookings/${id}/`)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка загрузки бронирования')
  }
})

export const createBooking = createAsyncThunk('bookings/createBooking', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/bookings/', data)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка создания бронирования')
  }
})

export const cancelBooking = createAsyncThunk('bookings/cancelBooking', async (id, { rejectWithValue }) => {
  try {
    const response = await api.post(`/bookings/${id}/cancel/`)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка отмены бронирования')
  }
})

export const checkAvailability = createAsyncThunk(
  'bookings/checkAvailability',
  async ({ place_id, start, end }, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/check_availability/', {
        params: { place_id, start, end },
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка проверки доступности')
    }
  }
)

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    bookings: [],
    currentBooking: null,
    loading: false,
    error: null,
    total: 0,
    availability: null,
  },
  reducers: {
    clearCurrentBooking: (state) => {
      state.currentBooking = null
    },
    clearAvailability: (state) => {
      state.availability = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false
        state.bookings = action.payload.results || action.payload
        state.total = action.payload.count || action.payload.length
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch single booking
      .addCase(fetchBooking.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchBooking.fulfilled, (state, action) => {
        state.loading = false
        state.currentBooking = action.payload
      })
      .addCase(fetchBooking.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false
        state.bookings.unshift(action.payload)
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Cancel booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex((b) => b.id === action.meta.arg)
        if (index !== -1) {
          state.bookings[index].status = 'cancelled'
        }
        if (state.currentBooking?.id === action.meta.arg) {
          state.currentBooking.status = 'cancelled'
        }
      })
      // Check availability
      .addCase(checkAvailability.fulfilled, (state, action) => {
        state.availability = action.payload
      })
  },
})
 export const fetchRecentBookings = createAsyncThunk(
  'bookings/fetchRecentBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/', { params: { limit: 10, ordering: '-created_at' } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки последних бронирований');
    }
  }
);

export const { clearCurrentBooking, clearAvailability } = bookingSlice.actions
export default bookingSlice.reducer
