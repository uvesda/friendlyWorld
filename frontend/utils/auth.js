import { authApi } from '@entities/authApi/authApi'
import { tokenStorage } from './tokenStorage'

export const auth = {
  async login(email, password) {
    const response = await authApi.login(email, password)

    const { accessToken, refreshToken } = response.data
    await tokenStorage.setTokens(accessToken, refreshToken)
    return true
  },

  async isLoggedIn() {
    const token = await tokenStorage.getAccessToken()
    return Boolean(token)
  },

  async logout() {
    await tokenStorage.clear()
  },
}
