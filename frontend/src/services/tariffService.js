import api from './api'

export const tariffService = {
  getTariffs: (params) => api.get('/tariffs/', { params }),
  getTariff: (id) => api.get(`/tariffs/${id}/`),
  createTariff: (data) => api.post('/tariffs/', data),
  updateTariff: (id, data) => api.put(`/tariffs/${id}/`, data),
  deleteTariff: (id) => api.delete(`/tariffs/${id}/`),
  getPlaceTariffs: (placeId) => api.get(`/places/${placeId}/tariffs/`),
}

export default tariffService
