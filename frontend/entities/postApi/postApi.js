import { baseApi } from '@utils/baseApi'
import { tokenStorage } from '@utils/tokenStorage'

export const postApi = {
  getAll: (filters = {}) => {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.hashtag) params.hashtag = filters.hashtag
    return baseApi.get('/posts', { params })
  },

  getById: (id) => baseApi.get(`/posts/${id}`),

  create: (data) => baseApi.post('/posts', data),

  getMyPosts: () => baseApi.get('/posts/me/my-posts'),

  update: (id, data) => baseApi.put(`/posts/${id}`, data),

  delete: (id) => baseApi.delete(`/posts/${id}`),

  getPhotos: (postId) => baseApi.get(`/posts/${postId}/photos`),

  uploadPhotos: async (postId, formData) => {
    // Используем нативный fetch для загрузки файлов в React Native
    const token = await tokenStorage.getAccessToken()
    const baseURL = process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
    const url = `${baseURL}/posts/${postId}/photos`
    
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

  deletePhoto: (postId, photoId) =>
    baseApi.delete(`/posts/${postId}/photos/${photoId}`),

  getComments: (postId) => baseApi.get(`/posts/${postId}/comments`),

  createComment: (postId, text) =>
    baseApi.post(`/posts/${postId}/comments`, { text }),

  deleteComment: (commentId) => baseApi.delete(`/comments/${commentId}`),

  editComment: (commentId, text) =>
    baseApi.put(`/comments/${commentId}`, { text }),

  addFavorite: (postId) => baseApi.post(`/posts/${postId}/favorite`),

  removeFavorite: (postId) => baseApi.delete(`/posts/${postId}/favorite`),

  getFavorites: () => baseApi.get('/me/favorites'),
}
