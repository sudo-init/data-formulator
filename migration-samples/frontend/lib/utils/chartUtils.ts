/**
 * Chart Utilities - Core chart assembly and data processing utilities
 * Migrated from original utils.tsx to Next.js with TypeScript
 */

import * as d3 from 'd3'
import { getChartTemplate } from '@/lib/constants/ChartTemplates'
import { 
  Channel, 
  Chart, 
  ChartTemplate, 
  EncodingItem, 
  EncodingMap, 
  FieldItem,
  DataType
} from '@/lib/types/componentTypes'

// API URL configuration
export function getUrls() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  return {
    // Session management
    GET_SESSION_ID: `${baseUrl}/api/get-session-id`,
    APP_CONFIG: `${baseUrl}/api/app-config`,
    AUTH_INFO_PREFIX: `${baseUrl}/api/.auth/`,

    // Vega datasets
    VEGA_DATASET_LIST: `${baseUrl}/api/vega-datasets`,
    VEGA_DATASET_REQUEST_PREFIX: `${baseUrl}/api/vega-dataset/`,

    // AI agent endpoints
    CHECK_AVAILABLE_MODELS: `${baseUrl}/api/agent/check-available-models`,
    TEST_MODEL: `${baseUrl}/api/agent/test-model`,
    RUN_AGENT: `${baseUrl}/api/agent/run`,
    DERIVE_CONCEPT_URL: `${baseUrl}/api/agent/derive-concept-request`,
    DERIVE_PY_CONCEPT: `${baseUrl}/api/agent/derive-py-concept`,
    SORT_DATA_URL: `${baseUrl}/api/agent/sort-data`,
    CLEAN_DATA_URL: `${baseUrl}/api/agent/clean-data`,
    CODE_EXPL_URL: `${baseUrl}/api/agent/code-expl`,
    SERVER_PROCESS_DATA_ON_LOAD: `${baseUrl}/api/agent/process-data-on-load`,
    DERIVE_DATA: `${baseUrl}/api/agent/derive-data`,
    REFINE_DATA: `${baseUrl}/api/agent/refine-data`,
    QUERY_COMPLETION: `${baseUrl}/api/agent/query-completion`,

    // Database endpoints
    UPLOAD_DB_FILE: `${baseUrl}/api/tables/upload-db-file`,
    DOWNLOAD_DB_FILE: `${baseUrl}/api/tables/download-db-file`,
    RESET_DB_FILE: `${baseUrl}/api/tables/reset-db-file`,
    LIST_TABLES: `${baseUrl}/api/tables/list-tables`,
    TABLE_DATA: `${baseUrl}/api/tables/get-table`,
    CREATE_TABLE: `${baseUrl}/api/tables/create-table`,
    DELETE_TABLE: `${baseUrl}/api/tables/delete-table`,
    GET_COLUMN_STATS: `${baseUrl}/api/tables/analyze`,
    QUERY_TABLE: `${baseUrl}/api/tables/query`,
    SAMPLE_TABLE: `${baseUrl}/api/tables/sample-table`,

    // Data loader endpoints
    DATA_LOADER_LIST_DATA_LOADERS: `${baseUrl}/api/tables/data-loader/list-data-loaders`,
    DATA_LOADER_LIST_TABLES: `${baseUrl}/api/tables/data-loader/list-tables`,
    DATA_LOADER_INGEST_DATA: `${baseUrl}/api/tables/data-loader/ingest-data`,
    DATA_LOADER_VIEW_QUERY_SAMPLE: `${baseUrl}/api/tables/data-loader/view-query-sample`,
    DATA_LOADER_INGEST_DATA_FROM_QUERY: `${baseUrl}/api/tables/data-loader/ingest-data-from-query`
  }
}

// Type inference utility
export function getDType(type: DataType, values: any[]): string {
  if (type === 'auto') {
    const nonNullValues = values.filter(v => v != null && v !== '')
    if (nonNullValues.length === 0) return 'nominal'
    
    // Check if all values are boolean
    if (nonNullValues.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
      return 'nominal'
    }
    
    // Check if all values are numbers
    if (nonNullValues.every(v => !isNaN(Number(v)) && isFinite(Number(v)))) {
      return 'quantitative'
    }
    
    // Check if all values are dates
    if (nonNullValues.every(v => !isNaN(Date.parse(v)))) {
      return 'temporal'
    }
    
    return 'nominal'
  }
  
  switch (type) {
    case 'number': return 'quantitative'
    case 'date': return 'temporal'
    case 'boolean':
    case 'string':
    default:
      return 'nominal'
  }
}

// Code execution utilities (simplified for browser environment)
export function runCodeOnInputListsInVM(
  code: string, 
  inputTupleList: any[][], 
  mode: 'faster' | 'safer' = 'faster'
): [any[], any][] {
  'use strict'
  
  const ioPairs: [any[], any][] = inputTupleList.map(args => [args, undefined])
  
  if (!code) return ioPairs
  
  try {
    // Simplified execution for browser environment
    // In production, this should use a more secure sandbox
    const func = new Function('...args', `return (${code})(...args)`)
    
    return inputTupleList.map(args => {
      let target = undefined
      try {
        target = func(...structuredClone(args))
      } catch (err) {
        console.warn(`Execution error: ${err}`)
      }
      return [args, target]
    })
  } catch (err) {
    console.warn(`Code compilation error: ${err}`)
    return ioPairs
  }
}

// Extract fields from encoding map for aggregation
export function extractFieldsFromEncodingMap(
  encodingMap: EncodingMap, 
  allFields: FieldItem[]
): { aggregateFields: [string | undefined, string][]; groupByFields: string[] } {
  const aggregateFields: [string | undefined, string][] = []
  const groupByFields: string[] = []
  
  for (const [channel, encoding] of Object.entries(encodingMap)) {
    const field = encoding.fieldID 
      ? allFields.find(f => f.id === encoding.fieldID) 
      : undefined
      
    if (encoding.aggregate) {
      aggregateFields.push([field?.name, encoding.aggregate])
    } else if (field) {
      groupByFields.push(field.name)
    }
  }

  return { aggregateFields, groupByFields }
}

// Prepare visualization table with aggregations
export function prepVisTable(
  table: any[], 
  allFields: FieldItem[], 
  encodingMap: EncodingMap
): any[] {
  const { aggregateFields, groupByFields } = extractFieldsFromEncodingMap(encodingMap, allFields)
  
  let processedTable = [...table]
  let result = processedTable

  if (aggregateFields.length > 0) {
    // Group by and aggregate
    let grouped: any[]
    
    if (groupByFields.length > 0) {
      grouped = d3.flatGroup(processedTable, ...groupByFields.map(field => (d: any) => d[field]))
    } else {
      grouped = [['_default', processedTable]]
    }

    result = grouped.map(row => {
      const groupValues = row.slice(0, -1)
      const group = row[row.length - 1]
      
      return {
        // Add group by fields
        ...Object.fromEntries(groupByFields.map((field, i) => [field, groupValues[i]])),
        // Add count aggregation
        ...(aggregateFields.some(([_, type]) => type === 'count') 
          ? { _count: group.length } 
          : {}),
        // Add other aggregations
        ...Object.fromEntries(
          aggregateFields
            .filter(([fieldName, aggType]) => aggType !== 'count' && fieldName)
            .map(([fieldName, aggType]) => {
              const values = group.map((r: any) => r[fieldName!])
              const suffix = `_${aggType}`
              
              const aggFunc = {
                'sum': d3.sum,
                'max': d3.max,
                'min': d3.min,
                'mean': d3.mean,
                'median': d3.median,
                'average': d3.mean,
                'mode': d3.mode
              }[aggType as keyof typeof aggFunc] as (values: any[]) => number | undefined
              
              return [fieldName + suffix, aggFunc ? aggFunc(values) : undefined]
            })
        )
      }
    })
  }

  return result
}

// Main chart assembly function
export const assembleVegaChart = (
  chartType: string,
  encodingMap: EncodingMap,
  conceptShelfItems: FieldItem[],
  workingTable: any[],
  maxNominalValues: number = 68,
  aggrPreprocessed: boolean = false
): [string, any] => {
  
  if (chartType === 'Table') {
    return ['Table', undefined]
  }

  const chartTemplate = getChartTemplate(chartType) as ChartTemplate
  if (!chartTemplate) {
    throw new Error(`Chart template not found for type: ${chartType}`)
  }

  let vgObj = structuredClone(chartTemplate.template)

  // Process each encoding channel
  for (const [channel, encoding] of Object.entries(encodingMap)) {
    let encodingObj: any = {}

    if (channel === 'radius') {
      encodingObj.scale = { type: 'sqrt', zero: true }
    }

    const field = encoding.fieldID 
      ? conceptShelfItems.find(f => f.id === encoding.fieldID) 
      : undefined

    // Handle count aggregation for preprocessed data
    if (!field && encoding.aggregate === 'count' && aggrPreprocessed) {
      encodingObj.field = '_count'
      encodingObj.title = 'Count'
      encodingObj.type = 'quantitative'
    }
    
    if (field) {
      // Create the encoding
      encodingObj.field = field.name
      encodingObj.type = getDType(field.type, workingTable.map(r => r[field.name]))
      
      // Handle special semantic types
      if (field.semanticType === 'Year') {
        if (['color', 'size', 'column', 'row'].includes(channel)) {
          encodingObj.type = 'nominal'
        } else {
          encodingObj.type = 'temporal'
        }
      }

      // Handle aggregations
      if (aggrPreprocessed) {
        if (encoding.aggregate) {
          if (encoding.aggregate === 'count') {
            encodingObj.field = '_count'
            encodingObj.title = 'Count'
            encodingObj.type = 'quantitative'
          } else {
            encodingObj.field = `${field.name || ''}_${encoding.aggregate}`
            encodingObj.type = 'quantitative'
          }
        }
      } else {
        if (encoding.aggregate) {
          encodingObj.aggregate = encoding.aggregate
          if (encodingObj.aggregate === 'count') {
            encodingObj.title = 'Count'
          }
        }
      }

      // Special handling for line charts
      if (encodingObj.type === 'quantitative' && chartType.includes('Line') && channel === 'x') {
        encodingObj.scale = { nice: false }
      }

      // Handle color encoding for nominal fields
      if (encodingObj.type === 'nominal' && channel === 'color') {
        const actualDomain = [...new Set(workingTable.map(r => r[field.name]))]
        
        if (actualDomain.every(v => field.domain.includes(v)) && field.domain.length > actualDomain.length) {
          const scaleValues = [...new Set(field.domain)].sort()
          const legendValues = actualDomain.sort()

          encodingObj.scale = { domain: scaleValues }
          encodingObj.legend = { values: legendValues }
        }

        if (actualDomain.length >= 16) {
          if (!encodingObj.legend) encodingObj.legend = {}
          encodingObj.legend.symbolSize = 12
          encodingObj.legend.labelFontSize = 8
        }

        if ([...new Set(field.domain)].length >= 16) {
          if (!encodingObj.scale) encodingObj.scale = {}
          encodingObj.scale.scheme = 'tableau20'
        }
      }
    }
    
    // Handle sorting
    if (encoding.sortBy || encoding.sortOrder) {
      const sortOrder = encoding.sortOrder || 'ascending'

      if (!encoding.sortBy || encoding.sortBy === 'default') {
        encodingObj.sort = sortOrder
      } else if (encoding.sortBy === 'x' || encoding.sortBy === 'y') {
        encodingObj.sort = `${sortOrder === 'ascending' ? '' : '-'}${encoding.sortBy}`
      } else {
        try {
          const sortedValues = JSON.parse(encoding.sortBy).values
          encodingObj.sort = sortOrder === 'ascending' ? sortedValues : sortedValues.reverse()

          // Special handling for stacked charts
          if (channel === 'color' && (vgObj.mark === 'bar' || vgObj.mark === 'area')) {
            vgObj.encoding = vgObj.encoding || {}
            vgObj.encoding.order = {
              field: `color_${field?.name}_sort_index`
            }
          }
        } catch {
          console.warn(`Sort error: ${encoding.sortBy}`)
        }
      }
    }

    // Handle stacking
    if (encoding.stack) {
      encodingObj.stack = encoding.stack === 'layered' ? null : encoding.stack
    }

    // Handle color schemes
    if (encoding.scheme) {
      if ('scale' in encodingObj) {
        encodingObj.scale.scheme = encoding.scheme
      } else {
        encodingObj.scale = { scheme: encoding.scheme }
      }
    }

    // Apply encoding to chart template paths
    if (Object.keys(encodingObj).length !== 0 && chartTemplate.paths[channel as Channel]) {
      const pathObj = chartTemplate.paths[channel as Channel]
      let paths: (string | number)[][]
      
      if (pathObj.length > 0 && Array.isArray(pathObj[0])) {
        paths = pathObj as (string | number)[][]
      } else {
        paths = [pathObj as (string | number)[]]
      }
      
      // Fill the template with encoding objects
      for (const path of paths) {
        let ref = vgObj
        for (const key of path.slice(0, path.length - 1)) {
          ref = ref[key]
        }

        const lastKey = path[path.length - 1]
        if (typeof ref[lastKey] === 'string') {
          ref[lastKey] = encodingObj.field
        } else {
          const prebuiltEntries = ref[lastKey] ? Object.entries(ref[lastKey]) : []
          ref[lastKey] = Object.fromEntries([...prebuiltEntries, ...Object.entries(encodingObj)])
        }
      }
    }
  }

  // Handle faceting
  if (vgObj.encoding?.column && !vgObj.encoding?.row) {
    vgObj.encoding.facet = vgObj.encoding.column
    vgObj.encoding.facet.columns = 6
    delete vgObj.encoding.column
  }

  // Apply post processor
  if (chartTemplate.postProcessor) {
    vgObj = chartTemplate.postProcessor(vgObj, workingTable)
  }

  // Prepare data values
  let values = structuredClone(workingTable)
  values = values.map((r: any) => {
    const keys = Object.keys(r)
    const temporalKeys = keys.filter((k: string) => 
      conceptShelfItems.some(concept => 
        concept.name === k && (concept.type === 'date' || concept.semanticType === 'Year')
      )
    )
    
    for (const temporalKey of temporalKeys) {
      r[temporalKey] = String(r[temporalKey])
    }
    return r
  })

  // Handle nominal axes with many entries
  for (const channel of ['x', 'y', 'column', 'row', 'xOffset']) {
    const encoding = vgObj.encoding?.[channel]
    if (encoding?.type === 'nominal') {
      const fieldName = encoding.field
      if (fieldName) {
        const uniqueValues = [...new Set(values.map(r => r[fieldName]))]
        if (uniqueValues.length > maxNominalValues) {
          console.warn(`Too many nominal values for ${channel}: ${uniqueValues.length}`)
        }
      }
    }
  }

  // Add data to vega specification
  vgObj.data = { values }

  return [chartType, vgObj]
}

// Utility function for previous value hook
export function usePrevious<T>(value: T): T | undefined {
  const { useRef, useEffect } = require('react')
  const ref = useRef<T>()
  
  useEffect(() => {
    ref.current = value
  })
  
  return ref.current
}

// Export utilities for chart validation and manipulation
export const validateChart = (chart: Chart, fields: FieldItem[]): boolean => {
  try {
    const template = getChartTemplate(chart.chartType)
    if (!template) return false
    
    // Check if required channels are filled
    const requiredChannels = template.channels.slice(0, 2) // Usually x and y are required
    for (const channel of requiredChannels) {
      const encoding = chart.encodingMap[channel as Channel]
      if (!encoding?.fieldID) return false
      
      const field = fields.find(f => f.id === encoding.fieldID)
      if (!field) return false
    }
    
    return true
  } catch {
    return false
  }
}

export const getChartDataRequirements = (chartType: string): {
  minFields: number
  requiredChannels: string[]
  optionalChannels: string[]
} => {
  const template = getChartTemplate(chartType)
  if (!template) {
    return { minFields: 0, requiredChannels: [], optionalChannels: [] }
  }
  
  const channels = template.channels
  return {
    minFields: Math.min(2, channels.length),
    requiredChannels: channels.slice(0, 2),
    optionalChannels: channels.slice(2)
  }
}