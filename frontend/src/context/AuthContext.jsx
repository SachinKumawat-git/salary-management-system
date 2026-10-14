import React, { createContext, useContext, useEffect, useState } from 'react'
import { loginApi, logoutApi, refreshTokenApi } from '../api/auth'
import { UnauthorizedModal } from '../components/ui/UnauthorizedModal'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessTokenState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [unauthorizedModal, setUnauthorizedModal] = useState(null)

  const checkAuth = async () => {
    try {
      const data = await refreshTokenApi()
      if (data.access) {
        if (data.user) {
          const isAuthorized = Boolean(data.user.is_hr_manager || data.user.is_admin)
          if (!isAuthorized) {
            try {
              await logoutApi()
            } catch {
              // ignore
            }
            setUser(null)
            setAccessTokenState(null)
            setUnauthorizedModal({
              isOpen: true,
              username: data.user.username,
              role: data.user.role || 'Employee',
              message:
                'You are not authorized for this portal. Access is restricted to HR Managers and Administrators.',
            })
            return
          }
          setUser(data.user)
        } else {
          // If refresh only returns access token, store minimal logged in indicator
          setUser((prev) => prev || { is_hr_manager: true, username: 'HR Manager' })
        }
        setAccessTokenState(data.access)
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

    const handleForbidden = (event) => {
      logoutApi().catch(() => {})
      setUser((prevUser) => {
        setUnauthorizedModal({
          isOpen: true,
          username: prevUser?.username || 'Current User',
          role: prevUser?.role || 'Employee',
          message:
            event.detail?.message ||
            'You are not authorized for this portal. Access is restricted to HR Managers and Administrators.',
        })
        return null
      })
      setAccessTokenState(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    window.addEventListener('auth:forbidden', handleForbidden)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
      window.removeEventListener('auth:forbidden', handleForbidden)
    }
  }, [])

  const login = async (username, password) => {
    const data = await loginApi(username, password)
    const isAuthorized = Boolean(data.user?.is_hr_manager || data.user?.is_admin)

    if (!isAuthorized) {
      try {
        await logoutApi()
      } catch {
        // ignore
      }
      setUser(null)
      setAccessTokenState(null)
      setUnauthorizedModal({
        isOpen: true,
        username: data.user?.username || username,
        role: data.user?.role || 'Employee',
        message:
          'You are not authorized for this portal. Access is restricted to HR Managers and Administrators.',
      })
      const err = new Error('You are not authorized for this portal.')
      err.code = 'UNAUTHORIZED_ROLE'
      err.user = data.user
      throw err
    }

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

  const handleCloseModal = () => {
    setUnauthorizedModal(null)
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      try {
        window.location.assign('/login')
      } catch {
        // ignore in test environments
      }
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
        unauthorizedModal,
        setUnauthorizedModal,
      }}
    >
      {children}
      <UnauthorizedModal
        isOpen={Boolean(unauthorizedModal?.isOpen)}
        onClose={handleCloseModal}
        username={unauthorizedModal?.username}
        role={unauthorizedModal?.role}
        message={unauthorizedModal?.message}
      />
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
