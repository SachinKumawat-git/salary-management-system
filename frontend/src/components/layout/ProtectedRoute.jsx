import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading, setUnauthorizedModal, logout } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <LoadingSpinner message="Authenticating session..." size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user && !user.is_hr_manager && !user.is_admin) {
    logout()
    if (setUnauthorizedModal) {
      setUnauthorizedModal({
        isOpen: true,
        username: user.username,
        role: user.role || 'Employee',
        message: 'You are not authorized for this portal. Access is restricted to HR Managers and Administrators.',
      })
    }
    return <Navigate to="/login" replace />
  }

  return children
}
