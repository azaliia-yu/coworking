import api from './api'

export const bookingService = {
  getBookings: (params) => api.get('/bookings/', { params }),
  getBooking: (id) => api.get(`/bookings/${id}/`),
  createBooking: (data) => api.post('/bookings/', data),
  cancelBooking: (id) => api.post(`/bookings/${id}/cancel/`),
  checkAvailability: (place_id, start, end) =>
    api.get('/bookings/check-availability/', { params: { place_id, start, end } }),
}

export default bookingService
