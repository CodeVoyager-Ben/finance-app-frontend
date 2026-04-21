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

// Response interceptor - handle auth errors
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      if (window.location.pathname.includes('/login')) {
        message.error(error.response?.data?.detail || '用户名或密码错误')
      } else {
        window.location.href = '/login'
      }
    } else {
      const data = error.response?.data
      let msg = '请求失败'
      if (typeof data === 'object' && data !== null) {
        // DRF field errors: {"field": ["msg1", "msg2"]}
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
    }
    return Promise.reject(error)
  }
)

export default request
