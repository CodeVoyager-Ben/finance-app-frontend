import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Request interceptor - attach JWT token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Token refresh state
let isRefreshing = false
let pendingRequests = []

const onRefreshed = (newToken) => {
  pendingRequests.forEach(cb => cb(newToken))
  pendingRequests = []
}

const addPendingRequest = (cb) => {
  pendingRequests.push(cb)
  return cb
}

// Handle auth failure - logout via store and redirect to login
const handleAuthFailure = async () => {
  try {
    const { default: useAuthStore } = await import('../store/authStore')
    useAuthStore.getState().logout()
  } catch {}
}

// Response interceptor - handle auth errors with token refresh
request.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401) {
      // Already retried once - give up
      if (originalRequest._retry) {
        await handleAuthFailure()
        return Promise.reject(error)
      }

      const refreshToken = localStorage.getItem('refresh_token')

      // No refresh token or refresh endpoint itself failed
      if (!refreshToken || originalRequest.url?.includes('/auth/refresh/')) {
        await handleAuthFailure()
        return Promise.reject(error)
      }

      // Another request is already refreshing - queue up
      if (isRefreshing) {
        return new Promise((resolve) => {
          addPendingRequest((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(request(originalRequest))
          })
        })
      }

      // Try to refresh
      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post('/api/auth/refresh/', {
          refresh: refreshToken,
        })
        const newAccessToken = res.data.access
        if (newAccessToken) {
          localStorage.setItem('access_token', newAccessToken)
          if (res.data.refresh) {
            localStorage.setItem('refresh_token', res.data.refresh)
          }
          onRefreshed(newAccessToken)
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return request(originalRequest)
        }
      } catch (refreshError) {
        pendingRequests.forEach(cb => cb(null))
        pendingRequests = []
        await handleAuthFailure()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const data = error.response?.data
    let msg = '请求失败'
    if (typeof data === 'object' && data !== null) {
      const firstKey = Object.keys(data)[0]
      if (Array.isArray(data[firstKey])) {
        msg = data[firstKey][0]
      } else if (data.detail) {
        msg = data.detail
      } else if (data.message) {
        msg = data.message
      } else if (data.non_field_errors) {
        msg = data.non_field_errors[0]
      }
    }
    message.error(msg)
    return Promise.reject(error)
  }
)

export default request
