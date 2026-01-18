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
  
  // Логируем запросы с FormData для отладки
  if (config.data instanceof FormData) {
    console.log('📤 FormData request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      hasAuth: !!token,
      timeout: config.timeout,
    })
  }
  
  return config
})

baseApi.interceptors.response.use(
  (response) => response.data,
  async (error) => {
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
