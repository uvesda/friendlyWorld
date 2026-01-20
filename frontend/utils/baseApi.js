import axios from 'axios'
import { tokenStorage } from './tokenStorage'

export const baseApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000',
  timeout: 30000, // Увеличиваем таймаут до 30 секунд
})

const refreshApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000',
  timeout: 5000,
})

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

baseApi.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Логирование для запросов с FormData (загрузка файлов)
  if (config.url?.includes('/avatar') || config.url?.includes('/photos')) {
    console.log('=== FRONTEND: Request Interceptor ===')
    console.log('URL:', config.url)
    console.log('Method:', config.method?.toUpperCase())
    console.log('Has Authorization:', !!config.headers.Authorization)
    console.log('Content-Type:', config.headers['Content-Type'])
    console.log('Is FormData:', config.data instanceof FormData)
    console.log('Data type:', typeof config.data)
    console.log('Data constructor:', config.data?.constructor?.name)
    if (config.data instanceof FormData) {
      console.log('FormData detected - multipart/form-data request')
    }
    console.log('====================================')
  }
  
  return config
})

baseApi.interceptors.response.use(
  (response) => {
    // Логирование успешных ответов для загрузки файлов
    if (response.config?.url?.includes('/avatar') || response.config?.url?.includes('/photos')) {
      console.log('=== FRONTEND: Response Success ===')
      console.log('URL:', response.config.url)
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      console.log('=================================')
    }
    return response.data
  },
  async (error) => {
    // Логирование ошибок для загрузки файлов
    if (error.config?.url?.includes('/avatar') || error.config?.url?.includes('/photos')) {
      console.error('=== FRONTEND: Response Error ===')
      console.error('URL:', error.config?.url)
      console.error('Status:', error.response?.status)
      console.error('Status Text:', error.response?.statusText)
      console.error('Error Message:', error.message)
      console.error('Response Data:', error.response?.data)
      console.error('Response Headers:', error.response?.headers)
      console.error('================================')
    }
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/logout')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            return baseApi(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = await tokenStorage.getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await refreshApi.post('/auth/refresh', {
          refreshToken,
        })
        const { accessToken } = response.data

        await tokenStorage.setTokens(accessToken, refreshToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        processQueue(null, null)

        return baseApi(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        await tokenStorage.clear()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
