import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import * as authContext from '../context/AuthContext'

describe('ProtectedRoute', () => {
  it('redirects to /login when user is not authenticated', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Mock</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page Mock')).toBeInTheDocument()
    expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Mock</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Secret Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Login Page Mock')).not.toBeInTheDocument()
  })
})
