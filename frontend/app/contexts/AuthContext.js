import React, { createContext, useEffect, useState } from 'react'
import { auth } from '@utils/auth'

export const AuthContext = createContext({
  isLoggedIn: false,
  loading: true,
  login: async () => {},
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
        const logged = await auth.isLoggedIn()
        setState((prev) => ({
          ...prev,
          isLoggedIn: Boolean(logged),
          loading: false,
        }))
      } catch (e) {
        console.error('Auth error:', e)
        setState((prev) => ({
          ...prev,
          isLoggedIn: false,
          loading: false,
        }))
      }
    }

    init()
  }, [])

  const login = async (email, password) => {
    await auth.login(email, password)
    setState((prev) => ({
      ...prev,
      isLoggedIn: true,
    }))
  }

  const logout = async () => {
    await auth.logout()
    setState((prev) => ({
      ...prev,
      isLoggedIn: false,
    }))
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: state.isLoggedIn,
        loading: state.loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
