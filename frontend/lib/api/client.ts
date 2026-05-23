import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/store/auth-store'

// ============================================================
// RESPONSE TYPES
// ============================================================

export interface APIResponse<T = unknown> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedAPIResponse<T = unknown> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
const TIMEOUT = 30_000

// ============================================================
// AXIOS INSTANCE
// ============================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (!error.response) {
      // Network error
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      })
    }

    const { status } = error.response

    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const { refreshToken, setTokens, logout } = useAuthStore.getState()

      if (!refreshToken) {
        processQueue(error, null)
        isRefreshing = false
        logout()
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token } = response.data.data

        setTokens(access_token, refresh_token)
        processQueue(null, access_token)

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      return Promise.reject({
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
        status: 403,
      })
    }

    // Handle 404 Not Found
    if (status === 404) {
      return Promise.reject({
        message: error.response.data?.message ?? 'Resource not found.',
        code: 'NOT_FOUND',
        status: 404,
      })
    }

    // Handle 422 Validation Error
    if (status === 422) {
      return Promise.reject({
        message: error.response.data?.message ?? 'Validation failed.',
        code: 'VALIDATION_ERROR',
        status: 422,
        details: error.response.data?.detail ?? null,
      })
    }

    // Handle 429 Rate Limit
    if (status === 429) {
      return Promise.reject({
        message: 'Too many requests. Please slow down.',
        code: 'RATE_LIMIT',
        status: 429,
      })
    }

    // Handle 500+ Server Errors
    if (status >= 500) {
      return Promise.reject({
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        status,
      })
    }

    return Promise.reject(error)
  },
)

// ============================================================
// TYPED REQUEST HELPERS
// ============================================================

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<APIResponse<T>>(url, config)
  return response.data.data
}

export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<APIResponse<T>>(url, data, config)
  return response.data.data
}

export async function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.put<APIResponse<T>>(url, data, config)
  return response.data.data
}

export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<APIResponse<T>>(url, data, config)
  return response.data.data
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<APIResponse<T>>(url, config)
  return response.data.data
}

export async function getPaginated<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<PaginatedAPIResponse<T>> {
  const response = await apiClient.get<PaginatedAPIResponse<T>>(url, config)
  return response.data
}

export async function uploadFile<T>(
  url: string,
  formData: FormData,
  onProgress?: (percentage: number) => void,
): Promise<T> {
  const response = await apiClient.post<APIResponse<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentage)
      }
    },
  })
  return response.data.data
}

export default apiClient

// ============================================================
// DECLARE axios config metadata
// ============================================================

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date
    }
    _retry?: boolean
  }
}
