import request from './request'

export const login = (data) => request.post('/auth/login/', data)
export const register = (data) => request.post('/auth/register/', data)
export const getProfile = () => request.get('/auth/profile/')
export const updateProfile = (data) => request.patch('/auth/profile/', data)
export const changePassword = (data) => request.put('/auth/change-password/', data)
