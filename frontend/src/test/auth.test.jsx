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
})
