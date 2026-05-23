// ============================================================
// ENUMS & LITERALS
// ============================================================

export type Role = 'employee' | 'finance_manager' | 'auditor' | 'admin'

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type ExpenseCategory =
  | 'travel'
  | 'accommodation'
  | 'meals'
  | 'office_supplies'
  | 'software'
  | 'hardware'
  | 'marketing'
  | 'training'
  | 'medical'
  | 'utilities'
  | 'other'

export type FraudType =
  | 'duplicate_receipt'
  | 'inflated_amount'
  | 'fictitious_vendor'
  | 'personal_expense'
  | 'policy_violation'
  | 'suspicious_timing'
  | 'blacklisted_vendor'
  | 'gstin_mismatch'
  | 'round_number_bias'
  | 'split_transaction'

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

export type NotificationType =
  | 'expense_submitted'
  | 'expense_approved'
  | 'expense_rejected'
  | 'fraud_detected'
  | 'compliance_alert'
  | 'system_alert'
  | 'audit_complete'

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise'

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED'

// ============================================================
// CORE ENTITIES
// ============================================================

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  organization_id: string
  avatar_url: string | null
  department: string | null
  employee_id: string | null
  phone: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export interface Organization {
  id: string
  name: string
  domain: string
  gstin: string | null
  pan: string | null
  logo_url: string | null
  subscription_plan: SubscriptionPlan
  is_active: boolean
  employee_count: number
  created_at: string
  address: {
    street: string
    city: string
    state: string
    country: string
    pincode: string
  } | null
  settings: OrganizationSettings
}

export interface OrganizationSettings {
  auto_approve_below: number
  fraud_threshold: number
  require_receipt_above: number
  allowed_categories: ExpenseCategory[]
  max_per_diem: number
  currency: Currency
  approval_workflow: 'single' | 'multi'
  notify_on_fraud: boolean
  notify_on_approval: boolean
}

export interface ExpenseClaim {
  id: string
  title: string
  description: string | null
  amount: number
  currency: Currency
  category: ExpenseCategory
  status: ExpenseStatus
  employee_id: string
  employee_name: string
  organization_id: string
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  reviewer_name: string | null
  reviewer_comments: string | null
  fraud_score: number
  risk_level: RiskLevel
  receipts: Receipt[]
  tags: string[]
  location: string | null
  project_code: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Receipt {
  id: string
  expense_claim_id: string
  file_url: string
  file_name: string
  file_size: number
  mime_type: string
  vendor_name: string | null
  vendor_address: string | null
  gstin: string | null
  invoice_number: string | null
  invoice_date: string | null
  tax_amount: number | null
  cgst: number | null
  sgst: number | null
  igst: number | null
  total_amount: number | null
  currency: Currency
  processing_status: ProcessingStatus
  ai_analysis: AIAnalysis | null
  created_at: string
  updated_at: string
}

export interface AIAnalysis {
  ocr_confidence: number
  extracted_text: string
  detected_language: string
  vendor_verified: boolean
  gstin_valid: boolean
  amount_matches: boolean
  date_valid: boolean
  anomalies: string[]
  fraud_indicators: FraudType[]
  processing_time_ms: number
}

export interface Vendor {
  id: string
  name: string
  gstin: string | null
  pan: string | null
  email: string | null
  phone: string | null
  address: string | null
  category: ExpenseCategory | null
  fraud_score: number
  compliance_score: number
  transaction_count: number
  total_amount: number
  is_verified: boolean
  is_blacklisted: boolean
  blacklist_reason: string | null
  risk_level: RiskLevel
  created_at: string
  updated_at: string
}

export interface FraudReport {
  id: string
  receipt_id: string
  expense_claim_id: string
  fraud_score: number
  confidence: number
  fraud_types: FraudType[]
  ai_reasoning: string
  evidence: Record<string, unknown>
  status: 'open' | 'investigating' | 'confirmed' | 'dismissed'
  reviewed_by: string | null
  reviewer_notes: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  user_role: Role
  action: string
  resource_type: string
  resource_id: string
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  severity: AuditSeverity
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  action_url: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ============================================================
// DASHBOARD & ANALYTICS
// ============================================================

export interface DashboardStats {
  total_expenses: number
  total_amount: number
  fraud_detected: number
  fraud_amount: number
  pending_reviews: number
  compliance_score: number
  approval_rate: number
  monthly_spend: number
  monthly_spend_change: number
  expense_change: number
  fraud_change: number
  compliance_change: number
}

export interface MonthlyTrend {
  month: string
  total_amount: number
  approved_amount: number
  rejected_amount: number
  fraud_amount: number
  expense_count: number
}

export interface CategoryBreakdown {
  category: ExpenseCategory
  amount: number
  count: number
  percentage: number
  fraud_count: number
}

export interface SpendingAnalytics {
  monthly_trends: MonthlyTrend[]
  category_breakdown: CategoryBreakdown[]
  top_vendors: VendorSpend[]
  department_breakdown: DepartmentSpend[]
  risk_distribution: RiskDistribution[]
}

export interface VendorSpend {
  vendor_id: string
  vendor_name: string
  total_amount: number
  transaction_count: number
  risk_level: RiskLevel
  fraud_score: number
}

export interface DepartmentSpend {
  department: string
  total_amount: number
  expense_count: number
  employee_count: number
  avg_per_employee: number
}

export interface RiskDistribution {
  risk_level: RiskLevel
  count: number
  percentage: number
  total_amount: number
}

// ============================================================
// GST & COMPLIANCE
// ============================================================

export interface GSTValidation {
  gstin: string
  is_valid: boolean
  business_name: string | null
  state: string | null
  registration_type: string | null
  is_active: boolean | null
  error: string | null
  validated_at: string
}

export interface ComplianceReport {
  id: string
  organization_id: string
  period_start: string
  period_end: string
  total_transactions: number
  compliant_transactions: number
  non_compliant_transactions: number
  compliance_score: number
  gst_claims_eligible: number
  gst_amount_eligible: number
  issues: ComplianceIssue[]
  generated_at: string
}

export interface ComplianceIssue {
  expense_id: string
  receipt_id: string | null
  issue_type: string
  severity: AuditSeverity
  description: string
  recommendation: string
}

// ============================================================
// API RESPONSE WRAPPERS
// ============================================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface APIResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface APIError {
  message: string
  code: string
  details: Record<string, string[]> | null
  timestamp: string
}

// ============================================================
// FILTER & SORT TYPES
// ============================================================

export interface ExpenseFilters {
  status?: ExpenseStatus[]
  category?: ExpenseCategory[]
  risk_level?: RiskLevel[]
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  employee_id?: string
  department?: string
  search?: string
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginationConfig {
  page: number
  limit: number
}

// ============================================================
// FORM TYPES
// ============================================================

export interface LoginForm {
  email: string
  password: string
  remember_me?: boolean
}

export interface RegisterForm {
  full_name: string
  email: string
  password: string
  confirm_password: string
  organization_name: string
  domain: string
}

export interface ExpenseClaimForm {
  title: string
  description?: string
  amount: number
  currency: Currency
  category: ExpenseCategory
  location?: string
  project_code?: string
  tags?: string[]
  receipts?: File[]
}

// ============================================================
// AUTH TYPES
// ============================================================

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
  organization: Organization
}
