import { create } from 'zustand'
import { getProfile } from '../api/auth'

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: true,

  setUser: (user) => set({ user, isAuthenticated: true }),

  fetchUser: async () => {
    set({ loading: true })
    try {
      const data = await getProfile()
      set({ user: data, isAuthenticated: true, loading: false })
    } catch {
      set({ user: null, isAuthenticated: false, loading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false, loading: false })
  },
}))

export default useAuthStore
