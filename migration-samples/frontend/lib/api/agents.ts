/**
 * Agent API client
 * Handles AI agent-related API calls to FastAPI backend
 */

import { apiClient, APIError } from './client'

export interface ModelConfig {
  provider: string
  model: string
  api_key?: string
  api_base?: string
  api_version?: string
  temperature: number
  max_tokens?: number
}

export interface AgentRunRequest {
  agent_type: string
  model_config: ModelConfig
  prompt: string
  data: Record<string, any>
  tables: Record<string, any[]>
  session_id: string
  config?: Record<string, any>
}

export interface AgentFollowupRequest extends AgentRunRequest {
  previous_dialog: any[]
}

export interface AgentResponse {
  status: 'ok' | 'error' | 'other error'
  content: Record<string, any>
  code?: string
  dialog: any[]
  agent: string
  refined_goal?: Record<string, any>
  error_message?: string
  execution_time?: number
}

export interface ModelListResponse {
  models: Array<{
    provider: string
    model: string
    name: string
  }>
  providers: string[]
}

export class AgentAPI {
  /**
   * Run an AI agent for data transformation
   * Migrated from Flask /api/agent/run endpoint
   */
  static async runAgent(request: AgentRunRequest): Promise<AgentResponse> {
    try {
      return await apiClient.post<AgentResponse>('/api/v1/agents/run', request)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError('Failed to run agent', 500, error)
    }
  }

  /**
   * Follow up with an AI agent for iterative refinement
   */
  static async followupAgent(request: AgentFollowupRequest): Promise<AgentResponse> {
    try {
      return await apiClient.post<AgentResponse>('/api/v1/agents/followup', request)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError('Failed to followup with agent', 500, error)
    }
  }

  /**
   * Get list of available LLM models and providers
   */
  static async getAvailableModels(): Promise<ModelListResponse> {
    try {
      return await apiClient.get<ModelListResponse>('/api/v1/agents/models')
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError('Failed to get available models', 500, error)
    }
  }

  /**
   * Get agent configuration settings
   */
  static async getAgentConfig(): Promise<Record<string, any>> {
    try {
      return await apiClient.get<Record<string, any>>('/api/v1/agents/config')
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError('Failed to get agent config', 500, error)
    }
  }

  /**
   * Explain generated code in natural language
   */
  static async explainCode(
    code: string,
    modelConfig: ModelConfig,
    sessionId: string
  ): Promise<AgentResponse> {
    try {
      return await apiClient.post<AgentResponse>('/api/v1/agents/explain-code', {
        code,
        model_config: modelConfig,
        session_id: sessionId,
      })
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError('Failed to explain code', 500, error)
    }
  }
}

// Example usage function for the /api/agent/run endpoint
export async function runDataTransformationAgent(
  prompt: string,
  data: Record<string, any>,
  tables: Record<string, any[]>,
  modelConfig: ModelConfig,
  sessionId: string
): Promise<AgentResponse> {
  const request: AgentRunRequest = {
    agent_type: 'python_data_transform',
    model_config: modelConfig,
    prompt,
    data,
    tables,
    session_id: sessionId,
  }

  return AgentAPI.runAgent(request)
}

// Hook-style API for React components
export function useAgentAPI() {
  return {
    runAgent: AgentAPI.runAgent,
    followupAgent: AgentAPI.followupAgent,
    getAvailableModels: AgentAPI.getAvailableModels,
    getAgentConfig: AgentAPI.getAgentConfig,
    explainCode: AgentAPI.explainCode,
  }
}