import axios from 'axios'

export const baseApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000',
  timeout: 5000,
})

// Интерцептор пока пустой
baseApi.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
)
