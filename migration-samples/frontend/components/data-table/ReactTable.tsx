'use client'

/**
 * ReactTable component - Custom data table with pagination and styling
 * Migrated from original ReactTable.tsx to Next.js with Tailwind
 */

import React, { useState, useCallback } from 'react'

// MUI components during migration
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Box,
  Typography,
  useTheme,
  alpha,
} from '@mui/material'

// Types
export interface ColumnDef {
  id: string
  label: string
  minWidth?: number
  align?: 'right' | 'left' | 'center'
  source?: 'derived' | 'original' | 'custom'
  format?: (value: any) => string
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'auto'
}

interface CustomReactTableProps {
  rows: any[]
  columnDefs: ColumnDef[]
  rowsPerPageNum: number
  compact?: boolean
  maxCellWidth?: number
  isIncompleteTable?: boolean
  onRowClick?: (row: any, index: number) => void
  selectedRowIndex?: number
  className?: string
}

export function CustomReactTable({ 
  rows, 
  columnDefs, 
  rowsPerPageNum, 
  compact = false, 
  maxCellWidth,
  isIncompleteTable = false,
  onRowClick,
  selectedRowIndex,
  className = '' 
}: CustomReactTableProps) {
  
  const theme = useTheme()
  
  // State
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    if (rowsPerPageNum === -1) {
      return rows.length > 500 ? 100 : rows.length
    }
    return rowsPerPageNum
  })

  // Event handlers
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage)
  }, [])

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }, [])

  const handleRowClick = useCallback((row: any, index: number) => {
    if (onRowClick) {
      onRowClick(row, index)
    }
  }, [onRowClick])

  // Helper functions
  const getColumnBackgroundColor = (source?: string) => {
    if (!source) return 'none'
    
    switch (source) {
      case 'derived':
        return alpha(theme.palette.success?.main || '#4caf50', 0.05)
      case 'custom':
        return alpha(theme.palette.secondary?.main || '#9c27b0', 0.05)
      default:
        return 'none'
    }
  }

  const getColumnBorderColor = (source?: string) => {
    switch (source) {
      case 'derived':
        return theme.palette.success?.main || '#4caf50'
      case 'custom':
        return theme.palette.secondary?.main || '#9c27b0'
      default:
        return theme.palette.primary?.main || '#1976d2'
    }
  }

  const formatCellValue = (value: any, column: ColumnDef) => {
    if (column.format) {
      return column.format(value)
    }
    
    if (value == null || value === '') {
      return ''
    }
    
    if (typeof value === 'boolean') {
      return value.toString()
    }
    
    return String(value)
  }

  // Calculate paginated rows
  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box 
      className={`custom-react-table ${className}`}
      sx={{
        width: '100%',
        '& .MuiTableCell-root': {
          fontSize: compact ? 10 : 12,
          maxWidth: maxCellWidth || (compact ? '60px' : '120px'),
          padding: compact ? '2px 4px' : '6px 8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }
      }}
    >
      <TableContainer sx={{ maxHeight: compact ? 340 : 500 }}>
        <Table stickyHeader size={compact ? 'small' : 'medium'}>
          {/* Table Header */}
          <TableHead>
            <TableRow>
              {columnDefs.map((column) => {
                const backgroundColor = getColumnBackgroundColor(column.source)
                const borderBottomColor = getColumnBorderColor(column.source)
                
                return (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{
                      minWidth: column.minWidth,
                      fontSize: compact ? 11 : 13,
                      fontWeight: 600,
                      color: '#333',
                      backgroundColor,
                      borderBottomColor,
                      borderBottomWidth: '2px',
                      borderBottomStyle: 'solid',
                    }}
                  >
                    {column.label}
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>

          {/* Table Body */}
          <TableBody>
            {paginatedRows.map((row, rowIndex) => {
              const globalRowIndex = page * rowsPerPage + rowIndex
              const isSelected = selectedRowIndex === globalRowIndex
              const isEvenRow = rowIndex % 2 === 0
              
              return (
                <TableRow
                  key={rowIndex}
                  hover={!!onRowClick}
                  onClick={() => handleRowClick(row, globalRowIndex)}
                  selected={isSelected}
                  sx={{
                    backgroundColor: isSelected 
                      ? alpha(theme.palette.primary.main, 0.1)
                      : isEvenRow 
                      ? '#f8f9fa' 
                      : 'white',
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': onRowClick ? {
                      backgroundColor: isSelected 
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.action.hover, 0.08)
                    } : {}
                  }}
                >
                  {columnDefs.map((column) => {
                    const value = row[column.id]
                    const backgroundColor = getColumnBackgroundColor(column.source)
                    
                    return (
                      <TableCell 
                        key={column.id} 
                        align={column.align || 'left'}
                        sx={{ 
                          backgroundColor: backgroundColor !== 'none' ? backgroundColor : undefined
                        }}
                        title={formatCellValue(value, column)} // Show full value on hover
                      >
                        {formatCellValue(value, column)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}

            {/* Incomplete table indicator */}
            {isIncompleteTable && (
              <TableRow>
                {columnDefs.map((column, index) => (
                  <TableCell 
                    key={index} 
                    align="center" 
                    sx={{ 
                      padding: compact ? '4px' : '8px',
                      fontStyle: 'italic',
                      color: theme.palette.text.secondary
                    }}
                  >
                    ⋯
                  </TableCell>
                ))}
              </TableRow>
            )}

            {/* Empty state */}
            {rows.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={columnDefs.length} 
                  align="center"
                  sx={{ 
                    padding: '32px',
                    color: theme.palette.text.secondary,
                    fontStyle: 'italic'
                  }}
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {rowsPerPage < rows.length && (
        <TablePagination
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={compact ? [10, 25, 50] : [10, 25, 50, 100]}
          showFirstButton
          showLastButton
          sx={{
            color: 'gray',
            '& .MuiInputBase-root': { 
              fontSize: compact ? 10 : 12 
            },
            '& .MuiTablePagination-selectLabel': { 
              fontSize: compact ? 10 : 12 
            },
            '& .MuiTablePagination-displayedRows': { 
              fontSize: compact ? 10 : 12 
            },
            '& .MuiButtonBase-root': { 
              padding: compact ? '2px' : '8px' 
            },
            '& .MuiToolbar-root': { 
              minHeight: compact ? 18 : 56,
              height: compact ? 24 : 56
            },
            '& .MuiTablePagination-toolbar': { 
              paddingRight: 0 
            },
            '& .MuiSvgIcon-root': { 
              fontSize: compact ? '1rem' : '1.25rem' 
            }
          }}
          SelectProps={{
            MenuProps: {
              sx: {
                '.MuiPaper-root': {
                  maxHeight: 200
                },
                '.MuiMenuItem-root': { 
                  fontSize: compact ? 11 : 14 
                },
              },
            }
          }}
        />
      )}

      {/* Table info */}
      {rows.length > 0 && (
        <Box className="mt-2">
          <Typography 
            variant="caption" 
            className="text-gray-500"
            sx={{ fontSize: compact ? 9 : 11 }}
          >
            Showing {Math.min(rows.length, rowsPerPage)} of {rows.length} rows
            {columnDefs.some(c => c.source) && (
              <Box component="span" className="ml-4">
                <Box component="span" className="inline-flex items-center mr-3">
                  <Box 
                    className="w-3 h-3 mr-1 rounded" 
                    sx={{ backgroundColor: alpha(theme.palette.success?.main || '#4caf50', 0.3) }}
                  />
                  <span>Derived</span>
                </Box>
                <Box component="span" className="inline-flex items-center mr-3">
                  <Box 
                    className="w-3 h-3 mr-1 rounded" 
                    sx={{ backgroundColor: alpha(theme.palette.secondary?.main || '#9c27b0', 0.3) }}
                  />
                  <span>Custom</span>
                </Box>
                <Box component="span" className="inline-flex items-center">
                  <Box 
                    className="w-3 h-3 mr-1 rounded" 
                    sx={{ backgroundColor: alpha(theme.palette.primary?.main || '#1976d2', 0.3) }}
                  />
                  <span>Original</span>  
                </Box>
              </Box>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

// Export default for backward compatibility
export { CustomReactTable as ReactTable }
export default CustomReactTable