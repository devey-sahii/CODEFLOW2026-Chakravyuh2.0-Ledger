import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Organization } from '@/types'

// ============================================================
// STATE INTERFACE
// ============================================================

interface AuthState {
  user: User | null
  organization: Organization | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
}

interface AuthActions {
  setUser: (user: User) => void
  setOrganization: (org: Organization) => void
  setTokens: (access: string, refresh: string) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
  initialize: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: AuthState = {
  user: null,
  organization: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
}

// ============================================================
// STORE
// ============================================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user: User) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setOrganization: (organization: Organization) =>
        set({ organization }),

      setTokens: (accessToken: string, refreshToken: string) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setInitialized: (isInitialized: boolean) => set({ isInitialized }),

      updateUser: (updates: Partial<User>) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, ...updates } })
      },

      logout: () => {
        set({
          ...initialState,
          isInitialized: true,
        })
        // Clear any other persisted state if needed
        if (typeof window !== 'undefined') {
          // Clear non-persisted session items
          sessionStorage.removeItem('expense-draft')
        }
      },

      initialize: async () => {
        const { isInitialized, isLoading } = get()
        if (isInitialized || isLoading) return

        set({ isLoading: true })

        try {
          const { accessToken } = get()
          if (!accessToken) {
            set({ ...initialState, isInitialized: true })
            return
          }

          // Token exists - mark as initialized
          // Actual token validation happens via API interceptors
          set({ isInitialized: true })
        } catch {
          set({ ...initialState, isInitialized: true })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'ledger-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

// ============================================================
// SELECTORS
// ============================================================

export const selectUser = (state: AuthStore) => state.user
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated
export const selectIsLoading = (state: AuthStore) => state.isLoading
export const selectUserRole = (state: AuthStore) => state.user?.role
export const selectOrganization = (state: AuthStore) => state.organization
export const selectAccessToken = (state: AuthStore) => state.accessToken

// ============================================================
// PERMISSION HELPERS
// ============================================================

export function hasPermission(role: string | undefined, requiredRoles: string[]): boolean {
  if (!role) return false
  return requiredRoles.includes(role)
}

export function isAdmin(role: string | undefined): boolean {
  return role === 'admin'
}

export function isAuditor(role: string | undefined): boolean {
  return role === 'auditor' || role === 'admin'
}

export function isFinanceManager(role: string | undefined): boolean {
  return role === 'finance_manager' || role === 'admin'
}

export function canApproveExpenses(role: string | undefined): boolean {
  return ['finance_manager', 'auditor', 'admin'].includes(role ?? '')
}

export function canViewAllExpenses(role: string | undefined): boolean {
  return ['finance_manager', 'auditor', 'admin'].includes(role ?? '')
}

export function canManageVendors(role: string | undefined): boolean {
  return ['finance_manager', 'auditor', 'admin'].includes(role ?? '')
}

export function canViewAuditLogs(role: string | undefined): boolean {
  return ['auditor', 'admin'].includes(role ?? '')
}
