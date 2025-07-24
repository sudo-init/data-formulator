/**
 * Data Formulator Redux Slice
 * Migrated from original dfSlice.tsx to Next.js with TypeScript and RTK
 */

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { enableMapSet } from 'immer'
import {
  Channel,
  Chart,
  FieldItem,
  DictTable,
  DataType,
  Message,
  ModelConfig
} from '@/lib/types/componentTypes'
import { getChartChannels } from '@/lib/constants/ChartTemplates'
import { getUrls } from '@/lib/utils/chartUtils'

enableMapSet()

// Helper function to generate fresh chart
export const generateFreshChart = (
  tableRef: string, 
  chartType: string, 
  source: 'user' | 'trigger' = 'user'
): Chart => {
  return {
    id: `chart-${Date.now() - Math.floor(Math.random() * 10000)}`,
    chartType: chartType,
    encodingMap: Object.assign(
      {},
      ...getChartChannels(chartType).map((channel) => ({
        [channel]: { bin: false }
      }))
    ),
    tableRef: tableRef,
    saved: false,
    source: source
  }
}

// SSE Message interface
export interface SSEMessage {
  type: 'heartbeat' | 'notification' | 'action'
  text: string
  data?: Record<string, any>
  timestamp: number
}

// Model slot types
export const MODEL_SLOT_TYPES = ['generation', 'hint'] as const
export type ModelSlotType = typeof MODEL_SLOT_TYPES[number]
export type ModelSlots = Partial<Record<ModelSlotType, string>>

// Define the slice state
export interface DataFormulatorState {
  sessionId: string | undefined
  models: ModelConfig[]
  modelSlots: ModelSlots
  testedModels: { id: string; status: 'ok' | 'error' | 'testing' | 'unknown'; message: string }[]
  
  // Loading states
  isLoadingModels: boolean
  isLoadingAgent: boolean
  selectedModel: string | undefined
  selectedTableName: string | undefined

  tables: DictTable[]
  charts: Chart[]

  activeChallenges: {
    tableId: string
    challenges: { text: string; difficulty: 'easy' | 'medium' | 'hard' }[]
  }[]

  conceptShelfItems: FieldItem[]

  displayPanelSize: number
  visPaneSize: number
  conceptShelfPaneSize: number

  messages: Message[]
  displayedMessageIdx: number

  visViewMode: 'gallery' | 'carousel'

  focusedTableId: string | undefined
  focusedChartId: string | undefined

  chartSynthesisInProgress: string[]

  config: {
    formulateTimeoutSeconds: number
    maxRepairAttempts: number
    defaultChartWidth: number
    defaultChartHeight: number
  }

  dataLoaderConnectParams: Record<string, Record<string, string>>
  pendingSSEActions: SSEMessage[]
}

// Initial state
const initialState: DataFormulatorState = {
  sessionId: undefined,
  models: [],
  modelSlots: {},
  testedModels: [],

  // Loading states
  isLoadingModels: false,
  isLoadingAgent: false,
  selectedModel: undefined,
  selectedTableName: undefined,

  tables: [],
  charts: [],
  activeChallenges: [],
  conceptShelfItems: [],

  displayPanelSize: 550,
  visPaneSize: 640,
  conceptShelfPaneSize: 240,

  messages: [],
  displayedMessageIdx: -1,

  visViewMode: 'carousel',

  focusedTableId: undefined,
  focusedChartId: undefined,

  chartSynthesisInProgress: [],

  config: {
    formulateTimeoutSeconds: 30,
    maxRepairAttempts: 1,
    defaultChartWidth: 300,
    defaultChartHeight: 300
  },

  dataLoaderConnectParams: {},
  pendingSSEActions: []
}

// Helper functions
const getUnrefedDerivedTableIds = (state: DataFormulatorState): string[] => {
  const allCharts = state.charts
  const chartRefedTables = allCharts
    .map((chart) => getDataTable(chart, state.tables, allCharts, state.conceptShelfItems))
    .map((t) => t.id)

  return state.tables
    .filter((table) => table.derive && !chartRefedTables.includes(table.id))
    .map((t) => t.id)
}

const deleteChartsRoutine = (state: DataFormulatorState, chartIds: string[]) => {
  const charts = state.charts.filter((c) => !chartIds.includes(c.id))
  let focusedChartId = state.focusedChartId

  if (focusedChartId && chartIds.includes(focusedChartId)) {
    focusedChartId = charts.length > 0 ? charts[0].id : undefined
    state.focusedTableId = charts.find((c) => c.id === focusedChartId)?.tableRef
  }

  state.chartSynthesisInProgress = state.chartSynthesisInProgress.filter(
    (s) => !chartIds.includes(s)
  )

  state.charts = charts
  state.focusedChartId = focusedChartId

  const unrefedDerivedTableIds = getUnrefedDerivedTableIds(state)
  const tableIdsToDelete = state.tables
    .filter((t) => !t.anchored && unrefedDerivedTableIds.includes(t.id))
    .map((t) => t.id)
  state.tables = state.tables.filter((t) => !tableIdsToDelete.includes(t.id))
}

// Placeholder for getDataTable function
const getDataTable = (
  chart: Chart,
  tables: DictTable[],
  allCharts: Chart[],
  conceptShelfItems: FieldItem[]
): DictTable => {
  return tables.find((t) => t.id === chart.tableRef) || tables[0] || { 
    id: 'default', 
    displayId: 'default',
    names: [], 
    types: [], 
    rows: [], 
    anchored: false, 
    explorativeQuestions: [] 
  }
}

// Async thunks
export const fetchFieldSemanticType = createAsyncThunk(
  'dataFormulator/fetchFieldSemanticType',
  async (table: DictTable, { getState }) => {
    console.log('>>> call agent to infer semantic types <<<')

    const state = getState() as { dataFormulator: DataFormulatorState }
    const dfState = state.dataFormulator

    const message = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: Date.now(),
        input_data: {
          name: table.id,
          rows: table.rows,
          virtual: table.virtual ? true : false
        },
        model: dfSelectors.getActiveModel(dfState)
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch(getUrls().SERVER_PROCESS_DATA_ON_LOAD, {
        ...message,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }
)

export const fetchAvailableModels = createAsyncThunk(
  'dataFormulator/fetchAvailableModels',
  async () => {
    console.log('>>> call agent to fetch available models <<<')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch(getUrls().CHECK_AVAILABLE_MODELS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: Date.now() }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }
)

export const getSessionId = createAsyncThunk(
  'dataFormulator/getSessionId',
  async (_, { getState }) => {
    const state = getState() as { dataFormulator: DataFormulatorState }
    const sessionId = state.dataFormulator.sessionId

    const response = await fetch(getUrls().GET_SESSION_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    })
    return response.json()
  }
)

// Agent runner async thunk
export const runAgent = createAsyncThunk(
  'dataFormulator/runAgent',
  async (params: {
    agentType: string
    payload: Record<string, any>
    modelId?: string
  }, { getState }) => {
    const state = getState() as { dataFormulator: DataFormulatorState }
    const sessionId = state.dataFormulator.sessionId
    
    const response = await fetch(getUrls().RUN_AGENT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        agent_type: params.agentType,
        model_id: params.modelId || state.dataFormulator.selectedModel,
        ...params.payload
      })
    })
    return response.json()
  }
)

// Code explanation fetcher
export const fetchCodeExpl = createAsyncThunk(
  'dataFormulator/fetchCodeExpl',
  async (table: DictTable) => {
    // This would typically call an API to get code explanation
    // For now, return a placeholder
    return {
      tableId: table.id,
      explanation: 'Code explanation would be fetched from API'
    }
  }
)

// SSE Message handler
const handleSSEMessage = (state: DataFormulatorState, message: SSEMessage) => {
  state.pendingSSEActions.push(message)
  
  if (message.type === 'notification') {
    state.messages.push({
      timestamp: message.timestamp,
      component: 'SSE',
      type: 'info',
      value: message.text
    })
  }
}

// Create the slice
export const dataFormulatorSlice = createSlice({
  name: 'dataFormulator',
  initialState,
  reducers: {
    resetState: (state) => {
      Object.assign(state, {
        ...initialState,
        sessionId: state.sessionId,
        models: state.models,
        modelSlots: state.modelSlots
      })
    },

    loadState: (state, action: PayloadAction<Partial<DataFormulatorState>>) => {
      const savedState = action.payload
      Object.assign(state, {
        ...savedState,
        messages: [],
        displayedMessageIdx: -1,
        chartSynthesisInProgress: [],
        testedModels: []
      })
    },

    setConfig: (
      state,
      action: PayloadAction<{
        formulateTimeoutSeconds: number
        maxRepairAttempts: number
        defaultChartWidth: number
        defaultChartHeight: number
      }>
    ) => {
      state.config = action.payload
    },

    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },

    clearMessages: (state) => {
      state.messages = []
    },

    setVisViewMode: (state, action: PayloadAction<'gallery' | 'carousel'>) => {
      state.visViewMode = action.payload
    },

    setFocusedTableId: (state, action: PayloadAction<string | undefined>) => {
      state.focusedTableId = action.payload
    },

    setFocusedChartId: (state, action: PayloadAction<string | undefined>) => {
      state.focusedChartId = action.payload
      if (action.payload) {
        const chart = state.charts.find((c) => c.id === action.payload)
        if (chart) {
          state.focusedTableId = chart.tableRef
        }
      }
    },

    addTable: (state, action: PayloadAction<DictTable>) => {
      state.tables.push(action.payload)
    },

    updateTable: (state, action: PayloadAction<DictTable>) => {
      const index = state.tables.findIndex((t) => t.id === action.payload.id)
      if (index !== -1) {
        state.tables[index] = action.payload
      }
    },

    deleteTable: (state, action: PayloadAction<string>) => {
      state.tables = state.tables.filter((t) => t.id !== action.payload)
      const chartsToDelete = state.charts.filter((c) => c.tableRef === action.payload)
      deleteChartsRoutine(state, chartsToDelete.map((c) => c.id))
      state.conceptShelfItems = state.conceptShelfItems.filter(
        (item) => item.tableRef !== action.payload
      )
    },

    addChart: (state, action: PayloadAction<Chart>) => {
      state.charts.push(action.payload)
    },

    updateChart: (state, action: PayloadAction<Chart>) => {
      const index = state.charts.findIndex((c) => c.id === action.payload.id)
      if (index !== -1) {
        state.charts[index] = action.payload
      }
    },

    deleteChart: (state, action: PayloadAction<string>) => {
      deleteChartsRoutine(state, [action.payload])
    },

    addConceptShelfItem: (state, action: PayloadAction<FieldItem>) => {
      state.conceptShelfItems.push(action.payload)
    },

    updateConceptShelfItem: (state, action: PayloadAction<FieldItem>) => {
      const index = state.conceptShelfItems.findIndex((item) => item.id === action.payload.id)
      if (index !== -1) {
        state.conceptShelfItems[index] = action.payload
      }
    },

    deleteConceptShelfItem: (state, action: PayloadAction<string>) => {
      state.conceptShelfItems = state.conceptShelfItems.filter(
        (item) => item.id !== action.payload
      )
    },

    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload
    },

    addModel: (state, action: PayloadAction<ModelConfig>) => {
      state.models.push(action.payload)
    },

    removeModel: (state, action: PayloadAction<string>) => {
      state.models = state.models.filter((model) => model.id !== action.payload)
      Object.keys(state.modelSlots).forEach((slotType) => {
        if (state.modelSlots[slotType as ModelSlotType] === action.payload) {
          state.modelSlots[slotType as ModelSlotType] = undefined
        }
      })
    },

    setModelSlot: (
      state,
      action: PayloadAction<{ slotType: ModelSlotType; modelId: string | undefined }>
    ) => {
      state.modelSlots = {
        ...state.modelSlots,
        [action.payload.slotType]: action.payload.modelId
      }
    },

    // Additional actions needed by components
    extendTableWithNewFields: (state, action: PayloadAction<{ tableId: string; fields: FieldItem[] }>) => {
      const { tableId, fields } = action.payload
      // Add the logic to extend table with new fields
      state.conceptShelfItems.push(...fields)
    },

    deleteConceptItemByID: (state, action: PayloadAction<string>) => {
      state.conceptShelfItems = state.conceptShelfItems.filter(
        (item) => item.id !== action.payload
      )
    },

    updateConceptItems: (state, action: PayloadAction<FieldItem[]>) => {
      // Replace with new items or update existing ones
      action.payload.forEach(newItem => {
        const index = state.conceptShelfItems.findIndex(item => item.id === newItem.id)
        if (index !== -1) {
          state.conceptShelfItems[index] = newItem
        } else {
          state.conceptShelfItems.push(newItem)
        }
      })
    },

    setFocusedTable: (state, action: PayloadAction<string | undefined>) => {
      state.focusedTableId = action.payload
    },

    removeDerivedField: (state, action: PayloadAction<string>) => {
      state.conceptShelfItems = state.conceptShelfItems.filter(
        (item) => item.id !== action.payload
      )
    },

    setSSEConnectionStatus: (state, action: PayloadAction<{ connected: boolean; error?: string }>) => {
      // Add SSE connection status to state if needed
      // This would require adding the property to DataFormulatorState
    },

    // Loading states
    setLoadingModels: (state, action: PayloadAction<boolean>) => {
      state.isLoadingModels = action.payload
    },

    setLoadingAgent: (state, action: PayloadAction<boolean>) => {
      state.isLoadingAgent = action.payload
    },

    setSelectedModel: (state, action: PayloadAction<string | undefined>) => {
      state.selectedModel = action.payload
    },

    setSelectedTableName: (state, action: PayloadAction<string | undefined>) => {
      state.selectedTableName = action.payload
    },

    // Alias for backwards compatibility
    addMessages: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },

    loadTable: (state, action: PayloadAction<DictTable>) => {
      state.tables.push(action.payload)
    },

    addChallenges: (state, action: PayloadAction<{ tableId: string; challenges: { text: string; difficulty: 'easy' | 'medium' | 'hard' }[] }>) => {
      const existingIndex = state.activeChallenges.findIndex(c => c.tableId === action.payload.tableId)
      if (existingIndex !== -1) {
        state.activeChallenges[existingIndex] = action.payload
      } else {
        state.activeChallenges.push(action.payload)
      }
    },

    addConceptItems: (state, action: PayloadAction<FieldItem[]>) => {
      state.conceptShelfItems.push(...action.payload)
    },

    updateTableRef: (state, action: PayloadAction<{ chartId: string; tableRef: string }>) => {
      const chart = state.charts.find(c => c.id === action.payload.chartId)
      if (chart) {
        chart.tableRef = action.payload.tableRef
      }
    },

    changeChartRunningStatus: (state, action: PayloadAction<{ chartId: string; status: boolean }>) => {
      if (action.payload.status) {
        if (!state.chartSynthesisInProgress.includes(action.payload.chartId)) {
          state.chartSynthesisInProgress.push(action.payload.chartId)
        }
      } else {
        state.chartSynthesisInProgress = state.chartSynthesisInProgress.filter(
          id => id !== action.payload.chartId
        )
      }
    },

    clearUnReferencedTables: (state) => {
      const referencedTableIds = new Set(state.charts.map(c => c.tableRef))
      state.tables = state.tables.filter(t => referencedTableIds.has(t.id) || t.anchored)
    },

    clearUnReferencedCustomConcepts: (state) => {
      const referencedFields = new Set()
      state.charts.forEach(chart => {
        Object.values(chart.encodingMap).forEach(enc => {
          if (enc.fieldID) {
            referencedFields.add(enc.fieldID)
          }
        })
      })
      state.conceptShelfItems = state.conceptShelfItems.filter(
        item => item.source !== 'custom' || referencedFields.has(item.id)
      )
    },

    setVisPaneSize: (state, action: PayloadAction<number>) => {
      state.visPaneSize = action.payload
    },

    updateChartType: (state, action: PayloadAction<{ chartId: string; chartType: string }>) => {
      const chart = state.charts.find(c => c.id === action.payload.chartId)
      if (chart) {
        chart.chartType = action.payload.chartType
      }
    },

    deleteChartById: (state, action: PayloadAction<string>) => {
      deleteChartsRoutine(state, [action.payload])
    },

    setFocusedChart: (state, action: PayloadAction<string>) => {
      state.focusedChartId = action.payload
      const chart = state.charts.find(c => c.id === action.payload)
      if (chart) {
        state.focusedTableId = chart.tableRef
      }
    },

    addAndFocusChart: (state, action: PayloadAction<Chart>) => {
      state.charts.push(action.payload)
      state.focusedChartId = action.payload.id
      state.focusedTableId = action.payload.tableRef
    },

    insertDerivedTables: (state, action: PayloadAction<DictTable>) => {
      state.tables.push(action.payload)
    },

    overrideDerivedTables: (state, action: PayloadAction<DictTable>) => {
      const index = state.tables.findIndex(t => t.id === action.payload.id)
      if (index !== -1) {
        state.tables[index] = action.payload
      } else {
        state.tables.push(action.payload)
      }
    },

    handleSSEMessage: (state, action: PayloadAction<SSEMessage>) => {
      handleSSEMessage(state, action.payload)
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchFieldSemanticType.fulfilled, (state, action) => {
        const data = action.payload
        const tableId = action.meta.arg.id

        if (data?.status === 'ok' && data.result?.length > 0) {
          const typeMap = data.result[0].fields || {}
          state.conceptShelfItems = state.conceptShelfItems.map((field) => {
            if (
              ((field.source === 'original' && field.tableRef === tableId) ||
                field.source === 'custom') &&
              Object.keys(typeMap).includes(field.name)
            ) {
              const fieldData = typeMap[field.name]
              return {
                ...field,
                semanticType: fieldData.semantic_type,
                type: fieldData.type as DataType,
                levels: fieldData.sort_order
                  ? { values: fieldData.sort_order, reason: 'natural sort order' }
                  : field.levels
              }
            }
            return field
          })

          if (data.result[0].explorative_questions?.length > 0) {
            const table = state.tables.find((t) => t.id === tableId)
            if (table) {
              table.explorativeQuestions = data.result[0].explorative_questions
            }
          }
        }
      })
      .addCase(fetchAvailableModels.fulfilled, (state, action) => {
        const defaultModels = action.payload || []

        state.models = [
          ...defaultModels,
          ...state.models.filter(
            (e) =>
              !defaultModels.some(
                (m: ModelConfig) =>
                  m.endpoint === e.endpoint &&
                  m.model === e.model &&
                  m.api_base === e.api_base &&
                  m.api_version === e.api_version
              )
          )
        ]

        state.testedModels = [
          ...defaultModels.map((m: ModelConfig) => ({ 
            id: m.id, 
            status: 'ok' as const, 
            message: '' 
          })),
          ...state.testedModels.filter(
            (t) => !defaultModels.map((m: ModelConfig) => m.id).includes(t.id)
          )
        ]

        if (defaultModels.length > 0) {
          for (const slotType of MODEL_SLOT_TYPES) {
            if (state.modelSlots[slotType] === undefined) {
              state.modelSlots[slotType] = defaultModels[0].id
            }
          }
        }
      })
      .addCase(getSessionId.fulfilled, (state, action) => {
        console.log('got sessionId ', action.payload?.session_id)
        if (action.payload?.session_id) {
          state.sessionId = action.payload.session_id
        }
      })
  }
})

// Selectors
export const dfSelectors = {
  getAllCharts: (state: DataFormulatorState) => state.charts,
  getAllTables: (state: DataFormulatorState) => state.tables,
  getFocusedChart: (state: DataFormulatorState) =>
    state.charts.find((c) => c.id === state.focusedChartId),
  getFocusedTable: (state: DataFormulatorState) =>
    state.tables.find((t) => t.id === state.focusedTableId),
  getActiveModel: (state: DataFormulatorState) => {
    const generationModelId = state.modelSlots.generation
    return state.models.find((m) => m.id === generationModelId)
  },
  getConceptShelfItems: (state: DataFormulatorState) => state.conceptShelfItems,
  getMessages: (state: DataFormulatorState) => state.messages,
  getSessionId: (state: DataFormulatorState) => state.sessionId,
  getConfig: (state: DataFormulatorState) => state.config,
  getVisViewMode: (state: DataFormulatorState) => state.visViewMode
}

// Actions export
export const dataFormulatorActions = dataFormulatorSlice.actions

// Reducer export
export const dataFormulatorReducer = dataFormulatorSlice.reducer

export default dataFormulatorSlice.reducer