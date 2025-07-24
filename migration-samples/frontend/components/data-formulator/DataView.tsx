'use client'

/**
 * DataView component migrated to Next.js with Tailwind CSS
 * Handles AG Grid with proper SSR considerations
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { ColDef, GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community'

import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration phase
import {
  Box,
  Typography,
  Button,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'

// Dynamically import AG Grid to avoid SSR issues
const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Loading data grid...</span>
      </div>
    ),
  }
)

interface DataViewProps {
  tableName: string
  className?: string
}

export function DataView({ tableName, className = '' }: DataViewProps) {
  const dispatch = useAppDispatch()
  const tables = useAppSelector((state) => state.dataFormulator.tables)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [gridApi, setGridApi] = useState<any>(null)
  
  const tableData = tables[tableName] || []
  
  // Generate column definitions from data
  const columnDefs = useMemo<ColDef[]>(() => {
    if (tableData.length === 0) return []
    
    const sampleRow = tableData[0]
    return Object.keys(sampleRow).map((key) => ({
      field: key,
      headerName: key,
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 150,
      // Auto-detect column type
      type: typeof sampleRow[key] === 'number' ? 'numericColumn' : 'textColumn',
    }))
  }, [tableData])

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api)
    // Auto-size columns to fit content
    params.api.sizeColumnsToFit()
  }, [])

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    // Handle cell edits if needed
    console.log('Cell value changed:', event)
  }, [])

  const handleDownloadCSV = useCallback(() => {
    if (tableData.length === 0) return
    
    // Convert data to CSV
    const headers = Object.keys(tableData[0])
    const csvContent = [
      headers.join(','),
      ...tableData.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tableName}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [tableData, tableName])

  const handleRefreshData = useCallback(() => {
    // Trigger data refresh
    dispatch(dataFormulatorActions.refreshTable(tableName))
    if (gridApi) {
      gridApi.refreshCells()
    }
  }, [dispatch, tableName, gridApi])

  if (tableData.length === 0) {
    return (
      <div className={`data-table-container ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Typography variant="h6" className="text-gray-500 mb-2">
              No data available
            </Typography>
            <Typography variant="body2" className="text-gray-400">
              Upload data or select a dataset to get started
            </Typography>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`data-table-container ${className}`}>
      {/* Header with table info and actions */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <Typography variant="h6" className="font-semibold text-gray-900">
            {tableName}
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            {tableData.length} rows, {columnDefs.length} columns
          </Typography>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tooltip title="Download as CSV">
            <IconButton onClick={handleDownloadCSV} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefreshData} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => {
              setAnchorEl(null)
              // Handle duplicate table
            }}>
              Duplicate table
            </MenuItem>
            <MenuItem onClick={() => {
              setAnchorEl(null)
              // Handle delete table
            }}>
              Delete table
            </MenuItem>
          </Menu>
        </div>
      </div>

      {/* AG Grid data table */}
      <div className="ag-theme-alpine h-96">
        <AgGridReact
          rowData={tableData}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          enableRangeSelection={true}
          animateRows={true}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
          getRowId={(params) => params.data?.id || params.node.id}
        />
      </div>
      
      {/* Footer with pagination info */}
      <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
        <Typography variant="body2" className="text-gray-600">
          Showing {tableData.length} rows
        </Typography>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="text"
            size="small"
            onClick={() => {
              // Handle view more rows
            }}
            disabled={tableData.length < 1000}
          >
            View more
          </Button>
        </div>
      </div>
    </div>
  )
}