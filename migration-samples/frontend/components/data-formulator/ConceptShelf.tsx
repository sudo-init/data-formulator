'use client'

/**
 * ConceptShelf component - Drag and drop interface for data fields
 * Migrated from original ConceptShelf.tsx to Next.js with Tailwind
 */

import React, { useCallback, useEffect, useState } from 'react'
import { useDrop } from 'react-dnd'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import {
  Box,
  Typography,
  Tooltip,
  Button,
  Divider,
  IconButton,
  Collapse,
  Card,
  CardContent,
} from '@mui/material'
import {
  Add as AddIcon,
  CleaningServices as CleanIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
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

interface ConceptShelfProps {
  className?: string
}

interface ConceptGroupProps {
  groupName: string
  fields: FieldItem[]
  expanded?: boolean
  onToggleExpanded?: () => void
}

// Generate fresh custom concept
const genFreshCustomConcept = (): FieldItem => ({
  id: `concept-${Date.now()}`,
  name: '',
  type: 'auto',
  domain: [],
  description: '',
  source: 'custom',
  tableRef: 'custom',
})

// Draggable Concept Card Component
const ConceptCard: React.FC<{
  field: FieldItem
  isDragging?: boolean
}> = ({ field, isDragging = false }) => {
  const dispatch = useAppDispatch()

  const handleFieldEdit = useCallback((updatedField: FieldItem) => {
    // Update field in store
    console.log('Updating field:', updatedField)
  }, [])

  const handleFieldDelete = useCallback(() => {
    // Delete field from store
    console.log('Deleting field:', field.id)
  }, [field.id])

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800'
      case 'number': return 'bg-green-100 text-green-800'
      case 'date': return 'bg-purple-100 text-purple-800'
      case 'boolean': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      className={`
        concept-card 
        ${isDragging ? 'opacity-50' : ''}
        ${getFieldTypeColor(field.type)}
        cursor-move hover:shadow-md transition-all duration-200
      `}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(field))
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <Typography variant="caption" className="font-medium truncate">
            {field.name || 'Unnamed field'}
          </Typography>
          {field.description && (
            <Typography variant="caption" className="block text-xs opacity-75 truncate">
              {field.description}
            </Typography>
          )}
        </div>
        <div className="flex items-center ml-2">
          <span className="text-xs opacity-60">{field.type}</span>
        </div>
      </div>
    </div>
  )
}

// Concept Group Component
const ConceptGroup: React.FC<ConceptGroupProps> = ({
  groupName,
  fields,
  expanded: controlledExpanded,
  onToggleExpanded,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const dispatch = useAppDispatch()
  const focusedTableId = useAppSelector((state) => state.dataFormulator.selectedTableName)

  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const toggleExpanded = onToggleExpanded || (() => setInternalExpanded(!internalExpanded))

  const handleCleanUnusedConcepts = useCallback(() => {
    // Clean unused custom concepts
    console.log('Cleaning unused concepts for group:', groupName)
  }, [groupName])

  // Auto-expand based on focused table
  useEffect(() => {
    if (focusedTableId === groupName || groupName === 'new fields') {
      if (controlledExpanded === undefined) {
        setInternalExpanded(true)
      }
    }
  }, [focusedTableId, groupName, controlledExpanded])

  const displayFields = expanded ? fields : fields.slice(0, 6)
  const hasMoreFields = fields.length > 6

  return (
    <Box className="mb-4">
      <Divider className="mb-2">
        <Box
          className="flex items-center cursor-pointer gap-2 px-2 py-1 hover:bg-gray-50 rounded"
          onClick={toggleExpanded}
        >
          <Typography variant="caption" className="text-gray-600 font-medium">
            {groupName} ({fields.length})
          </Typography>
          
          {hasMoreFields && (
            <Box className="text-gray-400">
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Box>
          )}
          
          {groupName === 'new fields' && (
            <Tooltip title="Clean fields not referenced by any table">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCleanUnusedConcepts()
                }}
                className="ml-auto"
              >
                <CleanIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Divider>

      <Collapse in={expanded} timeout="auto">
        <Box className="grid grid-cols-1 gap-2">
          {displayFields.map((field) => (
            <ConceptCard
              key={field.id}
              field={field}
            />
          ))}
        </Box>
      </Collapse>

      {!expanded && hasMoreFields && (
        <Box className="text-center mt-2">
          <Button
            size="small"
            variant="text"
            onClick={toggleExpanded}
            className="text-xs"
          >
            +{fields.length - 6} more fields
          </Button>
        </Box>
      )}
    </Box>
  )
}

// Main ConceptShelf Component
export function ConceptShelf({ className = '' }: ConceptShelfProps) {
  const dispatch = useAppDispatch()
  const tables = useAppSelector((state) => state.dataFormulator.tables)
  const selectedTableName = useAppSelector((state) => state.dataFormulator.selectedTableName)

  // Mock data - replace with actual field data from tables
  const mockFields: FieldItem[] = [
    {
      id: 'field-1',
      name: 'Country',
      type: 'string',
      domain: [],
      source: 'table',
      tableRef: 'main',
    },
    {
      id: 'field-2',
      name: 'Population',
      type: 'number',
      domain: [],
      source: 'table',
      tableRef: 'main',
    },
    {
      id: 'field-3',
      name: 'Year',
      type: 'date',
      domain: [],
      source: 'table',
      tableRef: 'main',
    },
  ]

  // Group fields by source/table
  const groupedFields = {
    'main table': mockFields.filter(f => f.source === 'table'),
    'new fields': mockFields.filter(f => f.source === 'custom'),
    'derived fields': mockFields.filter(f => f.source === 'derived'),
  }

  const handleAddCustomField = useCallback(() => {
    const newField = genFreshCustomConcept()
    console.log('Adding new custom field:', newField)
    // Add to store
  }, [])

  // Drop zone for creating new concepts
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'field',
    drop: (item: any) => {
      console.log('Dropped item on concept shelf:', item)
      return { zone: 'concept-shelf' }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  return (
    <Card className={`concept-shelf ${className}`} ref={drop}>
      <CardContent className="p-4">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="font-semibold">
            Data Fields
          </Typography>
          
          <Tooltip title="Add custom field">
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddCustomField}
              className="text-xs"
            >
              Add Field
            </Button>
          </Tooltip>
        </Box>

        {/* Drop zone indicator */}
        {isOver && (
          <Box className="border-2 border-dashed border-blue-400 bg-blue-50 p-4 rounded-lg mb-4 text-center">
            <Typography variant="body2" className="text-blue-600">
              Drop here to create new concept
            </Typography>
          </Box>
        )}

        {/* Field groups */}
        <Box className="space-y-4">
          {Object.entries(groupedFields).map(([groupName, fields]) => (
            fields.length > 0 && (
              <ConceptGroup
                key={groupName}
                groupName={groupName}
                fields={fields}
              />
            )
          ))}
        </Box>

        {/* Helper text */}
        <Box className="mt-6 p-3 bg-gray-50 rounded-lg">
          <Typography variant="caption" className="text-gray-600">
            💡 Drag fields to chart properties or type new field names to create AI-powered transformations
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}