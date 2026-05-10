import axios from 'axios'
import { store } from '../store'
import { logout } from '../store/slices/authSlice'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
})

// Интерсептор запроса - добавляем токен
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Интерсептор ответа - обработка ошибок и обновление токена
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Если ошибка 401 и не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refresh')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        localStorage.setItem('access', access)
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`
        processQueue(null, access)

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        store.dispatch(logout())
        toast.error('Сессия истекла, пожалуйста, войдите снова')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Обработка других ошибок
    const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'Произошла ошибка'
    
    // Не показываем тост для 404 (кроме проверки доступности) и 409 (конфликт версий)
    if (
      error.response?.status !== 404 || 
      !originalRequest.url.includes('check-availability')
    ) {
      if (error.response?.status !== 409) {
        toast.error(message)
      }
    }

    return Promise.reject(error)
  }
)

export default api