/**
 * Component Types - Core type definitions for Data Formulator
 * Migrated from original ComponentType.tsx to Next.js with TypeScript
 */

// Basic data types
export type DataType = 'string' | 'number' | 'date' | 'boolean' | 'auto'
export type FieldSource = 'original' | 'derived' | 'custom'
export type ChartSource = 'user' | 'trigger'

// Aggregation operations
export const AGGR_OP_LIST = ['count', 'sum', 'average', 'mean', 'median', 'min', 'max', 'distinct'] as const
export type AggrOp = typeof AGGR_OP_LIST[number]

// Chart channels
export const CHANNEL_LIST = ['x', 'y', 'color', 'size', 'shape', 'opacity', 'row', 'column'] as const
export type Channel = typeof CHANNEL_LIST[number]

// Concept Transformation interface
export interface ConceptTransformation {
  parentIDs: string[]
  description: string
  code: string
}

// Field Item interface
export interface FieldItem {
  id: string
  name: string
  type: DataType
  source: FieldSource
  domain: any[]
  tableRef: string // which table it belongs to
  transform?: ConceptTransformation
  temporary?: boolean // the field is temporary, and will be deleted unless saved
  levels?: { values: any[], reason: string } // sort order for field values
  semanticType?: string // semantic type inferred by model
  description?: string // field description
}

// Utility function to duplicate a field
export const duplicateField = (field: FieldItem): FieldItem => {
  return {
    id: field.id,
    name: field.name,
    type: field.type,
    source: field.source,
    domain: [...field.domain],
    transform: field.transform ? { ...field.transform } : undefined,
    tableRef: field.tableRef,
    temporary: field.temporary,
    levels: field.levels ? { ...field.levels } : undefined,
    semanticType: field.semanticType,
    description: field.description
  }
}

// Trigger interface for data formulation
export interface Trigger {
  tableId: string // on which table this action is triggered
  sourceTableIds: string[] // which tables are used in the trigger
  chart?: Chart // intended chart from user when running formulation
  instruction: string
  resultTableId: string
}

// Dictionary Table interface
export interface DictTable {
  id: string // name/id of the table
  displayId: string // display id of the table
  names: string[] // column names
  types: DataType[] // column types
  rows: any[] // table content, each entry is a row
  derive?: {
    source: string[] // which tables this table is computed from
    code: string
    codeExpl: string
    dialog: any[] // LLM conversation log for derivation
    trigger: Trigger
  }
  virtual?: {
    tableId: string // id of virtual table in database
    rowCount: number // total number of rows in full table
  }
  anchored: boolean // whether table is anchored as persistent
  explorativeQuestions: string[] // 3-5 explorative questions for users
}

// Utility function to infer type from value array
const inferTypeFromValueArray = (values: any[]): DataType => {
  if (!values || values.length === 0) return 'auto'
  
  const nonNullValues = values.filter(v => v != null && v !== '')
  if (nonNullValues.length === 0) return 'auto'
  
  // Check if all values are boolean
  if (nonNullValues.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
    return 'boolean'
  }
  
  // Check if all values are numbers
  if (nonNullValues.every(v => !isNaN(Number(v)) && isFinite(Number(v)))) {
    return 'number'
  }
  
  // Check if all values are dates
  if (nonNullValues.every(v => !isNaN(Date.parse(v)))) {
    return 'date'
  }
  
  // Default to string
  return 'string'
}

// Factory function to create DictTable
export function createDictTable(
  id: string, 
  rows: any[], 
  derive?: {
    code: string
    codeExpl: string
    source: string[]
    dialog: any[]
    trigger: Trigger
  },
  virtual?: {
    tableId: string
    rowCount: number
  },
  anchored: boolean = false,
  explorativeQuestions: string[] = []
): DictTable {
  
  if (!rows || rows.length === 0) {
    return {
      id,
      displayId: id,
      names: [],
      rows: [],
      types: [],
      derive,
      virtual,
      anchored,
      explorativeQuestions
    }
  }
  
  const names = Object.keys(rows[0])
  
  return {
    id,
    displayId: id,
    names,
    rows,
    types: names.map(name => inferTypeFromValueArray(rows.map(r => r[name]))),
    derive,
    virtual,
    anchored,
    explorativeQuestions
  }
}

// Encoding Item interface
export interface EncodingItem {
  fieldID?: string // the field ID
  aggregate?: AggrOp
  stack?: 'layered' | 'zero' | 'center' | 'normalize'
  sortOrder?: 'ascending' | 'descending'
  sortBy?: string // what values are used to sort the encoding
  scheme?: string // color scheme
  bin?: boolean // whether to bin the data
  scale?: {
    type?: string
    domain?: any[]
    range?: any[]
  }
}

// Encoding Map type
export type EncodingMap = { [key in Channel]: EncodingItem }

// Chart interface
export interface Chart {
  id: string
  chartType: string
  encodingMap: EncodingMap
  tableRef: string
  saved: boolean
  source: ChartSource
  title?: string
  description?: string
  width?: number
  height?: number
}

// Utility function to duplicate a chart
export const duplicateChart = (chart: Chart): Chart => {
  return {
    id: `chart-${Date.now() - Math.floor(Math.random() * 10000)}`,
    chartType: chart.chartType,
    encodingMap: JSON.parse(JSON.stringify(chart.encodingMap)) as EncodingMap,
    tableRef: chart.tableRef,
    saved: false,
    source: chart.source,
    title: chart.title,
    description: chart.description,
    width: chart.width,
    height: chart.height
  }
}

// Chart Template interface
export interface ChartTemplate {
  chart: string
  icon: any
  template: any
  channels: string[]
  paths: { [key: string]: (string | number)[] | (string | number)[][] }
  postProcessor?: (vgSpec: any, table: any[]) => any
}

// Chart types
export const CHART_TYPES = [
  'Bar Chart',
  'Line Chart', 
  'Scatter Plot',
  'Area Chart',
  'Histogram',
  'Pie Chart',
  'Heatmap',
  'Boxplot',
  'Auto'
] as const

export type ChartType = typeof CHART_TYPES[number]

// Message interface for system communications
export interface Message {
  timestamp: number
  component: string
  type: 'success' | 'info' | 'error' | 'warning'
  value: string
  detail?: string
  code?: string
}

// Challenge interface for visualization challenges
export interface Challenge {
  tableId: string
  challenges: Array<{
    text: string
    difficulty: 'easy' | 'medium' | 'hard'
  }>
}

// Model configuration interface
export interface ModelConfig {
  id?: string
  name: string
  provider: string
  model?: string
  endpoint?: string
  api_key?: string
  apiKey?: string
  api_base?: string
  baseUrl?: string
  api_version?: string
  temperature?: number
  max_tokens?: number
  maxTokens?: number
}

// Agent types for AI operations
export const AGENT_TYPES = [
  'sql_data_rec',
  'python_data_transform',
  'chart_recommend',
  'field_semantic_type',
  'data_summary'
] as const

export type AgentType = typeof AGENT_TYPES[number]

// Agent request interface
export interface AgentRequest {
  agentType: AgentType
  prompt: string
  data: any
  tables: Record<string, DictTable>
  modelConfig: ModelConfig
  sessionId: string
}

// Agent response interface
export interface AgentResponse {
  status: 'ok' | 'error'
  content: any
  code?: string
  dialog?: any[]
  error?: string
}

// Session state interface
export interface SessionState {
  sessionId: string
  tables: Record<string, DictTable>
  conceptShelfItems: FieldItem[]
  charts: Chart[]
  messages: Message[]
  activeChallenges: Challenge[]
  selectedModel: ModelConfig | null
  focusedTableId: string | null
  isLoadingAgent: boolean
  displayedMessageIdx: number
}

// Utility functions
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const createEmptyEncodingMap = (): EncodingMap => {
  return CHANNEL_LIST.reduce((acc, channel) => {
    acc[channel] = {}
    return acc
  }, {} as EncodingMap)
}

export const createDefaultChart = (tableRef: string, chartType: string = 'Auto'): Chart => {
  return {
    id: generateId('chart'),
    chartType,
    encodingMap: createEmptyEncodingMap(),
    tableRef,
    saved: false,
    source: 'user'
  }
}

export const createDefaultField = (name: string, type: DataType = 'auto'): FieldItem => {
  return {
    id: generateId('field'),
    name,
    type,
    source: 'custom',
    domain: [],
    tableRef: 'custom'
  }
}

// Note: Types are already exported above, no need to re-export