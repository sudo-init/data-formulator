/**
 * Base API client for Data Formulator
 * Handles communication with FastAPI backend
 */

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface APIClientConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
}

export class APIClient {
  private baseURL: string
  private timeout: number
  private headers: Record<string, string>

  constructor(config: APIClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '') // Remove trailing slash
    this.timeout = config.timeout || 30000
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new APIError(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof APIError) {
        throw error
      }
      
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 408)
      }
      
      throw new APIError('Network error', 0, error)
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, this.baseURL)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }
    
    return this.request<T>(url.pathname + url.search)
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  // Streaming support for SSE endpoints
  async stream(endpoint: string, onMessage: (data: any) => void): Promise<void> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        ...this.headers,
        'Accept': 'text/event-stream',
      },
    })

    if (!response.ok) {
      throw new APIError(`HTTP ${response.status}: ${response.statusText}`, response.status)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new APIError('Stream not available', 500)
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onMessage(data)
            } catch (e) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}

// Default API client instance
export const apiClient = new APIClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 60000, // 60 seconds for agent operations
})

// Utility function for error handling
export function isAPIError(error: any): error is APIError {
  return error instanceof APIError
}