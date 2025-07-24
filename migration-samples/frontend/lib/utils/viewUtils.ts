/**
 * ViewUtils - Utility functions for data processing and UI helpers
 * Migrated from original ViewUtils.tsx to Next.js with Tailwind
 */

import React from 'react'

// MUI Icons
import {
  Numbers as NumericalIcon,
  TextFields as StringIcon,
  CalendarToday as DateIcon,
  CheckBox as BooleanIcon,
  AutoFixHigh as AutoFixHighIcon,
  Help as UnknownIcon,
} from '@mui/icons-material'

// Types
export interface FieldItem {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'auto'
  domain: any[]
  description?: string
  source: 'original' | 'custom' | 'derived'
  tableRef: string
  transform?: ConceptTransformation
  semanticType?: string
  levels?: { values: any[], reason: string }
}

export interface ConceptTransformation {
  parentIDs: string[]
  code: string
  description: string
}

export interface DictTable {
  id: string
  displayId?: string
  names: string[]
  rows: any[]
  derive?: {
    code: string
    source: string[]
    trigger?: any
  }
  virtual?: {
    tableId: string
    rowCount: number
  }
}

export type Type = 'string' | 'number' | 'date' | 'boolean' | 'auto'

/**
 * Extract domains from a list of tables for a given field
 * @param field - The field to extract domains for
 * @param tables - List of available tables
 * @returns Array of unique domains for the field
 */
export const getDomains = (field: FieldItem, tables: DictTable[]): any[][] => {
  // Find tables that contain the field
  let domains = tables
    .filter(t => t.rows.length > 0 && Object.keys(t.rows[0]).includes(field.name))
    .map(t => [...new Set(t.rows.map(row => row[field.name]))])
  
  // Remove duplicate domains by comparing sorted versions
  domains = domains.filter((d, i) => {
    return !domains.slice(0, i).some(prevD => 
      JSON.stringify(prevD.slice().sort()) === JSON.stringify(d.slice().sort())
    )
  })
  
  // Return empty array wrapped if no domains found
  return domains.length === 0 ? [[]] : domains
}

/**
 * Group concept items by their source table
 * @param conceptShelfItems - List of concept items
 * @param tables - List of available tables
 * @returns Grouped concept items with group labels
 */
export const groupConceptItems = (
  conceptShelfItems: FieldItem[], 
  tables: DictTable[]
): Array<{ group: string; field: FieldItem }> => {
  return conceptShelfItems.map(f => {
    let group = ""
    
    if (f.source === "original") {
      group = tables.find(t => t.id === f.tableRef)?.displayId || f.tableRef
    } else if (f.source === "custom") {
      group = "new fields"
    } else if (f.source === "derived") {
      group = tables.find(t => t.id === f.tableRef)?.displayId || f.tableRef
    }
    
    return { group, field: f }
  })
}

/**
 * Get appropriate icon for a data type
 * @param type - The data type
 * @returns React JSX element for the icon
 */
export const getIconFromType = (type: Type | undefined): JSX.Element => {
  switch (type) {
    case 'boolean':
      return React.createElement(BooleanIcon, { fontSize: "inherit" })
    case 'date':
      return React.createElement(DateIcon, { fontSize: "inherit" })
    case 'number':
      return React.createElement(NumericalIcon, { fontSize: "inherit" })
    case 'string':
      return React.createElement(StringIcon, { fontSize: "inherit" })
    case 'auto':
      return React.createElement(AutoFixHighIcon, { fontSize: "inherit" })
    default:
      return React.createElement(UnknownIcon, { fontSize: "inherit" })
  }
}

/**
 * Infer data type from sample values
 * @param values - Array of sample values
 * @returns Inferred data type
 */
export const inferDataType = (values: any[]): Type => {
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

/**
 * Format value for display based on its type
 * @param value - The value to format
 * @param type - The data type
 * @returns Formatted string value
 */
export const formatValue = (value: any, type: Type): string => {
  if (value == null || value === '') return ''
  
  switch (type) {
    case 'number':
      const num = Number(value)
      if (isNaN(num)) return String(value)
      return num % 1 === 0 ? num.toString() : num.toFixed(2)
      
    case 'date':
      const date = new Date(value)
      if (isNaN(date.getTime())) return String(value)
      return date.toLocaleDateString()
      
    case 'boolean':
      if (typeof value === 'boolean') return value.toString()
      return String(value).toLowerCase() === 'true' ? 'true' : 'false'
      
    default:
      return String(value)
  }
}

/**
 * Get color class for field source type
 * @param source - The field source type
 * @returns Tailwind CSS color classes
 */
export const getSourceColorClass = (source: string): string => {
  switch (source) {
    case 'original':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'custom':
      return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'derived':
      return 'text-green-600 bg-green-50 border-green-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

/**
 * Validate field name for concept creation
 * @param name - The field name to validate
 * @param existingFields - List of existing field names
 * @returns Validation result with error message if invalid
 */
export const validateFieldName = (
  name: string, 
  existingFields: string[]
): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Field name cannot be empty' }
  }
  
  const trimmedName = name.trim()
  
  if (existingFields.includes(trimmedName)) {
    return { isValid: false, error: 'Field name already exists' }
  }
  
  // Check for valid identifier (letters, numbers, underscore, no spaces)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
    return { 
      isValid: false, 
      error: 'Field name must start with a letter or underscore and contain only letters, numbers, and underscores' 
    }
  }
  
  return { isValid: true }
}

/**
 * Generate unique field ID
 * @param prefix - Prefix for the ID
 * @returns Unique field ID
 */
export const generateFieldId = (prefix: string = 'field'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === "object") {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

/**
 * Debounce function calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 * @param value - Value to check
 * @returns True if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}