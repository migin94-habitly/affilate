import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
  id: string
  email: string
  role: string
  full_name: string
}

interface AuthState {
  token: string | null
  admin: AdminUser | null
  setAuth: (token: string, admin: AdminUser) => void
  logout: () => void
}

export const useAdminAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setAuth: (token, admin) => set({ token, admin }),
      logout: () => set({ token: null, admin: null })
    }),
    { name: 'tap-admin-auth' }
  )
)
