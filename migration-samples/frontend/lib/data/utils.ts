/**
 * Data Utilities - Data loading, parsing, and transformation utilities
 * Migrated from original utils.ts to Next.js with TypeScript
 */

import * as d3 from 'd3'
import Column from './column'
import { DictTable } from '@/lib/types/componentTypes'
import { CoerceType, TestType, Type } from './types'
import { ColumnTable } from './table'

// Load text data wrapper
export const loadTextDataWrapper = (title: string, text: string, fileType: string): DictTable | undefined => {
  const tableName = title
  
  let table = undefined
  if (fileType === 'text/csv' || fileType === 'text/tab-separated-values') {
    table = createTableFromText(tableName, text)
  } else if (fileType === 'application/json') {
    table = createTableFromFromObjectArray(tableName, JSON.parse(text), true)
  }
  return table
}

// Create table from CSV/TSV text
export const createTableFromText = (title: string, text: string): DictTable | undefined => {
  // Check for empty strings, bad data, anything else?
  if (!text || text.trim() === '') {
    console.log('Invalid text provided for data. Could not load.')
    return undefined
  }

  // Determine if the input text is tab or comma separated values
  // Compute the number of tabs and lines
  let tabNum = 0,
      lineNum = 0
  for (let i = 0; i < text.length; i++) {
    if (text.charAt(i) === '\t') tabNum++
    if (text.charAt(i) === '\n') lineNum++
  }

  // If one or more tab per line, then it is tab separated values
  const isTabSeparated = tabNum / lineNum >= 1

  // Use d3.dsvFormat to create a custom parser that properly handles quoted fields
  const rows = isTabSeparated 
    ? d3.tsvParseRows(text) 
    : d3.dsvFormat(',').parseRows(text, (row, index) => {
        return row
      })
  
  // Handle duplicate column names by appending _1, _2, etc.
  const colNames: string[] = []
  for (let i = 0; i < rows[0].length; i++) {
    let col = rows[0][i]   
    if (colNames.includes(col)) {
      let k = 1
      while (colNames.includes(`${col}_${k}`)) {
        k++
      }
      colNames.push(`${col}_${k}`)
    } else {
      colNames.push(col)
    }
  }

  const values = rows.slice(1)
  const records = values.map(row => {
    const record: any = {}
    for (let i = 0; i < colNames.length; i++) {
      record[colNames[i]] = row[i]
    }
    return record
  })
  
  return createTableFromFromObjectArray(title, records, true)
}

// Create table from object array
export const createTableFromFromObjectArray = (
  title: string, 
  values: any[], 
  anchored: boolean, 
  derive?: any
): DictTable => {
  const len = values.length
  let names: string[] = []
  let cleanNames: string[] = []
  const columns = new Map<string, Column>()

  if (len) {
    names = Object.keys(values[0])
    cleanNames = names.map((name, i) => {
      if (name === '') {
        let newName = `c${i}`
        let k = 0
        while (names.includes(newName)) {
          newName = `c${i}_${k}`
          k = k + 1
        } 
        return newName
      }
      // clean up messy column names
      if (name && name.includes('.')) {
        return name.replace('.', '_')
      }
      return name
    })

    for (let i = 0; i < names.length; i++) {
      const col = []
      for (let r = 0; r < len; r++) {
        col.push(values[r][names[i]])
      }
      const type = inferTypeFromValueArray(col)
      const coercedCol = coerceValueArrayFromTypes(col, type)
      columns.set(cleanNames[i], new Column(coercedCol, type))
    }
  }

  const columnTable = new ColumnTable(columns, cleanNames)

  return {
    id: title,
    displayId: `${title}`,
    names: columnTable.names(),
    types: columnTable.names().map(name => (columnTable.column(name) as Column).type),
    rows: columnTable.objects(),
    derive: derive,
    anchored: anchored,
    explorativeQuestions: []
  }
}

// Infer type from value array
export const inferTypeFromValueArray = (values: any[]): Type => {
  let types: Type[] = [Type.Boolean, Type.Integer, Type.Date, Type.Number, Type.String]

  for (let i = 0; i < values.length; i++) {
    const v = values[i]

    for (let t = 0; t < types.length; t++) {
      if (v != null && !TestType[types[t]](v)) {
        types.splice(t, 1)
        t -= 1
      }
    }
  }

  return types[0] || Type.String
}

// Coerce value array to specific type
export const coerceValueArrayFromTypes = (values: any[], type: Type): any[] => {
  return values.map((v) => CoerceType[type](v))
}

// Coerce single value to specific type
export const coerceValueFromTypes = (value: any, type: Type): any => {
  return CoerceType[type](value)
}

// Compute unique values
export const computeUniqueValues = (values: any[]): any[] => {
  return Array.from(new Set(values))
}

// Check if two tuples are equal
export function tupleEqual(a: any[], b: any[]): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false
  }
  return true
}

// Load binary data (Excel files) - Note: XLSX would need to be added to package.json
export const loadBinaryDataWrapper = async (title: string, arrayBuffer: ArrayBuffer): Promise<DictTable[]> => {
  try {
    // Dynamic import for XLSX to avoid SSR issues
    const XLSX = await import('xlsx')
    
    // Read the Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // Get all sheet names
    const sheetNames = workbook.SheetNames
    
    // Create tables for each sheet
    const tables: DictTable[] = []
    
    for (const sheetName of sheetNames) {
      // Get the worksheet
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert the worksheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // Create a table from the JSON data with sheet name included in the title
      const sheetTable = createTableFromFromObjectArray(`${title}-${sheetName}`, jsonData, true)
      tables.push(sheetTable)
    }
    
    return tables
  } catch (error) {
    console.error('Error processing Excel file:', error)
    return []
  }
}

// Additional utility functions for data manipulation
export const sampleRows = (data: any[], sampleSize: number): any[] => {
  if (data.length <= sampleSize) return data
  
  const sampled = []
  const step = Math.floor(data.length / sampleSize)
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i])
    if (sampled.length >= sampleSize) break
  }
  
  return sampled
}

export const filterRowsByCondition = (data: any[], condition: (row: any) => boolean): any[] => {
  return data.filter(condition)
}

export const sortRowsByColumn = (data: any[], columnName: string, ascending: boolean = true): any[] => {
  return [...data].sort((a, b) => {
    const aVal = a[columnName]
    const bVal = b[columnName]
    
    if (aVal === bVal) return 0
    
    const comparison = aVal < bVal ? -1 : 1
    return ascending ? comparison : -comparison
  })
}

export const groupRowsByColumn = (data: any[], columnName: string): Record<string, any[]> => {
  const groups: Record<string, any[]> = {}
  
  for (const row of data) {
    const key = String(row[columnName])
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(row)
  }
  
  return groups
}

export const aggregateColumn = (
  data: any[], 
  columnName: string, 
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count'
): number => {
  const values = data.map(row => row[columnName]).filter(v => v != null && !isNaN(Number(v)))
  
  if (values.length === 0) return 0
  
  switch (operation) {
    case 'sum':
      return values.reduce((acc, val) => acc + Number(val), 0)
    case 'avg':
      return values.reduce((acc, val) => acc + Number(val), 0) / values.length
    case 'min':
      return Math.min(...values.map(Number))
    case 'max':
      return Math.max(...values.map(Number))
    case 'count':
      return values.length
    default:
      return 0
  }
}

// Export common patterns
export const CSV_MIME_TYPES = ['text/csv', 'application/csv']
export const JSON_MIME_TYPES = ['application/json', 'text/json']
export const EXCEL_MIME_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]