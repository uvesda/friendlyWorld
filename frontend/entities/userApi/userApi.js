import { baseApi } from '@utils/baseApi'
import { tokenStorage } from '@utils/tokenStorage'

export const userApi = {
  getProfile: () => baseApi.get('/me'),

  getUserById: (userId) => baseApi.get(`/user/${userId}`),

  updateProfile: (data) => baseApi.put('/me', data),

  updateAvatar: async (formData) => {
    // Используем нативный fetch для загрузки файлов в React Native
    // Точно так же, как в postApi.uploadPhotos
    const token = await tokenStorage.getAccessToken()
    const baseURL = process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
    const url = `${baseURL}/me/avatar`
    
    // Проверяем, что URL валидный
    if (!url || !url.startsWith('http')) {
      const error = new Error(`Invalid URL: ${url}`)
      throw error
    }
    
    let timeoutId = null
    
    try {
      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      // НЕ указываем Content-Type - React Native установит автоматически с boundary
      
      // Добавляем таймаут для fetch
      // eslint-disable-next-line no-undef
      const controller = new AbortController()
      if (typeof setTimeout !== 'undefined') {
        timeoutId = setTimeout(() => {
          controller.abort()
        }, 60000) // 60 секунд
      }
      
      // eslint-disable-next-line no-undef
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      })
      
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      if (!response.ok) {
        let errorData = {}
        try {
          errorData = await response.json()
        } catch {
          const text = await response.text()
          errorData = { message: text }
        }
        const error = new Error(errorData.message || errorData.error || errorData.details || `HTTP error! status: ${response.status}`)
        error.response = {
          status: response.status,
          data: errorData,
        }
        throw error
      }
      
      const data = await response.json()
      return { data }
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      throw error
    }
  },

  deleteAvatar: () => baseApi.delete('/me/avatar'),

  changePassword: (oldPassword, newPassword) =>
    baseApi.put('/me/password', { oldPassword, newPassword }),
}
