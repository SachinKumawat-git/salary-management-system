import axios from 'axios'

let memoryAccessToken = null
let isRefreshing = false
let failedQueue = []

export const setAccessToken = (token) => {
  memoryAccessToken = token
}

export const getAccessToken = () => {
  return memoryAccessToken
}

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const defaultProductionApiUrl = 'https://salary-management-backend-v9cs.onrender.com'
const fallbackUrl = import.meta.env.DEV ? '' : defaultProductionApiUrl
const rawBaseUrl = (import.meta.env.VITE_API_URL || fallbackUrl).trim()
const normalizedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

export const apiClient = axios.create({
  baseURL: normalizedBaseUrl || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Access Token to requests
apiClient.interceptors.request.use(
  (config) => {
    if (memoryAccessToken) {
      config.headers.Authorization = `Bearer ${memoryAccessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercept 401s and attempt silent token refresh via cookie
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(error)
    }

    // Do not attempt refresh on auth endpoints to avoid infinite loops
    if (
      originalRequest.url?.includes('/api/auth/login/') ||
      originalRequest.url?.includes('/api/auth/refresh/')
    ) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshUrl = normalizedBaseUrl
          ? `${normalizedBaseUrl}/api/auth/refresh/`
          : '/api/auth/refresh/'
        const refreshResponse = await axios.post(
          refreshUrl,
          {},
          { withCredentials: true }
        )
        const newAccess = refreshResponse.data.access
        setAccessToken(newAccess)
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return apiClient(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        setAccessToken(null)
        window.dispatchEvent(new Event('auth:unauthorized'))
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 403) {
      window.dispatchEvent(
        new CustomEvent('auth:forbidden', {
          detail: {
            message: error.response?.data?.detail || 'You are not authorized for this portal.',
          },
        })
      )
    }

    return Promise.reject(error)
  }
)

