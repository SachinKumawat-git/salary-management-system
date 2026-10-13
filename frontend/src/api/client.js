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

export const apiClient = axios.create({
  baseURL: '',
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
        const refreshResponse = await axios.post(
          '/api/auth/refresh/',
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

    return Promise.reject(error)
  }
)
