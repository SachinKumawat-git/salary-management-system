import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { AuthProvider } from '../context/AuthContext'
import * as authApi from '../api/auth'

vi.mock('../api/auth', () => ({
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
  refreshTokenApi: vi.fn().mockRejectedValue(new Error('No token')),
}))

describe('LoginPage', () => {
  it('renders login form with inputs and action button', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Salary Management Portal')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('Enter HR username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('autofills demo credentials when demo button is clicked', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Auto-fill Demo HR Credentials/i)).toBeInTheDocument()
    })

    const demoButton = screen.getByText(/Auto-fill Demo HR Credentials/i)
    fireEvent.click(demoButton)

    const userInput = screen.getByPlaceholderText('Enter HR username')
    const passInput = screen.getByPlaceholderText('••••••••••••')

    expect(userInput.value).toBe('hrmanager')
    expect(passInput.value).toBe('hrpassword123')
  })

  it('displays error message on invalid credentials', async () => {
    authApi.loginApi.mockRejectedValueOnce({
      response: { status: 401, data: { detail: 'Invalid credentials.' } },
    })

    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    )

    const userInput = screen.getByPlaceholderText('Enter HR username')
    const passInput = screen.getByPlaceholderText('••••••••••••')
    const submitBtn = screen.getByRole('button', { name: /Sign In/i })

    fireEvent.change(userInput, { target: { value: 'wronguser' } })
    fireEvent.change(passInput, { target: { value: 'wrongpass' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('shows unauthorized modal when non-HR role user attempts to log in', async () => {
    authApi.loginApi.mockResolvedValueOnce({
      access: 'fake-jwt-token',
      user: {
        id: 99,
        username: 'regular_employee',
        email: 'employee@company.com',
        is_hr_manager: false,
        is_admin: false,
        role: 'Employee',
      },
    })

    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    )

    const userInput = screen.getByPlaceholderText('Enter HR username')
    const passInput = screen.getByPlaceholderText('••••••••••••')
    const submitBtn = screen.getByRole('button', { name: /Sign In/i })

    fireEvent.change(userInput, { target: { value: 'regular_employee' } })
    fireEvent.change(passInput, { target: { value: 'mypassword' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Unauthorized Portal Access')).toBeInTheDocument()
      expect(screen.getByText('regular_employee')).toBeInTheDocument()
      expect(screen.getByText('Session Terminated')).toBeInTheDocument()
    })

    // Verify logout was triggered
    expect(authApi.logoutApi).toHaveBeenCalled()

    // Dismiss modal
    const closeBtn = screen.getByRole('button', { name: /Acknowledge & Return to Sign In/i })
    fireEvent.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByText('Unauthorized Portal Access')).not.toBeInTheDocument()
    })
  })
})

