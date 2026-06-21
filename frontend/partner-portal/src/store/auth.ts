import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Partner } from '@/types'

interface AuthState {
  token: string | null
  partner: Partner | null
  setAuth: (token: string, partner: Partner) => void
  updatePartner: (partner: Partial<Partner>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      partner: null,
      setAuth: (token, partner) => set({ token, partner }),
      updatePartner: (update) =>
        set((state) => ({
          partner: state.partner ? { ...state.partner, ...update } : null
        })),
      logout: () => set({ token: null, partner: null })
    }),
    { name: 'tap-auth' }
  )
)
