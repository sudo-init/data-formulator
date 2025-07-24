'use client'

/**
 * EncodingBox component - Visual encoding drag-and-drop interface
 * Migrated from original EncodingBox.tsx to Next.js with Tailwind
 */

import React, { useState, useCallback, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Autocomplete,
} from '@mui/material'
import {
  ArrowDropDown as ArrowDropDownIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
} from '@mui/icons-material'

// Types
interface FieldItem {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'auto'
  domain: any[]
  description?: string
  source: 'table' | 'custom' | 'derived'
  tableRef: string
}

type Channel = 'x' | 'y' | 'color' | 'size' | 'shape' | 'opacity' | 'row' | 'column'
type AggrOp = 'count' | 'sum' | 'mean' | 'median' | 'min' | 'max' | 'distinct'

interface EncodingItem {
  channel: Channel
  field?: FieldItem
  type?: 'quantitative' | 'ordinal' | 'nominal' | 'temporal'
  aggregate?: AggrOp
  bin?: boolean
  sort?: 'ascending' | 'descending' | null
}

interface EncodingBoxProps {
  channel: Channel
  encoding?: EncodingItem
  onEncodingChange?: (encoding: EncodingItem) => void
  className?: string
}

interface EncodingShelfProps {
  encodings: Record<Channel, EncodingItem>
  onEncodingsChange?: (encodings: Record<Channel, EncodingItem>) => void
  className?: string
}

const CHANNEL_LABELS: Record<Channel, string> = {
  x: 'X Axis',
  y: 'Y Axis', 
  color: 'Color',
  size: 'Size',
  shape: 'Shape',
  opacity: 'Opacity',
  row: 'Row',
  column: 'Column',
}

const AGGREGATION_OPTIONS: AggrOp[] = ['count', 'sum', 'mean', 'median', 'min', 'max', 'distinct']

const getChannelColor = (channel: Channel) => {
  const colors = {
    x: 'border-blue-300 bg-blue-50',
    y: 'border-green-300 bg-green-50',
    color: 'border-purple-300 bg-purple-50',
    size: 'border-orange-300 bg-orange-50',
    shape: 'border-pink-300 bg-pink-50',
    opacity: 'border-gray-300 bg-gray-50',
    row: 'border-cyan-300 bg-cyan-50',
    column: 'border-indigo-300 bg-indigo-50',
  }
  return colors[channel] || 'border-gray-300 bg-gray-50'
}

// Individual Encoding Box Component
export function EncodingBox({ 
  channel, 
  encoding, 
  onEncodingChange, 
  className = '' 
}: EncodingBoxProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [fieldName, setFieldName] = useState(encoding?.field?.name || '')
  const [aggregation, setAggregation] = useState<AggrOp | ''>(encoding?.aggregate || '')
  const [dataType, setDataType] = useState(encoding?.type || 'auto')
  
  const dispatch = useAppDispatch()
  const availableFields = useAppSelector((state) => {
    // Get all fields from all tables - mock data for now
    return [
      { id: 'field-1', name: 'Country', type: 'string' as const, domain: [], source: 'table' as const, tableRef: 'main' },
      { id: 'field-2', name: 'Population', type: 'number' as const, domain: [], source: 'table' as const, tableRef: 'main' },
      { id: 'field-3', name: 'Year', type: 'date' as const, domain: [], source: 'table' as const, tableRef: 'main' },
      { id: 'field-4', name: 'GDP', type: 'number' as const, domain: [], source: 'table' as const, tableRef: 'main' },
    ]
  })

  // Drop zone for field assignment
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'field',
    drop: (item: FieldItem) => {
      const newEncoding: EncodingItem = {
        channel,
        field: item,
        type: inferDataType(item.type),
        aggregate: shouldUseAggregation(channel, item.type) ? 'count' : undefined,
      }
      
      onEncodingChange?.(newEncoding)
      return { channel }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }))

  const inferDataType = (fieldType: string) => {
    switch (fieldType) {
      case 'number': return 'quantitative'
      case 'date': return 'temporal'
      case 'string': return 'nominal'
      case 'boolean': return 'nominal'
      default: return 'nominal'
    }
  }

  const shouldUseAggregation = (channel: Channel, fieldType: string) => {
    return channel === 'y' && fieldType === 'number'
  }

  const handleSaveEdit = useCallback(() => {
    if (!fieldName.trim()) {
      handleClearEncoding()
      return
    }

    // Find field by name or create new one
    let field = availableFields.find(f => f.name === fieldName.trim())
    
    if (!field) {
      // Create new field for AI transformation
      field = {
        id: `field-${Date.now()}`,
        name: fieldName.trim(),
        type: 'auto',
        domain: [],
        source: 'custom',
        tableRef: 'custom',
      }
    }

    const newEncoding: EncodingItem = {
      channel,
      field,
      type: dataType as any,
      aggregate: aggregation || undefined,
    }

    onEncodingChange?.(newEncoding)
    setIsEditing(false)
  }, [fieldName, aggregation, dataType, channel, availableFields, onEncodingChange])

  const handleClearEncoding = useCallback(() => {
    onEncodingChange?.({
      channel,
      field: undefined,
      type: undefined,
      aggregate: undefined,
    })
    setFieldName('')
    setAggregation('')
    setIsEditing(false)
  }, [channel, onEncodingChange])

  const handleStartEdit = useCallback(() => {
    setFieldName(encoding?.field?.name || '')
    setAggregation(encoding?.aggregate || '')
    setDataType(encoding?.type || 'auto')
    setIsEditing(true)
  }, [encoding])

  return (
    <Card
      ref={drop}
      className={`
        encoding-box min-h-20 transition-all duration-200
        ${getChannelColor(channel)}
        ${isOver && canDrop ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
        ${className}
      `}
    >
      <CardContent className="p-3">
        {/* Channel label */}
        <Typography variant="caption" className="font-semibold text-gray-700 block mb-2">
          {CHANNEL_LABELS[channel]}
        </Typography>

        {/* Encoding content */}
        {isEditing ? (
          <Box className="space-y-3">
            {/* Field name input */}
            <Autocomplete
              freeSolo
              size="small"
              options={availableFields.map(f => f.name)}
              value={fieldName}
              onInputChange={(_, value) => setFieldName(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Field name or description"
                  variant="outlined"
                  size="small"
                />
              )}
            />

            {/* Data type selection */}
            <FormControl size="small" fullWidth>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                label="Data Type"
              >
                <MenuItem value="auto">Auto</MenuItem>
                <MenuItem value="quantitative">Quantitative</MenuItem>
                <MenuItem value="ordinal">Ordinal</MenuItem>
                <MenuItem value="nominal">Nominal</MenuItem>
                <MenuItem value="temporal">Temporal</MenuItem>
              </Select>
            </FormControl>

            {/* Aggregation selection */}
            {(channel === 'y' || channel === 'size') && (
              <FormControl size="small" fullWidth>
                <InputLabel>Aggregation</InputLabel>
                <Select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value as AggrOp)}
                  label="Aggregation"
                >
                  <MenuItem value="">None</MenuItem>
                  {AGGREGATION_OPTIONS.map(op => (
                    <MenuItem key={op} value={op}>
                      {op.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Action buttons */}
            <Box className="flex justify-end space-x-2">
              <Button
                size="small"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveEdit}
              >
                Apply
              </Button>
            </Box>
          </Box>
        ) : encoding?.field ? (
          <Box>
            {/* Field display */}
            <Box className="flex items-center justify-between mb-2">
              <Chip
                label={encoding.field.name}
                size="small"
                className="bg-white"
              />
              
              <Box className="flex items-center space-x-1">
                <Tooltip title="Edit encoding">
                  <IconButton size="small" onClick={handleStartEdit}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Clear encoding">
                  <IconButton size="small" onClick={handleClearEncoding}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Encoding details */}
            <Box className="flex flex-wrap gap-1">
              {encoding.type && (
                <Chip
                  label={encoding.type}
                  size="small"
                  variant="outlined"
                  className="text-xs"
                />
              )}
              
              {encoding.aggregate && (
                <Chip
                  label={encoding.aggregate.toUpperCase()}
                  size="small"
                  variant="outlined"
                  className="text-xs"
                />
              )}
            </Box>
          </Box>
        ) : (
          <Box 
            className="text-center py-2 cursor-pointer hover:bg-white hover:bg-opacity-50 rounded"
            onClick={() => setIsEditing(true)}
          >
            <Typography variant="body2" className="text-gray-500">
              {isOver && canDrop 
                ? 'Drop field here'
                : 'Click to add field'
              }
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// Encoding Shelf Component (collection of encoding boxes)
export function EncodingShelf({ 
  encodings, 
  onEncodingsChange, 
  className = '' 
}: EncodingShelfProps) {
  const handleEncodingChange = useCallback((newEncoding: EncodingItem) => {
    const updatedEncodings = {
      ...encodings,
      [newEncoding.channel]: newEncoding,
    }
    onEncodingsChange?.(updatedEncodings)
  }, [encodings, onEncodingsChange])

  const generateChart = useCallback(() => {
    // Trigger chart generation based on current encodings
    console.log('Generating chart with encodings:', encodings)
    
    // This would typically call an API to generate the Vega-Lite spec
    // and create a new chart in the visualization area
  }, [encodings])

  const clearAllEncodings = useCallback(() => {
    const clearedEncodings = Object.keys(encodings).reduce((acc, channel) => ({
      ...acc,
      [channel]: { channel: channel as Channel }
    }), {} as Record<Channel, EncodingItem>)
    
    onEncodingsChange?.(clearedEncodings)
  }, [encodings, onEncodingsChange])

  const hasAnyEncoding = Object.values(encodings).some(enc => enc.field)

  return (
    <Card className={`encoding-shelf ${className}`}>
      <CardContent className="p-4">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="font-semibold">
            Visual Encoding
          </Typography>
          
          <Box className="flex items-center space-x-2">
            {hasAnyEncoding && (
              <Button
                size="small"
                variant="outlined"
                onClick={clearAllEncodings}
                startIcon={<ClearIcon />}
              >
                Clear All
              </Button>
            )}
            
            <Button
              size="small"
              variant="contained"
              onClick={generateChart}
              disabled={!hasAnyEncoding}
              startIcon={<RefreshIcon />}
            >
              Generate Chart
            </Button>
          </Box>
        </Box>

        {/* Primary encodings (X, Y) */}
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <EncodingBox
            channel="x"
            encoding={encodings.x}
            onEncodingChange={handleEncodingChange}
          />
          <EncodingBox
            channel="y"
            encoding={encodings.y}
            onEncodingChange={handleEncodingChange}
          />
        </Box>

        {/* Secondary encodings */}
        <Box className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {(['color', 'size', 'shape', 'opacity'] as Channel[]).map(channel => (
            <EncodingBox
              key={channel}
              channel={channel}
              encoding={encodings[channel]}
              onEncodingChange={handleEncodingChange}
            />
          ))}
        </Box>

        {/* Faceting encodings */}
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EncodingBox
            channel="row"
            encoding={encodings.row}
            onEncodingChange={handleEncodingChange}
          />
          <EncodingBox
            channel="column"
            encoding={encodings.column}
            onEncodingChange={handleEncodingChange}
          />
        </Box>

        {/* Help text */}
        <Box className="mt-4 p-3 bg-blue-50 rounded-lg">
          <Typography variant="caption" className="text-blue-800">
            💡 Drag fields from the concept shelf above, or type field names to create AI-powered transformations
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}