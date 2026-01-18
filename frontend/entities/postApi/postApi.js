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
    
    console.log('📤 postApi.uploadPhotos called (fetch):', {
      postId,
      url,
      baseURL,
      formDataType: formData.constructor.name,
      hasToken: !!token,
    })
    
    // Проверяем, что URL валидный
    if (!url || !url.startsWith('http')) {
      const error = new Error(`Invalid URL: ${url}`)
      console.error('❌ Invalid URL:', url)
      throw error
    }
    
    try {
      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      // НЕ указываем Content-Type - React Native установит автоматически с boundary
      
      console.log('📤 Sending fetch request...')
      console.log('Request details:', {
        method: 'POST',
        url,
        hasHeaders: Object.keys(headers).length > 0,
        hasBody: !!formData,
      })
      
      // Добавляем таймаут для fetch
      const controller = new AbortController()
      let timeoutId
      if (typeof setTimeout !== 'undefined') {
        timeoutId = setTimeout(() => {
          console.error('⏱️ Request timeout after 60 seconds')
          controller.abort()
        }, 60000) // 60 секунд
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      })
      
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      console.log('📥 Fetch response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })
      
      if (!response.ok) {
        let errorData = {}
        try {
          errorData = await response.json()
        } catch (e) {
          const text = await response.text()
          console.error('Failed to parse error response as JSON:', text)
          errorData = { message: text }
        }
        console.error('❌ Fetch error response:', errorData)
        const error = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`)
        error.response = {
          status: response.status,
          data: errorData,
        }
        throw error
      }
      
      const data = await response.json()
      console.log('✅ Fetch upload successful:', data)
      return { data }
    } catch (error) {
      if (typeof clearTimeout !== 'undefined' && timeoutId) {
        clearTimeout(timeoutId)
      }
      console.error('❌ Fetch upload error:', error)
      console.error('Error message:', error.message)
      console.error('Error name:', error.name)
      if (error.stack) {
        console.error('Error stack:', error.stack.substring(0, 500))
      }
      
      // Если это ошибка сети, добавляем больше информации
      if (error.name === 'TypeError' && error.message && (
        error.message.includes('Network request failed') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      )) {
        console.error('🔴 Network request failed - возможные причины:')
        console.error('1. Неправильный URL:', url)
        console.error('2. Сервер недоступен с устройства/эмулятора')
        console.error('3. CORS блокирует запрос')
        console.error('4. Проблема с FormData в React Native')
        console.error('5. Проверьте EXPO_PUBLIC_IP_CONFIG:', baseURL)
        console.error('6. Убедитесь, что сервер доступен:', `${baseURL}/`)
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
