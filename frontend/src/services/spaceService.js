import api from './api'

export const spaceService = {
  // Помещения
  getSpaces: (params) => api.get('/spaces/', { params }),
  getSpace: (id) => api.get(`/spaces/${id}/`),
  createSpace: (data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    return api.post('/spaces/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  updateSpace: (id, data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    return api.put(`/spaces/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteSpace: (id) => api.delete(`/spaces/${id}/`),

  // Места
  getPlaces: (params) => api.get('/places/', { params }),
  getPlace: (id) => api.get(`/places/${id}/`),
  createPlace: (data) => api.post('/places/', data),
  updatePlace: (id, data) => api.put(`/places/${id}/`, data),
  deletePlace: (id) => api.delete(`/places/${id}/`),
}

export default spaceService
