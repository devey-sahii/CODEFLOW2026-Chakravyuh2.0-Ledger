import { get, post, put, patch, del, getPaginated, uploadFile } from './client'
import type {
  User,
  Organization,
  ExpenseClaim,
  ExpenseClaimForm,
  Receipt,
  Vendor,
  FraudReport,
  AuditLog,
  DashboardStats,
  SpendingAnalytics,
  Notification,
  ComplianceReport,
  GSTValidation,
  LoginForm,
  LoginResponse,
  AuthTokens,
  ExpenseFilters,
  PaginationConfig,
  SortConfig,
} from '@/types'
import type { PaginatedAPIResponse } from './client'

// ============================================================
// AUTH ENDPOINTS
// ============================================================

export const authAPI = {
  login: (data: LoginForm) =>
    post<LoginResponse>('/auth/login', data),

  logout: () =>
    post<void>('/auth/logout'),

  refresh: (refreshToken: string) =>
    post<AuthTokens>('/auth/refresh', { refresh_token: refreshToken }),

  register: (data: {
    full_name: string
    email: string
    password: string
    organization_name: string
    domain: string
  }) => post<LoginResponse>('/auth/register', data),

  forgotPassword: (email: string) =>
    post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    post<void>('/auth/reset-password', { token, password }),

  verifyEmail: (token: string) =>
    post<void>('/auth/verify-email', { token }),

  getProfile: () =>
    get<User>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    patch<User>('/auth/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    post<void>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
}

// ============================================================
// DASHBOARD ENDPOINTS
// ============================================================

export const dashboardAPI = {
  getStats: () =>
    get<DashboardStats>('/dashboard/stats'),

  getSpendingAnalytics: (params?: { period?: string; department?: string }) =>
    get<SpendingAnalytics>('/dashboard/analytics', { params }),

  getRecentActivity: (limit = 10) =>
    get<AuditLog[]>('/dashboard/recent-activity', { params: { limit } }),

  getFraudAlerts: (limit = 5) =>
    get<FraudReport[]>('/dashboard/fraud-alerts', { params: { limit } }),
}

// ============================================================
// EXPENSE ENDPOINTS
// ============================================================

export const expenseAPI = {
  list: (
    filters?: ExpenseFilters,
    pagination?: PaginationConfig,
    sort?: SortConfig,
  ): Promise<PaginatedAPIResponse<ExpenseClaim>> =>
    getPaginated<ExpenseClaim>('/expenses', {
      params: {
        ...filters,
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        sort_by: sort?.field,
        sort_order: sort?.direction,
      },
    }),

  getById: (id: string) =>
    get<ExpenseClaim>(`/expenses/${id}`),

  create: (data: ExpenseClaimForm) =>
    post<ExpenseClaim>('/expenses', data),

  update: (id: string, data: Partial<ExpenseClaimForm>) =>
    put<ExpenseClaim>(`/expenses/${id}`, data),

  delete: (id: string) =>
    del<void>(`/expenses/${id}`),

  approve: (id: string, comments?: string) =>
    post<ExpenseClaim>(`/expenses/${id}/approve`, { comments }),

  reject: (id: string, reason: string) =>
    post<ExpenseClaim>(`/expenses/${id}/reject`, { reason }),

  flag: (id: string, reason: string) =>
    post<ExpenseClaim>(`/expenses/${id}/flag`, { reason }),

  submitForReview: (id: string) =>
    post<ExpenseClaim>(`/expenses/${id}/submit`),

  getReceipts: (expenseId: string) =>
    get<Receipt[]>(`/expenses/${expenseId}/receipts`),

  uploadReceipt: (
    expenseId: string,
    file: File,
    onProgress?: (percentage: number) => void,
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    return uploadFile<Receipt>(
      `/expenses/${expenseId}/receipts`,
      formData,
      onProgress,
    )
  },

  deleteReceipt: (expenseId: string, receiptId: string) =>
    del<void>(`/expenses/${expenseId}/receipts/${receiptId}`),

  exportCSV: (filters?: ExpenseFilters) =>
    get<Blob>('/expenses/export/csv', {
      params: filters,
      responseType: 'blob',
    }),

  exportPDF: (id: string) =>
    get<Blob>(`/expenses/${id}/export/pdf`, {
      responseType: 'blob',
    }),

  bulkApprove: (ids: string[]) =>
    post<{ approved: number; failed: number }>('/expenses/bulk/approve', { ids }),

  bulkReject: (ids: string[], reason: string) =>
    post<{ rejected: number; failed: number }>('/expenses/bulk/reject', { ids, reason }),

  getMyExpenses: (pagination?: PaginationConfig): Promise<PaginatedAPIResponse<ExpenseClaim>> =>
    getPaginated<ExpenseClaim>('/expenses/me', {
      params: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
      },
    }),
}

// ============================================================
// RECEIPT ENDPOINTS
// ============================================================

export const receiptAPI = {
  getById: (id: string) =>
    get<Receipt>(`/receipts/${id}`),

  reprocess: (id: string) =>
    post<Receipt>(`/receipts/${id}/reprocess`),

  getAnalysis: (id: string) =>
    get<Receipt['ai_analysis']>(`/receipts/${id}/analysis`),

  validateGSTIN: (gstin: string) =>
    post<GSTValidation>('/receipts/validate-gstin', { gstin }),
}

// ============================================================
// FRAUD ENDPOINTS
// ============================================================

export const fraudAPI = {
  list: (pagination?: PaginationConfig): Promise<PaginatedAPIResponse<FraudReport>> =>
    getPaginated<FraudReport>('/fraud/reports', {
      params: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
      },
    }),

  getById: (id: string) =>
    get<FraudReport>(`/fraud/reports/${id}`),

  getByExpense: (expenseId: string) =>
    get<FraudReport[]>(`/fraud/reports/expense/${expenseId}`),

  updateStatus: (
    id: string,
    status: FraudReport['status'],
    notes?: string,
  ) => patch<FraudReport>(`/fraud/reports/${id}/status`, { status, notes }),

  analyzeReceipt: (receiptId: string) =>
    post<FraudReport>(`/fraud/analyze/${receiptId}`),

  getStats: () =>
    get<{
      total_reports: number
      confirmed: number
      investigating: number
      dismissed: number
      total_fraud_amount: number
    }>('/fraud/stats'),

  getFraudTrends: (period?: string) =>
    get<Array<{ date: string; count: number; amount: number }>>('/fraud/trends', {
      params: { period },
    }),
}

// ============================================================
// GST / COMPLIANCE ENDPOINTS
// ============================================================

export const gstAPI = {
  validateGSTIN: (gstin: string) =>
    post<GSTValidation>('/gst/validate', { gstin }),

  getComplianceReport: (params?: { start_date?: string; end_date?: string }) =>
    get<ComplianceReport>('/gst/compliance-report', { params }),

  listComplianceReports: (pagination?: PaginationConfig) =>
    getPaginated<ComplianceReport>('/gst/compliance-reports', {
      params: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
      },
    }),

  generateReport: (startDate: string, endDate: string) =>
    post<ComplianceReport>('/gst/compliance-reports/generate', {
      start_date: startDate,
      end_date: endDate,
    }),

  getEligibleClaims: (params?: { start_date?: string; end_date?: string }) =>
    get<{
      total_claims: number
      eligible_amount: number
      expenses: ExpenseClaim[]
    }>('/gst/eligible-claims', { params }),
}

// ============================================================
// VENDOR ENDPOINTS
// ============================================================

export const vendorAPI = {
  list: (
    params?: {
      search?: string
      is_blacklisted?: boolean
      risk_level?: string
    },
    pagination?: PaginationConfig,
  ): Promise<PaginatedAPIResponse<Vendor>> =>
    getPaginated<Vendor>('/vendors', {
      params: {
        ...params,
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
      },
    }),

  getById: (id: string) =>
    get<Vendor>(`/vendors/${id}`),

  create: (data: Partial<Vendor>) =>
    post<Vendor>('/vendors', data),

  update: (id: string, data: Partial<Vendor>) =>
    put<Vendor>(`/vendors/${id}`, data),

  blacklist: (id: string, reason: string) =>
    post<Vendor>(`/vendors/${id}/blacklist`, { reason }),

  unblacklist: (id: string) =>
    post<Vendor>(`/vendors/${id}/unblacklist`),

  verify: (id: string) =>
    post<Vendor>(`/vendors/${id}/verify`),

  getTransactions: (id: string, pagination?: PaginationConfig) =>
    getPaginated<ExpenseClaim>(`/vendors/${id}/transactions`, {
      params: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
      },
    }),

  getRiskScore: (gstin: string) =>
    post<{ risk_score: number; risk_level: string; reasons: string[] }>(
      '/vendors/risk-score',
      { gstin },
    ),
}

// ============================================================
// EMPLOYEE ENDPOINTS
// ============================================================

export const employeeAPI = {
  list: (
    params?: { department?: string; search?: string; role?: string },
    pagination?: PaginationConfig,
  ): Promise<PaginatedAPIResponse<User>> =>
    getPaginated<User>('/employees', {
      params: {
        ...params,
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
      },
    }),

  getById: (id: string) =>
    get<User>(`/employees/${id}`),

  update: (id: string, data: Partial<User>) =>
    put<User>(`/employees/${id}`, data),

  deactivate: (id: string) =>
    post<User>(`/employees/${id}/deactivate`),

  activate: (id: string) =>
    post<User>(`/employees/${id}/activate`),

  getExpenses: (
    id: string,
    pagination?: PaginationConfig,
  ): Promise<PaginatedAPIResponse<ExpenseClaim>> =>
    getPaginated<ExpenseClaim>(`/employees/${id}/expenses`, {
      params: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
      },
    }),

  invite: (email: string, role: User['role'], department?: string) =>
    post<{ message: string }>('/employees/invite', { email, role, department }),

  getDepartments: () =>
    get<string[]>('/employees/departments'),
}

// ============================================================
// AUDIT LOG ENDPOINTS
// ============================================================

export const auditAPI = {
  list: (
    params?: {
      user_id?: string
      resource_type?: string
      severity?: string
      start_date?: string
      end_date?: string
      search?: string
    },
    pagination?: PaginationConfig,
  ): Promise<PaginatedAPIResponse<AuditLog>> =>
    getPaginated<AuditLog>('/audit-logs', {
      params: {
        ...params,
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 50,
      },
    }),

  getById: (id: string) =>
    get<AuditLog>(`/audit-logs/${id}`),

  exportCSV: (params?: {
    start_date?: string
    end_date?: string
    severity?: string
  }) =>
    get<Blob>('/audit-logs/export/csv', {
      params,
      responseType: 'blob',
    }),

  getStats: () =>
    get<{
      total_events: number
      critical_events: number
      error_events: number
      warning_events: number
      by_resource: Record<string, number>
      by_user: Array<{ user_id: string; user_name: string; count: number }>
    }>('/audit-logs/stats'),
}

// ============================================================
// ANALYTICS ENDPOINTS
// ============================================================

export const analyticsAPI = {
  getSpendByCategory: (params?: { start_date?: string; end_date?: string; department?: string }) =>
    get<Array<{ category: string; amount: number; count: number; percentage: number }>>(
      '/analytics/spend-by-category',
      { params },
    ),

  getSpendByDepartment: (params?: { start_date?: string; end_date?: string }) =>
    get<Array<{ department: string; amount: number; employee_count: number }>>(
      '/analytics/spend-by-department',
      { params },
    ),

  getMonthlyTrends: (params?: { months?: number }) =>
    get<
      Array<{
        month: string
        total: number
        approved: number
        rejected: number
        fraud: number
      }>
    >('/analytics/monthly-trends', { params }),

  getTopVendors: (params?: { limit?: number; start_date?: string; end_date?: string }) =>
    get<
      Array<{
        vendor_name: string
        total_amount: number
        transaction_count: number
        risk_level: string
      }>
    >('/analytics/top-vendors', { params }),

  getComplianceScore: () =>
    get<{
      score: number
      trend: number
      breakdown: Record<string, number>
    }>('/analytics/compliance-score'),

  getFraudHeatmap: (params?: { period?: string }) =>
    get<
      Array<{
        day_of_week: number
        hour: number
        fraud_count: number
        total_count: number
      }>
    >('/analytics/fraud-heatmap', { params }),
}

// ============================================================
// NOTIFICATION ENDPOINTS
// ============================================================

export const notificationAPI = {
  list: (pagination?: PaginationConfig): Promise<PaginatedAPIResponse<Notification>> =>
    getPaginated<Notification>('/notifications', {
      params: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
      },
    }),

  markRead: (id: string) =>
    patch<Notification>(`/notifications/${id}/read`),

  markAllRead: () =>
    post<void>('/notifications/read-all'),

  delete: (id: string) =>
    del<void>(`/notifications/${id}`),

  getUnreadCount: () =>
    get<{ count: number }>('/notifications/unread-count'),

  updatePreferences: (preferences: Record<string, boolean>) =>
    put<void>('/notifications/preferences', preferences),
}

// ============================================================
// ORGANIZATION ENDPOINTS
// ============================================================

export const organizationAPI = {
  get: () =>
    get<Organization>('/organization'),

  update: (data: Partial<Organization>) =>
    put<Organization>('/organization', data),

  updateSettings: (settings: Partial<Organization['settings']>) =>
    put<Organization>('/organization/settings', settings),

  uploadLogo: (file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    return uploadFile<{ logo_url: string }>('/organization/logo', formData)
  },

  getSubscription: () =>
    get<{
      plan: string
      status: string
      expires_at: string
      features: string[]
    }>('/organization/subscription'),
}
