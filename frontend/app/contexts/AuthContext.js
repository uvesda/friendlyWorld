import { createContext, useEffect, useState } from 'react'
import { auth } from '@utils/auth'
import { tokenStorage } from '@utils/tokenStorage'

export const AuthContext = createContext({
  isLoggedIn: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
})

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    isLoggedIn: false,
    loading: true,
  })

  useEffect(() => {
    const init = async () => {
      try {
        const accessToken = await tokenStorage.getAccessToken()
        if (accessToken) {
          const { user } = await auth.me()
          setState({ isLoggedIn: true, loading: false, user })
        } else {
          const refreshToken = await tokenStorage.getRefreshToken()
          if (refreshToken) {
            try {
              await auth.refresh(refreshToken)
              const user = await auth.me()
              setState({ isLoggedIn: true, loading: false, user })
            } catch {
              await tokenStorage.clear()
              setState({ isLoggedIn: false, loading: false })
            }
          } else {
            setState({ isLoggedIn: false, loading: false })
          }
        }
      } catch (e) {
        setState({ isLoggedIn: false, loading: false })
        throw e
      }
    }
    init()
  }, [])

  const login = async (email, password) => {
    try {
      await auth.login(email, password)
      setState((prev) => ({ ...prev, isLoggedIn: true }))
    } catch (e) {
      throw e
    }
  }

  const register = async (name, email, password) => {
    try {
      await auth.register(name, email, password)
      setState((prev) => ({ ...prev, isLoggedIn: true }))
    } catch (e) {
      throw e
    }
  }

  const logout = async () => {
    try {
      await auth.logout()
      setState({ isLoggedIn: false, loading: false })
    } catch (e) {
      setState({ isLoggedIn: false, loading: false })
      throw e
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: state.isLoggedIn,
        loading: state.loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
