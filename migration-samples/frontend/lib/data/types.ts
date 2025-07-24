/**
 * Data Types - Type definitions and utilities for data processing
 * Migrated from original types.ts to Next.js with TypeScript
 */

export enum Type {
  String = 'string',
  Boolean = 'boolean',
  Integer = 'integer',
  Number = 'number',
  Date = 'date',
  Auto = 'auto'
}

export const TypeList = [Type.Auto, Type.Number, Type.Date, Type.String]

// Type coercion functions
const coerceBoolean = (v: any): boolean | null => 
  v == null || v === '' ? null : v === 'false' ? false : !!v

const coerceNumber = (v: any): number | null => 
  v == null || v === '' ? null : +v

const coerceDate = (v: any, format?: any) => {
  // TODO: follow the standard date format
  return v
}

const coerceString = (v: any) => 
  v == null || v === '' ? null : v

export const CoerceType = {
  boolean: coerceBoolean,
  number: coerceNumber,
  integer: coerceNumber,
  date: coerceDate,
  string: coerceString,
  auto: coerceString,
}

// Type testing functions
const testBoolean = (v: any): boolean => 
  v === 'true' || v === 'false' || isBoolean(v)

const testNumber = (v: any): boolean => 
  !isNaN(+v) && !isDate(v)

const testInteger = (v: any): boolean => 
  testNumber(v) && (v = +v) === ~~v

const testDate = (v: any): boolean => 
  !isNaN(Date.parse(v))

const testString = (v: any): boolean => 
  true

export const TestType = {
  boolean: testBoolean,
  number: testNumber,
  integer: testInteger,
  date: testDate,
  string: testString,
  auto: testString,
}

// Type checking utilities
export const isBoolean = (v: any) => 
  v === true || v === false || Object.prototype.toString.call(v) === '[object Boolean]'

export const isNumber = (v: any) => 
  typeof v === 'number' || Object.prototype.toString.call(v) === '[object Number]'

export const isDate = (v: any) => 
  Object.prototype.toString.call(v) === '[object Date]'

// Convert Type to Vega-Lite data type
export const getDType = (type: Type | undefined, domain: any[]): string => {
  return type === Type.Integer || type === Type.Number ? 'quantitative'
    : type === Type.Boolean ? 'nominal'
    : type === Type.Date ? 'temporal'
    : type === Type.String ? 'nominal'
    : type === Type.Auto ? getDType(testType(domain) as Type, domain)
    : 'nominal'
}

// Infer type from array of values
export const testType = (values: any[]): string => {
  if (values.length === 0) {
    return 'string'
  }
  if (values.filter(v => !isBoolean(v)).length === 0) {
    return 'boolean'
  }
  if (values.filter(v => !testNumber(v)).length === 0) {
    return 'number'
  }
  if (values.filter(v => !testDate(v)).length === 0) {
    return 'date'
  }
  return 'string'
}

// Convert Type to simple dtype string
export const convertTypeToDtype = (type: Type | undefined): string => {
  return type === Type.Integer || type === Type.Number
    ? 'quantitative'
    : type === Type.Boolean
    ? 'boolean'
    : type === Type.Date
    ? 'date'
    : 'nominal'
}