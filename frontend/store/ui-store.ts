import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Notification } from '@/types'

// ============================================================
// STATE INTERFACE
// ============================================================

type Theme = 'dark' | 'light' | 'system'

type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration?: number
}

interface UIState {
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  theme: Theme
  notifications: Notification[]
  unreadCount: number
  toasts: Toast[]
  isCommandPaletteOpen: boolean
  activeModal: string | null
  activeSheet: string | null
  tableView: 'table' | 'grid' | 'list'
  pageSize: number
}

interface UIActions {
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleMobileSidebar: () => void
  setTheme: (theme: Theme) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  toggleCommandPalette: () => void
  openModal: (modalId: string) => void
  closeModal: () => void
  openSheet: (sheetId: string) => void
  closeSheet: () => void
  setTableView: (view: UIState['tableView']) => void
  setPageSize: (size: number) => void
}

type UIStore = UIState & UIActions

// ============================================================
// STORE
// ============================================================

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      theme: 'dark',
      notifications: [],
      unreadCount: 0,
      toasts: [],
      isCommandPaletteOpen: false,
      activeModal: null,
      activeSheet: null,
      tableView: 'table',
      pageSize: 20,

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (sidebarCollapsed: boolean) =>
        set({ sidebarCollapsed }),

      toggleMobileSidebar: () =>
        set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),

      // Theme
      setTheme: (theme: Theme) => set({ theme }),

      // Notifications
      addNotification: (notification: Notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        })),

      markNotificationRead: (id: string) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          if (!notification || notification.is_read) return state
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, is_read: true } : n,
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }
        }),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        })),

      removeNotification: (id: string) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.is_read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }
        }),

      clearNotifications: () =>
        set({ notifications: [], unreadCount: 0 }),

      // Toasts
      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).slice(2)
        const newToast: Toast = { ...toast, id }
        set((state) => ({ toasts: [...state.toasts, newToast] }))

        // Auto-remove after duration
        const duration = toast.duration ?? 5000
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, duration)
        }
      },

      removeToast: (id: string) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      // Command palette
      toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

      // Modals
      openModal: (activeModal: string) => set({ activeModal }),
      closeModal: () => set({ activeModal: null }),

      // Sheets
      openSheet: (activeSheet: string) => set({ activeSheet }),
      closeSheet: () => set({ activeSheet: null }),

      // Table preferences
      setTableView: (tableView: UIState['tableView']) => set({ tableView }),
      setPageSize: (pageSize: number) => set({ pageSize }),
    }),
    {
      name: 'ledger-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        tableView: state.tableView,
        pageSize: state.pageSize,
      }),
    },
  ),
)

// ============================================================
// SELECTORS
// ============================================================

export const selectSidebarCollapsed = (state: UIStore) => state.sidebarCollapsed
export const selectTheme = (state: UIStore) => state.theme
export const selectNotifications = (state: UIStore) => state.notifications
export const selectUnreadCount = (state: UIStore) => state.unreadCount
export const selectToasts = (state: UIStore) => state.toasts
export const selectCommandPaletteOpen = (state: UIStore) => state.isCommandPaletteOpen
export const selectActiveModal = (state: UIStore) => state.activeModal
export const selectActiveSheet = (state: UIStore) => state.activeSheet
