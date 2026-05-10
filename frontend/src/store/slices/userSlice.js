import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка загрузки пользователей');
  }
});

export const blockUser = createAsyncThunk('users/blockUser', async (id, { rejectWithValue }) => {
  try {
    const response = await api.post(`/auth/users/${id}/block/`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка блокировки пользователя');
  }
});

export const unblockUser = createAsyncThunk('users/unblockUser', async (id, { rejectWithValue }) => {
  try {
    const response = await api.post(`/auth/users/${id}/unblock/`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка разблокировки пользователя');
  }
});

const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload.results || action.payload
        state.total = action.payload.count || action.payload.length
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.meta.arg)
        if (index !== -1) {
          state.users[index].is_active = false
        }
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.meta.arg)
        if (index !== -1) {
          state.users[index].is_active = true
        }
      })
  },
})

export default userSlice.reducer
