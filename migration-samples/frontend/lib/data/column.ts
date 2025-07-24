/**
 * Column Class - Data column with type information and utilities
 * Migrated from original column.ts to Next.js with TypeScript
 */

import { Type } from './types'
import { computeUniqueValues } from './utils'

export default class Column {
  protected _data: any[]
  protected _type: Type
  protected _uniques: any[]

  constructor(data: any[], type?: Type) {
    this._data = data
    this._type = type || Type.String
    // Should sort uniques based on type?
    this._uniques = computeUniqueValues(this._data)
  }

  get uniques(): any[] {
    return this._uniques
  }

  get type(): Type {
    return this._type
  }

  get length(): number {
    return this._data.length
  }

  get(row: number): any {
    return this._data[row]
  }

  // Additional utility methods
  get data(): any[] {
    return this._data
  }

  slice(start?: number, end?: number): any[] {
    return this._data.slice(start, end)
  }

  map<T>(callback: (value: any, index: number) => T): T[] {
    return this._data.map(callback)
  }

  filter(callback: (value: any, index: number) => boolean): any[] {
    return this._data.filter(callback)
  }

  find(callback: (value: any, index: number) => boolean): any {
    return this._data.find(callback)
  }

  includes(value: any): boolean {
    return this._data.includes(value)
  }

  indexOf(value: any): number {
    return this._data.indexOf(value)
  }
}