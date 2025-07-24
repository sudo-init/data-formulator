/**
 * SSE Client - Server-Sent Events client for real-time communication
 * Migrated from original SSEClient.tsx to Next.js with proper TypeScript
 */

import { AppDispatch } from '@/lib/store/store'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'

// Types
export interface SSEMessage {
  type: string
  payload: any
  timestamp?: number
  sessionId?: string
}

export interface SSEClientOptions {
  url?: string
  withCredentials?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  onOpen?: (event: Event) => void
  onMessage?: (data: SSEMessage) => void
  onError?: (event: Event) => void
  onClose?: (event: Event) => void
}

export class SSEClient {
  private eventSource: EventSource | null = null
  private dispatch: AppDispatch | null = null
  private options: Required<SSEClientOptions>
  private reconnectCount = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private isConnecting = false
  private isDestroyed = false

  constructor(dispatch?: AppDispatch, options: SSEClientOptions = {}) {
    this.dispatch = dispatch || null
    this.options = {
      url: '/api/sse/connect',
      withCredentials: true,
      reconnectAttempts: 5,
      reconnectDelay: 3000,
      onOpen: () => {},
      onMessage: () => {},
      onError: () => {},
      onClose: () => {},
      ...options
    }
  }

  /**
   * Connect to SSE endpoint
   */
  connect(): void {
    if (this.isDestroyed) {
      console.warn('SSE Client has been destroyed, cannot reconnect')
      return
    }

    if (this.eventSource || this.isConnecting) {
      console.warn('SSE connection already exists or is connecting')
      return
    }

    this.isConnecting = true

    try {
      console.log('Connecting to SSE...')
      this.eventSource = new EventSource(this.options.url, {
        withCredentials: this.options.withCredentials
      })

      this.setupEventListeners()
    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('Disconnecting SSE...')
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    this.isConnecting = false
    this.reconnectCount = 0
  }

  /**
   * Destroy the client completely
   */
  destroy(): void {
    this.isDestroyed = true
    this.disconnect()
    this.dispatch = null
  }

  /**
   * Get connection status
   */
  getConnectionState(): string {
    if (!this.eventSource) return 'DISCONNECTED'
    
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'CONNECTING'
      case EventSource.OPEN:
        return 'OPEN'
      case EventSource.CLOSED:
        return 'CLOSED'
      default:
        return 'UNKNOWN'
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }

  /**
   * Setup event listeners for EventSource
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return

    this.eventSource.onopen = (event) => {
      console.log('SSE connection opened')
      this.isConnecting = false
      this.reconnectCount = 0
      
      // Notify Redux store of connection
      if (this.dispatch) {
        this.dispatch(dataFormulatorActions.setSSEConnectionStatus('connected'))
      }
      
      this.options.onOpen(event)
    }

    this.eventSource.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data)
        console.log('Received SSE message:', data)
        
        // Send to Redux store if dispatch is available
        if (this.dispatch) {
          this.dispatch(dataFormulatorActions.handleSSEMessage(data))
        }
        
        this.options.onMessage(data)
      } catch (error) {
        console.error('Failed to parse SSE message:', event.data, error)
      }
    }

    this.eventSource.onerror = (event) => {
      console.error('SSE connection error:', event)
      this.isConnecting = false
      
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        console.error('SSE connection was closed')
        
        // Notify Redux store of disconnection
        if (this.dispatch) {
          this.dispatch(dataFormulatorActions.setSSEConnectionStatus('disconnected'))
        }
        
        this.scheduleReconnect()
      } else if (this.eventSource?.readyState === EventSource.CONNECTING) {
        console.log('SSE connection is reconnecting...')
      }
      
      this.options.onError(event)
    }

    this.eventSource.onclose = (event) => {
      console.log('SSE connection closed')
      this.isConnecting = false
      
      // Notify Redux store of disconnection
      if (this.dispatch) {
        this.dispatch(dataFormulatorActions.setSSEConnectionStatus('disconnected'))
      }
      
      this.options.onClose(event)
      this.scheduleReconnect()
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.isDestroyed) return
    
    if (this.reconnectCount >= this.options.reconnectAttempts) {
      console.error(`SSE reconnection failed after ${this.options.reconnectAttempts} attempts`)
      
      // Notify Redux store of connection failure
      if (this.dispatch) {
        this.dispatch(dataFormulatorActions.setSSEConnectionStatus('failed'))
      }
      
      return
    }

    this.reconnectCount++
    const delay = this.options.reconnectDelay * Math.pow(1.5, this.reconnectCount - 1)
    
    console.log(`Scheduling SSE reconnect attempt ${this.reconnectCount}/${this.options.reconnectAttempts} in ${delay}ms`)
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.eventSource = null
      this.connect()
    }, delay)
  }
}

// Singleton instance for global use
let sseClientInstance: SSEClient | null = null

/**
 * Get or create SSE client singleton
 */
export const getSSEClient = (dispatch?: AppDispatch, options?: SSEClientOptions): SSEClient => {
  if (!sseClientInstance) {
    sseClientInstance = new SSEClient(dispatch, options)
  }
  return sseClientInstance
}

/**
 * Connect to SSE (legacy function for backward compatibility)
 */
export function connectToSSE(dispatch?: AppDispatch, options?: SSEClientOptions): SSEClient {
  const client = getSSEClient(dispatch, options)
  client.connect()
  return client
}

/**
 * React hook for SSE connection management
 */
export const useSSEConnection = (
  dispatch: AppDispatch,
  options?: SSEClientOptions
) => {
  const client = getSSEClient(dispatch, options)
  
  // Connect on mount, disconnect on unmount
  React.useEffect(() => {
    if (!client.isConnected()) {
      client.connect()
    }
    
    return () => {
      // Don't disconnect on unmount by default to maintain connection
      // across component remounts. Use client.disconnect() manually if needed.
    }
  }, [client])
  
  return {
    client,
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    isConnected: client.isConnected(),
    connectionState: client.getConnectionState()
  }
}

// React import for the hook
import React from 'react'

export default SSEClient