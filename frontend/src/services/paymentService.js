import api from './api'

export const paymentService = {
  getPayments: (params) => api.get('/payments/', { params }),
  getPayment: (id) => api.get(`/payments/${id}/`),
  createPayment: (data) => api.post('/payments/create_payment/', data),
}

export default paymentService
