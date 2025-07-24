/**
 * Table Classes - Data table management with column-based storage
 * Migrated from original table.ts to Next.js with TypeScript
 */

import Column from './column'
import { Type } from './types'

const columnsToObjects = (columns: Map<string, Column>, names: string[], nrows: number): any[] => {
  const objects = []
  for (let r = 0; r < nrows; r++) {
    const o: any = {}
    for (let c = 0; c < names.length; c++) {
      o[names[c]] = columns.get(names[c])?.get(r)
    }
    objects.push(o)
  }
  return objects
}

export class ColumnTable {
  protected _data: Map<string, Column>
  protected _names: string[]
  protected _objects: any[]
  protected _nrows: number

  constructor(columns: Map<string, Column>, names: string[]) {
    this._data = columns
    this._names = names
    const nrows = columns.get(names[0])?.length
    this._nrows = nrows ? nrows : 0
    this._objects = columnsToObjects(this._data, this._names, this._nrows)
  }

  public numCols = (): number => {
    return this._names.length
  }

  public numRows = (): number => {
    return this._nrows
  }

  public column = (name: string): Column | undefined => {
    return this._data.get(name)
  }

  public columnAt = (col: number): Column | undefined => {
    return this._data.get(this._names[col])
  }

  public columns = (): Map<string, Column> => {
    return this._data
  }

  public objects = (): any[] => {
    return this._objects
  }

  public names = (): string[] => {
    return this._names
  }

  public metadata = (): [string, Type][] => {
    return this._names.map((name) => [name, (this.column(name) as Column).type])
  }

  public get = (name: string, row: number = 0): any => {
    const column = this.column(name)
    return column?.get(row)
  }

  // Additional utility methods
  public hasColumn(name: string): boolean {
    return this._data.has(name)
  }

  public addColumn(name: string, column: Column): void {
    if (column.length !== this._nrows) {
      throw new Error(`Column length ${column.length} does not match table rows ${this._nrows}`)
    }
    this._data.set(name, column)
    this._names.push(name)
    this._objects = columnsToObjects(this._data, this._names, this._nrows)
  }

  public removeColumn(name: string): boolean {
    if (this._data.has(name)) {
      this._data.delete(name)
      this._names = this._names.filter(n => n !== name)
      this._objects = columnsToObjects(this._data, this._names, this._nrows)
      return true
    }
    return false
  }

  public renameColumn(oldName: string, newName: string): boolean {
    if (this._data.has(oldName) && !this._data.has(newName)) {
      const column = this._data.get(oldName)
      if (column) {
        this._data.delete(oldName)
        this._data.set(newName, column)
        const index = this._names.indexOf(oldName)
        if (index !== -1) {
          this._names[index] = newName
        }
        this._objects = columnsToObjects(this._data, this._names, this._nrows)
        return true
      }
    }
    return false
  }

  public slice(start?: number, end?: number): any[] {
    return this._objects.slice(start, end)
  }

  public filter(callback: (row: any, index: number) => boolean): any[] {
    return this._objects.filter(callback)
  }

  public map<T>(callback: (row: any, index: number) => T): T[] {
    return this._objects.map(callback)
  }

  public find(callback: (row: any, index: number) => boolean): any {
    return this._objects.find(callback)
  }

  public clone(): ColumnTable {
    const newColumns = new Map<string, Column>()
    for (const [name, column] of this._data) {
      newColumns.set(name, new Column([...column.data], column.type))
    }
    return new ColumnTable(newColumns, [...this._names])
  }
}