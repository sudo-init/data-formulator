'use client'

/**
 * DerivedDataDialog component - Dialog for selecting derived data transformation candidates
 * Migrated from original DerivedDataDialog.tsx to Next.js with Tailwind
 */

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAppSelector } from '@/lib/store/hooks'

// MUI components during migration
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Box,
  Typography,
  Radio,
  FormControlLabel,
  ButtonGroup,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material'

// Dynamic import for Vega-Lite to avoid SSR issues
const VegaLite = dynamic(
  () => import('react-vega').then(mod => mod.VegaLite),
  { 
    ssr: false, 
    loading: () => <div className="w-60 h-40 bg-gray-100 animate-pulse rounded" />
  }
)

// Types
interface DictTable {
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

interface Chart {
  id: string
  chartType: string
  encodingMap: Record<string, any>
}

interface FieldItem {
  id: string
  name: string
  type: string
  source: string
}

export interface DerivedDataDialogProps {
  chart: Chart
  candidateTables: DictTable[]
  open: boolean
  handleCloseDialog: () => void
  handleSelection: (selectIndex: number) => void
  handleDeleteChart: () => void
  bodyOnly?: boolean
  className?: string
}

// Code Box Component
const CodeBox: React.FC<{ code: string; language?: string; fontSize?: number }> = ({ 
  code, 
  language = 'python',
  fontSize = 10 
}) => {
  return (
    <Box className="code-box bg-gray-100 rounded-md p-3 max-h-80 overflow-auto">
      <pre 
        className="whitespace-pre-wrap font-mono text-gray-800"
        style={{ fontSize: `${fontSize}px` }}
      >
        {code}
      </pre>
    </Box>
  )
}

// Simple Table View Component
const SimpleTableView: React.FC<{ table: DictTable; conceptShelfItems: FieldItem[] }> = ({ 
  table, 
  conceptShelfItems 
}) => {
  return (
    <Box className="relative flex flex-col max-h-80 overflow-auto">
      <div className="overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {table.names.map(name => {
                const field = conceptShelfItems.find(f => f.name === name)
                const sourceColor = field?.source === 'derived' 
                  ? 'text-green-700' 
                  : field?.source === 'custom' 
                  ? 'text-purple-700' 
                  : 'text-blue-700'
                
                return (
                  <th 
                    key={name} 
                    className={`border p-2 text-left font-medium min-w-16 ${sourceColor}`}
                  >
                    {name}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {table.rows.slice(0, 10).map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                {table.names.map(name => (
                  <td key={name} className="border p-2 max-w-32 truncate">
                    {String(row[name] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {table.rows.length > 10 && (
        <Typography className="text-xs text-gray-500 p-2 text-center">
          Showing 10 of {table.rows.length} rows
        </Typography>
      )}
    </Box>
  )
}

// Chart Thumbnail Component
const ChartThumbnail: React.FC<{ 
  chart: Chart
  table: DictTable
  conceptShelfItems: FieldItem[]
  index: number
}> = ({ chart, table, conceptShelfItems, index }) => {
  // Simplified Vega-Lite spec generation
  const generateVegaSpec = useCallback(() => {
    try {
      const spec: any = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: table.rows.slice(0, 100) }, // Limit data for thumbnail
        background: "transparent",
        width: 200,
        height: 150,
        autosize: { type: "fit", contains: "padding" }
      }

      // Basic mark type mapping
      const markTypeMap: Record<string, string> = {
        'Bar Chart': 'bar',
        'Line Chart': 'line', 
        'Scatter Plot': 'point',
        'Area Chart': 'area',
        'Histogram': 'bar'
      }

      spec.mark = { 
        type: markTypeMap[chart.chartType] || 'point',
        tooltip: true
      }

      // Basic encoding from chart.encodingMap
      const encoding: any = {}
      
      if (chart.encodingMap.x?.fieldID) {
        const field = conceptShelfItems.find(f => f.id === chart.encodingMap.x.fieldID)
        if (field) {
          encoding.x = { 
            field: field.name, 
            type: field.type === 'number' ? 'quantitative' : 'nominal',
            title: field.name
          }
        }
      }

      if (chart.encodingMap.y?.fieldID) {
        const field = conceptShelfItems.find(f => f.id === chart.encodingMap.y.fieldID)
        if (field) {
          encoding.y = { 
            field: field.name, 
            type: field.type === 'number' ? 'quantitative' : 'nominal',
            title: field.name
          }
          
          // Add aggregation if specified
          if (chart.encodingMap.y.aggregate) {
            encoding.y.aggregate = chart.encodingMap.y.aggregate
          }
        }
      }

      if (chart.encodingMap.color?.fieldID) {
        const field = conceptShelfItems.find(f => f.id === chart.encodingMap.color.fieldID)
        if (field) {
          encoding.color = { 
            field: field.name, 
            type: field.type === 'number' ? 'quantitative' : 'nominal',
            title: field.name
          }
        }
      }

      spec.encoding = encoding
      return spec
    } catch (error) {
      console.error('Error generating Vega spec:', error)
      return {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: [] },
        mark: 'point',
        encoding: {},
        background: "transparent"
      }
    }
  }, [chart, table, conceptShelfItems])

  const vegaSpec = generateVegaSpec()

  return (
    <Box className="min-w-56 bg-white rounded border p-2 flex justify-center items-center">
      <VegaLite 
        spec={vegaSpec}
        actions={false}
        renderer="canvas"
      />
    </Box>
  )
}

// Candidate Card Component
const CandidateCard: React.FC<{
  table: DictTable
  chart: Chart
  index: number
  isSelected: boolean
  onSelect: () => void
  conceptShelfItems: FieldItem[]
  direction: 'horizontal' | 'vertical'
}> = ({ table, chart, index, isSelected, onSelect, conceptShelfItems, direction }) => {
  
  return (
    <Card 
      variant="outlined" 
      onClick={onSelect}
      className={`min-w-72 max-w-full flex flex-1 m-2 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-2 border-blue-500 shadow-md' 
          : 'border border-gray-200 hover:border-gray-300'
      }`}
    >
      <CardContent className="flex flex-col flex-1 max-h-screen p-2">
        {/* Header with radio button */}
        <FormControlLabel 
          className="ml-0 text-xs absolute z-10"
          value={index} 
          control={<Radio checked={isSelected} size="small" />} 
          label={
            <Typography 
              className={`text-xs ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
            >
              candidate-{index + 1} ({table.id})
            </Typography>
          } 
        />

        {/* Content area */}
        <Box className={`flex ${direction === 'horizontal' ? 'flex-col' : 'flex-row'} items-center flex-1 mt-6`}>
          {/* Chart thumbnail */}
          <Box className="mb-4">
            <ChartThumbnail 
              chart={chart}
              table={table}
              conceptShelfItems={conceptShelfItems}
              index={index}
            />
          </Box>

          {/* Data table preview */}
          <Box className="mx-3 w-full mb-4">
            <Typography className="text-xs text-gray-600 mb-2">
              Data Preview ({table.rows.length} rows)
            </Typography>
            <SimpleTableView table={table} conceptShelfItems={conceptShelfItems} />
          </Box>

          {/* Transformation code */}
          <Box className="max-w-96 w-full flex max-h-80">
            <Box className="w-full">
              <Typography className="text-xs text-gray-600 mb-2">
                Transformation Code
              </Typography>
              <CodeBox code={table.derive?.code || ''} language="python" fontSize={9} />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// Main Component
export function DerivedDataDialog({ 
  chart, 
  candidateTables, 
  open, 
  handleCloseDialog, 
  handleSelection, 
  handleDeleteChart,
  bodyOnly = false,
  className = '' 
}: DerivedDataDialogProps) {
  
  const [selectionIdx, setSelectionIdx] = useState(0)
  const conceptShelfItems = useAppSelector((state) => state.dataFormulator.conceptShelfItems || [])
  
  const direction = candidateTables.length > 1 ? "horizontal" : "horizontal"

  // Reset selection when candidates change
  useEffect(() => {
    if (selectionIdx >= candidateTables.length) {
      setSelectionIdx(0)
    }
  }, [candidateTables.length, selectionIdx])

  const handleSelectionChange = useCallback((index: number) => {
    setSelectionIdx(index)
  }, [])

  const handleConfirmSelection = useCallback(() => {
    handleSelection(selectionIdx)
  }, [handleSelection, selectionIdx])

  // Body content
  const bodyContent = (
    <Box className={`flex overflow-x-auto ${direction === 'horizontal' ? 'flex-col' : 'flex-row'} justify-between relative mt-4 min-h-32`}>
      {candidateTables.map((table, idx) => (
        <CandidateCard
          key={`candidate-dialog-${idx}`}
          table={table}
          chart={chart}
          index={idx}
          isSelected={selectionIdx === idx}
          onSelect={() => handleSelectionChange(idx)}
          conceptShelfItems={conceptShelfItems}
          direction={direction}
        />
      ))}
    </Box>
  )

  // Body-only mode (embedded view)
  if (bodyOnly) {
    return (
      <Box className={`mt-4 ${className}`}>
        <Box className="w-full flex items-center mb-4">
          <Typography className="text-sm text-gray-600">
            Transformation from{' '}
            <span className="underline">
              {candidateTables[0]?.derive?.source?.join(', ') || 'source'}
            </span>
          </Typography>
        </Box>
        
        {bodyContent}
        
        <Box className="w-full flex items-center mt-6">
          <Box className="flex mx-auto">
            <ButtonGroup size="small">
              <Button 
                variant="text" 
                startIcon={<DeleteIcon />} 
                color="error"
                onClick={handleDeleteChart}
                className="normal-case"
              >
                Delete all
              </Button>
              
              <Button 
                variant="text" 
                startIcon={<SaveIcon />}
                onClick={handleConfirmSelection}
                className="normal-case w-80"
              >
                Save{' '}
                <span className="mx-1 px-1">
                  candidate {selectionIdx + 1} ({candidateTables[selectionIdx]?.id})
                </span>{' '}
                as the result
              </Button>
            </ButtonGroup>
          </Box>
        </Box>
      </Box>
    )
  }

  // Full dialog mode
  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth={false}
      className={className}
      PaperProps={{
        className: "max-w-screen-xl max-h-screen min-w-80 w-full mx-4"
      }}
    >
      <DialogTitle>
        <Typography variant="h6" className="font-semibold">
          Derived Data Candidates
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers className="overflow-x-hidden">
        {bodyContent}
      </DialogContent>
      
      <DialogActions className="p-4">
        <Button onClick={handleCloseDialog} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleConfirmSelection} 
          variant="contained"
          disabled={candidateTables.length === 0}
        >
          Select Candidate {selectionIdx + 1}
        </Button>
      </DialogActions>
    </Dialog>
  )
}