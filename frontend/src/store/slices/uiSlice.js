import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    modalOpen: false,
    modalContent: null,
    loadingStates: {},
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    openModal: (state, action) => {
      state.modalOpen = true
      state.modalContent = action.payload
    },
    closeModal: (state) => {
      state.modalOpen = false
      state.modalContent = null
    },
    setLoading: (state, action) => {
      const { key, loading } = action.payload
      state.loadingStates[key] = loading
    },
  },
})

export const { toggleSidebar, setSidebarOpen, openModal, closeModal, setLoading } = uiSlice.actions
export default uiSlice.reducer
