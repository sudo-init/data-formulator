'use client'

/**
 * SelectableDataGrid component - Virtualized data grid with cell selection
 * Migrated from original SelectableDataGrid.tsx to Next.js with Tailwind
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Collapse,
  ToggleButton,
  TableSortLabel,
  CircularProgress,
  Chip,
  OutlinedInput,
  InputAdornment,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  ChevronLeft as ChevronLeftIcon,
  FileDownload as FileDownloadIcon,
  CloudQueue as CloudQueueIcon,
  Casino as CasinoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'

// Dynamic imports for heavy components
const TableVirtuoso = dynamic(
  () => import('react-virtuoso').then(mod => mod.TableVirtuoso),
  { 
    ssr: false, 
    loading: () => <div className="h-96 flex items-center justify-center"><CircularProgress /></div>
  }
)

// Types
export interface ColumnDef {
  id: string
  label: string
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'auto'
  minWidth?: number
  width?: number
  align?: 'left' | 'right' | 'center'
  format?: (value: any) => string | JSX.Element
  source: 'original' | 'derived' | 'custom'
}

interface SelectableDataGridProps {
  tableId: string
  tableName: string
  rows: any[]
  rowCount: number
  virtual?: boolean
  columnDefs: ColumnDef[]
  onSelectionFinished?: (columns: string[], values: any[]) => void
  className?: string
  height?: number
}

interface CellPosition {
  row: number
  col: number
}

// Utility functions
const getIconFromType = (type: string) => {
  const iconMap = {
    string: '📝',
    number: '🔢', 
    date: '📅',
    boolean: '☑️',
    auto: '🔄'
  }
  return iconMap[type as keyof typeof iconMap] || '❓'
}

const descendingComparator = <T,>(a: T, b: T, orderBy: keyof T) => {
  if (b[orderBy] < a[orderBy]) return -1
  if (b[orderBy] > a[orderBy]) return 1
  return 0
}

const getComparator = <Key extends keyof any>(
  order: 'asc' | 'desc',
  orderBy: Key,
): ((a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number) => {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

// Selectable Cell Component
const SelectableCell: React.FC<{
  value: any
  column: ColumnDef
  position: CellPosition
  isSelected: boolean
  searchMatch: string
  onClick: (position: CellPosition) => void
}> = ({ value, column, position, isSelected, searchMatch, onClick }) => {
  const theme = useTheme()
  
  const getBackgroundColor = () => {
    if (isSelected) return alpha(theme.palette.primary.main, 0.2)
    
    switch (column.source) {
      case 'derived':
        return alpha(theme.palette.success?.main || '#4caf50', 0.05)
      case 'custom':
        return alpha(theme.palette.secondary?.main || '#9c27b0', 0.05)
      default:
        return 'rgba(255,255,255,0.05)'
    }
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onClick(position)
  }, [position, onClick])

  // Highlight search matches
  const renderValue = () => {
    const valueStr = String(value || '')
    if (!searchMatch || !valueStr.includes(searchMatch)) {
      return valueStr
    }
    
    const matchIndex = valueStr.indexOf(searchMatch)
    return (
      <>
        {valueStr.substring(0, matchIndex)}
        <span className="font-bold bg-yellow-200">
          {searchMatch}
        </span>
        {valueStr.substring(matchIndex + searchMatch.length)}
      </>
    )
  }

  return (
    <TableCell
      className={`cursor-pointer transition-colors duration-150 ${
        isSelected ? 'ring-2 ring-blue-400' : 'hover:bg-gray-100'
      }`}
      style={{ backgroundColor: getBackgroundColor() }}
      align={column.align || 'left'}
      onClick={handleClick}
    >
      {renderValue()}
    </TableCell>
  )
}

// Main Component
export function SelectableDataGrid({
  tableId,
  tableName,
  rows,
  rowCount,
  virtual = false,
  columnDefs,
  onSelectionFinished,
  className = '',
  height = 400
}: SelectableDataGridProps) {
  
  const theme = useTheme()
  const dispatch = useAppDispatch()
  
  // State
  const [displayRows, setDisplayRows] = useState<any[]>(rows)
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([])
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined)
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [searchText, setSearchText] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [footerExpanded, setFooterExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchValue(searchText)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchText])
  
  // Filter and sort rows
  useEffect(() => {
    let filteredRows = rows.slice()
    
    // Apply search filter
    if (searchValue) {
      filteredRows = filteredRows.filter(row => 
        columnDefs.some(col => 
          String(row[col.id] || '').toLowerCase().includes(searchValue.toLowerCase())
        )
      )
    }
    
    // Apply sorting
    if (orderBy) {
      filteredRows.sort(getComparator(order, orderBy))
    }
    
    setDisplayRows(filteredRows)
  }, [rows, searchValue, order, orderBy, columnDefs])
  
  // Event handlers
  const handleCellClick = useCallback((position: CellPosition) => {
    setSelectedCells(prev => {
      const existingIndex = prev.findIndex(
        p => p.row === position.row && p.col === position.col
      )
      
      if (existingIndex >= 0) {
        // Remove if already selected
        return prev.filter((_, index) => index !== existingIndex)
      } else {
        // Add to selection
        return [...prev, position]
      }
    })
  }, [])
  
  const handleSort = useCallback((columnId: string) => {
    let newOrder: 'asc' | 'desc' = 'asc'
    let newOrderBy: string | undefined = columnId
    
    if (orderBy === columnId) {
      if (order === 'asc') {
        newOrder = 'desc'
      } else {
        // Clear sorting
        newOrder = 'asc'
        newOrderBy = undefined
      }
    }
    
    setOrder(newOrder)
    setOrderBy(newOrderBy)
    
    // For virtual tables, fetch sorted data from server
    if (virtual && newOrderBy) {
      fetchSortedVirtualData([newOrderBy], newOrder)
    }
  }, [orderBy, order, virtual])
  
  const fetchSortedVirtualData = useCallback(async (columns: string[], sortOrder: 'asc' | 'desc') => {
    setIsLoading(true)
    
    try {
      // Mock API call - replace with actual implementation
      console.log('Fetching sorted virtual data:', { columns, sortOrder })
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock sorted data
      const sortedRows = [...displayRows].sort((a, b) => {
        const col = columns[0]
        const aVal = a[col]
        const bVal = b[col]
        
        if (sortOrder === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
      })
      
      setDisplayRows(sortedRows)
    } catch (error) {
      console.error('Error fetching sorted data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [displayRows])
  
  const handleRandomSample = useCallback(async () => {
    if (!virtual) return
    
    setIsLoading(true)
    
    try {
      // Mock API call for random sampling
      console.log('Fetching random sample for table:', tableId)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Shuffle current rows as mock
      const shuffled = [...displayRows].sort(() => Math.random() - 0.5)
      setDisplayRows(shuffled.slice(0, 1000))
      
      dispatch(dataFormulatorActions.addMessage({
        timestamp: Date.now(),
        component: 'Data Grid',
        type: 'info',
        value: 'Loaded 1000 random rows'
      }))
    } catch (error) {
      console.error('Error sampling table:', error)
    } finally {
      setIsLoading(false)
    }
  }, [virtual, tableId, displayRows, dispatch])
  
  const handleDownloadCSV = useCallback(() => {
    if (virtual) return
    
    try {
      const headers = columnDefs.map(col => col.label).join(',')
      const csvContent = [
        headers,
        ...displayRows.map(row =>
          columnDefs.map(col => {
            const value = row[col.id]
            const strValue = String(value || '')
            // Escape values containing quotes or commas
            return strValue.includes(',') || strValue.includes('"')
              ? `"${strValue.replace(/"/g, '""')}"`
              : strValue
          }).join(',')
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = url
      link.download = `${tableName}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      dispatch(dataFormulatorActions.addMessage({
        timestamp: Date.now(),
        component: 'Data Grid',
        type: 'success',
        value: `Downloaded ${tableName}.csv`
      }))
    } catch (error) {
      console.error('Error downloading CSV:', error)
    }
  }, [virtual, columnDefs, displayRows, tableName, dispatch])
  
  const clearSelection = useCallback(() => {
    setSelectedCells([])
  }, [])
  
  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionFinished && selectedCells.length > 0) {
      const selectedValues = selectedCells.map(pos => {
        const row = displayRows[pos.row]
        const column = columnDefs[pos.col]
        return row?.[column.id]
      }).filter(Boolean)
      
      const selectedColumns = [...new Set(
        selectedCells.map(pos => columnDefs[pos.col]?.id).filter(Boolean)
      )]
      
      onSelectionFinished(selectedColumns, selectedValues)
    }
  }, [selectedCells, displayRows, columnDefs, onSelectionFinished])

  const TableComponents = {
    Scroller: TableContainer,
    Table: (props: any) => <Table {...props} stickyHeader />,
    TableHead: (props: any) => <TableHead {...props} />,
    TableRow: (props: any) => {
      const index = props['data-index'] || 0
      return (
        <TableRow 
          {...props} 
          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
        />
      )
    },
    TableBody: TableBody,
  }

  return (
    <Box 
      className={`selectable-data-grid relative ${className}`}
      sx={{ width: '100%', height: height }}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <Box className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-80">
          <CircularProgress size={24} className="mr-2" />
          <Typography variant="body2" className="text-gray-600">
            Fetching data...
          </Typography>
        </Box>
      )}

      {/* Main Table */}
      <Box className="flex-1 overflow-hidden">
        <TableVirtuoso
          style={{ height: height - 40 }} // Account for footer
          data={displayRows}
          components={TableComponents}
          fixedHeaderContent={() => (
            <TableRow>
              {columnDefs.map((column, index) => {
                const backgroundColor = (() => {
                  switch (column.source) {
                    case 'derived':
                      return alpha(theme.palette.success?.main || '#4caf50', 0.05)
                    case 'custom':
                      return alpha(theme.palette.secondary?.main || '#9c27b0', 0.05)
                    default:
                      return 'white'
                  }
                })()
                
                const borderColor = (() => {
                  switch (column.source) {
                    case 'derived':
                      return theme.palette.success?.main || '#4caf50'
                    case 'custom':
                      return theme.palette.secondary?.main || '#9c27b0'
                    default:
                      return theme.palette.primary.main
                  }
                })()

                return (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    className="p-0"
                    style={{
                      minWidth: column.minWidth,
                      width: column.width,
                      backgroundColor,
                      borderBottomColor: borderColor,
                      borderBottomWidth: '2px',
                      borderBottomStyle: 'solid'
                    }}
                  >
                    <Tooltip title={column.label}>
                      <Box className="flex items-center p-2">
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => handleSort(column.id)}
                          className="flex-1"
                        >
                          <Box className="flex items-center space-x-1">
                            <span className="text-sm">
                              {getIconFromType(column.dataType)}
                            </span>
                            <Typography variant="body2" className="font-medium truncate">
                              {column.label}
                            </Typography>
                          </Box>
                        </TableSortLabel>
                      </Box>
                    </Tooltip>
                  </TableCell>
                )
              })}
            </TableRow>
          )}
          itemContent={(rowIndex, row) => (
            <>
              {columnDefs.map((column, colIndex) => (
                <SelectableCell
                  key={`${rowIndex}-${colIndex}`}
                  value={column.format ? column.format(row[column.id]) : row[column.id]}
                  column={column}
                  position={{ row: rowIndex, col: colIndex }}
                  isSelected={selectedCells.some(
                    pos => pos.row === rowIndex && pos.col === colIndex
                  )}
                  searchMatch={searchValue}
                  onClick={handleCellClick}
                />
              ))}
            </>
          )}
        />
      </Box>

      {/* Footer */}
      <Paper className="absolute bottom-0 right-4 border-t p-2 flex items-center space-x-2">
        <Tooltip title="Table options">
          <ToggleButton
            value="expand"
            selected={footerExpanded}
            onChange={() => {
              if (footerExpanded) {
                setSearchText('')
              }
              setFooterExpanded(!footerExpanded)
            }}
            size="small"
            className="border-none"
          >
            <ChevronLeftIcon 
              className={`transition-transform ${footerExpanded ? 'rotate-180' : ''}`} 
            />
          </ToggleButton>
        </Tooltip>

        <Collapse in={footerExpanded} orientation="horizontal">
          <Box className="flex items-center space-x-2 mr-2">
            <OutlinedInput
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search in table"
              startAdornment={
                <InputAdornment position="start">
                  {searchText.length > 0 ? (
                    <IconButton
                      size="small"
                      onClick={() => setSearchText('')}
                    >
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <SearchIcon fontSize="small" />
                  )}
                </InputAdornment>
              }
              className="w-48"
            />
            
            {searchText && (
              <Typography variant="caption" className="text-gray-600">
                {displayRows.length} matches
              </Typography>
            )}
          </Box>
        </Collapse>

        <Box className="flex items-center space-x-2">
          <Typography variant="caption" className="flex items-center text-gray-600">
            {virtual && <CloudQueueIcon className="mr-1" fontSize="small" />}
            {virtual ? `${rowCount.toLocaleString()} rows` : `${displayRows.length} rows`}
          </Typography>

          {virtual && (
            <Tooltip title="View 1000 random rows">
              <IconButton size="small" onClick={handleRandomSample}>
                <CasinoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {!virtual && (
            <Tooltip title={`Download ${tableName} as CSV`}>
              <IconButton size="small" onClick={handleDownloadCSV}>
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {selectedCells.length > 0 && (
            <Chip
              label={`${selectedCells.length} selected`}
              size="small"
              onDelete={clearSelection}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default SelectableDataGrid