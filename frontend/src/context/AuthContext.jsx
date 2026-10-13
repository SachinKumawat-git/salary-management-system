import React, { createContext, useContext, useEffect, useState } from 'react'
import { loginApi, logoutApi, refreshTokenApi } from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessTokenState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const data = await refreshTokenApi()
      if (data.access) {
        setAccessTokenState(data.access)
        // Set basic user info if returned or keep existing
        if (data.user) {
          setUser(data.user)
        } else {
          // If refresh only returns access token, store minimal logged in indicator
          setUser((prev) => prev || { is_hr_manager: true, username: 'HR Manager' })
        }
      }
    } catch {
      setUser(null)
      setAccessTokenState(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()

    const handleUnauthorized = () => {
      setUser(null)
      setAccessTokenState(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const login = async (username, password) => {
    const data = await loginApi(username, password)
    setAccessTokenState(data.access)
    if (data.user) {
      setUser(data.user)
    }
    return data
  }

  const logout = async () => {
    try {
      await logoutApi()
    } finally {
      setUser(null)
      setAccessTokenState(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
