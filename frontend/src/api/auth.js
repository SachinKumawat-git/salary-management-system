import { apiClient, setAccessToken } from './client'

export const loginApi = async (username, password) => {
  const response = await apiClient.post('/api/auth/login/', { username, password })
  if (response.data.access) {
    setAccessToken(response.data.access)
  }
  return response.data
}

export const logoutApi = async () => {
  try {
    await apiClient.post('/api/auth/logout/')
  } finally {
    setAccessToken(null)
  }
}

export const refreshTokenApi = async () => {
  const response = await apiClient.post('/api/auth/refresh/')
  if (response.data.access) {
    setAccessToken(response.data.access)
  }
  return response.data
}
