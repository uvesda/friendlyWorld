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
    // Это работает более надежно, чем axios с FormData
    const token = await tokenStorage.getAccessToken()
    const baseURL = process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
    const url = `${baseURL}/posts/${postId}/photos`
    
    console.log('📤 postApi.uploadPhotos called (fetch):', {
      postId,
      url,
      formDataType: formData.constructor.name,
      hasToken: !!token,
    })
    
    try {
      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      // Не указываем Content-Type - браузер/React Native установит автоматически с boundary
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })
      
      console.log('📥 Fetch response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Fetch error response:', errorData)
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`)
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
      console.error('❌ Fetch upload error:', error)
      console.error('Error message:', error.message)
      console.error('Error name:', error.name)
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
