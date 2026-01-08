import axios from 'axios'
import { tokenStorage } from './tokenStorage'

export const baseApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000',
  timeout: 5000,
})

baseApi.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

baseApi.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    return Promise.reject(error)
  }
)
