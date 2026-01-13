import { baseApi } from '@utils/baseApi'

export const userApi = {
  getProfile: () => baseApi.get('/me'),

  updateProfile: (data) => baseApi.put('/me', data),

  updateAvatar: (formData) =>
    baseApi.post('/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}
